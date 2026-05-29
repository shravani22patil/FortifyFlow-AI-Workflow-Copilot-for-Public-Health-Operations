from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    openai_api_key: str = ""
    supabase_url: str = ""
    supabase_key: str = ""
    database_url: str = "sqlite:///./fortifyflow.db"
    chroma_persist_dir: str = "./vector_store"
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 50
    chunk_size: int = 1000
    chunk_overlap: int = 200
    llm_model: str = "gpt-4-turbo"
    embedding_model: str = "text-embedding-3-small"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
