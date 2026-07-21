# OceanMind — Product Requirements Document
*AI-Driven Unified Marine Data Intelligence Platform*

**Biothon 2026 — Environment & Biodiversity Domain**
Marwadi University, Dept. of Bioinformatics

| Field | Value |
|---|---|
| Version | 1.1 |
| Derived from | Ideation Document v7.0 |
| Status | Pre-build |

---

## Changelog

| Version | Change | Reason |
|---|---|---|
| v1.0 | Initial release | Derived from Ideation v7.0 |
| v1.1 | §3.2 CV recall: standardised to ≥90% internal benchmark (94% per Shedrawi et al. 2024) | Inconsistency with TRD §11.1 and IMPL §7 — all docs now align |
| v1.1 | §4 Persona table: qualified Bhashini "22 languages" as Phase 2; "2 languages (Hindi, Tamil)" as MVP | Agent building MVP alerts would have targeted 22 languages; IMPL Phase F specifies 2 |
| v1.1 | §6.1 F1: ensemble Transformer marked as optional upgrade, not core MVP | IMPL §3 Phase C treats it as optional; PRD previously implied MVP core |
| v1.1 | §8 Out of Scope: reproduced DENIED ID rationale table for self-containment | TRD and IMPL reference DENIED IDs without explanation; PRD is now the canonical denial registry |

---

# 1. Executive Summary

OceanMind is an AI-driven, unified data intelligence platform integrating oceanographic sensor data, fisheries catch records, and molecular biodiversity (eDNA) data for real-time marine decision support. It is designed for Biothon 2026 under the Environment & Biodiversity domain.

Marine data exists in completely isolated silos today. No unified platform integrates all three data types for real-time, trustworthy decision support. OceanMind is that platform, built on open data, explainable AI, and FAIR data principles.

35.5% of global fish stocks are overfished (FAO Marine Fisheries Review 2025), the Indian Ocean is among the fastest-warming ocean basins on Earth, and 14.5 million Indians depend on marine fisheries. At the same time, marine data collection is scaling faster than analytical capacity (Malde et al. 2020) — OceanMind addresses both the ecological crisis and the analytical bottleneck.

---

# 2. Problem Statement

## 2.1 The Global Fisheries Crisis

Based on FAO Marine Fisheries Review 2025 (2,570 stocks — the most comprehensive assessment ever):

- 35.5% of global fish stocks are overfished (up from previous decades)
- Southeast Pacific: only 46% sustainable; Mediterranean & Black Sea: only 35.1% sustainable
- 11–26 million tonnes/year of illegal, unreported, unregulated (IUU) catch (MRAG 2009)
- India is the second-largest fish-producing nation, with 14.5 million people directly employed in marine fisheries

## 2.2 Indian Ocean Climate Urgency

- Indian Ocean is among the fastest-warming ocean basins globally
- Marine heatwaves (MHWs) have increased up to fourfold in the tropical Indian Ocean (Saranya et al. 2022)
- Bay of Bengal: 94 MHW events recorded 1982–2018; CMFRI 2024 attributed reduced productivity to prolonged MHW days
- Expanding Oxygen Minimum Zones (OMZs) in Arabian Sea and Bay of Bengal

## 2.3 The Data Silo Problem

Oceanographic sensor data, fisheries catch records, and molecular biodiversity data exist in completely isolated silos. No unified platform today integrates all three for real-time decision support. Additionally:

- ~7 million small-scale Indian fishers are entirely outside AIS vessel-tracking coverage (AIS mandatory only for vessels ≥15m)
- State MFRA (Marine Fishing Regulation Act) data is fragmented across 13 coastal states with no harmonisation
- Schema mismatches between ARGO NetCDF, INCOIS JSON, and NCBI FASTA formats prevent true data integration

## 2.4 The Analysis Bottleneck

Marine data collection is scaling faster than analytical capacity (Malde et al. 2020, ICES Journal of Marine Science). Data volume, complexity, and deterioration have made manual expert scrutiny structurally insufficient. Machine learning is the only mechanism that keeps analysis proportional to data collection — this is a structural and permanent trend.

---

# 3. Goals & Success Metrics

## 3.1 Primary Goals

1. Unify oceanographic, fisheries, and eDNA biodiversity data into a single, query-able, AI-powered intelligence layer
2. Deliver dynamic Sustainable Fishing Zone (SFZ) recommendations that update weekly based on real-time environmental data
3. Provide trustworthy, explainable AI outputs with SHAP and confidence intervals on all predictions
4. Extend data coverage to the ~7 million small-scale fishers previously outside AIS coverage
5. Support EEZ Rules 2025 compliance for Indian government stakeholders

## 3.2 Success Metrics

| Metric | Target | Source |
|---|---|---|
| Fish location accuracy (migration model) | 75–92% (literature target, not validated OceanMind output) | Comparable literature |
| Fuel savings via optimised route guidance | 15–25% reduction | INCOIS PFZ advisory studies |
| Dynamic vs. static zone size ratio | 2–3× smaller dynamic zones for equivalent species protection | Hazen et al. 2018 |
| eDNA species detection vs. traditional survey | Detects ≥23 additional species vs. 14 years of visual surveys | Yamamoto et al. 2017 |
| Landing-site CV species recall | ≥90% internal benchmark (94% achieved by Ikasavea system per Shedrawi et al. 2024) | Shedrawi et al. 2024 |
| RAG interface entity extraction F1 | 0.738 with ocean-specific embeddings | Sagi et al. 2020 |

---

# 4. Stakeholders & User Personas

| User Group | Scale | Core Need | OceanMind Answer |
|---|---|---|---|
| Indian coastal fishermen | 14.5M | Where to fish safely and profitably | Migration maps, dynamic SFZ zones, SMS + Bhashini voice alerts (2 languages MVP — Hindi, Tamil; 22 languages Phase 2) |
| Fisheries cooperatives / state depts. | Hundreds | Enforce sustainable zones, reduce IUU | Dynamic No-Take Zone boundaries, AIS anomaly alerts, dashboard |
| Marine scientists / researchers | INCOIS, CMLRE, CMFRI, universities | Unified multi-source dataset access | RAG query over ARGO, NCBI, IndOBIS + SPARQL ontological queries |
| Conservation NGOs | WWF India, WCS | Early warning of ecosystem stress | MHI scores, eDNA biodiversity trends, digital twin MHW scenarios |
| Policy / government | Blue Economy Mission, PMMSY, EEZ enforcement | Evidence-based zone delineation | Dynamic SFZ outputs, IUU detection reports, blockchain-verified catch data |
| Supply chain buyers | Retailers, exporters | Sustainable sourcing verification | Blockchain traceability certificates (Phase 2) |

---

# 5. Design Principles

## 5.1 Insight-Only
OceanMind surfaces predictions, alerts, and intelligence. It does NOT control vessels, auto-file reports, or take autonomous action on any government portal. This contains liability and keeps the platform advisory. (DENIED-003, DENIED-004 — permanent constraints; see §8)

## 5.2 Open Data Only
Every data source is publicly accessible. This is critical to hackathon reproducibility and long-term sustainability. No proprietary sensor hardware or commercial datasets without confirmed academic access. (DENIED-002 — permanent constraint; see §8)

## 5.3 FAIR Data Principles
All data assets are Findable, Accessible, Interoperable, and Reusable. This is the foundational requirement for the integration layer.

## 5.4 Trustworthy by Design
Explainability (SHAP on XGBoost models, Monte Carlo Dropout confidence intervals on ConvLSTM), governance, and validation against ecological and policy targets are first-class features. Anchored in Fernandes-Salvador et al. 2026 trustworthy AI framework for marine management.

---

# 6. Feature Requirements

## 6.1 MVP Features (Phases A–H)

### F1 — Fish Migration Prediction Engine
Objective: Forecast fish migration zones for the next 7 days across the Indian EEZ.

- Primary model: ConvLSTM (Agmata & Guðmundsson 2025 CATCH architecture) — spatiotemporal forecasting of fishing probability densities
- Ensemble: Transformer (4 attention heads, 2 encoder layers) for long-range seasonal dependencies — **optional upgrade if time permits; not core MVP scope**
- Baseline benchmark: Standard 2-layer LSTM + ARIMA for comparison
- Inputs: SST (weekly composite + anomaly), Chlorophyll-a, Mixed Layer Depth from ARGO, Ocean current u/v, Dissolved Oxygen, AIS fishing effort density, Sea Surface Height anomaly, Isothermal Layer Depth, Wind stress curl
- Uncertainty: Monte Carlo Dropout (N=50 forward passes; mean + std as confidence interval bands rendered on Leaflet)

### F2 — Sustainable Fishing Zone (SFZ) Engine
- Weekly-updating dynamic zones: Green (recommended), Amber (caution), Red (avoid)
- XGBoost classifier with SHAP top-3 feature importances per cell per week
- Phase 2 addition: `legal_status` from `mfra_zones` PostGIS (Open / Seasonal Ban / Restricted / No-Take)
- 2–3× smaller than static equivalent zones (Hazen et al. 2018 validated target)

### F3 — Marine Health Index (MHI)
- Isolation Forest anomaly detection across SST anomaly, Chl-a deviation, Dissolved Oxygen, pH, salinity
- Compound stress detection: synergistic DO + pH joint feature
- Output: MHI score (0–100) per grid cell; configurable alert thresholds

### F4 — eDNA Biodiversity Intelligence
- BLAST+ sequence alignment against NCBI, BOLD, IndOBIS reference databases
- 1D CNN for novel/uncharacterised barcode sequences (MiFish 12S + 18S rRNA)
- JSDM (HMSC) for species assemblage prediction at unsampled grid cells across Indian EEZ
- Community indices: Shannon, Simpson, Bray-Curtis (R Vegan)

### F5 — Data Integration Layer
- Schema matching engine: ARGO NetCDF, INCOIS JSON, NCBI FASTA, GFW CSV, CMFRI CSV → OceanMind unified mediated schema
- OBDA/SPARQL endpoint (Apache Jena Fuseki) over GeoLink, MarineTLO, WoRMS, SWEET ontologies
- Data Bubbles spatiotemporal fusion: adaptive radius 5km coastal / 50km open ocean; single generic join key across all data pillars
- AIS quality pipeline (5 stages): MMSI dedup, gap filling, outlier removal, spoofing detection, route clustering

### F6 — Landing-Site Computer Vision (CV)
- YOLOv8/v9 bounding box detection + ResNet101 species identification from catch photos
- Fork/total length (mm) + weight (g) via pixel-to-mm calibration on mat
- Covers ~7 million small-scale fishers below AIS 15m threshold (Ikasavea-derived architecture; Shedrawi et al. 2024)
- Deployed at smartphone; output feeds CPUE estimates and IOTC tuna migration training data

### F7 — RAG Conversational Interface
- LangChain with ocean-specific Word2Vec embeddings (Bar 2020b: 175M tokens, 30,000 oceanographic papers)
- Flair NER retrained on Bar 2020a oceanic NER dataset
- Full provenance: every answer cites source record IDs, ingestion timestamps, quality flags
- Bhashini voice interface: 2 Indian languages MVP (Hindi, Tamil); 22 languages Phase 2

### F8 — Alert & Notification System
- Twilio SMS: zone-change and MHW/cyclone alerts; < 60-second SLA from trigger to delivery
- Firebase FCM: Android push notifications
- Bhashini STT/TTS: voice I/O in 2 languages (MVP); full 22-language rollout Phase 2

### F9 — Digital Twin (Early Version — Phase G)
- MHW scenario engine: parameterised SST delta + duration → projected MHI score change + migration zone shift
- Generative AI / diffusion model for INCOIS SST cloud-gap imputation
- Full Lagrangian particle tracking IBM (OceanParcels) — Phase 2

### F10 — Blockchain Traceability (Phase H)
- **Phase H MVP: mock in-memory hash chain** with simulated transaction IDs for hackathon demo
- **Phase 2: real Hyperledger Fabric 2.5** permissioned network; smart contracts for PMMSY-linked certification
- Catch events logged from landing-site CV output; PSMA-compliant documentation

## 6.2 Phase 2 Features (3–6 Months Post-MVP)

| Feature | Description | Dependency |
|---|---|---|
| Bhashini Voice Interface (full rollout) | All 22 scheduled Indian languages; Android mobile app | Phase F MVP Bhashini (2 languages) |
| MFRA Regulatory Overlay on SFZ | `mfra_zones` PostGIS polygon table; `legal_status` on SFZ output; 13 coastal states + 4 UTs | State MFRA database compilation (OQ-032 resolved) |
| Hyperledger Fabric (full) | Real permissioned network replacing Phase H mock; PMMSY-linked cert; PSMA compliance | Phase H mock operational |
| Digital Twin (full) | Larval Connectivity IBM via OceanParcels + CMEMS u/v/w; 30–90 day recruitment maps | CMEMS u/v/w ingestion |
| Fleet Carbon Emission (STEAM) | GT-based engine power regression per vessel per AIS trip; SDG 13 reporting (OQ-030 resolved) | AIS quality pipeline |
| Landing-site CPUE Trend Dashboard | Species count trend per landing centre over time; Grafana-style time-series panels | Landing-site CV operational (F6) |
| LBSPR Stock Assessment Integration | Full stock status estimation from CV landing data; extends F6 | F6 operational + CMFRI data |
| MFC 2025 Data Integration | Geo-referenced fisher household data; vessel inventory by size/type (OQ-031: Q3 2026 preliminary data expected) | MFC 2025 public release |

## 6.3 Phase 3 Features (12–24 Months)

- Multi-omics expansion: population genomics (NCBI SRA — Track A, unblocked per OQ-018) + transcriptomics during MHW events (CMFRI/CMLRE partnership — Track B, still requires MOU)
- Socioecological Agent-Based Model: simulate policy scenarios (monsoon ban extensions vs. cooperative income); requires MFC 2025 microdata
- National scale: all Indian Ocean coastal regions; 586 landing centres at scale
- Blue carbon MRV integration for carbon credits (Verra VCS, ICM)
- International collaboration: OBIS, FAO, ARGO Global Network, Deep Ocean Mission

---

# 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Data Freshness | ARGO profiles ingested within 24h of float surfacing; INCOIS SST/Chl-a composites ingested daily; GFW AIS effort density updated daily; SFZ zones updated weekly |
| Explainability | SHAP values on all XGBoost/RF models; Monte Carlo Dropout confidence intervals on ConvLSTM migration predictions; every RAG answer traces to source records |
| Availability | MVP: demonstration-grade; Phase 2: 99% uptime during fishing season (Oct–May) |
| Scalability | Docker + Kubernetes containerised deployment; Apache Kafka IoT streaming (Phase 2); PostGIS handles millions of spatio-temporal records |
| Accessibility | Bhashini voice interface (2 languages MVP; 22 Phase 2); SMS delivery for fishermen without smartphones; responsive Leaflet web dashboard |
| Compliance | EEZ Rules 2025 (Rules 4, 6, 10, 12, 14); IOTC conservation measures; PSMA catch documentation via blockchain; FAIR data principles |
| Privacy | VMS data is government-access-only — OceanMind does not ingest it; no personally identifiable fisher data in public-facing outputs |
| Data Quality | Every ingested record tagged with source, timestamp, schema version, quality flag, and fusion method; AIS quality pipeline applied before IUU detection |

---

# 8. Out of Scope

These are permanent constraints that cannot be re-opened. Referenced across TRD and IMPL by their DENIED IDs.

| Item | DENIED ID | Rationale |
|---|---|---|
| Real-time eDNA data pipeline | DENIED-001 | Hard biological constraint: eDNA processing requires 24–48h minimum. OceanMind uses published/cached eDNA datasets only. Permanent for all phases. |
| Proprietary sensor hardware | DENIED-002 | Open data only principle. Permanent for all phases. |
| Direct vessel control or autonomous action | DENIED-003 | Insight-only design principle; liability and safety constraint. OceanMind is advisory only. |
| Auto-filing with government portals | DENIED-004 | Regulatory liability; insight-only. |
| Pre-downloaded fallback data must be validated before development starts | DENIED-007 | Prevents live API failures from blocking demo. All fallback datasets must be pre-downloaded and validated before Phase A begins. |
| VMS data ingestion | — | VMS is a government-access-only system; OceanMind uses AIS via GFW as the open-data proxy. |
| EU THETIS-MRV for carbon estimation | — | Covers EU-flagged vessels only — irrelevant for Indian EEZ. GT-based regression model is the default (OQ-030 resolved). |

---

# 9. Regulatory & Policy Alignment

OceanMind is arriving exactly as the Indian policy framework creates demand for it:

| Regulation / Policy | Relevance to OceanMind |
|---|---|
| EEZ Rules 2025 (Rule 4 — MCS) | VMS fleet expansion; OceanMind fills the enforcement intelligence gap this rule creates but does not provide |
| EEZ Rules 2025 (Rule 6 — Management Plans) | OceanMind SFZ output directly implements the spatial management requirements of fisheries management plans |
| EEZ Rules 2025 (Rule 12 — Destructive Practices) | AIS-based IUU detection for pair-trawl movement signatures and light-fishing vessel patterns |
| EEZ Rules 2025 (Rule 14 — IOTC Compliance) | IOTC catch-and-effort data added to Pillar 2 (OQ-033 resolved); IOTC stock assessments as validation target for tuna migration forecasts |
| PMMSY / PM-MKSSY | NFDP digital identity layer integration for Phase 2; blockchain catch certification linked to PMMSY benefit access (OQ-022 resolved) |
| MFRAs (state fragmentation) | MFRA regulatory overlay on SFZ (Phase 2, OQ-032 resolved); schema matching engine handles inconsistent state data formats |
| PSMA (Port State Measures) | Hyperledger Fabric immutable catch records (Phase 2) serve as catch documentation PSMA requires |
| Deep Ocean Mission (MoES) | Phase 3 integration; growing eDNA datasets from Indian Ocean survey voyages |

---

# 10. Phased Roadmap Summary

| Phase | Components | Outcome |
|---|---|---|
| Phase A (MVP) | Data ingestion + schema matching + OBDA layer + AIS quality pipeline + `data_bubbles` PostGIS | True unified data backend — three pillars communicating through a single schema |
| Phase B (MVP) | WoRMS entity resolution + domain NER + landing-site CV smartphone app + base YOLO pipeline | Cross-database species normalisation; small-scale fisher data coverage |
| Phase C (MVP) | ConvLSTM migration model + SHAP/confidence intervals + IOTC tuna data integration | Trustworthy fish migration predictions with quantified uncertainty |
| Phase D (MVP) | Dynamic SFZ weekly update + bycatch risk overlay + JSDM for unsampled cells | Dynamic zones, not static maps; biologically richer bycatch predictions |
| Phase E (MVP) | RAG with domain embeddings + data provenance layer | Trustworthy conversational interface traceable to source data |
| Phase F (MVP) | Bhashini voice interface (2 languages) + SMS alerts | Fishermen-accessible interfaces in regional languages (MVP) |
| Phase G (MVP) | Digital twin MHW scenario simulation (early version) | Monitoring → decision-support transformation |
| Phase H (MVP) | Blockchain traceability — **mock in-memory hash chain** for hackathon; real Hyperledger Fabric = Phase 2 | Compliance incentive mechanism; PSMA-compatible catch documentation |
| Phase 2 (3–6 mo.) | Full Bhashini (22 languages), real Hyperledger Fabric, MFRA overlay, larval IBM, STEAM carbon, CPUE dashboard, LBSPR, MFC 2025 | Pilot deployment with 3 coastal cooperatives |
| Phase 3 (12–24 mo.) | Multi-omics, socioecological ABM, national scale, carbon credits, international collaboration | National marine intelligence platform |

---

# 11. Open Items Requiring Human Action

Three items in the ideation document (v7.0) remain open pending human action and are noted here for completeness:

| Item | Action Required |
|---|---|
| OQ-025 — Landing-site CV Pilot | **Awaiting Human Execution (Post-Hackathon Phase)**: Initiate INCOIS conversation for Veraval pilot (mackerel + sardine, Oct–Dec). Pilot specification fully defined in Ideation v7.0 §12. |
| OQ-018 Track B — Novel Genomics | **Awaiting Human Execution (Post-Hackathon Phase)**: Initiate CMFRI/CMLRE MOU for novel genomic and transcriptomic data generation. Begin Phase 2 for Phase 3 readiness. |
| Section 18.2 — Official Biothon PS | **Awaiting Human Execution (Post-Hackathon Phase)**: Paste the exact official Biothon 2026 Environment & Biodiversity problem statement text for word-for-word alignment verification. |

---

# 12. Key References

All claims in this PRD are traceable to the OceanMind Ideation Document v7.0, which in turn cites primary research. Key references:

- FAO Marine Fisheries Review 2025 (2,570 stocks assessed)
- Malde et al. 2020. Machine intelligence and the data-driven future of marine science. ICES Journal of Marine Science 77(4). DOI: 10.1093/icesjms/fsz057
- Hazen et al. 2018. A dynamic ocean management tool to reduce bycatch. Science Advances, 4. DOI: 10.1126/sciadv.aar3001
- Sagi, Lehahn & Bar 2020. AI for ocean science data integration. Elementa. DOI: 10.1525/elementa.418
- Fernandes-Salvador et al. 2026. Towards Trustworthy AI for Marine Research. Fish and Fisheries. DOI: 10.1111/faf.70052
- Agmata & Guðmundsson 2025. ConvLSTM CATCH model. Biology Methods & Protocols, 10. DOI: 10.1093/biomethods/bpaf045
- Shedrawi et al. 2024. Ikasavea landing-site CV system. Scientific Reports, 14. DOI: 10.1038/s41598-024-71763-y
- Yang et al. 2024. Machine learning for AIS-driven maritime research. Transportation Research Part E. DOI: 10.1016/j.tre.2024.103426
- Aguzzi et al. 2025. Digital-twin strategy for marine ecosystem monitoring. Ecological Informatics, 91. DOI: 10.1016/j.ecoinf.2025.103409
- Alsharabi et al. 2024. Blockchain and AI for sustainable fisheries. Journal of Cloud Computing, 13. DOI: 10.1186/s13677-024-00696-8
- Zhang 2025. CNN-XGBoost fusion for marine fishery prediction. Scientific Reports 16. DOI: 10.1038/s41598-025-33175-4

---
*OceanMind PRD v1.1 | Biothon 2026 | Marwadi University, Dept. of Bioinformatics*
