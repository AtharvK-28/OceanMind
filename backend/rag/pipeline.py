"""
OceanMind — RAG Conversational Interface (Phase E)
LangChain + Groq (llama3-8b) + sentence-transformers + FAISS.
Every answer carries provenance: source record IDs + quality flags.
"""
import os
import json
import uuid
from datetime import datetime, timezone
from typing import Optional

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
try:
    from langchain_openai import ChatOpenAI
except ImportError:
    ChatOpenAI = None
try:
    from langchain_groq import ChatGroq
except ImportError:
    ChatGroq = None
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from loguru import logger

FAISS_INDEX_PATH = os.path.join(os.path.dirname(__file__), "faiss_index")

# ── Domain knowledge base (in lieu of trained Bar 2020b corpus for MVP) ────────
OCEAN_KNOWLEDGE = [
    {
        "id": "MHI_001",
        "source": "OceanMind_MHI_Model",
        "quality_flag": "GOOD",
        "text": (
            "The Marine Health Index (MHI) measures ocean ecosystem stress on a scale of 0–100. "
            "Scores below 25 indicate CRITICAL stress (marine heatwave or hypoxia). "
            "Scores 25–50 are WARNING (elevated temperature anomaly or chlorophyll depletion). "
            "Scores 50–65 are WATCH. Scores above 65 are NORMAL. "
            "Key indicators: SST anomaly, chlorophyll-a deviation, dissolved oxygen, pH, and salinity. "
            "The compound DO×pH feature detects synergistic acidification stress."
        ),
    },
    {
        "id": "SFZ_001",
        "source": "OceanMind_SFZ_Model",
        "quality_flag": "GOOD",
        "text": (
            "Sustainable Fishing Zones (SFZ) are classified as GREEN (recommended), AMBER (caution), "
            "or RED (avoid). Updated weekly from INCOIS SST composites and GFW fishing effort data. "
            "GREEN zones have optimal SST (24–30°C), healthy chlorophyll levels, and low fishing effort. "
            "RED zones may be overfished, in monsoon season, or near marine heatwave regions. "
            "SHAP values explain the top 3 features driving each zone classification."
        ),
    },
    {
        "id": "ARGO_001",
        "source": "ARGO_GDAC",
        "quality_flag": "GOOD",
        "text": (
            "ARGO floats are autonomous oceanographic profiling instruments deployed globally. "
            "Each float dives to 2000m, drifts, then surfaces transmitting CTD data (temperature, "
            "salinity, pressure) via satellite. The Indian Ocean has ~600 active ARGO floats. "
            "Arabian Sea floats record the oxygen minimum zone at 150–1000m depth. "
            "Bay of Bengal floats show strong freshwater influence from river runoff."
        ),
    },
    {
        "id": "INCOIS_001",
        "source": "INCOIS",
        "quality_flag": "GOOD",
        "text": (
            "INCOIS (Indian National Centre for Ocean Information Services) provides daily ocean "
            "forecasts and Potential Fishing Zone (PFZ) advisories for Indian coastal fishermen. "
            "PFZ advisories are based on SST fronts and chlorophyll-a concentration derived from "
            "satellite imagery. They guide ~14.5 million Indian fishermen. "
            "Gujarat and Tamil Nadu coastal waters show highest PFZ frequencies in Oct–March."
        ),
    },
    {
        "id": "IUU_001",
        "source": "GFW_AIS",
        "quality_flag": "PROBABLY_GOOD",
        "text": (
            "Illegal, Unreported, and Unregulated (IUU) fishing accounts for 11–26 million tonnes "
            "annually worldwide. Global Fishing Watch (GFW) detects IUU signals from AIS data: "
            "vessels appearing stationary at port while logbooks show fishing activity, positional "
            "jumps exceeding vessel rated speed, and transponder gaps in known fishing areas. "
            "The Indian EEZ has an estimated 7 million small-scale fishers below the 15m AIS threshold."
        ),
    },
    {
        "id": "EDNA_001",
        "source": "NCBI_SRA",
        "quality_flag": "GOOD",
        "text": (
            "Environmental DNA (eDNA) metabarcoding detects species from DNA shed into water. "
            "MiFish primers (12S rRNA region) are standard for marine fish detection. "
            "eDNA surveys detect 23+ additional species compared to 14 years of visual surveys "
            "(Yamamoto et al. 2017). Processing requires 24–48 hours minimum; OceanMind uses "
            "published cached datasets only. WoRMS AphiaIDs provide canonical species identifiers."
        ),
    },
    {
        "id": "SPECIES_001",
        "source": "WoRMS_CMFRI",
        "quality_flag": "GOOD",
        "text": (
            "Key Indian Ocean commercial species: Rastrelliger kanagurta (Indian mackerel, AphiaID 217044) "
            "is the most important small pelagic fish in Indian waters. Sardinella longiceps (oil sardine, "
            "AphiaID 217033) dominates Kerala and Karnataka landings. Penaeus monodon (giant tiger prawn, "
            "AphiaID 158966) is a high-value aquaculture and wild-catch species. "
            "Yellowfin tuna (Thunnus albacares, AphiaID 127660) is the primary IOTC-managed tuna species "
            "in the Indian Ocean."
        ),
    },
    {
        "id": "MHW_001",
        "source": "INCOIS_CMFRI",
        "quality_flag": "GOOD",
        "text": (
            "Marine Heatwaves (MHW) in the Indian Ocean have increased fourfold in the tropical region. "
            "The Bay of Bengal experienced 94 MHW events between 1982–2018. CMFRI attributes reduced "
            "fish productivity to prolonged MHW days in recent years. "
            "OceanMind's digital twin scenarios can simulate '+2°C SST for N weeks' projections showing "
            "MHI score degradation and migration zone shifts."
        ),
    },
    {
        "id": "GUJARAT_001",
        "source": "INCOIS_REGIONAL",
        "quality_flag": "GOOD",
        "text": (
            "Gujarat coast (Indian EEZ, Arabian Sea) — Veraval is India's largest fishing port by volume. "
            "Primary species: Indian mackerel, Bombay duck, pomfret, croaker. "
            "Fishing season: October to May (southwest monsoon ban June–September). "
            "Recent MHI data for the Gujarat coastal region shows seasonal stress patterns "
            "correlated with Arabian Sea warming events and oxygen minimum zone expansion."
        ),
    },
]


class OceanMindRAG:
    """
    LangChain RAG pipeline for OceanMind.
    Groq (llama3-8b) + sentence-transformers + FAISS.
    Every answer includes provenance: source record IDs + quality flags.
    """

    def __init__(self):
        self.vectorstore: Optional[FAISS] = None
        self.llm: Optional[ChatGroq] = None
        self._ready = False
        self._docs: list[Document] = []

    def initialise(self):
        """Build FAISS index + initialise LLM (xAI Grok or Groq)."""
        xai_key = os.getenv("XAI_API_KEY", "")
        groq_key = os.getenv("GROQ_API_KEY", "")
        if not xai_key and not groq_key:
            logger.warning("No LLM API key set — RAG will use fallback mode.")

        logger.info("Initialising RAG pipeline (sentence-transformers CPU mode)...")

        # Embeddings: all-MiniLM-L6-v2 runs on CPU, 384-dim
        embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )

        # Build documents with provenance metadata
        self._docs = [
            Document(
                page_content=item["text"],
                metadata={
                    "source_id": item["id"],
                    "source_system": item["source"],
                    "quality_flag": item["quality_flag"],
                    "ingestion_ts": datetime.now(timezone.utc).isoformat(),
                    "schema_version": "1.0",
                },
            )
            for item in OCEAN_KNOWLEDGE
        ]

        # Split long documents
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        split_docs = splitter.split_documents(self._docs)

        if os.path.exists(FAISS_INDEX_PATH):
            logger.info("Loading existing FAISS index...")
            self.vectorstore = FAISS.load_local(
                FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True
            )
        else:
            logger.info("Building FAISS index from domain knowledge...")
            self.vectorstore = FAISS.from_documents(split_docs, embeddings)
            os.makedirs(FAISS_INDEX_PATH, exist_ok=True)
            self.vectorstore.save_local(FAISS_INDEX_PATH)

        # LLM: prefer xAI Grok, fall back to Groq, then fallback mode
        if xai_key and ChatOpenAI:
            self.llm = ChatOpenAI(
                model="grok-3-mini",
                api_key=xai_key,
                base_url="https://api.x.ai/v1",
                temperature=0.1,
                max_tokens=512,
            )
            self._llm_name = "grok-3-mini (xAI)"
            logger.info("LLM: xAI Grok connected.")
        elif groq_key and ChatGroq:
            self.llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                api_key=groq_key,
                temperature=0.1,
                max_tokens=512,
            )
            self._llm_name = "llama-3.3-70b-versatile (Groq)"
            logger.info("LLM: Groq connected.")
        else:
            self.llm = None
            self._llm_name = "fallback"

        self._ready = True
        logger.success("RAG pipeline ready.")

    def query(self, question: str, top_k: int = 4) -> dict:
        """
        Process a natural language ocean question.
        Returns: answer + provenance citations.
        """
        if not self._ready:
            self.initialise()

        answer_id = str(uuid.uuid4())[:8]

        # Retrieve relevant chunks
        retriever = self.vectorstore.similarity_search_with_score(question, k=top_k)
        context_parts = []
        provenance = []

        for doc, score in retriever:
            context_parts.append(doc.page_content)
            provenance.append({
                "source_id":     doc.metadata.get("source_id"),
                "source_system": doc.metadata.get("source_system"),
                "quality_flag":  doc.metadata.get("quality_flag"),
                "ingestion_ts":  doc.metadata.get("ingestion_ts"),
                "schema_version": doc.metadata.get("schema_version"),
                "relevance_score": round(float(score), 4),
                "ai_answer_id":  answer_id,
            })

        context = "\n\n".join(context_parts)

        # Generate answer
        if self.llm:
            prompt = ChatPromptTemplate.from_messages([
                ("system",
                 "You are OceanMind, an AI marine intelligence assistant for Indian fisheries and ocean science. "
                 "Answer using ONLY the provided context. Be concise and factual. "
                 "If the context doesn't cover the question, say so clearly.\n\nContext:\n{context}"),
                ("human", "{question}"),
            ])
            chain = prompt | self.llm
            response = chain.invoke({"context": context, "question": question})
            answer = response.content
        else:
            # Fallback: return context-based answer without LLM
            answer = (
                f"[RAG Fallback Mode — no LLM API key configured]\n\n"
                f"Based on retrieved ocean data:\n{context[:600]}..."
            )

        return {
            "answer":     answer,
            "question":   question,
            "answer_id":  answer_id,
            "provenance": provenance,
            "model_used": self._llm_name if hasattr(self, '_llm_name') else "fallback",
            "timestamp":  datetime.now(timezone.utc).isoformat(),
        }

    def add_db_context(self, db_summary: dict):
        """
        Inject live DB statistics into the knowledge base.
        Called on startup to give RAG awareness of current data.
        """
        if not self._ready:
            return
        summary_text = (
            f"Current OceanMind database status: "
            f"{db_summary.get('argo_count', 0)} ARGO profiles, "
            f"{db_summary.get('sst_count', 0)} INCOIS SST records, "
            f"{db_summary.get('ais_count', 0)} AIS vessel records, "
            f"{db_summary.get('sfz_green', 0)} GREEN zones / "
            f"{db_summary.get('sfz_amber', 0)} AMBER zones / "
            f"{db_summary.get('sfz_red', 0)} RED zones for the current week."
        )
        doc = Document(
            page_content=summary_text,
            metadata={
                "source_id": "DB_LIVE_STATS",
                "source_system": "OceanMind_DB",
                "quality_flag": "GOOD",
                "ingestion_ts": datetime.now(timezone.utc).isoformat(),
                "schema_version": "1.0",
            },
        )
        embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
        )
        self.vectorstore.add_documents([doc])
        logger.info("Live DB context injected into RAG index.")


# Module-level singleton
rag_pipeline = OceanMindRAG()
