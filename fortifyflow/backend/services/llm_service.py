from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage
from config import get_settings

settings = get_settings()

SYSTEM_PROMPTS = {
    "stakeholder": (
        "You are writing a professional stakeholder update for a public health food fortification program. "
        "Use clear, formal language. Structure: executive summary, progress highlights, critical issues, upcoming milestones."
    ),
    "donor": (
        "You are writing a donor-facing report for a public health NGO. "
        "Highlight impact metrics, fund utilization, and program outcomes. Be specific with numbers. "
        "Structure: program overview, key achievements, challenges, financial summary, next steps."
    ),
    "internal": (
        "You are writing an internal operational summary. Be direct. "
        "Highlight blockers, action items, and owners. No jargon. "
        "Structure: status overview, issues requiring attention, completed items, upcoming deadlines."
    ),
    "field": (
        "You are writing a field briefing for on-ground officers. Be practical and action-oriented. "
        "Use simple language. Number every action item. "
        "Structure: situation overview, immediate actions required, standard procedures reminder, contacts."
    ),
}

SOP_PROMPTS = {
    "sop": "Generate a formal Standard Operating Procedure with numbered steps. Include purpose, scope, materials needed, and step-by-step procedure. Each step should have a clear action verb.",
    "beginner_guide": "Generate a beginner-friendly guide. Use simple language, define all technical terms, number every step, and add helpful tips in brackets.",
    "checklist": "Generate a checkbox checklist. Each item should be a single, verifiable action. Group related items under headings.",
    "training_outline": "Generate a training session outline with sections, learning objectives, key points, and knowledge check questions.",
}


class LLMService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.llm_model,
            temperature=0.4,
            openai_api_key=settings.openai_api_key
        )

    def generate_report(self, report_type: str, tone: str, doc_summaries: list,
                        csv_insights: list, custom_context: str) -> str:
        system = SYSTEM_PROMPTS.get(report_type, SYSTEM_PROMPTS["stakeholder"])
        context = f"""
Document analyses:
{doc_summaries}

Monitoring data insights:
{csv_insights}

Additional context:
{custom_context}

Tone: {tone}
"""
        messages = [
            SystemMessage(content=system),
            HumanMessage(content=f"Generate a comprehensive {report_type} report using:\n{context}")
        ]
        response = self.llm(messages)
        return response.content

    def generate_manual(self, output_type: str, source_text: str, audience: str) -> str:
        system = SOP_PROMPTS.get(output_type, SOP_PROMPTS["sop"])
        messages = [
            SystemMessage(content=system + f"\nAudience: {audience}"),
            HumanMessage(content=f"Convert the following workflow into the requested format:\n\n{source_text}")
        ]
        response = self.llm(messages)
        return response.content
