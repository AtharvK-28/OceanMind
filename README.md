# 🌊 OceanMind

**AI-Driven Unified Marine Data Intelligence Platform**

> Biothon 2026 · Environment & Biodiversity Domain  
> Marwadi University, Dept. of Bioinformatics  
> Authors: Adi (Crriminson) · Atharv (AtharvK-28)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?logo=next.js)](https://nextjs.org)
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
  Isolation Forest MHI · RAG (LangChain + OpenRouter)
  YOLOv8 landing-site CV · 1D CNN eDNA
              │
              ▼
API + Alerts (Phases E–F)
  FastAPI REST · Twilio SMS · Firebase FCM · Bhashini voice
              │
              ▼
Dashboard (Frontend)
  Next.js React PWA · Leaflet maps · Recharts · RAG chat
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
├── docker-compose.yml        # DB + API backend
├── requirements.txt
│
├── backend/
│   ├── main.py               # FastAPI app — all Phase A-H endpoints
│   ├── db/
│   │   ├── connection.py     # SQLAlchemy + psycopg3 + health check
│   │   └── schema.sql        # PostGIS schema (all tables)
│   ├── ingestion/
│   │   ├── argo_pipeline.py  # ARGO float CTD ingestion (Phase A)
│   │   ├── incois_pipeline.py# INCOIS SST/Chl-a ingestion (Phase A)
│   │   └── gfw_pipeline.py   # GFW AIS fishing effort (Phase A)
│   ├── models/
│   │   ├── artifacts/        # pre-trained .pkl files
│   │   ├── mhi.py            # Isolation Forest Marine Health Index (Phase C)
│   │   ├── sfz.py            # XGBoost SFZ classifier + SHAP (Phase D)
│   │   └── blockchain.py     # Mock SHA-256 hash chain (Phase H)
│   ├── processing/
│   │   ├── ais_quality.py    # 5-stage AIS quality pipeline (Phase A)
│   │   └── data_bubbles.py   # PostGIS spatiotemporal fusion (Phase A)
│   └── rag/
│       └── pipeline.py       # LangChain + OpenRouter + FAISS RAG (Phase E)
│
├── frontend-react/
│   ├── src/app/              # Next.js App Router
│   ├── public/manifest.json  # PWA configuration
│   └── package.json          # Frontend dependencies
│
├── tests/
│   ├── test_phase_a.py           # Phase A integration tests (DB-dependent)
│   ├── test_phase_b_and_g.py     # Phase B + G tests (CV, eDNA, Digital Twin)
│   └── test_phase_c_d_e_f_h.py   # Phase C-H tests (MHI, SFZ, RAG, Voice, Blockchain)
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
- Docker + Docker Compose (for PostGIS & API)
- [OpenRouter API key](https://openrouter.ai) (free) — powers the RAG interface

### 2. Clone & Configure

```bash
git clone https://github.com/your-org/OceanMind.git
cd OceanMind
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD and OPENROUTER_API_KEY at minimum
```

### 3a. Docker Compose (Backend) + Local Frontend

```bash
# 1. Start PostGIS + FastAPI backend
docker compose up --build -d
# API:       http://localhost:8000
# API docs:  http://localhost:8000/docs

# 2. Start Next.js PWA Frontend (separate terminal)
cd frontend-react
npm install
npm run dev
# Dashboard: http://localhost:3000
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

# Run Next.js React PWA dashboard (separate terminal)
make frontend
# → http://localhost:3000
```

---

## API Endpoints

| Phase | Endpoint | Method | Description |
|-------|----------|--------|-------------|
| A | `/api/v1/data/bubble?bubble_id=N` | GET | Unified multi-source join via Data Bubble |
| B | `/api/v1/cv/analyze` | POST | YOLOv8 landing-site fish species ID + length estimation |
| B | `/api/v1/cv/species-reference` | GET | WoRMS-validated species reference list |
| B | `/api/v1/edna/analyze` | POST | eDNA metabarcoding pipeline + diversity indices |
| C | `/api/v1/mhi/status` | GET | MHI grid scores for Indian EEZ |
| C | `/api/v1/mhi/score` | POST | Single-point MHI score |
| C | `/api/v1/migration/forecast` | GET | ConvLSTM migration heatmap with CI bands |
| D | `/api/v1/sfz/current` | GET | Weekly SFZ GeoJSON + SHAP |
| D | `/api/v1/sfz/classify` | POST | Classify single location |
| E | `/api/v1/rag/query` | POST | Natural language marine query + provenance |
| F | `/api/v1/alerts/subscribe` | POST | Register for SMS/FCM alerts |
| F | `/api/v1/alerts/trigger-demo` | GET | Demo zone-change alert |
| G | `/api/v1/digital-twin/scenario` | POST | MHW scenario engine (SST perturbation) |
| G | `/api/v1/digital-twin/presets` | GET | IPCC/MHW scenario presets |
| H | `/api/v1/trace/catch` | POST | Log catch to blockchain ledger |
| H | `/api/v1/trace/verify/{tx_id}` | GET | Verify transaction |
| H | `/api/v1/trace/chain-summary` | GET | Ledger statistics |
| H | `/api/v1/trace/history` | GET | Catch history (filterable by landing site) |
| F | `/api/v1/voice/query` | POST | Bhashini voice: STT → RAG → TTS (Hindi/Tamil/English) |
| F | `/api/v1/voice/languages` | GET | Supported voice languages |

Full interactive docs at `/docs` (Swagger UI).

---

## Phase Status

| Phase | Description | Status | Tests |
|-------|-------------|--------|-------|
| **A** | Data ingestion, schema matching, PostGIS Data Bubbles, AIS QC | ✅ Complete | `test_phase_a.py` |
| **B** | Landing-site CV (YOLOv8), eDNA pipeline, WoRMS entity resolution | ✅ Complete (synthetic MVP) | `test_phase_b_and_g.py` |
| **C** | ConvLSTM migration forecast, MHI (Isolation Forest) | ✅ Complete | `test_phase_c_d_e_f_h.py` |
| **D** | XGBoost SFZ classifier + SHAP explainability | ✅ Complete | `test_phase_c_d_e_f_h.py` |
| **E** | RAG: LangChain + OpenRouter (llama3-70b) + FAISS + provenance | ✅ Complete | `test_phase_c_d_e_f_h.py` |
| **F** | SMS/FCM alerts, Bhashini voice (Hindi + Tamil) | ✅ Endpoint ready; Twilio/FCM Phase 2 | `test_phase_c_d_e_f_h.py` |
| **G** | Digital twin MHW scenario engine | ✅ Complete | `test_phase_b_and_g.py` |
| **H** | Blockchain catch traceability (mock SHA-256 ledger) | ✅ Complete | `test_phase_c_d_e_f_h.py` |

---

## Key Technologies

| Layer | Tech |
|-------|------|
| Database | PostgreSQL 15 + PostGIS 3.3 |
| Backend  | FastAPI 0.111, Python 3.11, SQLAlchemy 2, psycopg3 |
| ML       | XGBoost, Isolation Forest (scikit-learn), SHAP |
| Deep Learning | PyTorch (ConvLSTM stub) |
| RAG      | LangChain, OpenRouter (llama3-70b), sentence-transformers, FAISS |
| Geospatial | GeoAlchemy2, Shapely, Leaflet |
| Frontend | Next.js (React), PWA configured, Recharts, React-Leaflet |
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

## Testing

```bash
# All tests (no DB required for B/C/D/E/F/G/H)
python tests/test_phase_b_and_g.py
python tests/test_phase_c_d_e_f_h.py

# Phase A only (requires running PostGIS)
python tests/test_phase_a.py
```

---

## Fallback Mode

Without a live database or API credentials, the system runs in **offline fallback mode**:
- All ML models use pre-trained `.pkl` artifacts in `backend/models/artifacts/`
- Ingestion pipelines generate realistic synthetic data matching the schema
- RAG uses a built-in domain knowledge base (no API key needed for retrieval; LLM answer generation requires OPENROUTER_API_KEY)
- The full API and dashboard are functional for demo purposes

Set `FALLBACK_DATA_MODE=true` in `.env` (default) to enable.

---

## Configuration

Key environment variables (see `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | Yes | PostGIS password |
| `OPENROUTER_API_KEY`| Recommended | OpenRouter API key for LLM RAG answers |
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
