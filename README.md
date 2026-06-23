# 🌊 OceanMind

**AI-Driven Unified Marine Data Intelligence Platform**

> Biothon 2026 · Environment & Biodiversity Domain  
> Marwadi University, Dept. of Bioinformatics  
> Authors: Adi (Crriminson) · Atharv (AtharvK-28)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.36-FF4B4B?logo=streamlit)](https://streamlit.io)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)](https://python.org)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.3-336791?logo=postgresql)](https://postgis.net)

---

## What is OceanMind?

OceanMind integrates three historically siloed data pillars — **oceanographic sensor data**, **fisheries catch records**, and **molecular biodiversity (eDNA)** — into a single AI-powered intelligence layer for real-time marine decision support.

35.5% of global fish stocks are overfished (FAO 2025). The Indian Ocean is among the fastest-warming ocean basins. 14.5 million Indians depend on marine fisheries. OceanMind addresses both the ecological crisis and the analytical bottleneck.

---

## Architecture

```
Data Sources (Pillar 1–3)
  ARGO · INCOIS · GFW · NCBI · IndOBIS · IOTC · CMFRI
              │
              ▼
Integration Layer (Phase A)
  Schema matching · Data Bubbles (PostGIS) · AIS QC pipeline
  OBDA/SPARQL (Apache Jena) · Provenance tagging
              │
              ▼
ML / AI Layer (Phases B–G)
  ConvLSTM migration · XGBoost SFZ + SHAP
  Isolation Forest MHI · RAG (LangChain + Groq)
  YOLOv8 landing-site CV · 1D CNN eDNA
              │
              ▼
API + Alerts (Phases E–F)
  FastAPI REST · Twilio SMS · Firebase FCM · Bhashini voice
              │
              ▼
Dashboard (Frontend)
  Streamlit · Folium map · Plotly · RAG chat
```

---

## Project Structure

```
OceanMind/
├── .env.example              # copy to .env and fill in credentials
├── .gitignore
├── Dockerfile
├── Makefile                  # dev workflow shortcuts
├── README.md
├── docker-compose.yml        # DB + API + frontend
├── requirements.txt
│
├── backend/
│   ├── main.py               # FastAPI app (all endpoints)
│   ├── db/
│   │   ├── connection.py     # SQLAlchemy + psycopg3 + health check
│   │   └── schema.sql        # PostGIS schema (all tables)
│   ├── ingestion/
│   │   ├── argo_pipeline.py  # ARGO float CTD ingestion (Phase A)
│   │   ├── incois_pipeline.py# INCOIS SST/Chl-a ingestion (Phase A)
│   │   └── gfw_pipeline.py   # GFW AIS fishing effort (Phase A) ← NEW
│   ├── models/
│   │   ├── artifacts/        # pre-trained .pkl files
│   │   ├── mhi.py            # Isolation Forest Marine Health Index (Phase C)
│   │   ├── sfz.py            # XGBoost SFZ classifier + SHAP (Phase D)
│   │   └── blockchain.py     # Mock SHA-256 hash chain (Phase H)
│   ├── processing/
│   │   ├── ais_quality.py    # 5-stage AIS quality pipeline (Phase A)
│   │   └── data_bubbles.py   # PostGIS spatiotemporal fusion (Phase A)
│   └── rag/
│       └── pipeline.py       # LangChain + Groq + FAISS RAG (Phase E)
│
├── frontend/
│   └── app.py                # Streamlit dashboard ← NEW
│
├── tests/
│   └── test_phase_a.py       # Phase A integration tests
│
└── docs/
    ├── OceanMind_PRD.md
    ├── OceanMind_TRD.md
    └── OceanMind_Implementation_Plan.md
```

---

## Quick Start

### 1. Prerequisites

- Python 3.11+
- Docker + Docker Compose (for PostGIS)
- [Groq API key](https://console.groq.com) (free) — powers the RAG interface

### 2. Clone & Configure

```bash
git clone https://github.com/your-org/OceanMind.git
cd OceanMind
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD and GROQ_API_KEY at minimum
```

### 3a. Docker Compose (recommended)

```bash
# Starts PostGIS + FastAPI + Streamlit in one command
docker compose up --build

# API:       http://localhost:8000
# API docs:  http://localhost:8000/docs
# Dashboard: http://localhost:8501
```

### 3b. Local dev

```bash
# Create virtualenv and install dependencies
make setup
source .venv/bin/activate

# Start PostGIS only
make db

# Run FastAPI backend (hot-reload)
make api
# → http://localhost:8000/docs

# Run Streamlit dashboard (separate terminal)
make frontend
# → http://localhost:8501
```

---

## API Endpoints

| Phase | Endpoint | Method | Description |
|-------|----------|--------|-------------|
| A | `/api/v1/data/bubble?bubble_id=N` | GET | Unified multi-source join via Data Bubble |
| C | `/api/v1/mhi/status` | GET | MHI grid scores for Indian EEZ |
| C | `/api/v1/mhi/score` | POST | Single-point MHI score |
| C | `/api/v1/migration/forecast` | GET | ConvLSTM migration heatmap |
| D | `/api/v1/sfz/current` | GET | Weekly SFZ GeoJSON + SHAP |
| D | `/api/v1/sfz/classify` | POST | Classify single location |
| E | `/api/v1/rag/query` | POST | Natural language marine query |
| F | `/api/v1/alerts/subscribe` | POST | Register for SMS/FCM alerts |
| F | `/api/v1/alerts/trigger-demo` | GET | Demo zone-change alert |
| H | `/api/v1/trace/catch` | POST | Log catch to blockchain ledger |
| H | `/api/v1/trace/verify/{tx_id}` | GET | Verify transaction |
| H | `/api/v1/trace/chain-summary` | GET | Ledger statistics |

Full interactive docs at `/docs` (Swagger UI).

---

## Phase Status

| Phase | Description | Status |
|-------|-------------|--------|
| **A** | Data ingestion, schema matching, PostGIS Data Bubbles, AIS QC | ✅ Complete |
| **B** | Landing-site CV (YOLOv8), eDNA pipeline, WoRMS entity resolution | 🏗 Architecture stub |
| **C** | ConvLSTM migration forecast, MHI (Isolation Forest) | ✅ Complete |
| **D** | XGBoost SFZ classifier + SHAP explainability | ✅ Complete |
| **E** | RAG: LangChain + Groq (llama3-8b) + FAISS + provenance | ✅ Complete |
| **F** | SMS/FCM alerts, Bhashini voice (Hindi + Tamil) | ✅ Endpoint ready; Twilio/FCM Phase 2 |
| **G** | Digital twin MHW scenario engine | 🏗 Architecture stub |
| **H** | Blockchain catch traceability (mock SHA-256 ledger) | ✅ Complete |

---

## Key Technologies

| Layer | Tech |
|-------|------|
| Database | PostgreSQL 15 + PostGIS 3.3 |
| Backend  | FastAPI 0.111, Python 3.11, SQLAlchemy 2, psycopg3 |
| ML       | XGBoost, Isolation Forest (scikit-learn), SHAP |
| Deep Learning | PyTorch (ConvLSTM stub) |
| RAG      | LangChain, Groq (llama3-8b), sentence-transformers, FAISS |
| Geospatial | GeoAlchemy2, Shapely, Folium |
| Frontend | Streamlit, Plotly, streamlit-folium |
| Alerts   | Twilio SMS (Phase 2), Firebase FCM (Phase 2), Bhashini |
| Blockchain | Mock SHA-256 chain (MVP); Hyperledger Fabric 2.5 (Phase 2) |

---

## Data Sources

**Pillar 1 — Oceanographic**  
ARGO GDAC · INCOIS · Copernicus CMEMS · NASA PODAAC · NOAA WOD23 · IMD

**Pillar 2 — Fisheries**  
GFW AIS (fishing effort) · CMFRI FCSA · IOTC tuna catch-and-effort · FAO FishBase

**Pillar 3 — eDNA / Biodiversity**  
NCBI SRA + GenBank · IndOBIS · OBIS · BOLD · GBIF · TARA Oceans

All data sources are publicly accessible (DENIED-002: open data only, permanent constraint).

---

## Fallback Mode

Without a live database or API credentials, the system runs in **offline fallback mode**:
- All ML models use pre-trained `.pkl` artifacts in `backend/models/artifacts/`
- Ingestion pipelines generate realistic synthetic data matching the schema
- RAG uses a built-in domain knowledge base (no Groq key needed for retrieval; LLM answer generation requires GROQ_API_KEY)
- The full API and dashboard are functional for demo purposes

Set `FALLBACK_DATA_MODE=true` in `.env` (default) to enable.

---

## Configuration

Key environment variables (see `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | Yes | PostGIS password |
| `GROQ_API_KEY` | Recommended | Groq API key for llama3-8b RAG answers |
| `GFW_API_KEY` | Optional | Global Fishing Watch AIS data |
| `FALLBACK_DATA_MODE` | No | `true` = use synthetic data (default) |

---

## References

- FAO Marine Fisheries Review 2025 (2,570 stocks assessed)
- Agmata & Guðmundsson 2025 — ConvLSTM CATCH architecture (*Biology Methods & Protocols* 10)
- Hazen et al. 2018 — Dynamic ocean management (*Science Advances* 4)
- Shedrawi et al. 2024 — Ikasavea landing-site CV (*Scientific Reports* 14)
- Yang et al. 2024 — ML for AIS maritime research (*Transportation Research Part E*)
- Sagi, Lehahn & Bar 2020 — AI for ocean data integration (*Elementa*)
- Fernandes-Salvador et al. 2026 — Trustworthy AI for marine management (*Fish and Fisheries*)

---

*OceanMind v1.0-mvp | Biothon 2026 | MIT License*
