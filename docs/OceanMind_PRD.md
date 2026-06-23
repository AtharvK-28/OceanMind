OceanMind — Product Requirements Document	Biothon 2026

**OceanMind**

Product Requirements Document (PRD)

*AI-Driven Unified Marine Data Intelligence Platform*

Biothon 2026 — Environment & Biodiversity Domain

Marwadi University, Dept. of Bioinformatics

Version 1.0  |  Derived from Ideation Document v7.0


# **1. Executive Summary**
OceanMind is an AI-driven, unified data intelligence platform integrating oceanographic sensor data, fisheries catch records, and molecular biodiversity (eDNA) data for real-time marine decision support. It is designed for Biothon 2026 under the Environment & Biodiversity domain.

Marine data exists in completely isolated silos today. No unified platform integrates all three data types for real-time, trustworthy decision support. OceanMind is that platform, built on open data, explainable AI, and FAIR data principles.

35\.5% of global fish stocks are overfished (FAO Marine Fisheries Review 2025), the Indian Ocean is among the fastest-warming ocean basins on Earth, and 14.5 million Indians depend on marine fisheries. At the same time, marine data collection is scaling faster than analytical capacity (Malde et al. 2020) — OceanMind addresses both the ecological crisis and the analytical bottleneck.

# **2. Problem Statement**
## **2.1 The Global Fisheries Crisis**
Based on FAO Marine Fisheries Review 2025 (2,570 stocks — the most comprehensive assessment ever):

- 35.5% of global fish stocks are overfished (up from previous decades)
- Southeast Pacific: only 46% sustainable; Mediterranean & Black Sea: only 35.1% sustainable
- 11–26 million tonnes/year of illegal, unreported, unregulated (IUU) catch (MRAG 2009)
- India is the second-largest fish-producing nation, with 14.5 million people directly employed in marine fisheries

## **2.2 Indian Ocean Climate Urgency**
- Indian Ocean is among the fastest-warming ocean basins globally
- Marine heatwaves (MHWs) have increased up to fourfold in the tropical Indian Ocean (Saranya et al. 2022)
- Bay of Bengal: 94 MHW events recorded 1982–2018; CMFRI 2024 attributed reduced productivity to prolonged MHW days
- Expanding Oxygen Minimum Zones (OMZs) in Arabian Sea and Bay of Bengal

## **2.3 The Data Silo Problem**
Oceanographic sensor data, fisheries catch records, and molecular biodiversity data exist in completely isolated silos. No unified platform today integrates all three for real-time decision support. Additionally:

- ~7 million small-scale Indian fishers are entirely outside AIS vessel-tracking coverage (AIS mandatory only for vessels ≥15m)
- State MFRA (Marine Fishing Regulation Act) data is fragmented across 13 coastal states with no harmonisation
- Schema mismatches between ARGO NetCDF, INCOIS JSON, and NCBI FASTA formats prevent true data integration

## **2.4 The Analysis Bottleneck**
Marine data collection is scaling faster than analytical capacity (Malde et al. 2020, ICES Journal of Marine Science). Data volume, complexity, and deterioration have made manual expert scrutiny structurally insufficient. Machine learning is the only mechanism that keeps analysis proportional to data collection — this is a structural and permanent trend.

# **3. Goals & Success Metrics**
## **3.1 Primary Goals**
1. Unify oceanographic, fisheries, and eDNA biodiversity data into a single, query-able, AI-powered intelligence layer
1. Deliver dynamic Sustainable Fishing Zone (SFZ) recommendations that update weekly based on real-time environmental data
1. Provide trustworthy, explainable AI outputs with SHAP and confidence intervals on all predictions
1. Extend data coverage to the ~7 million small-scale fishers previously outside AIS coverage
1. Support EEZ Rules 2025 compliance for Indian government stakeholders

## **3.2 Success Metrics**

|**Metric**|**Target**|**Source**|
| :- | :- | :- |
|Fish location accuracy (migration model)|75–92% (literature target, not validated OceanMind output)|Comparable literature|
|Fuel savings via optimised route guidance|15–25% reduction|INCOIS PFZ advisory studies|
|Dynamic vs. static zone size ratio|2–3× smaller dynamic zones for equivalent species protection|Hazen et al. 2018|
|eDNA species detection vs. traditional survey|Detects ≥23 additional species vs. 14 years of visual surveys|Yamamoto et al. 2017|
|Landing-site CV species recall|94%+ on established species|Shedrawi et al. 2024 target|
|RAG interface entity extraction F1|0\.738 with ocean-specific embeddings|Sagi et al. 2020|


# **4. Stakeholders & User Personas**

|**User Group**|**Scale**|**Core Need**|**OceanMind Answer**|
| :- | :- | :- | :- |
|Indian coastal fishermen|14\.5M|Where to fish safely and profitably|Migration maps, dynamic SFZ zones, SMS + Bhashini voice alerts (22 languages)|
|Fisheries cooperatives / state depts.|Hundreds|Enforce sustainable zones, reduce IUU|Dynamic No-Take Zone boundaries, AIS anomaly alerts, dashboard|
|Marine scientists / researchers|INCOIS, CMLRE, CMFRI, universities|Unified multi-source dataset access|RAG query over ARGO, NCBI, IndOBIS + SPARQL ontological queries|
|Conservation NGOs|WWF India, WCS|Early warning of ecosystem stress|MHI scores, eDNA biodiversity trends, digital twin MHW scenarios|
|Policy / government|Blue Economy Mission, PMMSY, EEZ enforcement|Evidence-based zone delineation|Dynamic SFZ outputs, IUU detection reports, blockchain-verified catch data|
|Supply chain buyers|Retailers, exporters|Sustainable sourcing verification|Blockchain traceability certificates (Phase 2)|


# **5. Design Principles**
## **5.1 Insight-Only**
OceanMind surfaces predictions, alerts, and intelligence. It does NOT control vessels, auto-file reports, or take autonomous action on any government portal. This contains liability and keeps the platform advisory. (DENIED-003, DENIED-004 — permanent constraints)
## **5.2 Open Data Only**
Every data source is publicly accessible. This is critical to hackathon reproducibility and long-term sustainability. No proprietary sensor hardware or commercial datasets without confirmed academic access.
## **5.3 FAIR Data Principles**
All data assets are Findable, Accessible, Interoperable, and Reusable. This is the foundational requirement for the integration layer.
## **5.4 Trustworthy by Design**
Explainability (SHAP on XGBoost models, Monte Carlo Dropout confidence intervals on ConvLSTM), governance, and validation against ecological and policy targets are first-class features. Anchored in Fernandes-Salvador et al. 2026 trustworthy AI framework for marine management.


# **6. Feature Requirements**
## **6.1 MVP Features (Phase 1)**
### **F1 — Fish Migration Prediction Engine**
Objective: Forecast fish migration zones for the next 7 days across the Indian EEZ.

- Primary model: ConvLSTM (Agmata & Guðmundsson 2025 CATCH architecture) — spatiotemporal forecasting of fishing probability densities
- Ensemble: Transformer (4 attention heads, 2 encoder layers) for long-range seasonal dependencies
- Baseline benchmark: Standard 2-layer LSTM + ARIMA for comparison
- Inputs: SST (weekly composite + anomaly), Chlorophyll-a, Mixed Layer Depth from ARGO, Ocean current u/v, Dissolved Oxygen, AIS fishing effort density, Sea Surface Height anomaly, Isothermal Layer Depth, Wind stress curl
- Output: Probability distribution over migration zones with Monte Carlo Dropout confidence intervals
- Training data: 25 years of INCOIS SST composites (2000–2025), ARGO GDAC historical profiles, GFW AIS effort density, IOTC tuna catch-and-effort (added v7.0)

### **F2 — Marine Health Index (MHI)**
Objective: Provide a composite real-time indicator of ecosystem health per ocean grid cell.

- Model: Isolation Forest for multi-parameter anomaly detection
- Parameters: SST anomaly, Chlorophyll-a, Dissolved Oxygen, pH, salinity (ARGO CTD profiles)
- Compound stress detection: synergistic DO + pH interaction (committed)
- Alert thresholds traceable to Section 2.5 of Ideation Document v7.0
- Digital twin scenario extension (Phase 2): simulate "what if SST +2°C for 3 weeks?"

### **F3 — eDNA Biodiversity Assessment Pipeline**
Objective: Species identification and biodiversity index computation from eDNA/published metabarcoding datasets.

- Two-stage pipeline: BLAST alignment (NCBI, BOLD, IndOBIS) → 1D CNN species classifier
- MiFish 12S rRNA + 18S rRNA universal primers (Miya et al. 2015)
- WoRMS taxonomic normalisation: all species names resolved against World Register of Marine Species
- Biodiversity indices: Shannon, Simpson, taxonomic richness, Bray-Curtis dissimilarity
- Joint Species Distribution Model (JSDM): predicts species assemblage in unsampled grid cells using INCOIS SST + Copernicus chlorophyll as environmental covariates (OQ-027 resolved — feasible via satellite covariates without strict ARGO co-location)
- Note: eDNA processing takes 24–48h minimum — OceanMind works with published/cached datasets (DENIED-001, permanent)

### **F4 — Sustainable Fishing Zone (SFZ) Engine — Dynamic**
Objective: Produce weekly-updating Green/Amber/Red fishing zone boundaries based on ecological suitability and bycatch risk.

- Model: XGBoost classifier (5-fold cross-validation, SHAP explainability)
- CNN-XGBoost fusion (Zhang 2025) as upgrade path: CNN extracts spatial features from satellite imagery, XGBoost handles tabular environmental variables
- Weekly update cycle driven by incoming INCOIS SST + chlorophyll + GFW effort data
- Bycatch risk overlay: JSDM-predicted presence probability for ecologically sensitive species in unsampled cells
- Phase 2 addition: MFRA regulatory overlay — legal\_status attribute (Open / Seasonal Ban / Restricted / No-Take) per grid cell per state (OQ-032 resolved)
- Dynamic zones are 2–3× smaller than static closures while achieving equivalent species protection (Hazen et al. 2018)

### **F5 — Conversational AI Interface**
Objective: Allow researchers and stakeholders to query marine data in natural language with provenance-traced answers.

- Architecture: LangChain RAG with FAISS/ChromaDB vector store + LLaMA 3 or GPT-4o-mini
- Domain-specific embeddings fine-tuned on the 175M-token oceanographic corpus (Bar 2020b — DOI 10.17605/OSF.IO/8VAFS) — delivers 11× improvement in F1 on oceanic entity extraction vs. general-purpose embeddings (Sagi et al. 2020)
- Flair NER retrained on annotated oceanic NER dataset (Bar 2020a — DOI 10.17605/OSF.IO/MY2NK)
- Data provenance layer: every AI-generated answer is traceable to its source records

### **F6 — Real-time Alert System**
Objective: Deliver actionable fishing zone and safety alerts to fishermen and cooperatives.

- SMS alerts via Twilio (regional language support)
- FCM push notifications via Firebase (Android mobile app)
- Bhashini API: voice I/O in all 22 scheduled Indian languages — primary fisherman-facing interface (Phase 2 full rollout, partial in MVP)
- Alert types: zone change (Green→Amber), MHW onset, cyclone proximity, MHI threshold breach

### **F7 — Data Integration Infrastructure Layer**
Objective: Make the three-pillar architecture genuinely unified rather than three loosely connected systems.

- Schema Matching & Mapping Engine: align NetCDF (ARGO), JSON (INCOIS/GFW), FASTA (NCBI), CSV (CMFRI) to OceanMind mediated schema; unit conversion functions (PSU vs. dimensionless salinity, °C vs. K, dbar vs. m)
- OBDA Layer: PostgreSQL/PostGIS mapped to GeoLink, MarineTLO, WoRMS ontologies; SPARQL endpoint for ontological queries
- Entity Resolution Engine: deduplicate records across ARGO, IndOBIS, OBIS, NCBI; resolve taxonomic synonyms via WoRMS canonical names
- Domain NER (Flair, oceanographic corpus): extract structured metadata from unstructured INCOIS advisories and CMFRI reports
- Data Bubbles abstraction: every observation tagged with (lat, lon, depth, radius, time\_window); data\_bubbles PostGIS table with bubble\_id FK on all observation tables; adaptive radius 5km coastal / 50km open ocean (OQ-026 resolved)
- AIS Data Quality Pipeline: MMSI deduplication, trajectory gap filling (Kalman/LSTM), DBSCAN outlier removal, spoofing detection, DBSCAN-SD route clustering (Yang et al. 2024)
- Data Quality & Provenance Layer: every record tagged with source system, ingestion timestamp, schema version, quality flag, fusion method

### **F8 — Landing Site Computer Vision (CV) Module**
Objective: Extend data coverage to the ~7 million small-scale fishers below the AIS 15m threshold.

- Architecture: YOLOv8/v9 + ResNet101 multistage pipeline (image orientation correction → pixel calibration → fish detection → species ID)
- Deployment: smartphone app at INCOIS's existing 586 landing centres; calibrated measurement mat (no specialist taxonomy required at collection)
- Outputs: species ID, fork/total length, weight (via length-weight relationships), CPUE per fishing method
- Stock assessment integration: Length-Based Spawning Potential Ratio (LBSPR), Fulton's condition factor K
- Pilot specification (OQ-025): Veraval, Gujarat; Indian mackerel + Indian oil sardine; October–December post-monsoon season
- Code base: github.com/PacificCommunity/cfap-ai-models (Shedrawi et al. 2024)

## **6.2 Phase 2 Features (3–6 Months Post-MVP)**
### **Phase 2 Feature List**

|**Feature**|**Description**|**Key Dependency**|
| :- | :- | :- |
|Blockchain Traceability Module|Hyperledger Fabric (permissioned) + PMMSY-linked catch certification; immutable catch records; PSMA compliance enabler (OQ-022 resolved)|Cooperative partnership|
|Digital Twin & Scenario Simulation|MHW what-if scenarios; generative AI/diffusion models for data imputation; Ortenzi et al. 2026|Phase 1 data layer stable|
|Bhashini Voice Interface (full rollout)|All 22 scheduled Indian languages; spoken query by fishermen in regional languages|Bhashini API integration|
|MFRA Regulatory Overlay on SFZ|mfra\_zones PostGIS polygon table; legal\_status field on SFZ output; 13 coastal states + 4 UTs|State MFRA database compilation|
|Larval Connectivity IBM|Particle-tracking individual-based model via CMEMS current fields; 30–90 day recruitment probability maps|CMEMS u/v/w ingestion|
|Fleet Carbon Emission (STEAM)|Vessel carbon footprint maps; GT-based engine power regression as default (OQ-030 resolved); SDG 13 reporting|AIS quality pipeline|
|Landing-site CPUE Trend Dashboard|Species count trend per landing centre over time; Grafana-style time-series panels|Landing-site CV operational (F8)|
|LBSPR Stock Assessment Integration|Full stock status estimation from CV landing data; extends F8|F8 operational + CMFRI data|
|MFC 2025 Data Integration|Geo-referenced fisher household data; vessel inventory by size/type (OQ-031: Q3 2026 preliminary data expected)|MFC 2025 public release|

## **6.3 Phase 3 Features (12–24 Months)**
- Multi-omics expansion: population genomics (NCBI SRA — Track A, unblocked) + transcriptomics during MHW events (CMFRI/CMLRE partnership — Track B, OQ-018 partially resolved)
- Socioecological Agent-Based Model: simulate policy scenarios (monsoon ban extensions vs. cooperative income); requires MFC 2025 microdata
- National scale: all Indian Ocean coastal regions; 586 landing centres at scale
- Blue carbon MRV integration for carbon credits (Verra VCS, ICM)
- International collaboration: OBIS, FAO, ARGO Global Network, Deep Ocean Mission


# **7. Non-Functional Requirements**

|**Category**|**Requirement**|
| :- | :- |
|Data Freshness|ARGO profiles ingested within 24h of float surfacing; INCOIS SST/chlorophyll composites ingested daily; GFW AIS effort density updated daily; SFZ zones updated weekly|
|Explainability|SHAP values on all XGBoost/RF models; Monte Carlo Dropout confidence intervals on ConvLSTM migration predictions; every RAG answer traces to source records|
|Availability|MVP: demonstration-grade; Phase 2: 99% uptime during fishing season (Oct–May)|
|Scalability|Docker + Kubernetes containerised deployment; Apache Kafka IoT streaming (Phase 2); PostGIS handles millions of spatio-temporal records|
|Accessibility|Bhashini voice interface in 22 Indian languages; SMS delivery for fishermen without smartphones; responsive Leaflet web dashboard|
|Compliance|EEZ Rules 2025 (Rules 4, 6, 10, 12, 14); IOTC conservation measures; PSMA catch documentation via blockchain; FAIR data principles|
|Privacy|VMS data is government-access-only — OceanMind does not ingest it; no personally identifiable fisher data in public-facing outputs|
|Data Quality|Every ingested record tagged with source, timestamp, schema version, quality flag, and fusion method; AIS quality pipeline applied before IUU detection|


# **8. Out of Scope**

|**Item**|**Rationale**|
| :- | :- |
|Real-time eDNA data pipeline|DENIED-001 (permanent): eDNA processing requires 24–48h minimum — a hard biological constraint. OceanMind uses published/cached eDNA datasets.|
|Proprietary sensor hardware|DENIED-002 (permanent): open data only principle. Out of scope for all phases.|
|Direct vessel control or autonomous action|DENIED-003 (permanent): insight-only design principle; liability and safety constraint.|
|Auto-filing with government portals|DENIED-004 (permanent): regulatory liability; insight-only.|
|VMS data ingestion|VMS is a government-access-only system; OceanMind uses AIS via GFW as the open-data proxy.|
|EU THETIS-MRV for carbon estimation|Covers EU-flagged vessels only — irrelevant for Indian EEZ. GT-based regression model is the default.|


# **9. Regulatory & Policy Alignment**
OceanMind is arriving exactly as the Indian policy framework creates demand for it:

|**Regulation / Policy**|**Relevance to OceanMind**|
| :- | :- |
|EEZ Rules 2025 (Rule 4 — MCS)|VMS fleet expansion; OceanMind fills the enforcement intelligence gap this rule creates but does not provide|
|EEZ Rules 2025 (Rule 6 — Management Plans)|OceanMind SFZ output directly implements the spatial management requirements of fisheries management plans|
|EEZ Rules 2025 (Rule 12 — Destructive Practices)|AIS-based IUU detection for pair-trawl movement signatures and light-fishing vessel patterns|
|EEZ Rules 2025 (Rule 14 — IOTC Compliance)|IOTC catch-and-effort data added to Pillar 2 (OQ-033 resolved); IOTC stock assessments as validation target for tuna migration forecasts|
|PMMSY / PM-MKSSY|NFDP digital identity layer integration for Phase 2; blockchain catch certification linked to PMMSY benefit access (OQ-022 resolved)|
|MFRAs (state fragmentation)|MFRA regulatory overlay on SFZ (Phase 2, OQ-032 resolved); schema matching engine handles inconsistent state data formats|
|PSMA (Port State Measures)|Hyperledger Fabric immutable catch records serve as catch documentation PSMA requires|
|Deep Ocean Mission (MoES)|Phase 3 integration; growing eDNA datasets from Indian Ocean survey voyages|


# **10. Phased Roadmap Summary**

|**Phase**|**Components**|**Outcome**|
| :- | :- | :- |
|Phase A (MVP)|Data ingestion + schema matching + OBDA layer + AIS quality pipeline + data\_bubbles PostGIS|True unified data backend — three pillars communicating through a single schema|
|Phase B (MVP)|WoRMS entity resolution + domain NER + landing-site CV smartphone app + base YOLO pipeline|Cross-database species normalisation; small-scale fisher data coverage|
|Phase C (MVP)|ConvLSTM migration model + SHAP/confidence intervals + IOTC tuna data integration|Trustworthy fish migration predictions with quantified uncertainty|
|Phase D (MVP)|Dynamic SFZ weekly update + bycatch risk overlay + JSDM for unsampled cells|Dynamic zones, not static maps; biologically richer bycatch predictions|
|Phase E (MVP)|RAG with domain embeddings + data provenance layer|Trustworthy conversational interface traceable to source data|
|Phase F (MVP)|Bhashini voice interface (partial) + SMS alerts|Fishermen-accessible interfaces in regional languages|
|Phase G (MVP)|Digital twin MHW scenario simulation (early version)|Monitoring → decision-support transformation|
|Phase H (MVP)|Blockchain traceability MVP (Hyperledger Fabric + PMMSY)|Compliance incentive mechanism for fishermen|
|Phase 2 (3–6 mo.)|Full Bhashini, MFRA overlay, larval connectivity IBM, STEAM carbon, CPUE dashboard, LBSPR, MFC 2025 integration|Pilot deployment with 3 coastal cooperatives|
|Phase 3 (12–24 mo.)|Multi-omics, socioecological ABM, national scale, carbon credits, international collaboration|National marine intelligence platform|


# **11. Open Items Requiring Human Action**
Three items in the ideation document (v7.0) remain open pending human action and are noted here for completeness:

|**Item**|**Action Required**|
| :- | :- |
|OQ-025 — Landing-site CV Pilot|Initiate INCOIS conversation for Veraval pilot (mackerel + sardine, Oct–Dec). Pilot specification fully defined in Ideation v7.0 Section 12.|
|OQ-018 Track B — Novel Genomics|Initiate CMFRI/CMLRE Memorandum of Understanding for novel genomic and transcriptomic data generation. Begin Phase 2 for Phase 3 readiness.|
|Section 18.2 — Official Biothon PS|Paste the exact official Biothon 2026 Environment & Biodiversity problem statement text for word-for-word alignment verification.|


# **12. Key References**
All claims in this PRD are traceable to the OceanMind Ideation Document v7.0, which in turn cites primary research. Key references:

- FAO Marine Fisheries Review 2025 (2,570 stocks assessed)
- Malde et al. 2020. Machine intelligence and the data-driven future of marine science. ICES Journal of Marine Science 77(4).
- Hazen et al. 2018. A dynamic ocean management tool to reduce bycatch. Science Advances, 4.
- Sagi, Lehahn & Bar 2020. AI for ocean science data integration. Elementa.
- Fernandes-Salvador et al. 2026. Towards Trustworthy AI for Marine Research. Fish and Fisheries.
- Agmata & Guðmundsson 2025. ConvLSTM CATCH model. Biology Methods & Protocols, 10.
- Shedrawi et al. 2024. Ikasavea landing-site CV system. Scientific Reports, 14.
- Yang et al. 2024. Machine learning for AIS-driven maritime research. Transportation Research Part E.
- Aguzzi et al. 2025. Digital-twin strategy for marine ecosystem monitoring. Ecological Informatics, 91.
- Alsharabi et al. 2024. Blockchain and AI for sustainable fisheries. Journal of Cloud Computing, 13.
OceanMind PRD v1.0  |  Confidential  	Page  of 
