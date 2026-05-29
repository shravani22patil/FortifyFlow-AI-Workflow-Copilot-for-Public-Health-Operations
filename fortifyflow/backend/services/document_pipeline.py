import os
from typing import List, Tuple
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from models.schemas import ExtractedEntities
from config import get_settings

settings = get_settings()

EXTRACTION_PROMPT = PromptTemplate(
    input_variables=["text", "format_instructions"],
    template="""You are an expert analyst for a public health food fortification program.

Analyze the following document and extract structured information.

Document text:
{text}

{format_instructions}

Rules:
- key_actions: specific, actionable tasks (start with verb e.g. "Submit quarterly report to...")
- deadlines: extract actual dates when mentioned, format as {{"date": "...", "description": "..."}}
- risks: concrete compliance risks with potential consequences
- stakeholders: named organizations, roles, or departments
- summary: exactly 3 sentences, plain language, most important points only

Respond ONLY with valid JSON matching the schema above."""
)


class DocumentPipeline:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            openai_api_key=settings.openai_api_key
        )
        self.llm = ChatOpenAI(
            model=settings.llm_model,
            temperature=0,
            openai_api_key=settings.openai_api_key
        )
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", " "]
        )
        self.parser = PydanticOutputParser(pydantic_object=ExtractedEntities)

    def load_document(self, file_path: str, file_type: str):
        if file_type == "pdf":
            loader = PyPDFLoader(file_path)
        elif file_type in ["docx", "doc"]:
            loader = Docx2txtLoader(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        return loader.load()

    def process_document(self, file_path: str, file_type: str, doc_id: str) -> Tuple[dict, int]:
        pages = self.load_document(file_path, file_type)
        chunks = self.splitter.split_documents(pages)

        # Store embeddings in ChromaDB
        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=settings.chroma_persist_dir,
            collection_name=f"doc_{doc_id}"
        )
        vectorstore.persist()

        # Extract entities from first 12k chars
        full_text = " ".join([c.page_content for c in chunks])[:12000]

        chain = LLMChain(llm=self.llm, prompt=EXTRACTION_PROMPT)
        result = chain.run(
            text=full_text,
            format_instructions=self.parser.get_format_instructions()
        )

        # Retry once if parse fails
        try:
            entities = self.parser.parse(result)
        except Exception:
            result = chain.run(
                text=full_text[:8000],
                format_instructions=self.parser.get_format_instructions()
            )
            entities = self.parser.parse(result)

        return entities.dict(), len(chunks)

    def semantic_search(self, query: str, collection_ids: List[str], top_k: int = 5) -> List[dict]:
        results = []
        for doc_id in collection_ids:
            try:
                vs = Chroma(
                    persist_directory=settings.chroma_persist_dir,
                    embedding_function=self.embeddings,
                    collection_name=f"doc_{doc_id}"
                )
                hits = vs.similarity_search_with_score(query, k=top_k)
                for doc, score in hits:
                    results.append({
                        "doc_id": doc_id,
                        "content": doc.page_content,
                        "similarity": round(float(1 - score), 3),
                        "metadata": doc.metadata
                    })
            except Exception:
                continue

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]
