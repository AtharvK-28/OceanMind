# OceanMind — Implementation Plan

**AI-Driven Unified Marine Data Intelligence Platform**
Biothon 2026 — Environment & Biodiversity Domain
Marwadi University, Dept. of Bioinformatics

| Field | Value |
|---|---|
| Version | 1.1 |
| Derived from | Ideation Document v7.0, PRD v1.1, TRD v1.1 |
| Status | Pre-build |
| Authors | Adi (Crriminson) · Atharv (AtharvK-28) |

---

## Changelog

| Version | Change | Reason |
|---|---|---|
| v1.0 | Initial release | Derived from Ideation v7.0, PRD v1.0, TRD v1.0 |
| v1.1 | File renamed: `IMPLEMENTATION_PLAN.md` → `OceanMind_Implementation_Plan.md` | Naming convention inconsistency — all OceanMind spec docs follow `OceanMind_{Type}.md` |
| v1.1 | §2.2 Pillar 2: INCOIS PFZ cross-reference note added | TRD §2.2 carries a Pillar 2 INCOIS PFZ row; IMPL v1.0 had no corresponding entry — agent building from IMPL alone would miss the cross-pillar data source |
| v1.1 | Phase B milestone: named test species added | Milestone previously said "3 species" without specifying which — agent would invent or fail on lookup |
| v1.1 | Phase H: mock hash chain decision committed; ⚠ note converted to explicit decision | Open item in §11 was unresolved; committed: Phase H MVP = mock in-memory hash chain |
| v1.1 | §9 Phase 3: "OQ-011" corrected to "THREAD-011" | Wrong identifier; THREAD-011 resolved CV regional model split; OQ-011 does not exist |
| v1.1 | §11 Open Items: IOTC licensing item closed | OQ-033 in Ideation v7.0 confirmed IOTC data is freely downloadable, no registration; item was falsely open |
| v1.1 | §11 Open Items: Phase H item closed (decision committed in Phase H task) | Decision recorded in §3 Phase H |

---

## Document Navigation for AI Agents

| Question type | Primary document |
|---|---|
| What to build, feature scope, phase inclusion | **PRD v1.1** |
| How to build: architecture, models, schema, API contracts | **TRD v1.1** |
| Task execution sequence, milestones, dependencies | **This document (IMPL v1.1)** |
| Why decisions were made, research backing, denied approaches | **Ideation Document v7.0** |

For DENIED ID rationale (DENIED-001 through DENIED-007): see **PRD §8 Out of Scope**.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Sources](#2-data-sources)
3. [Build Phases A–H (MVP)](#3-build-phases-ah-mvp)
4. [Dependency Graph](#4-dependency-graph)
5. [API Endpoints](#5-api-endpoints)
6. [Performance Requirements](#6-performance-requirements)
7. [Testing & Validation Targets](#7-testing--validation-targets)
8. [Fallback Data Strategy](#8-fallback-data-strategy)
9. [Post-MVP Roadmap](#9-post-mvp-roadmap)
10. [Out of Scope](#10-out-of-scope)
11. [Open Items](#11-open-items)
- [Appendix A — Full Tech Stack Reference](#appendix-a--full-tech-stack-reference)
- [Appendix B — Core Database Schema](#appendix-b--core-database-schema)
- [Appendix C — Key References](#appendix-c--key-references)

---

## 1. Architecture Overview

Five-layer stack. Upper layers depend on lower layers — phases are ordered accordingly.

**Data Bubbles:** The core fusion primitive. A `data_bubble` is a PostGIS POINT with adaptive radius (5km coastal / 50km open ocean) and a time window. Every observation table carries a `bubble_id` FK. This single generic join key replaces bespoke per-dataset-pair fusion rules. See TRD §3.3 for full schema.

| Layer | Name | Key Components | Tech |
|---|---|---|---|
| 1 | Data Sources | ARGO, INCOIS, CMEMS, GFW, NCBI, IndOBIS, IOTC, CMFRI, IMD, WOD23, GBIF | NetCDF, JSON, FASTA, CSV, REST |
| 2 | Integration & Storage | Schema matching, OBDA/SPARQL, AIS quality pipeline, `data_bubbles` (PostGIS), entity resolution, provenance tagging | PostgreSQL/PostGIS, Apache Jena, RDFLib, Gensim, Flair NER |
| 3 | ML / AI Processing | ConvLSTM migration, XGBoost SFZ, 1D CNN eDNA, YOLOv8/v9 CV, JSDM, RAG, Isolation Forest MHI | PyTorch, scikit-learn, HMSC, LangChain, FAISS |
| 4 | API & Backend | REST endpoints, SPARQL, Bhashini, alert dispatch, blockchain (Phase 2) | FastAPI, Python 3.11+, Twilio, Firebase, Hyperledger Fabric (Phase 2) |
| 5 | Frontend & UX | Web dashboard, geospatial map, voice interface, mobile app | React/Next.js, Leaflet.js + Plotly, Streamlit (MVP), Bhashini API |

---

## 2. Data Sources

### 2.1 Pillar 1 — Oceanographic

| Source | Format | Cadence | Ingestion |
|---|---|---|---|
| ARGO GDAC (Coriolis/US-GODAE) | CTD T/S profiles; NetCDF | ~10-day per float; ~daily new profiles globally | GDAC FTP/OPeNDAP; Xarray + NetCDF4 |
| INCOIS (MoES) | SST composites, Chl-a, PFZ advisories; JSON/GeoTIFF | Daily to twice-weekly composites | INCOIS API + data.gov.in; GDAL/Xarray |
| Copernicus CMEMS | SST, Chl, SSH/SLA, u/v/w currents, MLD, wave height; NetCDF | Daily analysis; 5-day forecast | Copernicus Marine API (REST/OPeNDAP) |
| NASA Earthdata (PODAAC) | MODIS-Aqua/Terra + VIIRS SST at 0.01°; NetCDF/HDF | Daily overpass; 1-day composites | Earthdata API; OPeNDAP |
| World Ocean Database 2023 (NOAA NCEI) | 18.6M CTD casts (1778–present); quality-controlled; NetCDF | Continuous (updated periodically) | NOAA NCEI portal; OPeNDAP |
| IMD | Weather forecasts, cyclone tracks, wind fields; JSON/CSV | Daily to hourly for severe events | IMD open data portal API |

### 2.2 Pillar 2 — Fisheries

| Source | Format | Cadence | Notes |
|---|---|---|---|
| GFW AIS | Fishing effort density (0.01°, daily); vessel identity; IUU signals; CSV/GeoJSON | Daily | Rate limits apply; non-commercial academic access |
| INCOIS PFZ Advisories | Twice-weekly to daily fisheries zone advisories (SST + Chl-a derived) | Daily to twice-weekly | **Cross-Pillar source:** ingested via Pillar 1 INCOIS pipeline — no separate ingestion step required. PFZ advisory field (`pfz_advisory`) populated in `incois_sst` table. |
| CMFRI FCSA | Marine fish landings, species composition, CPUE; CSV | Annual reports; monthly provisional | CMFRI eprints repository (eprints.cmfri.org.in) |
| IOTC / Global Tuna Atlas | Tuna catch-and-effort by gear type; 1°×1°; Indian Ocean FAO Areas 51+57; CSV | Annual; quarterly updates | iotc.org/data/datasets (OQ-033 ✅ — confirmed free, no registration) |
| FAO FishBase | Fish biology, feeding habits, migration, breeding records | Static reference + periodic | FishBase REST API |
| ReALCraft Portal (⚠ verify: likely DoF/NFDB, not DGTR) | Vessel registration and licensing by size/type/state | As updated | Used in AIS MMSI deduplication step |
| MFC 2025 (CMFRI/DoF) | Geo-referenced fisher household data; vessel inventory; Q3 2026 preliminary expected | Census (once) | OQ-031 ✅ resolved; check data.gov.in monthly from Aug 2026 |

### 2.3 Pillar 3 — Molecular Biodiversity / eDNA

| Source | Format | Use |
|---|---|---|
| NCBI SRA + GenBank | Raw FASTQ; metabarcoding; population genetics (COI, mtDNA, RADseq) | eDNA CNN training; Phase 3 population genomics (OQ-018 Track A, unblocked) |
| EBI / ENA | Complementary metabarcoding; TARA Oceans Indian Ocean transects | Cross-reference NCBI; TARA provides eDNA co-located with CTD for JSDM |
| IndOBIS (CMLRE, Goa) | Georeferenced species occurrence; eDNA-derived | Primary India-specific biodiversity layer; JSDM occurrence records |
| OBIS (global) | 100M+ species occurrence records | Supplementary occurrence for JSDM |
| BOLD (Barcode of Life) | Reference DNA barcodes by species | 1D CNN reference training; WoRMS cross-reference |
| GBIF | 3.5B+ occurrence records; museum, survey, citizen science, eDNA | Supplementary for species with low IndOBIS coverage |
| TARA Oceans (PANGAEA) | Global metabarcoding + oceanographic co-variables; Indian Ocean transects | JSDM training — rare resource: eDNA co-located with CTD |

---

## 3. Build Phases A–H (MVP)

Phases must be started in dependency order (see §4). C and D can run in parallel once A is verified.

---

### Phase A — Data & Integration Foundations

**Builds:** Layers 1 & 2
**Prerequisite:** None — this is the blocker for everything else

#### Tasks

- **PostGIS schema:** Provision PostgreSQL 15+ / PostGIS 3.3+. Implement `data_bubbles` table: adaptive radius 5km coastal / 50km open ocean. Add `bubble_id` FK to all observation tables (`argo_profiles`, `incois_sst`, `gfw_ais`, `edna_occurrences`, `landing_site_cv`). See Appendix B for full schema.
- **Schema matching engine:** Align ARGO NetCDF, INCOIS JSON, NCBI FASTA, GFW CSV, CMFRI CSV to OceanMind unified mediated schema. Implement unit conversion functions: dbar→m (depth), PSU dimensionless salinity, °C/K, coordinate normalisation. See TRD §3.1 for field-level mapping table.
- **OBDA/SPARQL:** Deploy Apache Jena Fuseki 4.x. Map PostgreSQL schema to GeoLink/OceanLink, MarineTLO, WoRMS, and SWEET ontologies. Expose SPARQL 1.1 endpoint at `/sparql`. Read-only.
- **AIS quality pipeline:** Five stages in order — (1) MMSI deduplication via vessel registry cross-reference, (2) Kalman/LSTM trajectory gap filling (< 6h linear; longer gaps LSTM), (3) DBSCAN outlier removal for positional jumps, (4) spoofing detection (stationary-at-port vs. logbook), (5) DBSCAN-SD route clustering. **Run before any IUU signal extraction — not optional (see TRD §3.5).**
- **Provenance tagging:** Every ingested record tagged with `source_system`, `ingestion_ts`, `schema_version`, `quality_flag` (GOOD / PROBABLY_GOOD / BAD / MISSING), `fusion_method`.
- **Initial ingestion:** Pull ARGO profiles (Arabian Sea + Bay of Bengal), INCOIS SST composites, GFW fishing effort density, IndOBIS occurrences.

#### ✓ Milestone
SPARQL query across `bubble_id = 'B-247'` returns unified rows from ARGO + INCOIS SST + landing-site CV in a single result table.

---

### Phase B — Biodiversity & Computer Vision

**Builds:** Layers 2 & 3
**Prerequisite:** Phase A

#### Tasks

**Entity resolution:**
- WoRMS AphiaID canonical keys across all species records (CMFRI, BOLD, IndOBIS). Blocking on geo-coordinates + date + parameter type for sensor records; taxon barcode for eDNA records.
- Example: "Rastrelliger kanagurta" in CMFRI → AphiaID 217044 → linked in BOLD and FishBase.

**NER:**
- Retrain Flair NER on Bar 2020a annotated oceanic NER dataset (DOI: 10.17605/OSF.IO/MY2NK). Entity types: species, parameters, locations.
- Apply to unstructured INCOIS advisories and CMFRI reports for structured metadata extraction.

**CV pipeline — YOLOv8/v9 + ResNet101:**
1. Geometric correction + perspective transform (calibrated mat)
2. Pixel-to-mm calibration using markers on mat
3. YOLOv8/v9 bounding box detection per fish
4. ResNet101 fine-tuned on Indian Ocean species → species ID + confidence
5. Fork/total length (mm) and weight (g) via length-weight relationship

⚠ Recall degrades when >150 new low-sample-count species added simultaneously (Shedrawi et al. 2024). Build on well-represented Indian Ocean species first; expand via transfer learning.

Reference codebase: github.com/PacificCommunity/cfap-ai-models (Ikasavea CV pipeline starting point).

**eDNA bioinformatics pipeline:**
1. FastQC + Trimmomatic (adapter trimming, quality filtering on FASTQ)
2. DADA2 / VSEARCH (ASV denoising; OTU clustering)
3. BLAST+ against NCBI nt, BOLD, IndOBIS (Stage 1 — known species)
4. 1D CNN trained on BOLD 12S/18S barcodes (Stage 2 — novel/uncharacterised)
5. WoRMS API AphiaID lookup for taxonomic normalisation
6. R Vegan: Shannon, Simpson, Bray-Curtis indices

Primers: MiFish 12S rRNA + 18S rRNA (Miya et al. 2015).

⚠ DENIED-001: OceanMind uses published/cached eDNA datasets only — real-time eDNA is permanently out of scope (24–48h biological processing constraint).

#### ✓ Milestone
CV species ID + fork length estimate from catch photo. WoRMS AphiaID lookup for the following three species must succeed across CMFRI + BOLD:
- *Rastrelliger kanagurta* (Indian mackerel — AphiaID 217044)
- *Sardinella longiceps* (oil sardine — AphiaID 217033)
- *Penaeus monodon* (giant tiger prawn — AphiaID 158966)

---

### Phase C — Migration Prediction & Marine Health Index

**Builds:** Layer 3
**Prerequisite:** Phase A

#### Tasks

**ConvLSTM migration model:**
- Architecture: CATCH model (Agmata & Guðmundsson 2025, *Biology Methods & Protocols* 10, DOI: 10.1093/biomethods/bpaf045)
- Input tensor: `(batch, time_steps=52_weeks, H, W, features=11)` — SST weekly composite + anomaly, Chl-a, MLD (ARGO), u/v currents, DO, AIS fishing effort density, SSH anomaly, ILD, wind stress curl
- Output: Probability distribution over Indian EEZ grid for target week + CI bands per grid cell
- Uncertainty quantification (OQ-021 ✅): Monte Carlo Dropout — retain dropout layers active at inference; N=50 stochastic forward passes; mean + std per grid cell; serialise CI bands as GeoJSON polygons
- Training data: 25yr INCOIS SST (2000–2025) + ARGO GDAC + GFW AIS effort density + IOTC tuna catch-and-effort (OQ-033 ✅)
- Benchmark: 2-layer LSTM (128 units, dropout 0.3) + ARIMA. Metrics: Brier Score + F1.
- Optional upgrade (if time permits): Transformer ensemble (4 attention heads, 2 encoder layers) for long-range seasonal dependencies — not required for milestone.

**Marine Health Index (Isolation Forest):**
- Features: SST anomaly, Chl-a deviation, DO, pH, salinity (ARGO CTD)
- Compound stress flag: synergistic DO + pH interaction modelled as joint feature
- Output: MHI score (0–100) per grid cell; configurable alert thresholds
- Served via `GET /api/v1/mhi/status`

#### ✓ Milestone
7-day Indian EEZ migration probability heatmap with CI bands rendered on Leaflet dashboard; MHI score computed for current week and displayed per grid cell.

---

### Phase D — Sustainable Fishing Zones & Species Distribution

**Builds:** Layer 3
**Prerequisite:** Phase A

#### Tasks

**XGBoost SFZ classifier:**
- 5-fold cross-validation (stratified by year); SHAP top-3 feature importances per zone cell per week
- Output classes: Green (recommended), Amber (caution), Red (avoid)
- Weekly update driven by INCOIS SST + Copernicus Chl-a composites
- Upgrade path: CNN-XGBoost fusion (Zhang 2025, DOI: 10.1038/s41598-025-33175-4)
- Phase 2 addition: `legal_status` from `mfra_zones` PostGIS layer (Open / Seasonal Ban / Restricted / No-Take; OQ-032 ✅)

**JSDM (HMSC):**
- Implementation: HMSC R package (Ovaskainen et al. 2017) via rpy2, or PyMC/Stan equivalent
- Occurrence input: IndOBIS + NCBI-derived georeferenced species occurrence (WoRMS-normalised)
- Environmental covariates: INCOIS SST weekly + Copernicus Chl-a (complete Indian EEZ coverage); interpolated ARGO profiles supplementary
- Output: predicted species composition probability map at 1°×1° across Indian EEZ; feeds bycatch risk overlay
- Pre-training feasibility check: spatial overlap query on IndOBIS — verify >10 records per 1°×1° cell for target species (calibration, not go/no-go gate; OQ-027 ✅)

**Weekly SFZ GeoJSON endpoint:** `GET /api/v1/sfz/current` — returns zone class + `bycatch_risk_score` + `shap_top3` fields.

#### ✓ Milestone
SFZ map shows Green/Amber/Red zones + `bycatch_risk_score` + SHAP top-3 features readable from `/api/v1/sfz/current` response.

---

### Phase E — RAG Conversational AI

**Builds:** Layers 3 & 4
**Prerequisite:** Phases A, B, C, D

#### Tasks

- **LangChain RAG pipeline:** FAISS (MVP, zero setup) or ChromaDB (Phase 2, persistent) vector store. LLM: LLaMA 3 or GPT-4o-mini.
- **Domain embeddings:** Ocean-specific Word2Vec fine-tuned on Bar 2020b corpus (175M tokens, 30,000 oceanographic papers — DOI: 10.17605/OSF.IO/8VAFS) via Gensim. Expected 11× F1 vs. general-purpose embeddings (Sagi et al. 2020: F1 0.068 general → 0.738 domain-specific).
- **Flair NER:** Retrain on Bar 2020a dataset for query preprocessing — entity types: species, parameters, locations.
- **Provenance layer:** Every AI answer annotated with source record IDs, ingestion timestamps, quality flags from `provenance_log` table. Fields: `source_table`, `source_system`, `ingestion_ts`, `schema_version`, `quality_flag`, `ai_answer_id`.
- **Endpoint:** `POST /api/v1/rag/query` — accepts natural language; returns answer + provenance citations + source record IDs.

#### ✓ Milestone
Query "marine health near Gujarat this week" returns answer citing specific source records with `provenance_id`s and quality flags visible in the response.

---

### Phase F — Alerts & Voice Interface

**Builds:** Layers 4 & 5
**Prerequisite:** Phases D, E
**SLA:** Safety-critical — zone-change → SMS < 60 seconds.

#### Tasks

- **Twilio SMS:** Subscribe to SFZ zone-change events. Dispatch SMS within 60s SLA. Alert types: zone change (Green→Amber), MHW onset, cyclone proximity, MHI threshold breach.
- **Firebase FCM:** Push notifications to Android fishermen app for same alert types.
- **Bhashini API (bhashini.gov.in):** MVP — **2 Indian languages: Hindi + Tamil**. Full 22-language rollout in Phase 2. Voice I/O: STT → RAG query → TTS.
- **Event pipeline:** INCOIS SST update → SFZ reclassification trigger → async queue → Twilio + FCM dispatch → delivery confirmation log.
- **Registration endpoint:** `POST /api/v1/alerts/subscribe` — register phone/device with language preference.

#### ✓ Milestone
Simulated zone-change SMS delivered to demo phone within 60 seconds of trigger event; Bhashini voice response demonstrated in Hindi and Tamil.

---

### Phase G — Digital Twin (Scenario Engine)

**Builds:** Layer 3
**Prerequisite:** Phases C, D

#### Tasks

- **Diffusion model for imputation:** Train generative AI / diffusion model (PyTorch `diffusers`) for cloud-occluded INCOIS SST raster pixels + ARGO float spatial gaps. Evaluate SSIM vs. kriging baseline.
- **MHW scenario engine:** Accept parameterised inputs (SST delta, duration weeks) → project MHI score change + migration zone shift using ConvLSTM from Phase C.
- **Streamlit scenario viewer:** Slider for SST delta + duration; render projected heatmap overlay within 30s compute time. (Full Aguzzi et al. 2025 digital twin — Larval Connectivity IBM via OceanParcels — is Phase 2.)

> **Note:** This is an *early version* of the digital twin for MVP. Full digital twin (Lagrangian particle tracking, larval connectivity IBM, socioecological ABM) is Phase 2 / Phase 3.

#### ✓ Milestone
"+2°C SST for 3 weeks" scenario shows projected MHI score change + migration zone shift on Streamlit dashboard within 30-second compute time.

---

### Phase H — Blockchain Traceability

**Builds:** Layer 4
**Prerequisite:** Phase B (CV species ID)

#### Phase H Blockchain Decision (committed v1.1)

> **MVP (hackathon):** Implement as a **mock in-memory hash chain** — Python dict simulating an immutable ledger, generating deterministic transaction IDs from catch event data (SHA-256 hash of species AphiaID + quantity + GPS + timestamp). Mark module with `# MOCK_LEDGER` comment at the top. Document in repo README under "Phase H Implementation Notes."
>
> **Phase 2:** Replace mock with real **Hyperledger Fabric 2.5** permissioned network; deploy org MSPs, orderer, channel; smart contracts in Go/Node.js.
>
> Rationale: Full Fabric network setup is disproportionate for hackathon demo. Mock preserves the full API contract (`/api/v1/trace/catch`) so Phase 2 swap-in is a module replacement, not a redesign.

#### Tasks

- **Mock hash chain module:** Python dict-based ledger. Method `log_catch_event(species_aphia_id, quantity_kg, gps, landing_site_id, timestamp)` → returns `transaction_id` (SHA-256 hash) + PMMSY cert reference field.
- **Smart contract spec (Phase 2 reference):** Log catch event (species AphiaID, quantity, GPS, landing site, timestamp) to immutable ledger.
- **PSMA compliance:** Catch records serve as catch documentation PSMA requires (Phase 2 via real Fabric; mock provides API surface for integration testing).
- **Endpoint:** `POST /api/v1/trace/catch` — register catch event; returns `transaction_id` + `pmmsy_cert_ref`. Links to `landing_site_cv` table for Phase 2 CPUE dashboard.

#### ✓ Milestone
Mock catch record written to in-memory hash chain; `transaction_id` (SHA-256) returned via `/api/v1/trace/catch`; module has `# MOCK_LEDGER` flag; documented in repo README.

---

## 4. Dependency Graph

```
Phase A  ──┬──► Phase B ──┬──► Phase E ──► Phase F
           │               └──► Phase H
           ├──► Phase C ──┬──► Phase E
           │               └──► Phase G
           └──► Phase D ──┬──► Phase E
                           ├──► Phase F
                           └──► Phase G
```

| Phase | Depends On | Unlocks | Can Parallelise |
|---|---|---|---|
| A | None | B, C, D | — |
| B | A | E, H | With C, D |
| C | A | E, G | With B, D |
| D | A | E, F, G | With B, C |
| E | A, B, C, D | F | — |
| F | D, E | Phase 2 | With G, H |
| G | C, D | Phase 2 | With F, H |
| H | B | Phase 2 | With F, G |

**Recommended sprint tracks for hackathon:**

- **Track 1 (Data/Backend):** A → C + D (parallel) → E
- **Track 2 (CV/Bio):** B → H
- **Track 3 (UX/Alerts):** F → G (prototype UI concurrently with Tracks 1 & 2)

---

## 5. API Endpoints

All served via FastAPI. OpenAPI docs auto-generated at `/docs`.

| Endpoint | Method | Phase | Description |
|---|---|---|---|
| `/api/v1/migration/forecast` | GET | MVP | ConvLSTM migration probability map for next N weeks; GeoJSON with CI bands per grid cell |
| `/api/v1/sfz/current` | GET | MVP | Current week SFZ GeoJSON; Green/Amber/Red + `bycatch_risk_score` + `shap_top3`; `legal_status` added in Phase 2 |
| `/api/v1/mhi/status` | GET | MVP | MHI scores per grid cell; most recent observation window |
| `/api/v1/edna/biodiversity` | GET | MVP | Species richness, Shannon, Simpson; WoRMS-normalised species list per location |
| `/api/v1/alerts/subscribe` | POST | MVP | Register phone/device for zone-change SMS/push; language preference |
| `/api/v1/rag/query` | POST | MVP | Natural language query; returns answer + provenance citations + source record IDs |
| `/api/v1/data/bubble` | GET | MVP | All observations within `bubble_id` + time window; unified multi-source join |
| `/api/v1/landing/cpue` | GET | MVP | CPUE trend per landing site from CV; species-level time series |
| `/api/v1/trace/catch` | POST | MVP (mock) / Phase 2 (Fabric) | Register verified catch event to mock/real ledger; returns `transaction_id` + PMMSY cert reference |

**SPARQL endpoint:** `/sparql` via Apache Jena Fuseki. Read-only. Example query in TRD §7.2.

**API security (production):** JWT auth on REST; HTTPS/TLS; rate limiting per API key; SPARQL endpoint read-only.

---

## 6. Performance Requirements

| Component | Target | Rationale |
|---|---|---|
| ARGO ingestion | New profiles within 24h of float surfacing | ARGO GDAC publishes within 12–24h; scheduled pull must match |
| SFZ update cycle | Weekly refresh; alert within 2h of new INCOIS composite | Fishermen plan week-ahead trips |
| ConvLSTM inference | < 30s full Indian EEZ grid (CPU); < 5s on GPU | Interactive dashboard; live demo |
| RAG query response | < 5s end-to-end (retrieval + generation) | Conversational UX expectation |
| Landing-site CV inference | < 10s per catch photo batch | Field use at busy landing sites |
| Alert delivery (SMS/push) | < 60s from zone-change event to first SMS | Safety-critical for cyclone/MHW |
| PostGIS bubble join | < 500ms across 1M records | Indexed geometry; ST_Within with R-tree |
| SPARQL endpoint | < 2s typical ontological discovery query | Interactive exploration |

---

## 7. Testing & Validation Targets

### Model Validation

| Model | Method | Target |
|---|---|---|
| ConvLSTM migration | Held-out 2023–2024 ARGO+INCOIS; compare to CMFRI catch hotspot records | Beat 2-layer LSTM baseline on Brier Score; F1 tracked |
| XGBoost SFZ | 5-fold CV (by year); SHAP stability check across folds | F1 ≥ 0.75 on Amber/Red classification; CPUE prediction r ≥ 0.85 |
| JSDM | Held-out IndOBIS occurrence records; predicted vs. observed species composition at known sample sites | Tjur R² > 0.20 for primary target species |
| CV species ID | Hold-out image set per species; species recall per class | Recall ≥ 90% for top-20 Indian Ocean species by volume (94% achieved by Ikasavea — see Shedrawi et al. 2024) |
| RAG interface | 50 test queries evaluated against known answers; provenance coverage measurement | Provenance coverage 100%; factual accuracy validated by domain expert |

### Integration Tests

- Data pipeline E2E: ARGO GDAC pull → schema matching → `data_bubbles` insert → SPARQL query
- SFZ pipeline: INCOIS SST raster → feature engineering → XGBoost → GeoJSON output → Leaflet render
- Alert pipeline: zone-change event → Twilio SMS → delivery confirmation log
- RAG pipeline: text query → Flair NER → embedding retrieval → LLM generation → provenance annotation → response

### Performance Tests

- Load: 50 concurrent RAG queries; target < 5s p95
- Spatial: `data_bubbles` join across 1M records; target < 500ms
- Inference: ConvLSTM full Indian EEZ grid; target < 30s CPU, < 5s GPU

---

## 8. Fallback Data Strategy

> **DENIED-007 retained:** All fallback datasets must be pre-downloaded and validated **before development begins**. MVP demo must function entirely on pre-loaded fallback data if live APIs are unavailable.

| Dataset | Source | Coverage |
|---|---|---|
| ARGO profiles | ARGO GDAC FTP | Arabian Sea + Bay of Bengal, 2020–2025 |
| eDNA | NCBI SRA | Indian Ocean fish, MiFish 12S primers; representative species |
| INCOIS PFZ advisories | INCOIS API | 2022–2024 static dataset |
| GFW AIS fishing effort | GFW REST API | Indian EEZ, 2022–2024 |
| IOTC tuna catch-and-effort | iotc.org/data/datasets | Indian Ocean FAO Areas 51+57 |
| IndOBIS occurrences | OBIS API export | Indian Ocean |

---

## 9. Post-MVP Roadmap

### Phase 2 — Pilot Deployment (3–6 months post-MVP)

**Milestone:** Pilot active at Veraval + 2 cooperatives; mobile app accessible across 586 INCOIS landing centres.

| Feature | Description | Dependency |
|---|---|---|
| Bhashini full rollout | All 22 scheduled Indian languages; Android mobile app | Phase F MVP (2 languages) |
| MFRA regulatory overlay | `mfra_zones` PostGIS polygon table; `legal_status` on SFZ output; 13 coastal states + 4 UTs | State MFRA database compilation; OQ-032 ✅ |
| Hyperledger Fabric (full) | Real permissioned network replacing Phase H mock; PMMSY-linked cert; PSMA compliance | Phase H mock operational |
| Digital twin (full) | Larval Connectivity IBM via OceanParcels + CMEMS u/v/w; 30–90 day recruitment maps | CMEMS u/v/w ingestion |
| STEAM fleet carbon | GT-based engine power regression per vessel per AIS trip; SDG 13 reporting | AIS quality pipeline |
| Landing-site CPUE dashboard | Species count trend per landing centre; Grafana-style time-series panels | Phase B CV + Phase H operational |
| LBSPR stock assessment | Full stock status estimation from CV landing data | Phase B CV + CMFRI data |
| MFC 2025 integration | Geo-referenced fisher household + vessel inventory | MFC 2025 public release (Q3 2026 preliminary expected; OQ-031 ✅) |

### Phase 3 — National Scale (12–24 months post-MVP)

**Milestone:** National marine intelligence platform operational; carbon credit-linked ecosystem incentives active.

- Multi-omics expansion: population genomics (NCBI SRA Track A) + MHW transcriptomics (CMFRI/CMLRE MOU — OQ-018 Track B)
- Socioecological ABM: simulate policy scenarios (monsoon ban extensions vs. cooperative income); requires MFC 2025 microdata
- All 586 INCOIS landing centres at national scale; one base model + regional fine-tuning heads (Arabian Sea / Bay of Bengal) — **THREAD-011 ✅ resolved**
- Blue carbon MRV integration for carbon credits (Verra VCS, ICM); national marine biodiversity registry via eDNA
- International collaboration: OBIS, FAO, ARGO Global Network, Deep Ocean Mission data integration

---

## 10. Out of Scope

Permanent constraints — not re-openable. See PRD §8 for full rationale.

| Item | DENIED ID | Rationale |
|---|---|---|
| Real-time eDNA data pipeline | DENIED-001 | Hard biological constraint: eDNA processing requires 24–48h minimum. OceanMind uses published/cached datasets only. |
| Proprietary sensor hardware | DENIED-002 | Open data only principle. Permanent for all phases. |
| Direct vessel control or autonomous action | DENIED-003 | Insight-only design. Liability and safety constraint. |
| Auto-filing with government portals | DENIED-004 | Regulatory liability. Insight-only. |
| VMS data ingestion | — | Government-access-only system. AIS via GFW is the open-data proxy. |
| EU THETIS-MRV for carbon estimation | — | EU-flagged vessels only; irrelevant for Indian EEZ. GT-based regression is the default (OQ-030 ✅). |

---

## 11. Open Items

| ID | Item | Owner | Status |
|---|---|---|---|
| OQ-025 | Landing-site CV pilot — initiate INCOIS conversation for Veraval pilot (mackerel + sardine, Oct–Dec). Pilot spec fully defined in Ideation v7.0 §12. | Atharv | **Awaiting Human Execution** (Post-Hackathon Phase) |
| OQ-018 Track B | CMFRI/CMLRE MOU for novel genomic/transcriptomic data generation (Phase 3 readiness). Begin MOU discussion in Phase 2. | Adi | **Awaiting Human Execution** (Post-Hackathon Phase) |
| Section 18.2 | Paste exact official Biothon 2026 Environment & Biodiversity problem statement for word-for-word alignment verification. | Both | **Awaiting Human Execution** (Post-Hackathon Phase) |
| OQ-031 | MFC 2025 preliminary data release (Q3 2026) — check data.gov.in monthly from Aug 2026. | Atharv | **Awaiting Human Execution** (Monitor) |
| ReALCraft attribution | Verify vessel registry portal authority — DGTR (Directorate General of Trade Remedies) handles anti-dumping, not vessel registration. Likely DoF (Department of Fisheries) or NFDB. Confirm URL and update TRD §2.2 and IMPL §2.2. | Adi | **Awaiting Human Execution** (Before Phase A AIS pipeline) |
| ~~IOTC licensing~~ | ~~Verify IOTC open-access terms before ConvLSTM training.~~ | — | **✅ CLOSED** — OQ-033 resolved in Ideation v7.0. IOTC data freely downloadable at iotc.org/data/datasets; no registration required; confirmed compliant with open-data principle. |
| ~~Phase H mock vs. Fabric~~ | ~~Mock hash chain vs. real Hyperledger Fabric for MVP?~~ | — | **✅ CLOSED** — Decision committed in §3 Phase H and TRD §5.5: Phase H MVP = mock in-memory hash chain. Hyperledger Fabric 2.5 = Phase 2. |

---

## Appendix A — Full Tech Stack Reference

| Category | Tool | Version | Usage |
|---|---|---|---|
| Language | Python | 3.11+ | Primary |
| Database | PostgreSQL + PostGIS | 15+ / 3.3+ | Geospatial schema; ST_Within / bubble joins |
| Semantic | Apache Jena Fuseki | 4.x | SPARQL endpoint; OBDA layer |
| Semantic (Python) | RDFLib | 6.x | Ontology mapping in Python |
| API | FastAPI | Latest stable | Async REST; auto OpenAPI docs |
| Raster ingestion | NetCDF4 + Xarray | Latest | ARGO + satellite raster |
| Data | Pandas + NumPy | Pandas 2.x; NumPy 1.26+ | Feature engineering |
| Embeddings | Gensim | 4.x | Ocean-specific Word2Vec |
| NER | Flair | 0.12+ | Entity extraction; oceanic NER |
| ML — time series | PyTorch (ConvLSTM) | Latest | CATCH architecture migration model |
| ML — tabular | XGBoost + SHAP | 1.7+ | SFZ classifier + explainability |
| ML — CV | Ultralytics YOLOv8/v9 + torchvision ResNet101 | Latest | Landing-site species ID + fork length |
| ML — eDNA | PyTorch (1D CNN) | Latest | Species classification from barcodes |
| ML — ecology | HMSC (R + rpy2) | 3.0 | JSDM; bycatch risk overlay |
| ML — anomaly | scikit-learn IsolationForest | Latest | Marine Health Index |
| RAG | LangChain + FAISS / ChromaDB | Latest | Conversational AI pipeline |
| LLM | LLaMA 3 or GPT-4o-mini | Latest | RAG generation backbone |
| Bioinformatics | FastQC + Trimmomatic | Latest | FASTQ QC + adapter trimming |
| Bioinformatics | DADA2 / VSEARCH | Latest | ASV denoising; OTU clustering |
| Bioinformatics | BLAST+ | Latest | Sequence alignment against NCBI/BOLD/IndOBIS |
| Bioinformatics | Biopython | Latest | NCBI Entrez API; FASTA handling |
| Bioinformatics | R Vegan (rpy2) | Latest | Shannon, Simpson, Bray-Curtis |
| Taxonomy | WoRMS REST API (aphiamatch) | Latest | Canonical AphiaID lookup; batch |
| Alerts | Twilio SMS | Latest | Zone-change + cyclone alert dispatch |
| Alerts | Firebase FCM | Latest | Android push notifications |
| Voice | Bhashini API | GoI v1 | 2 languages MVP (Hindi, Tamil); 22 languages Phase 2 |
| Frontend (MVP) | Streamlit | 1.30+ | Hackathon prototype dashboard |
| Frontend (Prod) | React / Next.js | 14+ | Production SPA (Phase 2+) |
| Maps | Leaflet.js + Plotly | Latest | Interactive ocean maps; CI overlays |
| Blockchain | Hyperledger Fabric | 2.5 | Phase 2 (mock in-memory hash chain for Phase H MVP) |
| Streaming | Apache Kafka | 3.x | IoT buoy feeds (Phase 2) |
| Containers | Docker + Kubernetes | 24+ / 1.28+ | Containerised deployment; auto-scaling |
| Digital twin | OceanParcels | Latest | Lagrangian particle tracking IBM (Phase 2) |
| Carbon | STEAM emission model | Jalkanen 2009/2012 | GT-based vessel carbon estimation (Phase 2) |
| Benchmark | ARIMA (statsmodels) | Latest | Baseline for ConvLSTM comparison |

---

## Appendix B — Core Database Schema

| Table | Key Columns | Notes |
|---|---|---|
| `data_bubbles` | `bubble_id` PK, `geom` POINT, `radius_km`, `time_window_start`, `time_window_end` | Unified spatiotemporal join key; adaptive 5km/50km |
| `argo_profiles` | `profile_id`, `bubble_id` FK, `float_id`, `datetime`, `depth_m`, `temperature_c`, `salinity_psu`, `dissolved_o2`, `quality_flag` | NetCDF CF Profile type; WMO float IDs |
| `incois_sst` | `raster_id`, `bubble_id` FK, `composite_date`, `geom` RASTER, `sst_c`, `chlorophyll_mgl`, `pfz_advisory` | NetCDF CF Grid type; weekly composites; `pfz_advisory` serves both Pillar 1 and Pillar 2 |
| `gfw_ais` | `record_id`, `bubble_id` FK, `mmsi`, `datetime`, `latitude`, `longitude`, `sog`, `cog`, `fishing_hours`, `quality_flag` | Post-AIS-quality-pipeline only |
| `edna_occurrences` | `occurrence_id`, `bubble_id` FK, `species_aphia_id`, `latitude`, `longitude`, `collection_date`, `sequence_hash`, `detection_method`, `database_source` | WoRMS AphiaID as canonical key |
| `landing_site_cv` | `cv_id`, `bubble_id` FK, `landing_site_id`, `fisher_id` (anonymised token), `species_aphia_id`, `fork_length_mm`, `weight_g`, `cpue`, `image_path`, `datetime` | Links to mock/real blockchain catch record |
| `sfz_output` | `zone_id`, `grid_cell_id`, `week_start`, `ecological_class`, `bycatch_risk_score`, `legal_status` (Phase 2 only — add via ALTER TABLE), `shap_top3`, `model_version` | Weekly; SHAP explainability fields |
| `mfra_zones` | `zone_id`, `state_name`, `geom` POLYGON, `ban_start_month`, `ban_end_month`, `gear_restrictions`, `min_mesh_size_mm`, `legal_status` | **Phase 2 table** — 13 coastal states + 4 UTs; do not create in Phase A |
| `provenance_log` | `record_id`, `source_table`, `source_system`, `ingestion_ts`, `schema_version`, `quality_flag`, `fusion_method`, `ai_answer_id` | Every record + every AI output traceable |

---

## Appendix C — Key References

| Reference | DOI / Source | Used In |
|---|---|---|
| Agmata & Guðmundsson 2025 — ConvLSTM CATCH model | 10.1093/biomethods/bpaf045 | Phase C architecture |
| Sagi, Lehahn & Bar 2020 — AI for ocean data integration | 10.1525/elementa.418 | Phase A DI process; Phase E embedding target |
| Bar 2020a — Oceanic NER dataset | 10.17605/OSF.IO/MY2NK | Phase B, E NER training |
| Bar 2020b — 175M-token oceanographic corpus | 10.17605/OSF.IO/8VAFS | Phase E Word2Vec embeddings |
| Yang et al. 2024 — ML for AIS maritime research | 10.1016/j.tre.2024.103426 | Phase A AIS pipeline |
| Shedrawi et al. 2024 — Ikasavea CV system | 10.1038/s41598-024-71763-y | Phase B CV pipeline; reference codebase: github.com/PacificCommunity/cfap-ai-models |
| Hazen et al. 2018 — Dynamic ocean management | 10.1126/sciadv.aar3001 | Phase D SFZ 2–3× size target |
| Aguzzi et al. 2025 — Digital twin strategy | 10.1016/j.ecoinf.2025.103409 | Phase G; Phase 2 full twin |
| Fernandes-Salvador et al. 2026 — Trustworthy AI | 10.1111/faf.70052 | SHAP + MC Dropout compliance |
| Zhang 2025 — CNN-XGBoost fusion | 10.1038/s41598-025-33175-4 | Phase D upgrade path |
| Alsharabi et al. 2024 — Blockchain + AI fisheries | 10.1186/s13677-024-00696-8 | Phase H |
| Malde et al. 2020 — Marine science data bottleneck | 10.1093/icesjms/fsz057 | PRD problem statement |
| Jalkanen et al. 2009/2012 — STEAM emission model | *Atmos. Chem. Phys.* | Phase 2 fleet carbon |

---
*OceanMind Implementation Plan v1.1 | Biothon 2026 | Marwadi University, Dept. of Bioinformatics*
