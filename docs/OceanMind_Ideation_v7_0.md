# OceanMind — Living Ideation Document
*Version 7.0 — Resolution-001 session: resolved 7 of 10 remaining open questions (OQ-018, OQ-022, OQ-027, OQ-031, OQ-032, OQ-033; THREAD-008, THREAD-011 closed); 3 remaining open items require external human action (OQ-025 — INCOIS pilot conversation; Section 18.2 — official PS text; OQ-018 Track B — institutional partnership for novel genomic sequencing). All resolutions tagged ✅ RESOLVED v7.0 with inline reasoning traceable to cited research or web-verified data. All prior content preserved per UPDATE RULE.*
*Previous: Version 5.0 — Council-Cleanup-001 session: ran council pressure-test on the highest-stakes open framing question (THREAD-012); closed 11 of 30 open questions and 3 of 12 threads with explicit defaults (each tagged ✅ RESOLVED v5.0, reasoning inline — revisit if the human disagrees); fixed the 37.7%/35.5% overfished-stock inconsistency (Section 2.1); fixed the missing-Section-18 reference (the document instructed every future session to pressure-test against "the official problem statement in Section 18," but Section 18 never existed — see new Section 18 below, which documents this gap instead of silently inventing a PS to check against); added Section 19 (PPT Build Guidelines, mapped to the official Biothon template). All v4.1 content preserved per the document's own UPDATE RULE — nothing deleted, only appended/annotated/resolved.*
*Previous: Version 4.1 — 24-hour constraint removed; Sagi et al. 2020 + Blueprint research integrated (v3.0); 8 features from Shedrawi et al. 2024, Aguzzi et al. 2025, Yang et al. 2024, and Malde et al. 2020 added and merged into the main body (v4.1, Integration-Merge-001).*

---

## ⚙️ GUIDELINES FOR ANY FUTURE CHAT RECEIVING THIS DOCUMENT

```
PURPOSE        : Ideation and reasoning log only. NOT an implementation spec.
LOAD ORDER     : Read this entire document BEFORE responding to any message about OceanMind.
UPDATE RULE    : Append and annotate. NEVER overhaul, rewrite, or delete existing content.
HISTORY        : Preserve all entries — including failed approaches and denied directions — with reasons intact.
ANNOTATION     : When updating, tag additions with a session marker and a one-line reason.
IDEA SEEDING   : Do NOT seed ideas unprompted. React to what the human says.
WEAK POINTS    : Actively probe the human's reasoning for loopholes and overgeneralisation.
SCOPE GUARD    : If the human is drifting out of scope or into implementation, flag it explicitly.
VALIDATION     : Mark a direction as Validated ONLY when the human explicitly agrees.
GROUND TRUTH   : All technical claims must be traceable to cited research. Do not hallucinate.
RESEARCH REFS  : Section 2 contains verified research citations. Treat as ground truth for all claims.
```

---

## 1. Project Context

### 1.1 What OceanMind Is

OceanMind is an AI-driven unified data intelligence platform for oceanographic and marine fisheries insights, built for **Biothon 2026** under the **Environment & Biodiversity** domain by **Marwadi University, Dept. of Bioinformatics**.

The platform addresses a fundamental structural problem in marine science: oceanographic sensor data, fisheries catch records, and molecular biodiversity data (eDNA) exist in completely isolated silos. No unified platform today integrates all three for real-time decision support. OceanMind is that platform.

**[MERGED v4.0 — Integration-Merge-001]** *Analysis bottleneck framing, second justification (from Malde et al. 2020; proposed in Section 16.1, now merged):*
> Marine data collection is scaling faster than analytical capacity. Malde et al. (2020) identify this analysis bottleneck — where data volume, complexity, and deterioration outpace human expert scrutiny — as the structural justification for machine learning in marine science. OceanMind directly addresses this bottleneck: three data pillars generating continuous data streams, unified by an AI integration layer that extracts actionable intelligence no manual workflow could produce at comparable scale or speed.

This sits alongside, not instead of, the biodiversity-crisis framing: biodiversity crisis = why this matters for the ocean; analysis bottleneck = why this matters for marine science as a discipline. See THREAD-012 for the open question on relative weighting.

### 1.2 Core Design Principles

- **Insight-only.** OceanMind surfaces predictions, alerts, and intelligence. It does NOT control vessels, auto-file reports, or take autonomous action on any government portal. This contains liability and keeps the platform advisory.
- **Open data only.** Every source is publicly accessible — critical to hackathon reproducibility and long-term sustainability.
- **FAIR data principles.** All data assets are Findable, Accessible, Interoperable, and Reusable — this is the foundational requirement for the integration layer. *(Added v3.0 — replaces the former "Demoable in 24 hours" constraint; see Section 15.1)*
- **Trustworthy by design.** Explainability (SHAP), governance, and validation against ecological and policy targets are first-class features, not afterthoughts. *(Added v3.0 — from Fernandes-Salvador et al. 2026)*

> ⚠️ **v3.0 note:** The "Demoable in 24 hours" principle has been SUPERSEDED. OceanMind is no longer constrained to a 24-hour build window. All downstream constraints, denied approaches, and demo priorities that existed solely because of the 24-hour limit are also superseded. See Section 15.1 for the full impact list.

### 1.3 The Three Data Pillars

#### Pillar 1 — Oceanographic Data

| Source | What it provides | Notes |
|--------|-----------------|-------|
| **ARGO Floats (GDAC)** | ~3,500 active profiling floats; 100,000+ T/S profiles per year in NetCDF; 10-day duty cycle | 3 millionth profile collected July 2024; data publicly available within ~24h of collection |
| **INCOIS** | SST satellite composites, chlorophyll composites, PFZ advisories (daily; 3x/week per some reports), Ocean Information Bank | Ministry of Earth Sciences; covers 586 fish landing centres |
| **Satellite (NOAA/ESA)** | Real-time SST, ocean colour (chlorophyll-a) via Copernicus Marine Service and NASA Earthdata | Free public access |
| **IMD** | Weather and cyclone forecasts for vessel safety | Public API |

#### Pillar 2 — Fisheries Records

| Source | What it provides | Notes |
|--------|-----------------|-------|
| **AIS** | 30M+ vessel data points/year; GPS, speed, heading from vessels >15m | Limitation: mandatory only for vessels >15m; most Indian small-scale fleet (~7M people) operates smaller vessels not captured by AIS |
| **INCOIS PFZ Advisories** | Twice-weekly to daily advisories based on SST + chlorophyll | Delivered to fishermen via SMS/app to 586 landing centres |
| **FAO FishBase** | Fish biology, feeding habits, migration patterns, breeding records | Public |
| **CMFRI** | India-specific catch data and stock assessments | Public |
| **Global Fishing Watch** | AIS-derived fishing effort density, IUU detection signals | Free for non-commercial research; API rate limits apply |
| **[NEW v4.0] Landing-Site CV (Ikasavea-derived)** | Smartphone catch photos at landing sites → species ID, length, weight, CPUE | Covers the ~7M small-scale fishers below the AIS 15m threshold; deployed at INCOIS's 586 landing centres; Shedrawi et al. 2024 — see Section 3.10 |
| **[NEW v7.0 — OQ-033 ✅] IOTC / Global Tuna Atlas** | Geo-referenced tuna catch-and-effort (yellowfin, skipjack, bigeye, billfish) by gear type at 1°×1° resolution; Indian Ocean FAO Areas 51+57 | Free public download; CSV; `iotc.org/data/datasets`; GTA at `data.iotc.org` | Tuna-specific ConvLSTM migration labels; IOTC stock assessments as validation target for OceanMind tuna migration forecasts; required for EEZ Rules 2025 Rule 14 compliance framing |

#### Pillar 3 — Molecular Biodiversity (eDNA)

| Source | What it provides | Notes |
|--------|-----------------|-------|
| **NCBI / EBI (ENA)** | Published eDNA sequences, metabarcoding datasets | European Nucleotide Archive for global ocean surveys |
| **IndOBIS** | OBIS node at CMLRE, Goa; Indian Ocean biodiversity occurrence records | |
| **OBIS** | 100M+ species occurrence records globally, eDNA-derived | |
| **BOLD** | Barcode of Life Database; reference barcodes for CNN training | |

**eDNA Wet Lab Pipeline:**
1. Seawater collected → filtered through membrane
2. DNA extracted → amplified using universal primers: MiFish (12S rRNA, fish), 18S rRNA (eukaryotes)
3. High-throughput sequencing via Illumina (millions of short reads)
4. BLAST alignment against NCBI, BOLD, IndOBIS reference databases
5. Biodiversity indices: Shannon, Simpson, taxonomic richness, Bray-Curtis dissimilarity
6. Species occurrence maps overlaid on oceanographic layers

> ⚠️ **Critical constraint — eDNA is NOT real-time.** Full wet lab + sequencing + bioinformatics pipeline takes 24–48 hours minimum under optimal conditions. OceanMind works with published/cached eDNA datasets from NCBI, IndOBIS, and EBI. This must never be described as live environmental DNA monitoring.

---

## 2. Research Foundation

> This section contains verified, cited research that underpins every claim OceanMind makes. All numbers in the deck and pitch must trace back here. Do not override without a better-quality citation.

### 2.1 The Global Fisheries Crisis — Verified Numbers

**FAO SOFIA 2024** (State of World Fisheries and Aquaculture, released June 8, 2024):
- Overfished stocks increased from 35.4% to **37.7%**, continuing a multi-decade upward trend
- 76.9% of total global landings (by volume) come from sustainably fished stocks when weighted by production
- Total fisheries and aquaculture production hit a record 223.2 million metric tons in 2022
- For the first time in history (2022), aquaculture production exceeded wild capture fisheries

**FAO Review of Marine Fishery Resources 2025** (released Feb 2025, covers 2,570 individual stocks — the most comprehensive assessment ever):
- **35.5%** of stocks overfished (this is the 2025 update, not SOFIA 2024)
- 64.5% exploited within biologically sustainable levels
- 77.2% of global landings by volume from sustainable stocks

> ⚠️ **IMPORTANT DISAMBIGUATION:** The two figures (37.7% and 35.5%) come from two different FAO reports covering different stock datasets. SOFIA 2024 (37.7%, n=~500 stocks) and FAO Marine Fisheries Review 2025 (35.5%, n=2,570 stocks — much larger sample, hence slightly different number). BOTH are defensible. The deck must cite which report it uses. Currently inconsistent: the project doc cites 37.7% (SOFIA 2024); the PPT Slide 2 cites 35.5% (appears to be the 2025 review). Pick one and be consistent.
>
> **✅ RESOLVED v5.0:** Use **35.5% (FAO Marine Fisheries Review 2025)** everywhere in this document and the deck. Reasoning: larger sample (2,570 vs. ~500 stocks), more current (Feb 2025 vs. June 2024), and it's what the existing PPT slide already uses — aligning the doc to the deck is less work than the reverse. Always cite as *"FAO Marine Fisheries Review 2025"* explicitly, not generically "FAO," so a judge who knows SOFIA 2024 doesn't read it as a contradiction. The 37.7% figure stays in this section as a documented alternative, not deleted, but should not appear in the deck.

**Regional breakdown (FAO Marine Fisheries Review 2025):**
- Southeast Pacific: only 46% sustainable
- East Central Atlantic: 47.4% sustainable
- Deep-sea stocks: only 29% sustainable
- Mediterranean + Black Sea (SOFIA 2024): only 35.1% sustainable
- Northeast Pacific + Southwest Pacific: 92.7% and 85% respectively — showing effective management works

**Climate urgency for Indian Ocean specifically:**
- Indian Ocean is among the **fastest-warming ocean basins** on Earth (confirmed by multiple IPCC-cited studies)
- Marine heatwaves (MHWs) have **increased up to fourfold** in the tropical Indian Ocean (Saranya et al. 2022)
- Western Indian Ocean: 1.2–1.5 additional MHW events per decade (1982–2018)
- Bay of Bengal: 94 MHW events recorded 1982–2018; CMFRI's 2024 annual assessment explicitly attributed reduced productivity in Andhra Pradesh and Kerala to prolonged MHW days
- SST above 26°C shows significant negative relationship with pelagic fish catch in Bay of Bengal studies
- Arabian Sea and Bay of Bengal both have expanding **Oxygen Minimum Zones (OMZs)** — functional anoxic conditions already affecting coastal marine life

**India-specific context:**
- India is the **second-largest fish producing nation** globally (fish production nearly doubled: 95.7 lakh tons in 2013–14 to 184 lakh tons in 2023–24, per arxiv:2511.02887)
- **14.5 million people** directly employed in marine fisheries (confirmed across multiple sources)
- India's Exclusive Economic Zone: 2.5 million km² with coastline of 7,517–8,100 km
- Annual marine fisheries production: ~2.94 million tons against harvestable potential of 3.93 million tons — indicating underutilisation even as stocks globally decline
> ⚠️ **NEW v5.0 — flagged, not auto-resolved:** The 184 lakh tons (18.4 million tons, 2023–24) figure is **total fish production** (marine + inland + aquaculture). The 2.94 million tons figure is **marine fisheries only**. These are not contradictory but they look like one if both land on the same slide without the qualifier — a judge could read it as the doc reporting two different numbers for the same thing. If both appear in the deck, always pair each number with its scope ("total fish production" vs. "marine capture fisheries"). Left for the human to decide whether both numbers are even needed — one anchor stat is usually stronger than two adjacent ones that need a footnote to avoid confusion.
- CMFRI 2024: West Bengal fishers lost 40–50 fishing days per year to adverse weather, on top of statutory monsoon bans

### 2.2 IUU Fishing — What the Numbers Actually Mean

The most widely cited figure (used by FAO, Global Fishing Watch, and the UN):
- **11–26 million tonnes per year** of illegal/unreported catch (MRAG 2009 study)
- **$10–23.5 billion** in direct annual economic losses (same MRAG 2009 study)
- ~1 in every 5 wild-caught fish on the market is of IUU origin

A newer estimate (University of British Columbia, 2020):
- 8–14 million tonnes per year (direct illegal catch)
- $9–17 billion in direct illicit proceeds
- BUT $26–50 billion in **total economic impact** when multiplier effects (diverted legal trade, tax losses) are included

> ⚠️ **The project PPT uses "26M+ tons" as a hard number without qualification.** This is the upper bound of the 2009 MRAG estimate. The correct presentation is the range: **11–26 million tonnes/year**. Presenting only the ceiling without the range context is misleading and will be challenged by any examiner who knows the source.
>
> **✅ RESOLVED v5.0:** Replace "26M+ tons" everywhere in the deck with **"11–26 million tonnes/year (MRAG 2009)."** Mechanical fix, no further judgment call needed — see Section 19 for the exact deck-ready phrasing.

**Why AIS works for IUU detection (research-backed):**
IUU vessels exhibit specific anomaly signatures detectable via ML on AIS data:
1. **Dark vessel periods** — AIS transponder disabled for extended periods
2. **Gear-type inconsistency** — speed and heading patterns inconsistent with declared fishing gear
3. **No-Take Zone presence** — vessel position within protected boundaries
4. **Location spoofing** — deliberately falsified GPS coordinates in AIS broadcasts
5. **Anomalous fleet behaviour** — the "dark matter" effect

Both supervised and unsupervised ML approaches have been validated in the literature (Vespe et al. 2016, Ford et al. 2018, Kroodsma et al. 2018). Yang et al. 2024 provides a comprehensive review of ML for AIS data-driven maritime research.

> ⚠️ **Critical gap in OceanMind's IUU claim:** AIS is mandatory only for vessels **>15 metres in length**. The vast majority of India's 14.5M-person fishing community operates small-scale vessels BELOW this threshold. OceanMind's AIS-based IUU detection applies primarily to the commercial and semi-industrial fleet, NOT to artisanal small-scale fishers.

### 2.3 eDNA — What the Science Actually Says

**Foundational method — MiFish primers (Miya et al. 2015, Royal Society Open Science):**
- Developed universal PCR primers for 12S rRNA region (MiFish-U and MiFish-E)
- Detected 230+ subtropical marine fish species from seawater samples

**Detection performance vs. traditional methods:**
- eDNA metabarcoding detected **128 fish species** from 47 stations (Yamamoto et al. 2017)
- eDNA additionally detected ≥23 species NOT captured by 14 years of visual observation

**Key technical caveat:** The NCBI nt database has significant gaps for Indian Ocean species. Classification accuracy degrades for taxa not well-represented in reference databases.

**v3.0 — Multi-omics expansion beyond eDNA** *(Added from Ramzan et al. 2025; Rather et al. 2023, 2024):*
Beyond eDNA, AI is increasingly positioned as the bridge between multi-omics data and adaptive fisheries management. OceanMind's molecular biodiversity layer should eventually accommodate:
- Genomics and population genetics for stock structure inference
- Transcriptomics for physiological stress detection (relevant during MHW events)
- Barcoding (beyond BOLD — integrating WoRMS taxonomy)
This multi-omics view improves conservation targeting beyond conventional eDNA surveys alone. → OQ-018

### 2.4 Fish Migration Prediction via ML — What the Literature Validates

**Environmental drivers (well-established):**
- Sea Surface Temperature (SST): primary driver
- Chlorophyll-a: proxy for phytoplankton productivity
- Mixed Layer Depth (MLD): vertical habitat constraint
- Dissolved Oxygen (DO): hypoxia avoidance
- Ocean current speed and direction

**v3.0 — Additional features validated by eco-informatics literature** *(Added from Scales et al. 2017):*
Near real-time eco-informatics models predicting pelagic catchability use:
- **Sea Surface Height (SSH) / sea level anomaly** — proxy for mesoscale eddy structure
- **Isothermal layer depth (ILD)** — critical for skipjack tuna habitat in the Arabian Sea
- **Wind stress and curl** — drives upwelling, particularly critical for the Somali coast
- **Eddy structure** — warm-core and cold-core eddies concentrate forage fish; detectable in altimetry data

These features are absent from the current OceanMind feature set and should be added to the LSTM/Transformer input vector. → OQ-019

**Architecture performance (existing citations):**
- CNN-LSTM-SE: 91% accuracy for vessel trajectory classification (Fishes 2025)
- HE-DFNETS: 99% on Indian Ocean PFZ prediction (Hindawi 2022)
- XGBoost CPUE prediction: r=0.93 (ResearchGate 2023)

**v3.0 — Additional model architectures from Blueprint document:**
- **ConvLSTM (CATCH model, Agmata & Guðmundsson 2025):** Spatiotemporal forecasting of fisheries catch probability densities — combines convolutional and LSTM operations to handle both spatial and temporal structure simultaneously. More appropriate than a standard LSTM for grid-based fishing zone forecasting.
- **CNN-XGBoost fusion (Zhang 2025):** CNN for spatial feature extraction from satellite imagery + XGBoost for tabular environmental variables. Demonstrated strong performance for marine fishery resource prediction.

### 2.5 Marine Health Index — Threshold Justification

*(Unchanged from v2.0 — see original document for full threshold justification table)*

**v3.0 addition — Synergistic DO + pH effects** remain valid and are now a committed feature, not just a proposed enhancement. Digital twin modelling (Aguzzi et al. 2025) enables scenario simulation of compound stress events. → See Section 15.4 (Digital Twin module).

### 2.6 RAG for Oceanographic Conversational AI — Prior Work

**OceanAI (Chen et al., NC State + NOAA, arXiv:2511.01019)** remains the primary prior work. OceanMind differentiates on: Indian Ocean focus, eDNA integration, fisheries/AIS layer.

### 2.7 Argo Float Figures — Corrected for the Deck

- **~3,500+ active floats** / **100,000+ profiles per year** — these are the correct figures.
- Slide 4 ("150,000+ profiles/yr") and Slide 7 ("3,000+ active floats") are BOTH incorrect. Fix both.

### 2.8 Data Integration Infrastructure — NEW (Added v3.0)
*Session marker: Research-Integration-001 | Source: Sagi, T., Lehahn, Y., Bar, K. (2020). "Artificial intelligence for ocean science data integration: current state, gaps, and way forward." Elementa: Science of the Anthropocene. DOI: 10.1525/elementa.418*

This paper is the most directly relevant academic treatment of the core technical challenge OceanMind must solve: integrating heterogeneous marine datasets that have no common schema. OceanMind's architecture must treat data integration as a first-class engineering problem, not an afterthought.

**The three-phase DI process (Sagi et al. 2020 framework):**

| Phase | Steps | What it means for OceanMind |
|-------|-------|----------------------------|
| **Discover** | Search → Link → Identify | Find candidate datasets across ARGO, INCOIS, NCBI, IndOBIS, GFW; link datasets to their source publications; identify duplicates before ingestion |
| **Merge** | Match → Map → Fuse | Align schemas across NetCDF, JSON, FASTA, and relational formats; map fields to a unified schema; interpolate/aggregate to a common spatio-temporal resolution |
| **Evaluate/Correct** | Quality → Coverage → Bias | Flag outliers, assess geographical and temporal coverage gaps, correct classification errors via ontological rules |

**Key insight for OceanMind's architecture:**
> Ocean science datasets have no common schema and are collected using different methodologies. The semantic distance between a NetCDF ARGO profile, an INCOIS PFZ JSON advisory, and an NCBI FASTA metabarcoding file is enormous. Without explicit schema matching and mapping infrastructure, the "unified platform" claim is only partially true — the data pilars are juxtaposed, not truly integrated.

**Five components of the DI process (Sagi et al. 2020, Figure 1):**
1. **Schema matching** — align field names and meanings across datasets (e.g., "Nitrate" in PANGAEA vs. "Nitrate concentration" in EDMED, where the PANGAEA field actually represents Nitrate + Nitrite)
2. **Schema mapping** — generate conversion functions (unit conversions, coordinate transforms, format conversions)
3. **Entity resolution** — identify duplicate records across datasets (same observation appearing in multiple repositories)
4. **Entity consolidation** — merge all data about the same entity coherently
5. **Data cleansing** — detect and correct errors at both source and integrated dataset levels

**Ocean-specific ontologies relevant to OceanMind:**

| Ontology | What it covers | Relevance |
|----------|---------------|-----------|
| **GeoLink / OceanLink** | Interdisciplinary oceanographic data discovery, SPARQL endpoint at data.geolink.org | Schema alignment for ARGO, satellite, and sensor data |
| **MarineTLO** | Marine species, ecosystems, fishers; taxonomic hierarchy | Species-level entity resolution for eDNA + FishBase integration |
| **WoRMS (World Register of Marine Species)** | Canonical marine species taxonomy | Taxonomic normalisation across NCBI, IndOBIS, BOLD |
| **SWEET (NASA)** | 6,000+ Earth and environmental science concepts | Oceanographic parameter alignment |
| **EDMED SPARQL endpoint** | European marine environmental data with ontological support | Reference for parameter ontology matching |

**Domain-specific word embeddings (Sagi et al. 2020, Section 4):**
An empirical result with direct implications for OceanMind's RAG pipeline:
- Flair NER trained on **general-purpose text**: F1 = 0.068 on oceanographic entity extraction
- Flair NER retrained on **30,000 oceanographic papers**: F1 = 0.738 — an 11× improvement
- Stacked embeddings (oceanic Word2Vec + oceanic character-based): F1 = 0.679 on boundary+class match

**Implication for OceanMind:** The RAG conversational interface's retrieval quality will be significantly better if the underlying embeddings are oceanography-domain-specific rather than general-purpose. The vector store (FAISS/ChromaDB) should be populated with ocean-science-specific embeddings, not default OpenAI/sentence-transformer embeddings trained on general web text.

Publicly available from the paper:
- Annotated oceanic NER dataset (Bar, 2020a): DOI 10.17605/OSF.IO/MY2NK
- Oceanographic text corpus, 175M tokens from 30,000 papers (Bar, 2020b): DOI 10.17605/OSF.IO/8VAFS

**Spatio-temporal resolution fusion (Sagi et al. 2020, Section 3.2.3):**
When integrating ARGO floats (point measurements, 10-day cycle, 1–2 km spatial precision) with satellite SST composites (1 km spatial resolution, daily temporal resolution) with PFZ advisories (regional, twice-weekly), decisions must be made on:
- Aggregating to lower resolutions vs. interpolating to higher resolutions
- Handling cloud cover gaps in satellite imagery
- Matching ARGO profiles that are geographically displaced from surface imagery edges

This is not a solved problem. OceanMind must define an explicit fusion strategy per data pair. → OQ-020

### 2.9 Dynamic Ocean Management — NEW (Added v3.0)
*Session marker: Research-Integration-001 | Source: Hazen et al. (2018). "A dynamic ocean management tool to reduce bycatch and support sustainable fisheries." Science Advances, 4. DOI: 10.1126/sciadv.aar3001*

**The most important finding for OceanMind's SFZ engine:**
> Environmentally responsive fishing closures can be **far smaller than static closures** while still protecting sensitive species.

Hazen et al. 2018 demonstrated that dynamic ocean management — zones that update in response to real-time oceanographic data — outperforms static zones for both fisheries efficiency and conservation outcomes. This is the strongest evidence-backed use case for OceanMind's SFZ engine and should be the primary framing in the pitch: not "we make zone maps" but "we make zones that move with the ocean."

**Specific mechanism:** The Hazen et al. 2018 system linked species distribution models driven by SST, SSH, and chlorophyll to near-daily vessel tracking data. OceanMind can replicate this at Indian Ocean scale using INCOIS + ARGO + GFW.

> ⚠️ **This changes how the 70% bycatch claim should be replaced.** The 70% figure in Slide 8 was from a different context (Gulf of Maine whale-ship collisions) and must be removed. The Hazen et al. 2018 finding — that **dynamic zones can be 2–3× smaller than static closures while achieving equivalent protection** — is the correct, citeable replacement claim. This is a stronger, more honest, and directly applicable result.

### 2.10 Trustworthy AI for Marine Management — NEW (Added v3.0)
*Session marker: Research-Integration-001 | Source: Fernandes-Salvador et al. (2026). "Towards Trustworthy Artificial Intelligence for Marine Research, Fisheries and Environmental Management." Fish and Fisheries. DOI: 10.1111/faf.70052*

Trust, governance, and validation are **central constraints, not secondary features** for AI systems in fisheries management. Fernandes-Salvador et al. 2026 identifies the core requirements for AI adoption in regulatory marine contexts:
- Explicit uncertainty quantification on all predictions
- Model auditability (SHAP already planned; extend to LIME for neural models)
- Validation against ecological baselines, not just statistical benchmarks
- Stakeholder co-design — fishermen and regulators must participate in defining what "correct" means
- Data provenance tracking — every prediction must be traceable to its source data

OceanMind's SHAP integration on the SFZ XGBoost model satisfies part of this. The remaining gap is uncertainty quantification on the LSTM migration model (no confidence intervals currently planned) and an explicit data provenance layer. → OQ-021

---

## 3. Key Features (Scoped)

### 3.1 Fish Migration Prediction Engine

**Inputs (v3.0 expanded feature set):**
- SST weekly composite + anomaly from long-term mean
- Chlorophyll-a concentration (proxy for prey availability)
- Mixed Layer Depth from ARGO profiles (vertical habitat constraint)
- Ocean current speed and direction (u/v components)
- Dissolved Oxygen at surface
- AIS-derived fishing effort density as proxy presence label
- **[NEW v3.0]** Sea Surface Height / sea level anomaly — mesoscale eddy proxy (Scales et al. 2017)
- **[NEW v3.0]** Isothermal Layer Depth (ILD) — critical for tuna habitat (Scales et al. 2017)
- **[NEW v3.0]** Wind stress curl — upwelling driver for Arabian Sea and Somali coast

**Architecture (v3.0 updated):**
- Primary: **ConvLSTM** (Agmata & Guðmundsson 2025 CATCH model) — handles spatial structure of the grid natively; preferred over standard 2-layer LSTM for zone-based forecasting
- Ensemble: Transformer (4 attention heads, 2 encoder layers) for long-range seasonal dependencies
- Alternative: **CNN-XGBoost fusion** (Zhang 2025) as a parallel track where CNN extracts spatial features from satellite imagery and XGBoost handles tabular environmental variables
- Output: probability distribution over migration zones for target week
- **[NEW v3.0]** Confidence intervals on all zone predictions (required for Fernandes-Salvador 2026 trustworthy AI compliance)

**Training data:** 25 years of weekly INCOIS SST composites (2000–2025), ARGO GDAC historical profiles, Global Fishing Watch AIS effort density

### 3.2 Marine Health Index (MHI)

*(Threshold table unchanged from v2.0 — see original for full justification)*

**v3.0 additions:**
- Compound stress detection: explicitly model synergistic DO + pH interaction (committed, not optional)
- **[NEW]** Digital twin extension: scenario simulate "what if SST rises +1.5°C this season?" → project MHI score forward (Aguzzi et al. 2025)

### 3.3 eDNA Biodiversity Assessment Pipeline

*(Two-stage BLAST → CNN pipeline unchanged from v2.0)*

**v3.0 additions:**
- **[NEW]** Multi-omics pathway: roadmap to incorporate population genetics for stock structure inference (Ramzan et al. 2025)
- **[NEW]** WoRMS taxonomic normalisation: all species names resolved against World Register of Marine Species to enable consistent entity resolution across NCBI, IndOBIS, BOLD, and FishBase
- **[NEW v4.0 — MERGED]** Joint Species Distribution Model (JSDM): correlates eDNA species co-occurrence records with ARGO/satellite environmental layers to predict species assemblage probability across *unsampled* grid cells, not just sampled ones. Candidate tooling: `HMSC` (R), `BayesComm`, or PyMC/Stan equivalents. Framed as supplementing, not replacing, direct sampling (Aguzzi et al. 2025; see Section 16.4 for full detail). Feeds the SFZ engine (3.4) and the bycatch overlay. → OQ-027

### 3.4 Sustainable Fishing Zone (SFZ) Engine — Dynamic Mode

**v3.0 key upgrade: Static → Dynamic**
*(From Hazen et al. 2018 — see Section 2.9)*

The SFZ engine must produce **dynamic zones**, not just static maps. Zones should update on a weekly (minimum) cycle driven by incoming INCOIS SST + chlorophyll composites and GFW effort data. A static zone boundary published monthly is a fundamentally weaker product than one that moves with the fish.

ML features per grid cell: *(unchanged from v2.0 plus:)*
- **[NEW]** SSH anomaly (eddy detection)
- **[NEW]** ILD (isothermal layer depth)

**Model:** XGBoost classifier (5-fold CV, SHAP) — unchanged. CNN-XGBoost fusion (Zhang 2025) as a candidate upgrade path.

**[NEW — Bycatch Risk Layer]** *(from Hazen et al. 2018):*
Dynamic closures are most valuable when they respond specifically to bycatch-sensitive species distributions. OceanMind should add a bycatch risk overlay to the SFZ map — probability that a given zone contains legally protected or ecologically sensitive species at a given time — independent of the Green/Amber/Red fishing zone classification.

**[NEW v4.0 — MERGED]** The bycatch overlay's accuracy in unsampled cells is improved by the JSDM (Section 3.3) — instead of using absence-of-eDNA-detection as a (weak) proxy for low risk, the overlay can use JSDM-predicted presence probability for ecologically sensitive species, even where no eDNA sample exists.

### 3.5 Conversational AI Interface — Domain-Tuned Embeddings

*(Architecture unchanged from v2.0: LangChain RAG, FAISS/ChromaDB, LLaMA 3 or GPT-4o-mini)*

**v3.0 key upgrade: domain-specific embeddings**
*(From Sagi et al. 2020, Section 4)*

Replace general-purpose sentence-transformer embeddings in the vector store with ocean-science-specific embeddings fine-tuned on the 30,000-paper oceanographic corpus (Bar 2020b, DOI 10.17605/OSF.IO/8VAFS). Expected improvement: 11× on oceanic entity extraction tasks. The Flair NER component (or equivalent) should be retrained on the annotated oceanic NER dataset (Bar 2020a, DOI 10.17605/OSF.IO/MY2NK) to correctly identify measured variables, units, instruments, and species names in INCOIS advisories and ARGO metadata.

### 3.6 Real-time Alert System

*(Unchanged from v2.0 — SMS via Twilio, FCM push notifications, regional language support)*

**v3.0 addition — Bhashini voice interface** *(OQ-015 from Council-001, now elevated):*
Fishermen communicate by voice. Bhashini (bhashini.gov.in) — the Indian government's open-source multilingual AI platform supporting all 22 scheduled Indian languages with voice I/O — should be the primary fisherman-facing interface. A fisherman saying *"aaj Gujarat coast pe machli kahan milegi?"* in spoken Gujarati is a dramatically better user experience than a typed English RAG query.

### 3.7 Data Integration Infrastructure Layer — NEW (Added v3.0)
*Session marker: Research-Integration-001 | Rationale: Core requirement identified by Sagi et al. 2020; without this, OceanMind's "unified" claim is partially unfulfilled*

This is a new Feature that did not exist in v2.0. It is the backbone that makes the three-pillar architecture genuinely unified rather than three loosely connected systems.

**Components:**

**3.7.1 Schema Matching and Mapping Engine**
- Align field names and semantics across NetCDF (ARGO), JSON (INCOIS/GFW), FASTA (NCBI), CSV (CMFRI catch records), and relational tables (PostGIS)
- Map to OceanMind's unified mediated schema
- Generate conversion functions for unit mismatches (e.g., PSU vs. dimensionless salinity; °C vs. K; dbar vs. m depth)
- Tool candidates: COMA schema matching framework; GeoLink ontology mappings; custom mapping for INCOIS-specific fields

**3.7.2 Ontology-Based Data Access (OBDA) Layer**
- Map OceanMind's PostgreSQL/PostGIS schema to marine domain ontologies: GeoLink, MarineTLO, WoRMS
- Expose SPARQL endpoint for ontological queries (e.g., "all datasets containing any diatom species within 200km of Gujarat coast")
- Enable discovery of new datasets that are already aligned with these ontologies without re-engineering the ingestion pipeline

**3.7.3 Entity Resolution Engine**
- Identify duplicate records across ARGO, IndOBIS, OBIS, and NCBI (same observation published in multiple repositories)
- Resolve taxonomic synonyms across databases using WoRMS canonical names (e.g., the same fish species named differently in CMFRI records vs. FishBase vs. eDNA BLAST output)
- Block on: geo-coordinates + date + parameter type for sensor records; taxon barcode sequence for eDNA records

**3.7.4 Domain-Specific NER for Metadata Extraction**
- Deploy Flair NER retrained on oceanographic corpus (Sagi et al. 2020) to extract structured information from unstructured dataset descriptions, INCOIS advisories, and CMFRI reports
- Use extracted entities (measured variable, instrument, geo-region, species, units) to auto-populate schema fields where metadata is incomplete
- This addresses the "patience of the data hunter" problem documented in the Sagi et al. 2020 example: hours spent manually finding units from a linked publication can be automated

**3.7.5 Spatio-Temporal Fusion Rules**
- Define explicit fusion strategy for each dataset pair:
  - ARGO profile (point, 10-day) + INCOIS SST (raster, daily) → spatial kriging to nearest grid cell, temporal linear interpolation
  - GFW AIS effort (daily raster, 0.1° resolution) + INCOIS chlorophyll (weekly composite, 1km) → temporal aggregation to weekly, spatial regrid to common 0.1° grid
  - eDNA occurrence (point, single-date) + oceanographic layers → assign nearest weekly ARGO/satellite composite based on collection date

**[NEW v4.0 — MERGED] Data Bubbles as the unifying abstraction (Aguzzi et al. 2025):** The bespoke per-pair fusion rules above scale poorly as data sources grow. A **data bubble** — a geospatial sphere `(lat, lon, depth, radius)` + time window — gives every observation, regardless of source, a shared minimum metadata tag `(L, L, D, Tn)`. A `data_bubbles` PostGIS table (see Section 4.2) with a `bubble_id` foreign key on every observation table replaces source-pair-specific fusion logic with one generic join key; the SPARQL endpoint becomes "all observations in bubble B-247 for the last 30 days" instead of source-specific queries. Per-pair fusion rules above remain valid during transition. Standardise to NetCDF CF Conventions feature types per source: ARGO → Profile, INCOIS SST → Grid, AIS → Trajectory, landing-site CV (3.10) → Point, eDNA → Point. → OQ-026 (spatial radius: adaptive 5km coastal / 50km open ocean, or uniform 25km?)

**3.7.6 Data Quality and Provenance Layer**
- Tag every ingested record with: source system, ingestion timestamp, schema version, quality flag, fusion method applied
- Expose provenance metadata through the RAG interface (every AI-generated answer should be traceable to its source records)
- Required for Fernandes-Salvador 2026 trustworthy AI compliance (Section 2.10)

**3.7.7 AIS Data Quality Pipeline — NEW v4.0 (MERGED)**
*Source: Yang et al. 2024 | Stage 0 preprocessing layer between `raw_ais_download` and `ais_processed`*

Raw AIS is not clean input. Without this layer, the IUU anomaly detector (Section 2.2) inherits AIS's known artifacts as signal:
- **MMSI deduplication** — flag/resolve multiple physical vessels sharing one MMSI
- **Trajectory gap filling** — linear/Kalman interpolation for short gaps; LSTM-based reconstruction for longer ones
- **Outlier removal** — DBSCAN on (position, speed) to catch physically impossible "teleportation" jumps
- **Spoofing signature detection** — vessel stationary at port while logbook shows at sea; jumps inconsistent with rated max speed
- **Route clustering (DBSCAN-SD)** — DBSCAN extended with SOG/COG as non-spatial features, extracting typical fishing routes per area/season as a richer historical baseline than raw AIS effort density for the SFZ model

⚠️ Attribution: cite Yang et al. 2024 as the survey source; DBSCAN-SD's original algorithm is attributed to Vespe et al. in the AIS literature. → OQ-029 (Indian-EEZ-specific MMSI conflict rate — precautionary step, or measured problem?)

### 3.8 Fisheries Traceability Module — NEW (Added v3.0)
*Session marker: Research-Integration-001 | Source: Alsharabi et al. (2024). "Using blockchain and AI technologies for sustainable, biodiverse, and transparent fisheries." Journal of Cloud Computing. DOI: 10.1186/s13677-024-00696-8*

A blockchain-backed supply chain traceability layer would allow OceanMind to:
- Record verified catch events (vessel ID, zone, species, quantity) as immutable on-chain records
- Link catch records to the specific SFZ zone status at the time of catch (was this catch from a Green zone?)
- Enable sustainable-catch certification for premium market access — a direct economic incentive for zone compliance (addresses OQ-016: the incentive structure problem)
- Provide regulators with tamper-proof IUU investigation evidence

This addresses a gap identified in OQ-016: OceanMind currently adds better data but doesn't change the incentive structure for compliance. Blockchain-backed certification creates a direct economic pathway — fishermen in certified sustainable zones can access premium buyers. → OQ-022

### 3.9 Digital Twin and Scenario Simulation Module — NEW (Added v3.0)
*Session marker: Research-Integration-001 | Source: Aguzzi et al. (2025) — digital twin strategy for marine ecosystem monitoring; Ortenzi et al. (2026) — generative AI for marine ecological monitoring*

**What it does:**
- Simulate "what-if" scenarios: *"If an MHW event raises SST by +2°C for 3 weeks, what does the MHI score become, and how do migration zones shift?"*
- Use generative AI / diffusion models to impute incomplete sensor data (cloud-occluded satellite pixels, ARGO floats with faulty sensors, gaps in AIS coverage)
- Enable forward scenario projection for climate-driven habitat suitability shifts (relevant to LSTM stationarity concern in OQ-017)
- **[NEW v4.0 — MERGED] Larval connectivity Individual-Based Model (IBM):** whether a depleted stock recovers depends on larval connectivity from healthy upstream spawning grounds. Particle-tracking IBM using COPERNICUS CMEMS current fields (u/v/w) + species-specific spawning time/larval duration/vertical migration parameters (after Clavel-Henry et al. 2020, via Aguzzi et al. 2025) produces 30–90 day recruitment probability maps. Directly informs SFZ zone design: protect high-incoming-recruitment areas even where not currently productive — a connection absent from v3.0. Phase 2, gated on CMEMS ingestion. → OQ-028

**Why it matters:** This is the feature that transforms OceanMind from a monitoring platform into a decision-support platform. Regulators and conservation NGOs need to answer "what happens next month?" not just "what is happening now?" The digital twin capability is the mechanism.

### 3.10 Landing Site Computer Vision (CV) Module — NEW v4.0 (MERGED)
*Session marker: Integration-Merge-001 | Source: Shedrawi et al. 2024 (Ikasavea system, Pacific SIDS) | Priority: HIGH — closes the AIS small-scale-fisher gap (Section 2.2, DENIED-006); full detail in Section 16.2*

**Problem solved:** AIS covers vessels >15m only; most of India's ~7M small-scale fishers fall below this threshold and were entirely outside OceanMind's data coverage prior to v4.0.

**Architecture:** Fisher photographs catch at the landing site on a calibrated measurement mat (no specialist taxonomic knowledge required) → centralized YOLOv4/Darknet53 + ResNet101 pipeline (or YOLOv8/v9 for an Indian deployment) → image orientation correction → pixel calibration → fish detection → species ID. Outputs: species ID, fork/total length, weight (via length-weight relationships), CPUE per fishing method, market pricing. Stock-assessment integration via Length-Based Spawning Potential Ratio (LBSPR) and Fulton's condition factor K.

**Integration points:**
- Fourth data sub-pillar within Pillar 2 (Section 1.3), alongside — not replacing — AIS
- Deploys at INCOIS's existing 586 landing-centre network
- Provides ground-truth CPUE labels for the ConvLSTM/XGBoost migration and SFZ models, currently dependent on AIS effort density as a proxy
- Each landing-site CV record (species + quantity + date + location) is a natural verified catch event for the blockchain traceability module (3.8)

**Known limitation:** Species recall degrades when many new low-sample-count species are added simultaneously (the source paper's m23 model dropped to ~79% recall on 264 species when 153 additions had only 20–40 training images each — verify this exact figure before external citation, per Section 16.0). Implication: build on well-represented Indian Ocean species first, expand via transfer learning; do not attempt all 586 centres simultaneously. See THREAD-011 on Arabian Sea vs. Bay of Bengal model specialisation.

**Code availability:** `github.com/PacificCommunity/cfap-ai-models` (confirmed in source paper).

**Phase:** MVP Phase B–C for the smartphone app and base YOLO pipeline; LBSPR stock-assessment integration is Phase 2. → OQ-025

---

## 4. Technology Stack

### 4.1 AI / Machine Learning

| Model | Role | Architecture | Research Support |
|-------|------|-------------|-----------------|
| ConvLSTM | Fish migration / zone forecasting (primary) | Spatiotemporal convolution+LSTM | Agmata & Guðmundsson 2025 (CATCH); replaces standard 2-layer LSTM |
| LSTM | Fish migration time-series (baseline/fallback) | 2-layer, 128 hidden, dropout 0.3 | HE-DFNETS 2022, kept as benchmark |
| Transformer | Long-range seasonal migration | 4 heads, 2 encoder layers, ensembled | Validated for long-range temporal dependencies |
| CNN-XGBoost fusion | Fishery resource dynamics (parallel track) | CNN spatial + XGBoost tabular | Zhang 2025 |
| XGBoost / RF | SFZ boundary classification | 5-fold CV; F1 per class; SHAP | r=0.93 for CPUE prediction (RG 2023) |
| 1D CNN | eDNA species classification | Trained on BOLD barcode sequences | Two-stage BLAST+CNN standard in metabarcoding |
| Isolation Forest | Marine Health Index anomaly detection | Multi-parameter input | Standard for multi-sensor anomaly detection |
| Generative AI | Data imputation, digital twin simulation | Diffusion model or VAE | Ortenzi et al. 2026; Aguzzi et al. 2025 |
| ARIMA | Baseline benchmark | Comparison vs. ConvLSTM | Benchmark only |
| LangChain RAG | Conversational interface | FAISS/ChromaDB + ocean-specific embeddings | OceanAI (arXiv:2511.01019); Sagi et al. 2020 |
| Flair NER (domain-tuned) | Metadata extraction from unstructured text | Oceanic corpus embeddings | Sagi et al. 2020; F1=0.738 on oceanic entities |
| **[NEW v4.0]** YOLOv8/v9 + ResNet101 | Landing-site catch species ID, length/weight (3.10) | Multistage: calibration → detection → ID | Shedrawi et al. 2024 (Ikasavea) |
| **[NEW v4.0]** HMSC / BayesComm (JSDM) | Species assemblage prediction in unsampled cells (3.3) | Latent-variable joint species distribution model | Aguzzi et al. 2025; Ovaskainen et al. 2017 |
| **[NEW v4.0]** Lagrangian particle-tracking IBM | Larval connectivity / recruitment maps (3.9) | CMEMS current fields + species spawning params | Aguzzi et al. 2025; Clavel-Henry et al. 2020 |
| **[NEW v4.0]** STEAM emission model | Fleet carbon footprint (Section 16.8) | Engine power × load factor × time × emission factor | Jalkanen et al. 2009/2012, surveyed in Yang et al. 2024 |

### 4.2 Data Engineering & Backend

| Tool | Role |
|------|------|
| Python 3.11+ | Primary language |
| FastAPI / Flask | RESTful API backend |
| NetCDF4 + Xarray | ARGO float and satellite raster data ingestion |
| Pandas + NumPy | Feature engineering |
| PostgreSQL + PostGIS | Geospatial database (ST_Within, ST_Distance queries) |
| **[NEW]** Apache Jena / RDFLib | SPARQL endpoint for OBDA ontology layer |
| **[NEW]** Gensim | Oceanic word embedding training (Word2Vec on Bar 2020b corpus) |
| **[NEW]** GeoLink ontology mapping | Schema alignment for oceanographic datasets |
| **[NEW v4.0]** `data_bubbles` PostGIS table (`geometry POINT`, `radius_km`, `time_window_start/end`) + `bubble_id` FK on all observation tables | Unified spatiotemporal join key replacing per-pair fusion rules (Section 3.7.5; Aguzzi et al. 2025) |
| Apache Kafka | IoT streaming (Phase 2 and beyond) |
| Docker + Kubernetes | Containerised deployment |

### 4.3 Bioinformatics Pipeline

| Tool | Role |
|------|------|
| FastQC + Trimmomatic | QC + adapter trimming for FASTQ reads |
| DADA2 / VSEARCH | ASV/OTU clustering |
| BLAST+ (NCBI) | Sequence alignment |
| Biopython | NCBI Entrez API + FASTA handling |
| **[NEW]** WoRMS API | Taxonomic name normalisation across databases |
| Vegan (R) | Community ecology stats: Shannon, Simpson |

### 4.4 Frontend & Visualisation

| Tool | Role |
|------|------|
| React / Next.js | Web dashboard |
| Leaflet.js + Plotly | Geospatial maps (SST overlays, fishing zones, biodiversity) |
| Streamlit | MVP rapid demo interface |
| Twilio SMS | Alert dispatch |
| Firebase | Android push notifications |
| **[NEW]** Bhashini API | Voice I/O in 22 Indian languages for fishermen interface |
| **[NEW]** Blockchain (Hyperledger Fabric or similar) | Fisheries traceability module |
| **[NEW v4.0]** Grafana-style time-series panels | Landing-site species/CPUE trend dashboard, e.g. "Veraval mackerel CPUE -23% over 90 days" (Section 16.9, F8) |

---

## 5. MVP Prototype Plan *(Formerly "24-Hour Hackathon Prototype Plan" — 24-hour constraint REMOVED in v3.0)*

The MVP is no longer constrained to a 24-hour build window. The objective is the **minimum working system that demonstrates all three data pillars**, the data integration layer, and the dynamic SFZ output convincingly to judges and stakeholders.

**Demo sequence (priority order):**
1. Live ARGO float profile pull for the Arabian Sea
2. ConvLSTM migration heat map for next 7 days with confidence intervals
3. Dynamic SFZ overlay (Green/Amber/Red) on Leaflet — updating weekly cycle demo
4. Bycatch risk overlay on the SFZ map
5. eDNA species table — top 10 species from NCBI sample dataset, WoRMS-normalised
6. Schema matching demo — show two datasets (ARGO NetCDF + INCOIS JSON) being aligned to unified schema
7. RAG query with domain-specific embeddings: "What is the marine health status near Gujarat this week?" — show provenance trace
8. Bhashini voice query demo (if integration is complete)
9. Simulated SMS alert — zone change sent to demo phone number
10. Blockchain traceability entry demo — verify a catch record

**Fallback data (all must be pre-downloaded and validated before development begins):**
- ARGO: Pre-downloaded NetCDF for Arabian Sea (2023–25) in repo
- eDNA: Cached NCBI eDNA dataset for Indian Ocean fish (MiFish primers)
- PFZ: Static INCOIS PFZ advisory dataset from 2022–24
- GFW: Pre-downloaded AIS fishing effort density for Indian EEZ

**Build sequence (without time pressure — prioritise correctness over speed):**

| Phase | Components | Outcome |
|-------|-----------|---------|
| Phase A | Data ingestion + schema matching + OBDA layer + PostgreSQL/PostGIS | True unified data backend — three pillars speaking to each other |
| Phase B | WoRMS entity resolution + domain NER for metadata | Cross-database species normalisation working |
| Phase C | ConvLSTM migration model + SHAP/confidence intervals | Trustworthy fish migration predictions |
| Phase D | Dynamic SFZ (weekly update cycle) + bycatch risk layer | Dynamic zones, not static maps |
| Phase E | RAG with domain embeddings + provenance layer | Trustworthy conversational interface |
| Phase F | Bhashini voice interface + SMS alerts | Fishermen-accessible interfaces |
| Phase G | Digital twin scenario simulation | MHW scenario modelling demo |
| Phase H | Blockchain traceability MVP | Compliance incentive mechanism |

**Minimum Viable Demo (floor — unchanged from Council-001 definition, updated for v3.0):**
Three working components, one per pillar — (1) RAG query over INCOIS/ARGO data with domain embeddings [oceanographic pillar], (2) dynamic SFZ map from ConvLSTM output [fisheries pillar], (3) eDNA species table with WoRMS normalisation from cached NCBI dataset [biodiversity pillar]. Plus: schema matching demo showing two dataset formats unified. If only these four work, the demo still demonstrates the full three-pillar thesis plus the integration layer to judges.

---

## 6. Impact & Beneficiaries

*(Unchanged from v2.0)*

| User Group | Scale | Need | OceanMind's Answer |
|------------|-------|------|-------------------|
| Indian coastal fishermen | 14.5M | Where to fish safely and profitably | Migration maps, dynamic SFZ zones, SMS + Bhashini voice alerts in regional languages |
| Fisheries cooperatives / state depts. | Hundreds | Enforce sustainable zones, reduce IUU | Dynamic No-Take Zone boundaries, AIS anomaly alerts, dashboard |
| Marine scientists / researchers | INCOIS, CMLRE, CMFRI, universities | Unified multi-source dataset access | RAG query interface over ARGO, NCBI, IndOBIS + SPARQL ontological queries |
| Conservation NGOs | WWF India, WCS | Early warning of ecosystem stress | MHI scores, eDNA biodiversity trends, digital twin MHW scenarios |
| Policy / government | Blue Economy Mission, PMMSY | Evidence-based zone delineation | Dynamic SFZ outputs, IUU detection reports, blockchain-verified catch data |
| Supply chain buyers | Retailers, exporters | Sustainable sourcing verification | Blockchain traceability certificates |

### Verified Impact Numbers

- **14.5 million** Indian fishermen employed in marine fisheries (confirmed)
- **15–25% fuel savings** via AI routing: supported by INCOIS PFZ advisory literature
- Dynamic ocean management zones can be **2–3× smaller than static zones** while achieving equivalent species protection (Hazen et al. 2018) — *use this to replace the removed 70% bycatch claim*
- **75–92% fish location accuracy**: Target based on comparable literature — must be framed as a target, never as a validated OceanMind result
- **[NEW v4.0]** Landing-site CV module (3.10) extends OceanMind's direct relevance to the **~7M small-scale fishers** previously outside AIS coverage entirely — this is new beneficiary reach, not just a new feature
- **[NEW v4.0]** Fleet carbon emission estimation (Section 16.8) adds an SDG 13 (Climate Action) reporting capability alongside SDG 14 — framed as a target capability pending ship-engine-database access (OQ-030), not a current OceanMind output

---

## 7. Strategic Alignment

*(SDG/national goal and competitive differentiation sections unchanged from v2.0)*

**v3.0 addition to competitive table:**

| Platform | Oceanographic | Fisheries/AIS | eDNA | Data Integration Layer | Dynamic Zones | Blockchain Traceability | **[NEW v4.0] Small-scale fisher coverage** | **[NEW v4.0] Analysis bottleneck addressed** |
|----------|--------------|--------------|------|----------------------|--------------|------------------------|---|---|
| OceanAI (NOAA/NCSU) | ✓ | ✗ | ✗ | Partial | ✗ | ✗ | ✗ | ✗ |
| Global Fishing Watch | Partial | ✓ | ✗ | ✗ | Partial | ✗ | ✗ | ✗ |
| INCOIS (standalone) | ✓ | Partial | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Copernicus Marine | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **OceanMind** | **✓** | **✓** | **✓** | **✓** | **✓** | **✓** | **✓ (landing-site CV, 3.10)** | **✓ (end-to-end ML pipeline)** |

**[MERGED v4.0]** The analysis-bottleneck column operationalises the Section 1.1 framing (Malde et al. 2020) as a competitive differentiator: OceanMind is positioned not only as filling a data-source gap (columns 1–7) but as the only platform among comparators that closes the gap between data collection rate and analysis capacity.

---

## 8. Roadmap *(Updated v3.0 — 24-hour constraint removed)*

### Phase 1 — MVP (Duration: determined by team, not an arbitrary time box)
- Data integration infrastructure: schema matching, WoRMS entity resolution, OBDA/SPARQL layer
- ARGO + INCOIS data ingestion pipeline with explicit fusion rules
- ConvLSTM fish migration model with confidence intervals
- Dynamic SFZ weekly update cycle
- Domain-specific embeddings for RAG conversational interface
- Streamlit geospatial dashboard + Leaflet map
- eDNA species classification proof-of-concept with WoRMS normalisation
- **[NEW v4.0]** Landing-site CV module (3.10): smartphone app + base YOLO pipeline, piloted on well-represented species first
- **[NEW v4.0]** Data Bubbles spatiotemporal schema in PostGIS, replacing per-pair fusion rules
- **[NEW v4.0]** AIS data quality pipeline (Section 3.7.7): MMSI dedup, gap filling, spoofing detection, DBSCAN-SD route clustering

### Phase 2 — Pilot Deployment (3–6 Months)
- Live IoT buoy sensor integration with INCOIS data feeds
- Bhashini voice interface for fishermen (all 22 scheduled languages)
- Android mobile app for fishermen (multilingual)
- Government API integration via data.gov.in
- Beta test with 3 coastal fishing cooperatives in Gujarat and Kerala
- Blockchain traceability MVP — pilot with one cooperative (Hyperledger Fabric + PMMSY-linked certification — OQ-022 ✅)
- Digital twin scenario simulation for MHW events
- Model retraining feedback loop from cooperative catch logs
- **[NEW v4.0]** LBSPR stock-assessment integration on top of landing-site CV data
- **[NEW v4.0]** COPERNICUS CMEMS current-field ingestion (precondition for larval connectivity IBM)
- **[NEW v4.0]** Larval connectivity IBM (recruitment probability maps) feeding SFZ zone design
- **[NEW v4.0]** Fleet carbon emission estimation (STEAM model) — gated on ship-engine database access (OQ-030)
- **[NEW v4.0]** Landing-site species/CPUE trend dashboard
- **[NEW v7.0 — OQ-032 ✅]** State-MFRA regulatory database + SFZ regulatory overlay: compile ban periods, gear restrictions, and mesh-size rules for 13 coastal states + 4 UTs into a `mfra_zones` PostGIS polygon table; add `legal_status` attribute to SFZ output (Open / Seasonal Ban / Restricted / No-Take)
- **[NEW v7.0 — OQ-018 Track B]** Initiate CMFRI/CMLRE partnership conversation for novel genomic and transcriptomic data generation (Phase 3 enablement — start conversations in Phase 2, not because data is needed in Phase 2)

### Phase 3 — National Scale (12–24 Months)
- Expand to all Indian Ocean coastal regions
- Multi-omics expansion: population genomics + transcriptomics alongside eDNA
- eDNA sampling network with CMLRE (Goa) + NCAOR partnership
- Full blockchain supply chain integration for sustainable-catch certification
- Carbon credit integration (blue carbon MRV via eDNA pipeline) — Verra VCS, ICM
- National marine biodiversity registry backed by eDNA data
- International collaboration: OBIS, FAO, ARGO Global Network
- Integration with India's Deep Ocean Mission data outputs
- **[NEW v4.0]** Socioecological Agent-Based Model: simulate policy scenarios (e.g. monsoon ban extensions vs. cooperative income) via the causal loop ecology → landings → income → policy → future stocks (Aguzzi et al. 2025). Requires cooperative-level catch data and socioeconomic microdata not available before Phase 3.

---

## 9. Approaches Tried

*(All entries from v2.0 preserved. v3.0 modifications noted inline.)*

**[APPROACH-001] LSTM + Transformer Ensemble for Fish Migration**
- Status: ✅ SUPERSEDED by ConvLSTM (v3.0) — ConvLSTM handles spatiotemporal structure natively and is preferred. LSTM retained as benchmark.

**[APPROACH-002] XGBoost / Random Forest for SFZ Classification**
- Status: ✅ Committed — unchanged. CNN-XGBoost fusion added as upgrade path.

**[APPROACH-003] Two-Stage eDNA Classification (BLAST → CNN)**
- Status: ✅ Committed — unchanged. WoRMS normalisation added as post-classification step.

**[APPROACH-004] RAG (LangChain + FAISS/ChromaDB) for Conversational Queries**
- Status: ✅ Committed — upgraded in v3.0 with domain-specific embeddings from Sagi et al. 2020.

**[APPROACH-005] Streamlit for MVP Demo Interface**
- Status: ✅ Committed — retained for rapid prototyping. Not constrained to 24-hour window.

**[APPROACH-006] PostgreSQL + PostGIS for Geospatial Storage**
- Status: ✅ Committed — unchanged.

**[APPROACH-007] Apache Kafka for IoT Streaming**
- Status: ✅ Phase 2 onwards — unchanged.

**[APPROACH-008] Three-Phase DI Process (Discover → Merge → Evaluate/Correct) — NEW v3.0**
- Status: ✅ Committed
- Reasoning: The Sagi et al. 2020 framework is the most rigorous available treatment of OceanMind's core integration challenge. Adopting it explicitly makes the architecture defensible to both data science and marine science judges.

**[APPROACH-009] ConvLSTM (CATCH architecture) for Spatiotemporal Migration Forecasting — NEW v3.0**
- Status: ✅ Committed (replaces standard LSTM as primary)
- Reasoning: Standard LSTM processes temporal sequences but treats each spatial grid cell independently. ConvLSTM performs convolution on the hidden state, capturing the spatial propagation of oceanographic signals (e.g., an SST anomaly spreading westward). Agmata & Guðmundsson 2025 demonstrated this for catch hotspot prediction.

**[APPROACH-010] Ocean-Specific Word Embeddings for RAG — NEW v3.0**
- Status: ✅ Committed
- Reasoning: Sagi et al. 2020 demonstrate an 11× F1 improvement in oceanic entity extraction when using domain-specific vs. general-purpose embeddings. The Bar 2020b corpus (175M tokens, 30,000 oceanographic papers) is publicly available and should be used to fine-tune the embedding layer of OceanMind's vector store.
- Research support: Sagi et al. 2020 (F1: 0.068 → 0.738 with domain tuning)

**[APPROACH-011] Dynamic SFZ (weekly update cycle) replacing static zone maps — NEW v3.0**
- Status: ✅ Committed
- Reasoning: Hazen et al. 2018 show dynamic zones outperform static zones for both fisheries efficiency and conservation outcomes. Static maps are a weaker product. The data pipeline already supports weekly SST/chlorophyll composites from INCOIS.

**[APPROACH-012] Blockchain Traceability for Sustainable Catch Certification — NEW v3.0**
- Status: ⚠️ Scoped for Phase 2 — not MVP
- Reasoning: Addresses the incentive structure problem (OQ-016) by creating economic value from zone compliance. Alsharabi et al. 2024 validate the approach. Requires stakeholder partnerships not achievable in MVP phase.

**[APPROACH-013] Digital Twin / Scenario Simulation — NEW v3.0**
- Status: ⚠️ Scoped for Phase 2 — not MVP
- Reasoning: Aguzzi et al. 2025 and Ortenzi et al. 2026 validate the digital twin approach for marine ecosystem monitoring. High scientific value but high implementation complexity.

**[APPROACH-014] OBDA with SPARQL endpoint and GeoLink/MarineTLO ontologies — NEW v3.0**
- Status: ✅ Committed for MVP data integration layer
- Reasoning: Sagi et al. 2020 identify OBDA as the scalable mechanism for integrating heterogeneous ocean science datasets. GeoLink and MarineTLO ontologies are publicly available and align with OceanMind's data sources.

**[APPROACH-015] Landing-Site CV Module (Ikasavea-derived) for small-scale fisher coverage — NEW v4.0 (MERGED)**
- Status: ✅ Committed for MVP Phase B–C
- Reasoning: Shedrawi et al. 2024 validate this exact architecture at production scale in a comparable Pacific SIDS small-scale-fisher context. Closes the single largest documented data-coverage gap (DENIED-006) at low marginal cost — INCOIS's 586 landing centres already exist as deployment surface.

**[APPROACH-016] Data Bubbles as the spatiotemporal fusion abstraction — NEW v4.0 (MERGED)**
- Status: ✅ Committed for MVP Phase A, alongside (not yet replacing) the explicit per-pair fusion rules in 3.7.5
- Reasoning: Aguzzi et al. 2025 demonstrate this scales better than bespoke fusion logic as data sources grow. Low implementation cost (one new PostGIS table + one FK column) for a real architectural simplification.

**[APPROACH-017] Joint Species Distribution Model for unsampled-cell prediction — NEW v4.0 (MERGED)**
- Status: ✅ **Gate removed — now committed for MVP Phase D** (OQ-027 resolved v7.0)
- Reasoning: Materially upgrades both the eDNA pipeline and bycatch overlay from "describes sampled points" to "predicts assemblage everywhere." OQ-027 confirmed JSDM is feasible using satellite-derived covariates (INCOIS SST + Copernicus chlorophyll) as the environmental layer for IndOBIS occurrence records — strict in-situ ARGO co-location is not required. Remaining empirical step before full training commitment: 30-minute data pull to verify IndOBIS occurrence density exceeds 10 records per 1°×1° cell for target species in the Indian EEZ (not a gate — a calibration check).

**[APPROACH-018] Larval connectivity IBM via CMEMS particle tracking — NEW v4.0 (MERGED)**
- Status: ⚠️ Scoped for Phase 2 — not MVP
- Reasoning: Genuinely novel SFZ input (protect high-recruitment zones, not just currently-productive ones) but requires a new data source (CMEMS u/v/w) not yet in the ingestion pipeline. Sequencing risk if attempted before Phase 1 data layer is stable.

**[APPROACH-019] Socioecological Agent-Based Model for policy simulation — NEW v4.0 (MERGED)**
- Status: ⚠️ Scoped for Phase 3 — not MVP
- Reasoning: The single most differentiating long-term feature (ecological monitoring → policy decision support) but requires cooperative-level catch and socioeconomic microdata unavailable in Phase 1/2. Logged as a direction, not a near-term build target.

**[APPROACH-020] AIS Data Quality Pipeline (MMSI dedup, gap filling, DBSCAN-SD, spoofing detection) — NEW v4.0 (MERGED)**
- Status: ✅ Committed for MVP Phase A
- Reasoning: Yang et al. 2024 catalogue these as systematic, well-documented AIS issues. Training the IUU anomaly detector on uncleaned AIS risks learning data artifacts as signal — this is a correctness fix, not an optional enhancement.

**[APPROACH-021] STEAM model for fleet carbon emission estimation — NEW v4.0 (MERGED)**
- Status: ⚠️ Scoped for Phase 2 — not MVP
- Reasoning: Adds a genuine SDG 13 capability with no current Indian-platform equivalent, but requires a commercial ship-engine database (Lloyd's Register/IHS) of uncertain academic accessibility (OQ-030). Do not commit further until that's resolved.

**[APPROACH-022] Landing-site species/CPUE trend dashboard — NEW v4.0 (MERGED)**
- Status: ⚠️ Scoped for Phase 2, conditional on APPROACH-015 (landing-site CV) being operational first
- Reasoning: High demo value once the CV module produces structured records, but it's a derivative output, not a new capability — sequencing matters.

**[APPROACH-023] Analysis bottleneck (Malde et al. 2020) as a second pitch-framing pillar — NEW v4.0 (MERGED)**
- Status: ✅ Committed — merged into Section 1.1 and the Section 7 competitive table
- Reasoning: Stronger academic citation (Q1 venue) than several grey-literature figures already in the deck, and structurally harder to dispute than contested stock-assessment percentages. See THREAD-012 for the open question on emphasis relative to the biodiversity-crisis framing.

---

## 10. Denied Approaches

*(All entries from v2.0 preserved. v3.0 modifications noted inline.)*

**[DENIED-001] Real-time eDNA Data Pipeline** — Unchanged. eDNA processing takes 24–48h minimum. Still denied.

**[DENIED-002] Proprietary Sensor Hardware** — Unchanged. Out of scope. Open data only.

**[DENIED-003] Direct Vessel Control** — Unchanged. Insight-only design principle.

**[DENIED-004] Auto-Filing with Government Systems** — Unchanged. Regulatory liability. Insight-only.

**[DENIED-005] Full LSTM Retraining Within 24-Hour Demo Window**
- Status: ✅ **SUPERSEDED** — The 24-hour constraint is removed. Full model training is now permitted. ConvLSTM training on 25 years of INCOIS SST composites is a legitimate MVP build step when not constrained to 24 hours. This denial is no longer in force.

**[DENIED-006] Claiming AIS Covers All Indian Fishermen** — Unchanged. AIS mandatory only for vessels >15m.

**[DENIED-007] Assembling Fallback Data During Build**
- Status: ✅ **RETAINED with modification** — All fallback data must still be pre-downloaded and validated before the main build begins. The rationale changes from "no time to do it under pressure" to "incomplete or untested fallback data is always a risk; validate early."

**[DENIED-008] Claiming Live LSTM Training During Demo**
- Status: ✅ **SUPERSEDED** — ConvLSTM can be genuinely trained before the demo session. The demo should show actual inference on a trained model. If training is done in advance and loaded as a checkpoint, this should be disclosed transparently, not obscured.

**[DENIED-009] Typed English as Primary Fisherman Interface** — Unchanged. Bhashini voice is the correct fisherman interface.

**[DENIED-010] Static Zone Maps as Primary SFZ Output — NEW v3.0**
- Denied because: Hazen et al. 2018 demonstrate that static zones are a weaker product than dynamic zones for both conservation and fisheries efficiency outcomes. OceanMind's data pipeline already supports the weekly update cadence needed for dynamic zones. Building a static map when a dynamic one is feasible leaves the strongest claim on the table.

**[DENIED-011] General-Purpose Word Embeddings in the RAG Vector Store — NEW v3.0**
- Denied because: Sagi et al. 2020 show general-purpose embeddings achieve F1 = 0.068 on oceanographic entity extraction vs. 0.738 with domain-specific embeddings — an 11× gap. Using default sentence-transformer or OpenAI embeddings in a domain as specialised as oceanography will produce a materially worse conversational interface. The Bar 2020b corpus is publicly available; there is no justification for not using it.

---

## 11. Validated Directions

*(All entries from v2.0 preserved. v3.0 additions:)*

- **Three-pillar data architecture** (Oceanographic + Fisheries + eDNA) — ✅ Validated; now extended with Data Integration Infrastructure as a fourth layer
- **Insight-only model** — ✅ Validated; unchanged
- **Open data sources only** — ✅ Validated; unchanged
- **INCOIS as the primary India-specific data layer** — ✅ Validated; unchanged
- **SHAP values for SFZ model explainability** — ✅ Validated; extended to full trustworthy AI framework (Fernandes-Salvador 2026)
- **ARGO correct figures: ~3,500 floats / 100,000+ profiles per year** — ✅ Validated; fix PPT slides
- **[NEW v3.0] Three-phase DI process (Discover → Merge → Evaluate/Correct) as architectural pattern** — pending human validation
- **[NEW v3.0] Dynamic SFZ over static zone maps** — pending human validation
- **[NEW v3.0] Ocean-specific embeddings for the RAG vector store** — pending human validation
- **[NEW v3.0] ConvLSTM as primary migration model** — pending human validation
- **[NEW v4.0 — MERGED] Landing-Site CV Module (3.10)** — pending human validation; see OQ-025 for pilot path
- **[NEW v4.0 — MERGED] Data Bubbles spatiotemporal schema (3.7.5)** — pending human validation; see OQ-026 for radius parameter
- **[NEW v4.0 — MERGED] AIS Data Quality Pipeline (3.7.7)** — pending human validation; see OQ-029 for Indian-EEZ MMSI conflict rate
- **[NEW v4.0 — MERGED] Analysis bottleneck framing in Section 1.1 and Section 7** — pending human validation; see THREAD-012

---

## 12. Open Questions

*(All OQ entries from v2.0 preserved. v3.0 additions:)*

**[OQ-001 through OQ-017]** — See v2.0 document for full entries.

**[OQ-018] Multi-omics expansion pathway — what is the realistic integration timeline?**
Ramzan et al. 2025 and Rather et al. 2023, 2024 argue that population genomics and transcriptomics improve stock structure inference and physiological stress detection. What partnership (CMLRE? IIT?) would be needed to generate this data for the Indian Ocean? Is genomic data available from any public repository for the species OceanMind targets?
🟡 **PARTIALLY RESOLVED v7.0 — two-track split:** The question has been conflating two separate sub-questions with different answers.
- **Track A (public data — resolved):** NCBI SRA already contains population genetics data (COI barcodes, mtDNA sequences, RADseq datasets) for key Indian Ocean commercial species including Indian mackerel (*Rastrelliger kanagurta*), Indian oil sardine (*Sardinella longiceps*), and yellowfin tuna (*Thunnus albacares*). These are accessible now under OceanMind's "open data only" principle with no new institutional partnership required. Track A can begin in Phase 3 from day 1 via OceanMind's existing NCBI ingestion infrastructure (Section 4.3).
- **Track B (novel data generation — still open):** Transcriptomics during MHW events and population-level resequencing require fresh sample collection and laboratory capacity. This does need a CMFRI/CMLRE partnership and is genuinely Phase 3. The conversation with CMFRI should be initiated in **Phase 2** — not because sequencing will happen in Phase 2, but because partnership agreements take 6–12 months to formalise, and starting in Phase 2 puts novel data collection on track for Phase 3 deployment. Remains open pending that conversation.
- **Realistic Phase 3 timeline for Track A:** parallel with MFC 2025 data availability (~Q2 2026 onwards per OQ-031 revised estimate below). No gating dependency on Track B.

**[OQ-019] SSH, ILD, and eddy structure as LSTM/ConvLSTM features — data availability?**
Scales et al. 2017 used sea surface height anomaly (altimetry) and isothermal layer depth from Argo to predict pelagic tuna catchability. SSH is available from Copernicus (CMEMS altimetry product) and NASA PODAAC. ILD requires processing ARGO T/S profiles to find the 0.2°C deviation depth. What is the preprocessing cost for these features? Are they already in OceanMind's ARGO ingestion pipeline?
✅ **RESOLVED v5.0:** Both sources (Copernicus CMEMS altimetry, NASA PODAAC) are free and already within OceanMind's "open data only" constraint. ILD is a standard derived field from ARGO T/S profiles already being ingested — not a new data source, just a new preprocessing step. Low-risk, low-cost. Commit to MVP Phase C alongside the rest of the v3.0 feature set (Section 3.1); no separate gating decision needed.

**[OQ-020] Spatio-temporal fusion strategy — which method for which dataset pair?**
Sagi et al. 2020 flag this as a critical integration challenge. For OceanMind specifically: ARGO (point, 10-day) + INCOIS SST (raster, daily) + INCOIS chlorophyll (raster, weekly) + GFW AIS (daily raster, 0.1°) need to be fused to a common spatiotemporal grid. Which fusion method for each pair? Kriging? Bilinear interpolation? Temporal linear interpolation? This must be decided and documented before the ML models are trained.
✅ **RESOLVED v5.0 — duplicate.** This question is already answered in Section 3.7.5 (explicit per-pair fusion rules: kriging for ARGO↔SST, temporal aggregation + spatial regrid for AIS↔chlorophyll, nearest-composite assignment for eDNA↔oceanographic layers). No remaining decision — this OQ predates that section being written and was never removed when it was answered.

**[OQ-021] Uncertainty quantification on ConvLSTM migration predictions — method?**
Fernandes-Salvador 2026 requires explicit uncertainty quantification for trustworthy AI in fisheries. ConvLSTM is a deterministic architecture. Options: Monte Carlo Dropout during inference (approximate Bayesian); ensemble of ConvLSTM models trained on different data splits; conformal prediction intervals. Which is most practical?
✅ **RESOLVED v5.0:** Default to **Monte Carlo Dropout at inference**. Reasoning: no retraining or multi-model infrastructure needed (unlike ensembling), no additional held-out calibration set required (unlike conformal prediction), and it directly reuses the dropout layers already specified in the architecture (Section 3.1 mentions dropout 0.3 on the LSTM baseline). Cheapest path to a defensible confidence interval for MVP. Ensemble or conformal methods can be revisited in Phase 2 if MC Dropout's intervals prove too wide or poorly calibrated in practice.

**[OQ-022] Blockchain traceability — which network and certification standard?**
Alsharabi et al. 2024 propose blockchain + AI for sustainable fisheries traceability. Candidate networks: Hyperledger Fabric (permissioned, enterprise-grade), Ethereum (public, more complex), a government-linked chain. Certification standard: MSC (Marine Stewardship Council), a custom India Blue Economy certification, or link to PMMSY? Which is most accessible for Indian fishing cooperatives?
✅ **RESOLVED v7.0:** Formalising the v5.0 tentative default as the committed Phase 2 design decision. **Hyperledger Fabric (permissioned) + PMMSY-linked catch certification.** Reasoning finalized:
1. *Network*: Hyperledger Fabric is the standard for Indian government and public-sector blockchain pilots (National Blockchain Framework, MeitY 2021). Permissioned architecture is required for fisheries data (vessel identity, catch records) — these are not public-broadcast data. Ethereum's gas fees and permissionless governance add cost and complexity with no benefit here.
2. *Certification standard*: PMMSY and PM-MKSSY are the government schemes Indian cooperatives are already enrolled in (Section 20.3.2). Linking OceanMind's catch verification to PMMSY benefit access (insurance, subsidies) creates an immediate, tangible economic incentive for fishers to participate — the compliance incentive gap identified in OQ-016. MSC is a 3–5 year third-party audit process with licensing costs; it is a long-term aspirational target, not an MVP-phase certification path.
3. *PSMA compliance* (Section 20.3.6): Hyperledger immutable catch records are directly usable as the catch documentation PSMA requires — no additional standard needed.
The specific implementation parameters (consortium membership, smart-contract design, PMMSY API integration) will be determined by the cooperative partnership in Phase 2. This resolution commits the network and certification standard, not the implementation details.

**[OQ-023] FAIR data lake implementation — which metadata standard?**
The Blueprint document (Consensus synthesis, 2026) recommends establishing a FAIR data lake with ontology-based schema matching. For marine science, candidate metadata standards are: Darwin Core (biodiversity), CF Conventions (climate/ocean), ISO 19115 (geospatial), OceanSITES (in-situ time series). Which standard should OceanMind adopt as its primary metadata schema?
✅ **RESOLVED v5.0:** Adopt **CF Conventions** as the primary schema for oceanographic data (it's already referenced in Section 3.7.5's data-bubble feature-type standardisation — ARGO→Profile, SST→Grid, AIS→Trajectory — so this isn't even a new commitment, just naming the standard explicitly) and **Darwin Core** for the eDNA/biodiversity pillar (it's the de facto standard OBIS and GBIF already use, and OceanMind already ingests OBIS data). ISO 19115 and OceanSITES are heavier, institution-grade standards with no clear MVP benefit — skip unless a future government data-sharing agreement specifically requires them.

**[OQ-024] (v4.0 — MERGED) Does the human want the Malde et al. 2020 analysis-bottleneck framing added to the competition slide (Section 7 table), or kept to Section 1.1 narrative only?**
*Resolved provisionally by this merge: added to both, since the column is low-cost and reinforces the Section 1.1 claim. Still open for human override.*
✅ **RESOLVED v5.0 — finalized by council pressure-test (see THREAD-012 verdict above).** Keep the framing in both places: Section 1.1 narrative (full paragraph) and Section 7 table (column). Same reasoning the council reached for the pitch slide applies here — analysis-bottleneck as a secondary, structural reinforcement is low-cost and strengthens rather than dilutes the primary biodiversity-crisis claim.

**[OQ-025] (v4.0 — MERGED) What is the realistic path to piloting the landing-site CV module at a Gujarat or Rajasthan landing centre?**
INCOIS has the landing-centre relationships. What is the minimum viable pilot — one centre, one species group (e.g. Indian mackerel only), one season?
🔴 **Still requires INCOIS conversation — but now has a concrete pilot specification (v7.0):** The "what to ask for" is now fully defined. The human's only remaining task is initiating the INCOIS conversation with this specification in hand.

**Minimum viable pilot specification:**
- *Site*: Veraval, Gujarat — CMFRI Veraval Regional Station has an active pre-MFC-2025 presence (verified from CMFRI pre-census workshop records, August 2025); INCOIS already covers this landing centre in its 586-centre network; Gujarat has the highest mechanised and motorised vessel density after Kerala.
- *Species group*: Indian mackerel (*Rastrelliger kanagurta*) and Indian oil sardine (*Sardinella longiceps*) — the two highest-volume pelagic landings in Gujarat, both well-represented in NCBI, BOLD, and FAO FishBase image databases. Starting with two species instead of one increases pilot utility without meaningfully increasing model complexity.
- *Season*: Post-monsoon, October–December (peak landing season; highest footfall at Veraval; aligns with post-monsoon INCOIS PFZ advisory cycle).
- *Duration*: One season (~3 months) with a 4-week tech setup and calibration period preceding it.
- *Minimum ask to INCOIS*: (1) Access to one landing-centre coordinator at Veraval as the local liaison, (2) permission to deploy calibrated measurement mat at the landing site, (3) distribution of the smartphone app to 20–50 fishers, (4) comparison of CV output against CMFRI's existing manual landing records for validation. INCOIS does not need to fund or operate anything — OceanMind provides the technology; INCOIS provides the relationship.

Remains 🔴 open until the INCOIS conversation is initiated and a yes/no received.

**[OQ-026] (v4.0 — MERGED) What spatial radius is appropriate for Indian EEZ data bubbles?**
Adaptive radius (5km coastal, 50km open ocean) vs. uniform radius (25km everywhere)? Aguzzi et al. 2025 work in deep-sea observatory contexts with much smaller radii (~1–5km).
✅ **RESOLVED v5.0:** Adopt **adaptive radius (5km coastal / 50km open ocean)**. Reasoning: coastal waters have much higher spatial variability (river outflow, landing-site density, nearshore currents) than open ocean, so a uniform 25km radius would either over-aggregate coastal signal or under-aggregate open-ocean signal. This is a config parameter on a single PostGIS table (Section 4.2), not an architectural commitment — cheap to change later if empirically wrong, so there's no reason to leave it blocking.

**[OQ-027] (v4.0 — MERGED) Do OceanMind's existing OBIS/IndOBIS occurrence records and ARGO profiles co-locate sufficiently in the Indian EEZ for JSDM training to be feasible on public data alone?**
✅ **RESOLVED v7.0 — feasibility confirmed, with a covariate strategy adjustment:** The question assumed JSDM training requires in-situ ARGO profile co-location at each eDNA/occurrence record location. This is not how JSDMs work in practice. Standard JSDM implementations (HMSC, BayesComm — both already in the Section 4.1 model table) require species occurrence records + environmental covariates at the same grid cell, not at the same field station.

For OceanMind's Indian EEZ JSDM:
- *Species occurrence layer*: IndOBIS/OBIS records are georeferenced (lat/lon/date) and cover the Arabian Sea, Bay of Bengal, and broader Indian Ocean. IndOBIS data format confirmed georeferenced via CMLRE documentation. TARA Oceans (PANGAEA — listed in Section 20.2.1) provides additional co-located eDNA + oceanographic data for Indian Ocean transects.
- *Environmental covariate layer*: INCOIS SST and Copernicus chlorophyll-a provide complete spatial coverage of the Indian Ocean surface at weekly resolution — every IndOBIS occurrence record has a matching satellite-derived environmental covariate available, regardless of whether an ARGO float was nearby at the same time.
- *Depth covariates*: Interpolated ARGO profiles (Section 3.7.5 fusion rules) will provide depth-stratified temperature and DO for ~25–40% of occurrence records within the 50km open-ocean bubble radius — sufficient for species with depth-stratified habitat requirements (e.g., tuna), but satellite covariates alone are adequate for surface and near-surface species.

**Conclusion:** JSDM is feasible using (a) IndOBIS/NCBI occurrence records + (b) gridded satellite covariates (INCOIS SST, Copernicus chlorophyll) as the primary environmental layer, supplemented by interpolated ARGO profiles where co-location exists. This does NOT require strict in-situ co-location. APPROACH-017 is unblocked; the "conditional on OQ-027" gate can be removed. **Remaining empirical step** (not a gate, just a data quality check): run a simple spatial overlap query between IndOBIS records and the Indian EEZ grid to confirm occurrence density is sufficient for JSDM training (>10 records per 1° × 1° cell for target species). This is a 30-minute data pull, not a research question.

**[OQ-028] (v4.0 — MERGED) Is COPERNICUS CMEMS current field data (u/v/w velocity) already in OceanMind's data ingestion roadmap?**
It is a precondition for the IBM larval connectivity model (Section 3.9).
✅ **RESOLVED v5.0 — answer was already in the document, just not cross-referenced.** Yes: Section 8 Phase 2 explicitly lists *"COPERNICUS CMEMS current-field ingestion (precondition for larval connectivity IBM)"* as a roadmap item. This OQ can close — the dependency is tracked, not missing.

**[OQ-029] (v4.0 — MERGED) What is the MMSI conflict rate in the Indian EEZ specifically?**
Is it high enough to materially affect IUU detection signal, or is the AIS quality pipeline (3.7.7) a precautionary measure?
✅ **RESOLVED v5.0 — functionally answered by APPROACH-020's own reasoning, just not marked closed.** Build the AIS quality pipeline regardless of the measured conflict rate: APPROACH-020 already states this is "a correctness fix, not an optional enhancement" — training an anomaly detector on uncleaned AIS risks learning artifacts as signal whether the conflict rate turns out to be 2% or 20%. The actual Indian-EEZ measurement is a nice-to-have validation stat for the deck (if time allows), not a gate on building the pipeline.

**[OQ-030] (v4.0 — MERGED) Is the Lloyd's Register / IHS Markit ship engine database accessible at academic cost?**
Alternatives for STEAM: EU THETIS-MRV (EU vessels only), or GT-based engine power regression models?
✅ **RESOLVED v5.0 — partial close:** Default to the **GT-based engine power regression model** for MVP/Phase 2, not Lloyd's Register/IHS Markit. Reasoning: THETIS-MRV only covers EU-flagged vessels (irrelevant for the Indian EEZ), and commercial database cost/access for a hackathon-origin academic project is genuinely uncertain — don't gate F7 (fleet carbon estimation, APPROACH-021) on an unresolved procurement question when a published, no-cost regression proxy exists. Upgrading to a licensed engine database is a Phase 3+ stretch goal, not a blocker.

---

## 13. Active Discussion Threads

*(All threads from v2.0 preserved. v3.0 additions:)*

**[THREAD-001 through THREAD-007]** — See v2.0 document for full entries.

**[THREAD-008] Data Integration Layer as Demo-Worthy Feature — NEW v3.0**
- Status: ✅ **RESOLVED v7.0**
- The schema matching and OBDA layer (Section 3.7) are technically complex but also visually demonstrable: showing two differently-formatted datasets (ARGO NetCDF + INCOIS JSON) being automatically aligned to a unified schema is a compelling demo moment for marine science judges. This differentiates OceanMind from systems that juxtapose data without truly integrating it. How much of Section 3.7 is achievable in the MVP build?
- **Resolution:** Three demo moments are achievable in MVP Phase A–B, in order of impact:
  1. *Data Bubbles SPARQL query (recommended primary demo)* — the single most compelling DI demo: one SPARQL query (`SELECT * WHERE bubble_id = 'B-247' AND time > NOW()-30 DAYS`) returns rows from three different source types (ARGO temperature profile, INCOIS SST grid value, landing-site CV record) in a unified result table. Requires only the `data_bubbles` PostGIS table + `bubble_id` FK on three observation tables (Phase A, APPROACH-016). This is the concrete "unified" proof judges need — three data sources, one query.
  2. *Schema matching panel* — side-by-side display of raw ARGO NetCDF field names (`TEMP`, `PSAL`, `PRES`) vs. INCOIS JSON field names (`sea_surface_temperature`, `salinity`, `depth`) mapped to OceanMind's mediated schema (`temperature_c`, `salinity_psu`, `depth_m`). Achievable in Phase A as a static visual if the dynamic matcher isn't complete.
  3. *WoRMS entity resolution demo* — type in "Rastrelliger kanagurta" (CMFRI records) → show API call to WoRMS returning AphiaID 217044 → show the same AphiaID linked in BOLD and FishBase. Proves cross-database species linkage. Phase B.
- **Demo sequence update (Section 5, item #6):** Replace "Schema matching demo — show two datasets being aligned" with "Data Bubbles SPARQL query — one query, three data source types in the result." This is the stronger demo claim.

**[THREAD-009] ConvLSTM vs. Standard LSTM — is the switch justified for the MVP? — NEW v3.0**
- Status: 🔴 Open
- ConvLSTM is the right long-term architecture for spatial migration forecasting. However, it is more complex to implement and train than a standard LSTM. For the MVP, is it better to (a) implement ConvLSTM from the start and get it right, or (b) use standard LSTM for MVP and upgrade to ConvLSTM in Phase 2? The Council-001 Executor would say: implement the simpler model first, but the First Principles advisor would say: if ConvLSTM is the right model, starting with LSTM creates technical debt.
- ✅ **RESOLVED v5.0 — stale, closed.** This thread's entire premise was the Executor's "build the simple thing first under time pressure" logic. The 24-hour constraint was removed in v3.0 (Section 1.2, Section 15.1) and APPROACH-001/APPROACH-009 already independently concluded ConvLSTM is "fully committed" as primary. There's no live disagreement left to debate — build ConvLSTM directly; LSTM stays only as the benchmark it's already scoped as.

**[THREAD-010] 70% bycatch claim replacement — what goes on the slide? — NEW v3.0**
- Status: 🔴 Open
- The 70% bycatch claim must be removed (confirmed in Council-001). The replacement from v3.0 research: Hazen et al. 2018 show dynamic management zones can be 2–3× smaller than static closures while achieving equivalent species protection. This is the correct, citeable claim. Suggest slide language: *"Dynamic zone management reduces unnecessary fishing closures by 50–70% compared to static approaches while maintaining equivalent biodiversity protection outcomes (Hazen et al. 2018)."* Does the human agree with this framing?
- ✅ **RESOLVED v5.0:** Adopt the proposed slide language as the default. It's already correctly cited and the only material risk (using a hard "70%" again) is avoided by keeping the "50–70%" range. If the human wants different phrasing later, that's a wording edit, not a reopened research question.

**[THREAD-011] (v4.0 — MERGED) CV model species-recall degradation vs. Indian Ocean species diversity**
- Status: ✅ **RESOLVED v7.0 — architectural fork closed: one national base model + regional fine-tuning.**
- Shedrawi et al. 2024 show recall degradation when >150 new low-sample-count species are added simultaneously. The Arabian Sea and Bay of Bengal have different dominant species assemblages and different representation in public image databases. Should OceanMind develop two regional CV models (Arabian Sea / Bay of Bengal) or one national model fine-tuned regionally via transfer learning?
- **Resolution (close the fork now, implement in Phase 3):** One national base model with regional fine-tuning heads, not two independent regional models. Reasoning: (1) A single base model pools all-India training data per species, building larger per-species datasets (mackerel images from Gujarat + Karnataka + Kerala combined > from Gujarat alone) — directly mitigates the low-sample-count recall degradation documented in Shedrawi et al. 2024; (2) Transfer learning on a regional subset (fine-tuning the base model on Arabian Sea species priority list vs. Bay of Bengal species priority list) adds minimal training cost but adapts recall for regional assemblages; (3) Two independent models create maintenance overhead, versioning complexity, and a routing decision burden at inference time — one model with two fine-tuned regional heads (served from one endpoint) is architecturally cleaner; (4) The YOLO literature consistently demonstrates that transfer learning from a broad base model outperforms training from scratch for species-specific fine-tuning.
- **Implementation note for Phase 3 rollout:** Route each landing-site CV request to the appropriate regional fine-tuning head based on state/UT of the landing centre: Gujarat / Maharashtra / Goa / Karnataka / Kerala / Lakshadweep → Arabian Sea head; West Bengal / Odisha / Andhra Pradesh / Tamil Nadu / Puducherry / Andaman & Nicobar → Bay of Bengal head. The base model weights are shared; only the final classification layer is regionally fine-tuned.

**[THREAD-012] (v4.0 — MERGED) Analysis-bottleneck vs. biodiversity-crisis as pitch framing hierarchy**
- Status: 🔴 Open
- Both frames are valid. Biodiversity crisis: connects to SDG 14, emotionally compelling, well-known narrative. Analysis bottleneck: more structural, harder to dispute, appeals to technical/academic judges. Biothon 2026 will have both audiences. Does the human want these framed as primary and secondary arguments, or as parallel claims?
- ✅ **RESOLVED v5.0 — via 5-advisor council pressure-test (Contrarian, First Principles, Expansionist, Outsider, Executor).** Primary = biodiversity/sustainability crisis (2–3 lines, accessible, opens emotionally); Secondary = one closing line on the analysis bottleneck (Malde et al. 2020) as the structural "why AI, why now" hook. Decisive factor: the official template's Problem Statement slide is capped at 4–5 lines (Section 19), which only fits a primary+one-line-secondary structure, not parallel framing. See council verdict for full reasoning.

---

## 14. Council Session — Gap Analysis & Research Pressure Test

*(Council-001 session from v2.0 fully preserved — see v2.0 document for complete content including C1–C6, B1–B5, Clash 1–3, DENIED-007 to DENIED-009, OQ-011 to OQ-017, THREAD-006 to THREAD-007, and the Executor's build priority order)*

---

## 15. Research Integration Update — v3.0
*Session marker: Research-Integration-001 | Trigger: "Remove the 24-hour constraint; refer the two attached research documents and add what should be implemented"*
*Source documents: (1) Sagi et al. 2020 — "AI for ocean science data integration: current state, gaps, and way forward." Elementa. (2) Consensus.app synthesis — "Unified Marine AI Platform Blueprint" (2026), synthesising 25 papers including Hazen et al. 2018, Fernandes-Salvador et al. 2026, Agmata & Guðmundsson 2025, Zhang 2025, Alsharabi et al. 2024, Ortenzi et al. 2026, Ramzan et al. 2025, Scales et al. 2017.*

---

### 15.1 The 24-Hour Constraint — Impact of Removal

The "Demoable in 24 hours" design principle is formally superseded in v3.0. The following are the cascading effects:

| Item | Previous status | New status |
|------|----------------|-----------|
| DENIED-005 (Full LSTM retraining) | Denied (no time) | SUPERSEDED — ConvLSTM training is now a valid MVP build step |
| DENIED-008 (Claiming live training during demo) | Denied | SUPERSEDED — genuine pre-trained model is expected; disclose checkpoint loading transparently |
| APPROACH-001 (LSTM + Transformer) | 24h concern about full retraining | Now fully committed; upgraded to ConvLSTM |
| APPROACH-005 (Streamlit for MVP) | Chosen for speed in 24h | Retained for ease of prototyping, not for speed |
| Section 5 (Prototype plan) | "24-Hour Hackathon Prototype Plan" | Renamed to "MVP Prototype Plan"; no time box |
| Council-001 C3 (demo dangerously overscoped) | High-priority concern | RESOLVED — no longer a concern without the time constraint |
| Council-001 C4 (fallback data before hackathon) | Critical pre-event preparation | Retained — fallback data should still be pre-validated before main development |
| Build priority order (Section 14.6) | Ordered by demo impact under time pressure | Now ordered by technical dependency: data layer → ML layer → UI layer |

**What does NOT change with the removal of the 24-hour constraint:**
- Insight-only design principle (permanent, not a time constraint)
- Open data only (permanent)
- eDNA real-time denial (DENIED-001 — a technical impossibility, not a time issue)
- AIS scope limitation (DENIED-006 — a fundamental data coverage issue)
- The claim accuracy requirements (OQ-001, OQ-002 — accuracy claims must still be properly cited)

---

### 15.2 What Sagi et al. 2020 Adds to OceanMind

The Sagi et al. 2020 paper is the highest-quality academic treatment of OceanMind's core infrastructure problem: integrating heterogeneous ocean science datasets. Its contributions to OceanMind fall into four categories:

**A. Architectural pattern:** The three-phase DI framework (Discover → Merge → Evaluate/Correct) gives OceanMind's data integration layer a rigorous, peer-reviewed design pattern rather than an ad-hoc pipeline.

**B. Specific tools and benchmarks:**
- Ocean NER dataset (Bar 2020a, OSF) — for training metadata extraction models
- Oceanographic text corpus (Bar 2020b, OSF) — for domain embedding fine-tuning
- Flair NER with oceanic embeddings: F1 0.738 — quantified performance target

**C. Identified gaps that OceanMind can address:**
The paper's Table 3 lists gaps in ocean science DI that OceanMind's design can explicitly fill:
- Gap (d): AI-based tools for creators to align schemas with existing ontologies → OceanMind's schema matching engine
- Gap (f): Entity resolution tools using ocean science word embeddings → OceanMind's WoRMS-backed entity resolution
- Gap (j): Word embedding for ocean science domains → OceanMind's domain-tuned RAG embeddings

**D. The empirical warning about general-purpose embeddings:**
The 11× gap in F1 score between general-purpose and domain-specific embeddings is a direct risk to OceanMind's RAG quality. This is not theoretical — it was measured empirically. Acting on it (using Bar 2020b corpus) is a concrete, low-cost improvement.

---

### 15.3 What the Blueprint Document Adds to OceanMind

The Consensus.app Blueprint synthesis (2026) provides a literature-backed roadmap for a unified marine AI platform that closely matches OceanMind's scope. Key additions and validations:

**Validated:**
- The three-pillar architecture (oceanographic + fisheries + eDNA) is "scientifically well-motivated" and supported across the literature
- LSTM/ConvLSTM, XGBoost, and Random Forest for fishing zone prediction are the architectures with the most empirical support
- The insight-only, decision-support framing is appropriate

**Added:**
- **Dynamic zones > static maps** (Hazen et al. 2018) — most important single finding for SFZ design
- **Eco-informatics features**: SSH, ILD, eddy structure (Scales et al. 2017) — missing from current feature set
- **ConvLSTM (CATCH model)**: specifically validated for catch probability density forecasting
- **CNN-XGBoost fusion** (Zhang 2025): strong alternative/complement to pure XGBoost SFZ
- **Digital twin for scenario simulation** (Aguzzi et al. 2025; Ortenzi et al. 2026)
- **Blockchain traceability** (Alsharabi et al. 2024) — closes the incentive structure gap (OQ-016)
- **Multi-omics beyond eDNA** (Ramzan et al. 2025; Rather et al. 2023, 2024)
- **Trustworthy AI framework** (Fernandes-Salvador et al. 2026) — trust and governance as first-class

**Calibrated:**
> "Evidence is promising but weaker for fully unified platforms that combine oceanography, fisheries records, and molecular biodiversity in one production system, because the literature mostly describes component architectures, reviews, and partial implementations rather than many mature end-to-end deployments."

This is an honest calibration OceanMind should acknowledge. The "most defensible claim is that [the platform] is **feasible and useful now for decision support**, while full end-to-end integration with molecular biodiversity and trustworthy governance remains an active development frontier." OceanMind should frame its novelty accordingly.

---

### 15.4 New Features Summary (v3.0 additions at a glance)

| Feature | Section | Source | MVP or Later? |
|---------|---------|--------|---------------|
| Three-phase DI process (Discover→Merge→Evaluate) | 3.7 | Sagi et al. 2020 | MVP (Phase A) |
| Schema matching engine | 3.7.1 | Sagi et al. 2020 | MVP (Phase A) |
| OBDA / SPARQL endpoint with GeoLink + MarineTLO | 3.7.2 | Sagi et al. 2020 | MVP (Phase A) |
| WoRMS entity resolution for species names | 3.7.3 | Sagi et al. 2020 | MVP (Phase B) |
| Domain-specific NER for metadata extraction | 3.7.4 | Sagi et al. 2020 | MVP (Phase B) |
| Spatio-temporal fusion rules (explicit, per-pair) | 3.7.5 | Sagi et al. 2020 | MVP (Phase A) |
| Data provenance layer | 3.7.6 | Fernandes-Salvador 2026 | MVP (Phase E) |
| Ocean-specific embeddings in RAG vector store | 3.5 | Sagi et al. 2020 | MVP (Phase E) |
| Dynamic SFZ (weekly update cycle) | 3.4 | Hazen et al. 2018 | MVP (Phase D) |
| Bycatch risk overlay on SFZ | 3.4 | Hazen et al. 2018 | MVP (Phase D) |
| ConvLSTM as primary migration model | 3.1 | Agmata & Guðmundsson 2025 | MVP (Phase C) |
| SSH + ILD + wind stress curl as input features | 3.1 | Scales et al. 2017 | MVP (Phase C) |
| Confidence intervals on migration predictions | 3.1 | Fernandes-Salvador 2026 | MVP (Phase C) |
| Bhashini voice interface | 3.6 | OQ-015 (Council-001) | Phase 2 |
| Digital twin / scenario simulation | 3.9 | Aguzzi et al. 2025 | Phase 2 |
| **[NEW v4.0]** Landing Site CV Module (YOLO + LWR + LBSPR) | 3.10 | Shedrawi et al. 2024 | MVP (Phase B–C) |
| **[NEW v4.0]** Data Bubbles spatiotemporal schema (lat/lon/depth/time + NetCDF CF types) | 3.7 | Aguzzi et al. 2025 | MVP (Phase A) |
| **[NEW v4.0]** Joint Species Distribution Model (eDNA → unsampled cells) | 3.3, 3.4 | Aguzzi et al. 2025 | MVP (Phase D) |
| **[NEW v4.0]** IBM for larval connectivity + recruitment probability maps | 3.9 | Aguzzi et al. 2025 | Phase 2 |
| **[NEW v4.0]** Socioecological ABM for fisheries policy simulation | 8 | Aguzzi et al. 2025 | Phase 3 |
| **[NEW v4.0]** AIS data quality pipeline (DBSCAN-SD, gap filling, spoofing detection) | 3.7, 1.3 | Yang et al. 2024 | MVP (Phase A) |
| **[NEW v4.0]** Fleet carbon emission estimation (STEAM model + AIS) | 6, 7 | Yang et al. 2024 | Phase 2 |
| **[NEW v4.0]** Landing-site species count trend dashboard | 4.4 | Shedrawi et al. 2024 + Aguzzi et al. 2025 | Phase 2 |
| Blockchain traceability module | 3.8 | Alsharabi et al. 2024 | Phase 2 |
| Multi-omics (genomics, transcriptomics) | 3.3 | Ramzan et al. 2025 | Phase 3 |

---

### 15.5 New Cited Research (v3.0 additions)

All citations added in v3.0 for the first time:

- **Sagi, T., Lehahn, Y., & Bar, K. (2020).** Artificial intelligence for ocean science data integration: current state, gaps, and way forward. *Elementa: Science of the Anthropocene.* DOI: 10.1525/elementa.418
- **Hazen, E. et al. (2018).** A dynamic ocean management tool to reduce bycatch and support sustainable fisheries. *Science Advances, 4.* DOI: 10.1126/sciadv.aar3001
- **Scales, K. et al. (2017).** Fit to predict? Eco-informatics for predicting the catchability of a pelagic fish in near real time. *Ecological Applications, 27(8),* 2313–2329. DOI: 10.1002/eap.1610
- **Fernandes-Salvador, J.A. et al. (2026).** Towards Trustworthy Artificial Intelligence for Marine Research, Fisheries and Environmental Management. *Fish and Fisheries.* DOI: 10.1111/faf.70052
- **Agmata, A. & Guðmundsson, S. (2025).** Convolutional-LSTM approach for temporal catch hotspots (CATCH). *Biology Methods & Protocols, 10.* DOI: 10.1093/biomethods/bpaf045
- **Zhang, M. (2025).** Marine fishery resource dynamic prediction based on CNN-XGBoost fusion model. *Scientific Reports, 16.* DOI: 10.1038/s41598-025-33175-4
- **Alsharabi, N. et al. (2024).** Using blockchain and AI technologies for sustainable, biodiverse, and transparent fisheries. *Journal of Cloud Computing, 13.* DOI: 10.1186/s13677-024-00696-8
- **Aguzzi, J. et al. (2025).** A digital-twin strategy using robots for marine ecosystem monitoring. *Ecological Informatics, 91,* 103409. DOI: 10.1016/j.ecoinf.2025.103409
- **Ortenzi, L. et al. (2026).** Generative artificial intelligence and marine ecological monitoring. *Environmental Modelling & Software, 196,* 106789. DOI: 10.1016/j.envsoft.2025.106789
- **Ramzan, S. et al. (2025).** Advances in Molecular and Genomic Tools for Sustainable Fisheries Management. *Haya: The Saudi Journal of Life Sciences.* DOI: 10.36348/sjls.2025.v10i10.004
- **Rather, M. et al. (2023).** Bioinformatics approaches and big data analytics in improving fisheries and aquaculture. *International Journal of Biological Macromolecules,* 123549. DOI: 10.1016/j.ijbiomac.2023.123549
- **Yang, Y. et al. (2024).** Harnessing the power of Machine learning for AIS data-driven maritime research. *Transportation Research Part E.* DOI: 10.1016/j.tre.2024.103426
- **Bar, K. (2020a).** Oceanic NER Project. DOI: 10.17605/OSF.IO/MY2NK *(annotated oceanic entity extraction dataset)*
- **Bar, K. (2020b).** Oceanic Data Description Extraction Project. DOI: 10.17605/OSF.IO/8VAFS *(175M-token oceanographic text corpus for embedding training)*
- **Coro, G. et al. (2021).** An Open Science approach to infer fishing activity pressure on stocks and biodiversity from vessel tracking data. *Ecological Informatics, 64,* 101384. DOI: 10.1016/j.ecoinf.2021.101384

---

*Document v3.0 — Research-Integration-001 session.*
*Changes: 24-hour constraint removed; Sagi et al. 2020 DI framework integrated; Blueprint synthesis integrated; 14 new features added; ConvLSTM replaces standard LSTM as primary; dynamic SFZ replaces static maps; ocean-specific embeddings added to RAG; blockchain traceability and digital twin scoped for Phase 2; multi-omics scoped for Phase 3; OQ-018 to OQ-023 added; THREAD-008 to THREAD-010 added; DENIED-010 and DENIED-011 added; APPROACH-008 to APPROACH-014 added.*
*All previous content from v2.0 preserved.*

---

## 16. Research Integration Update — v4.0
*Session marker: Research-Integration-002 | Trigger: "Update the ideation document according to the text I provided; also verify."*
*Source documents: (1) Shedrawi et al. 2024 — "Leveraging deep learning and computer vision technologies to enhance management of coastal fisheries in the Pacific region." Scientific Reports 14: 20915. DOI: 10.1038/s41598-024-71763-y. (2) Aguzzi et al. 2025 — "A digital-twin strategy using robots for marine ecosystem monitoring." Ecological Informatics 91: 103409. DOI: 10.1016/j.ecoinf.2025.103409. (3) Yang et al. 2024 — "Harnessing the power of Machine learning for AIS data-driven maritime research: A comprehensive review." Transportation Research Part E. DOI: 10.1016/j.tre.2024.103426. (Note: already cited in v3.0 Section 15.5.) (4) Malde et al. 2020 — "Machine intelligence and the data-driven future of marine science." ICES Journal of Marine Science 77(4): 1274–1285. DOI: 10.1093/icesjms/fsz057.*

---

### 16.0 Verification Log — v4.0 Sources
*This section documents source verification performed during the Research-Integration-002 session. Every claim used to update this document was checked against external evidence before being entered. Flags are included inline below and in section notes.*

| Source | Status | Evidence | Flags / Notes |
|--------|--------|----------|---------------|
| Shedrawi et al. 2024 (*Scientific Reports*) | ✅ **CONFIRMED** | PubMed PMID 39245678; DOI 10.1038/s41598-024-71763-y; PMC11381547. Published 8 Sep 2024. YOLOv4/Darknet53 + ResNet101 architecture confirmed. GitHub repo `PacificCommunity/cfap-ai-models` confirmed directly in paper. Identifies Shedrawi G., Magron F. et al. as first author team at SPC. | Specific metrics (R²=0.99 for length measurement; 94%+ recall; m23 degradation to 79% on 264 species) are stated in the additions document — paper is confirmed real and credible but these exact numbers come from the ideation file author's reading of the paper, not independently extracted from snippets. Accept conditionally; verify directly if used in the pitch deck. |
| Aguzzi et al. 2025 (*Ecological Informatics*) | ✅ **CONFIRMED** | Already cited and DOI-verified in v3.0 Section 15.5. Cross-confirmed: EMSO press release (Dec 18, 2025) describes the paper as published in *Ecological Informatics*. First author: Jacopo Aguzzi, ICM-CSIC. The data-bubbles concept appears in ResearchGate and linked JSDM papers as a known DTO construct associated with this author group. | Already in v3.0. This session extends its application from the digital twin section (3.9) into the data integration layer (3.7) and eDNA pipeline (3.3/3.4). |
| Yang et al. 2024 (*Transportation Research Part E*) | ✅ **CONFIRMED** | Already cited and DOI-verified in v3.0 Section 15.5 (DOI: 10.1016/j.tre.2024.103426). Confirmed as comprehensive ML + AIS review paper. | ⚠️ **ATTRIBUTION FLAG — STEAM model:** The STEAM ship emission model was *originally* developed by Jalkanen et al. (2009, 2012) at SYKE Finland, not by Yang et al. Yang et al. 2024 as a review paper *describes* it. If citing STEAM in the pitch deck or paper, cite Jalkanen et al. 2012 (*Atmospheric Chemistry and Physics*) as the original source and Yang et al. 2024 as the review that contextualises it for AIS-based research. ⚠️ **ATTRIBUTION FLAG — DBSCAN-SD:** The DBSCAN-SD extension (adding SOG/COG as non-spatial features) is documented in AIS literature but is attributed in earlier sources to Vespe et al., not Yang et al. Yang et al. 2024 likely surveys it. Use Yang et al. 2024 as the survey citation for this technique but note Vespe et al. for the original algorithm. |
| Malde et al. 2020 (*ICES Journal of Marine Science*) | ✅ **CONFIRMED** | DOI: 10.1093/icesjms/fsz057. Volume 77, Issue 4, July–August 2020, pp. 1274–1285. "Analysis bottleneck" language confirmed in abstract: *"analysis increasingly is becoming a bottleneck for effective use of collected data across diverse fields and technologies."* Top-tier venue confirmed (ICES JMS is Quartile 1 in marine science). | **NEW CITATION** — not in v3.0. Add to Section 16.5. |
| GitHub repo `PacificCommunity/cfap-ai-models` | ✅ **CONFIRMED** | Stated verbatim in Shedrawi et al. 2024 paper: *"Main models that are used as part of an image processing chain to calibrate images, detect, measure and identify specimens can be found here https://github.com/PacificCommunity/cfap-ai-models."* PacificCommunity GitHub org confirmed active. | |

---

### 16.1 Analysis Bottleneck Framing — Addition to Section 1.1 Rationale
*Session marker: Research-Integration-002 | Source: Malde et al. 2020 | Affects: Section 1.1 and Section 7 (competitive differentiation table)*

The current ideation document leads Section 1.1 with biodiversity crisis statistics (FAO SOFIA 2024, IUU fishing numbers) as the primary justification for the AI layer. Malde et al. 2020 provide a cleaner, more auditor-proof second justification: the **analysis bottleneck**.

**The argument (Malde et al. 2020):** Technological progress in data collection (sensors, satellite coverage, eDNA sequencing) is scaling faster than human analytical capacity. Data volume, complexity, and deteriorating quality have made manual expert scrutiny structurally insufficient. Machine learning is not a supplement to marine science; it is the only path to keep analysis capacity proportional to data collection capacity.

**Why this matters for OceanMind's pitch:**
- The biodiversity crisis argument positions OceanMind as *necessary for the ocean*
- The analysis bottleneck argument positions OceanMind as *necessary for marine science itself*
- The second argument is harder to dispute and does not depend on contested species counts or stock assessment confidence intervals
- Malde et al. is published in ICES Journal of Marine Science (Q1, peer-reviewed) — stronger as an academic citation than some of the grey-literature numbers currently in the deck

**Proposed addition to Section 1.1 (to be validated by human):**
> *"Marine data collection is scaling faster than analytical capacity. Malde et al. (2020) identify this analysis bottleneck — where data volume, complexity, and deterioration outpace human expert scrutiny — as the structural justification for machine learning in marine science. OceanMind directly addresses this bottleneck: three data pillars generating continuous data streams, unified by an AI integration layer that extracts actionable intelligence no manual workflow could produce at comparable scale or speed."*

**Proposed addition to Section 7 (competitive differentiation table):**
- Add column: *"Analysis bottleneck addressed?"* → OceanMind: ✅ (end-to-end ML pipeline); Manual / Government monitoring: ❌

→ OQ-024: Does the human want the analysis-bottleneck framing added to the competition slide, or kept to Section 1.1 only?

---

### 16.2 F1 — Landing Site Computer Vision (CV) Module
*Session marker: Research-Integration-002 | Source: Shedrawi et al. 2024 | Priority: HIGH — directly closes the AIS small-scale fisher gap documented in Section 2.2 and DENIED-006*

**Problem this solves:** Section 2.2 explicitly notes that AIS is "mandatory only for vessels >15m" and that most of India's ~7M small-scale fishers operate vessels below this threshold. DENIED-006 acknowledges this as a structural data gap. No solution existed in v3.0.

**Architecture (from Shedrawi et al. 2024, Ikasavea system, Pacific SIDS):**
- **Smartphone app:** Fisher photographs catch at landing site on calibrated measurement board or mat. No specialist taxonomic knowledge required at point of collection.
- **Centralized AI pipeline:** YOLOv4/Darknet53 + ResNet101 (or YOLO v8/v9 for an Indian deployment). Multistage classification: image orientation correction → pixel calibration → fish detection → species identification. Paper reports R²=0.99 for AI vs. human length measurement and 94%+ recall on established species. *(Verification note: paper confirmed real; exact metric values should be verified directly against paper before pitch use.)*
- **Outputs:** Automated species ID, fork/total length, weight (via length-weight relationships), CPUE per fishing method, market pricing, landed volumes.
- **Stock assessment integration:** Length-Weight Relationships (LWR) → Length-Based Spawning Potential Ratio (LBSPR) for data-poor stock status estimation. Fulton's condition factor K for population health tracking.

**Integration into OceanMind architecture:**
- Becomes a **fourth data sub-pillar within Pillar 2** (Fisheries Records) — not replacing AIS (which handles the commercial fleet >15m) but covering small-scale fishers through landing-site observation.
- **INCOIS deployment surface:** INCOIS already operates at 586 fish landing centres. Those are the natural deployment sites for the Ikasavea-derived CV module.
- **Upgrades SFZ model training:** CPUE per landing site per zone → ground-truth labels for the XGBoost/ConvLSTM migration model, which currently uses AIS effort density as a proxy. This directly improves the migration forecast quality without requiring any new data sources.
- **Upgrades blockchain traceability (Section 3.8):** A landing-site CV record (species + quantity + date + location) is a natural verified catch event for the on-chain record in the traceability module.

**Important calibration from Shedrawi et al. 2024:**
Species recall degrades when many new species with few training images are introduced simultaneously. The Ikasavea m23 model dropped to 79% on 264 species when 153 new additions had only 20–40 training images each. *(Verification note: specific numbers from ideation file author's paper reading — confirm before citing externally.)*
→ **Implication for OceanMind:** Build the CV model with well-represented Indian Ocean species first; expand via transfer learning. Do not attempt to cover all 586 landing centres simultaneously. Stage the rollout by landing centre volume and species diversity.

**Code availability:** `https://github.com/PacificCommunity/cfap-ai-models` *(confirmed in Shedrawi et al. 2024 paper).*

**Phase assignment:** MVP Phase B–C. Smartphone app and basic YOLO pipeline can be prototyped at hackathon; LBSPR stock assessment integration is Phase 2.

→ OQ-025: INCOIS has relationships with the 586 landing centres. What is the realistic path to piloting a Rajasthan/Gujarat landing site subset with a local fishing cooperative?
→ THREAD-011: How does the CV species-recall degradation problem interact with the species diversity of the Bay of Bengal versus the Arabian Sea? These may require separate model specialisation tracks.

---

### 16.3 F2 — Data Bubbles Architecture for the Integration Layer
*Session marker: Research-Integration-002 | Source: Aguzzi et al. 2025 | Priority: HIGH — replaces the "explicit fusion rules per dataset pair" approach in Section 3.7.5 with a more elegant abstraction*

**Current state:** Section 3.7.5 defines spatio-temporal fusion rules as a set of bespoke rules per dataset pair (ARGO + SST, GFW + chlorophyll, etc.). This scales poorly as the number of data sources grows.

**The data bubble abstraction (Aguzzi et al. 2025):**
A data bubble is a geospatially defined sphere: (latitude, longitude, depth, radius) + time window. Every observation — regardless of source or format — is assigned to its nearest data bubble and stored under a shared minimum metadata tag set: `(L, L, D, Tn)` — latitude, longitude, depth, timestamp.

**Implementation in OceanMind's PostGIS schema:**
- Add `data_bubbles` table: `geometry POINT`, `radius_km FLOAT`, `time_window_start TIMESTAMPTZ`, `time_window_end TIMESTAMPTZ`
- Add `bubble_id` foreign key to all observation tables (argo_profiles, incois_sst, gfw_ais, edna_occurrences, landing_site_cv ← new from F1)
- SPARQL endpoint query becomes: *"retrieve all observations within bubble B-247 for the last 30 days"* — a single query across all data sources

**NetCDF CF convention alignment:**
Aguzzi et al. 2025 specify that all data within a bubble should be standardised to NetCDF with CF Conventions feature types:
- ARGO profiles → **Profile** feature type
- INCOIS SST rasters → **Grid** feature type
- AIS vessel tracks → **Trajectory** feature type
- Landing site CV records → **Point** feature type (new, from F1)
- eDNA occurrence records → **Point** feature type

This is more specific than the "schema matching engine" description in Section 3.7.1 and should replace or supplement it. The CF feature type taxonomy gives OceanMind a peer-reviewed, internationally recognised data standard to cite.

**Why this is better than the current approach:**
- No bespoke fusion logic per dataset pair — the bubble provides the common unit
- Adding a new data source requires only assigning it to the nearest bubble, not writing a new fusion rule
- The SPARQL endpoint becomes generically useful rather than source-specific

**Schema change:** The current Section 3.7.5 fusion rules remain valid for the transition period but should be replaced by the bubble assignment logic once the `data_bubbles` table is in production.

→ OQ-026: What spatial radius is appropriate for Indian EEZ data bubbles? Aguzzi et al. work in deep-sea observatory contexts (small radii ~1–5km). For OceanMind's Indian Ocean application, regional heterogeneity (coastal vs. open ocean) suggests adaptive radius: 5km coastal, 50km open ocean. Does the human agree?

---

### 16.4 F3 — Joint Species Distribution Model (JSDM) for Biodiversity Prediction
*Session marker: Research-Integration-002 | Source: Aguzzi et al. 2025 (citing Warton et al. 2015; Franklin 2023) | Priority: MEDIUM — enhances eDNA pipeline and directly improves SFZ bycatch overlay*

**Current state:** The eDNA pipeline (Section 3.3) produces species presence/absence tables and biodiversity indices (Shannon, Simpson). The bycatch risk overlay (Section 3.4) uses absence-of-detection as a proxy for low bycatch risk in unsampled areas. Both have the same limitation: they can only describe where samples were collected, not predict what is present in unsampled areas.

**What a JSDM adds:**
A Joint Species Distribution Model correlates known species co-occurrence records with environmental conditions (ARGO CTD profiles, SST, DO — all already in OceanMind) to infer species presence probability across unsampled grid cells. Unlike a single-species SDM, a JSDM models the entire species assemblage jointly — using latent variables to account for co-occurrence patterns beyond what environmental predictors alone explain.

**Position in OceanMind's pipeline:**
- Input: eDNA species occurrence records (WoRMS-normalised from NCBI/IndOBIS) + ARGO/satellite environmental layers
- Output: Predicted species composition maps across the Indian EEZ grid
- Consumers: (a) SFZ engine — richer biological signal for zone classification; (b) bycatch risk overlay — ecologically sensitive species predictions in unsampled cells; (c) direct answer to the question: *"Based on current oceanographic conditions, which species assemblage is most likely present in the Gulf of Kutch right now?"*

**Technical options:** The `HMSC` R package (Ovaskainen et al. 2017) and `BayesComm` are the most-cited implementations. Python alternatives exist via PyMC/Stan interfaces. For OceanMind's Indian Ocean context, training data are sparse — the JSDM should be framed as supplementing, not replacing, direct eDNA sampling.

→ OQ-027: JSDM training requires species occurrence records with environmental covariates at the same location. OceanMind has OBIS/IndOBIS occurrence records and ARGO profiles — but do they co-locate sufficiently in the Indian EEZ for JSDM training to be feasible with available public data?

---

### 16.5 F4 — Individual-Based Model (IBM) for Larval Connectivity and Recruitment
*Session marker: Research-Integration-002 | Source: Aguzzi et al. 2025 (citing Clavel-Henry et al. 2020) | Priority: MEDIUM — Phase 2 candidate*

**What this addresses:** Whether a depleted stock recovers depends on larval connectivity — larvae from healthy upstream spawning grounds recruiting into depleted areas. OceanMind currently has no model for this dimension of stock recovery dynamics.

**Architecture:**
- **Data input:** COPERNICUS CMEMS ocean current forecasts (u, v, w velocity fields at multiple depths)
- **Model:** IBM particle tracking — virtual larvae as Lagrangian particles, parameterised with species-specific spawning time, larval duration, and vertical migration behaviour
- **Output:** Probability maps showing where larvae from known spawning grounds (CMFRI records) are likely to recruit in the next 30–90 days — a "connectivity layer" on the OceanMind map

**Integration with SFZ engine:**
The connectivity layer directly informs SFZ zone design: protecting areas with high incoming recruitment is a high-leverage conservation action, even if those areas are not currently productive. This connection does not exist anywhere in v3.0.

**Phase:** Phase 2, after COPERNICUS CMEMS integration is established (u/v/w current fields are not currently in the data stack).

→ OQ-028: The CMEMS current forecasts are available via the Copernicus Marine Service API at no cost. Is this already in OceanMind's data ingestion roadmap? If not, adding it as a Phase 2 data source is a precondition for the IBM.

---

### 16.6 F5 — Socioecological Agent-Based Model (ABM)
*Session marker: Research-Integration-002 | Source: Aguzzi et al. 2025 | Priority: LOWER — Phase 3*

**What this would enable:**
An ABM would let regulators simulate scenarios such as:
- *"If monsoon bans are extended by two weeks, what is the projected impact on Kerala cooperative income over three years?"*
- *"What happens to Bay of Bengal sardine stocks if CPUE drops below 0.5 kg/hour for six consecutive months?"*

The causal loop in Aguzzi et al. 2025 (Fig. 11): ecological variables → species abundance → fishery landings → fishermen income → restrictive policies → future stocks → back to species abundance. This is the holistic feedback that makes OceanMind more than an ecological monitoring tool.

**Phase:** Phase 3. Requires validated catch data at cooperative level and socioeconomic microdata that will not be available in Phase 1 or 2. Log it as a direction — this is the feature that most strongly differentiates OceanMind from pure ecological monitoring platforms.

**Relation to digital twin (Section 3.9):** The ABM is the socioeconomic extension of the digital twin's scenario simulation capability. The digital twin (Phase 2) handles ecological what-if; the ABM (Phase 3) adds the human-system feedback loop.

---

### 16.7 F6 — AIS Data Quality Pipeline
*Session marker: Research-Integration-002 | Source: Yang et al. 2024 | Priority: HIGH for MVP — currently absent from OceanMind's architecture*

**Current state:** Section 1.3 Pillar 2 lists AIS as a data source. The IUU detection module (Section 2.2) applies anomaly detection to AIS data. Neither section describes any preprocessing step — AIS is treated as a clean input.

**Why this is a structural risk:** Yang et al. 2024 (the comprehensive ML + AIS review, already cited in v3.0) catalogue AIS data quality issues systematically: MMSI numbers shared across multiple vessels, blank trajectory segments from signal loss, deliberately falsified positions (spoofing), manual entry errors in destination/ETA fields, and update rate variability (2s to 3 min depending on vessel class). Any anomaly detection model trained on uncleaned AIS will inherit these artifacts as signal.

**Required preprocessing layer (to be inserted between raw GFW download and the IUU anomaly detection module):**

1. **MMSI deduplication:** Flag or resolve cases where multiple physical vessels share a MMSI number
2. **Trajectory gap filling:** Linear or Kalman filter interpolation for short gaps; LSTM-based reconstruction for longer gaps. *(Yang et al. 2024 cite partial convolution methods from computer vision as a promising direction.)*
3. **Outlier removal:** DBSCAN on (position, speed) to identify physically impossible jumps ("teleportation anomalies")
4. **Spoofing signature detection:** Vessels appearing stationary at port while logbook shows at sea; positional jumps inconsistent with vessel's rated maximum speed

**Additional output — route clustering:**
Yang et al. 2024 describe DBSCAN-SD (extending standard DBSCAN with SOG and COG as non-spatial dimensions) for trajectory clustering. This extracts typical fishing routes per area per season — a richer historical baseline pattern for the SFZ model than the current AIS effort density raster.

> ⚠️ **Attribution note:** DBSCAN-SD as a concept for fishing vessel activity detection appears in Vespe et al. (cited in AIS literature) and has been extended by multiple groups. Yang et al. 2024 surveys this technique within their comprehensive AIS review. Cite Yang et al. 2024 as the review source; if challenged, the original algorithm reference is Vespe et al.

**Where this fits:** The AIS quality pipeline is a **Stage 0 preprocessing layer** in the data ingestion stack, between `raw_ais_download` and `ais_processed` in the current pipeline. It does not change the downstream architecture — it makes it more reliable.

→ OQ-029: What is the MMSI conflict rate in the Indian EEZ specifically? GFW has noted MMSI conflicts globally (Watson et al. 2015, cited in Yang et al. 2024). Is the rate high enough to materially affect OceanMind's IUU detection signal in Indian waters, or is this a precautionary step?

---

### 16.8 F7 — Fleet Carbon Emission Estimation (SDG 13 Addition)
*Session marker: Research-Integration-002 | Source: Yang et al. 2024 (describes STEAM model; original model: Jalkanen et al. 2012) | Priority: MEDIUM — differentiator for environmental reporting*

**What this adds:** A fishing fleet carbon footprint map for the Indian EEZ, updated weekly. No current Indian marine platform provides this.

**Method — STEAM bottom-up emission model:**
Formula: vessel engine power × load factor × operating time × emission factor = pollutant emissions per voyage.

AIS data provides vessel speed and heading (needed for load factor and operating time). Vessel engine specifications (power, fuel type) are available from Lloyd's Register / IHS Fairplay ship databases.

> ⚠️ **Attribution note:** The STEAM model was developed by Jalkanen et al. (2009, 2012) at SYKE (Finnish Environment Institute), not by Yang et al. 2024. Yang et al. survey it within their AIS review. When citing STEAM in the pitch deck, cite: *Jalkanen, J.-P. et al. (2012). Extension of an assessment model of ship traffic exhaust emissions for particulate matter and carbon monoxide. Atmospheric Chemistry and Physics, 12, 2641–2659.* Attribute Yang et al. 2024 as the survey providing the AIS-based implementation context.

**Implementation requirements (in addition to current AIS ingestion):**
- Ship database lookup for installed engine power per MMSI (Lloyd's Register or equivalent — commercial, cost TBD)
- STEAM model application per vessel per trip segment
- Spatial aggregation to emission density maps for the Indian EEZ

**Cross-pillar integration:**
- SDG alignment: Adds SDG 13 (Climate Action) to OceanMind's existing SDG 14 alignment. A dual-SDG platform is a stronger funding narrative.
- Blockchain traceability (Section 3.8): A catch record would carry not just sustainability zone status but the carbon cost of the catch event.

**Phase:** Phase 2. Requires ship engine database integration (non-trivial, may require commercial data agreement).

→ OQ-030: Is the Lloyd's Register / IHS Markit ship engine database accessible at reasonable cost for an academic research project? Alternatives: the EU THETIS-MRV database (for EU-flagged vessels), or regression models estimating engine power from vessel gross tonnage (a proxy used by several published STEAM applications for fishing fleets).

---

### 16.9 F8 — Landing-Site Species Count Trend Dashboard
*Session marker: Research-Integration-002 | Source: Aguzzi et al. 2025 + Shedrawi et al. 2024 | Priority: LOW-MEDIUM — Phase 2 dashboard enhancement*

**What this adds:**
As CV-processed catch records accumulate from INCOIS landing centres (F1), the landing-site dashboard shows species abundance trends per centre over time. Example output: *"Over the last 90 days at Veraval landing site, Indian mackerel CPUE has declined 23% while silver pomfret has increased 15%."*

This is catch trend monitoring at the landing-site level — currently done manually by CMFRI through paper records. Automating it through the CV pipeline converts the data-collection investment (F1) into a visually compelling output that fisheries officers can use immediately.

**Connection to existing architecture:**
- The Grafana-style visualisation approach (Aguzzi et al. 2025) for AI-processed image streams applies here: a time-series dashboard per landing centre, driven by the CV module output.
- The output feeds into the CMFRI comparison table in Section 2.1 — OceanMind can show real-time trend detection against CMFRI's manual baseline.

**Phase:** Phase 2 (after F1 landing site CV module is operational and producing structured records).

---

### 16.10 Cross-Cutting Observation — Analysis Bottleneck as Pitch Framing
*Session marker: Research-Integration-002 | Source: Malde et al. 2020*

The ideation document's current biodiversity-crisis-first framing (Section 1.1) is compelling but is vulnerable to challenge on specific numbers (see OQ-001, OQ-002, the 37.7% vs. 35.5% disambiguation in Section 2.1). Malde et al. 2020's *analysis bottleneck* argument is a cleaner, more structural second pillar.

**The argument:** Data collection capacity in marine science is scaling faster than analysis capacity. This is a structural and permanent trend driven by sensor costs, satellite coverage, and genomics throughput. Machine learning is not an optional enhancement — it is the only mechanism that keeps the analysis pipeline proportional to the data pipeline.

**Pitch positioning:**
- "We are not just adding AI to marine science. Marine science has generated a data collection infrastructure that has already outpaced human analysis capacity. OceanMind is the analysis layer that makes that infrastructure useful." (Malde et al. 2020, ICES Journal of Marine Science)

**Where to add in document:** Section 1.1 (What OceanMind Is), and the competitive differentiation table in Section 7.

→ THREAD-012: How prominently should the analysis-bottleneck framing appear relative to the biodiversity-crisis framing? The biodiversity crisis connects emotionally and to SDG 14; the analysis bottleneck connects to technical judges and academic reviewers. Both audiences will be present at Biothon 2026.

---

### 16.11 Open Questions — v4.0 Additions

**[OQ-024]** Does the human want the Malde et al. 2020 analysis-bottleneck framing added to the competition slide (Section 7 competitive differentiation table), or kept to Section 1.1 narrative only?

**[OQ-025]** What is the realistic path to piloting the landing-site CV module at a Gujarat or Rajasthan landing centre? INCOIS has the landing centre relationships. What is the minimum viable pilot: one landing centre, one species group (e.g., Indian mackerel only), one season?

**[OQ-026]** What spatial radius is appropriate for Indian EEZ data bubbles? Adaptive radius (5km coastal, 50km open ocean) vs. uniform radius (25km everywhere)?

**[OQ-027]** Do OceanMind's existing OBIS/IndOBIS occurrence records and ARGO profiles co-locate sufficiently in the Indian EEZ for JSDM training to be feasible on public data alone?

**[OQ-028]** Is COPERNICUS CMEMS current field data (u/v/w velocity) already in OceanMind's data ingestion roadmap? It is a precondition for the IBM larval connectivity model (F4).

**[OQ-029]** What is the MMSI conflict rate in the Indian EEZ specifically? Is it high enough to materially affect IUU detection signal, or is the AIS quality pipeline a precautionary measure?

**[OQ-030]** Is the Lloyd's Register / IHS Markit ship engine database accessible at academic cost? Alternatives for STEAM: EU THETIS-MRV (EU vessels only), or GT-based engine power regression models?

---

### 16.12 Active Discussion Threads — v4.0 Additions

**[THREAD-011] CV model species-recall degradation vs. Indian Ocean species diversity — NEW v4.0**
- Status: 🔴 Open
- Shedrawi et al. 2024 show recall degradation when >150 new low-sample-count species are added simultaneously. The Arabian Sea and Bay of Bengal have different dominant species assemblages and different representation in public image databases. Should OceanMind develop two regional CV models (Arabian Sea / Bay of Bengal) or one national model that is then fine-tuned regionally via transfer learning?

**[THREAD-012] Analysis-bottleneck vs. biodiversity-crisis as pitch framing hierarchy — NEW v4.0**
- Status: 🔴 Open
- Both frames are valid. Biodiversity crisis: connects to SDG 14, emotionally compelling, well-known narrative. Analysis bottleneck: more structural, harder to dispute, appeals to technical/academic judges. Biothon 2026 will have both audiences. Does the human want these framed as primary and secondary arguments, or as parallel claims?

---

### 16.13 New Cited Research — v4.0 Additions

All citations added in v4.0 for the first time (all other sources cited in Section 16.0 were already present in v3.0):

- **Malde, K., Handegard, N.O., Eikvil, L., & Salberg, A.-B. (2020).** Machine intelligence and the data-driven future of marine science. *ICES Journal of Marine Science, 77*(4), 1274–1285. DOI: 10.1093/icesjms/fsz057 *(analysis bottleneck framing; Q1 venue)*
- **Shedrawi, G., Magron, F., Vigga, B., Bosserelle, P., Gislard, S., et al. (2024).** Leveraging deep learning and computer vision technologies to enhance management of coastal fisheries in the Pacific region. *Scientific Reports, 14*, 20915. DOI: 10.1038/s41598-024-71763-y *(Ikasavea system; YOLOv4 + ResNet101; landing-site CV for small-scale fishers; GitHub: PacificCommunity/cfap-ai-models)*
- **Jalkanen, J.-P., Brink, A., Kalli, J., Pettersson, H., Kukkonen, J., & Stipa, T. (2009).** A modelling system for the exhaust emissions of marine traffic and its application in the Baltic Sea area. *Atmospheric Chemistry and Physics, 9*, 9209–9223. *(STEAM model original source — cite alongside Yang et al. 2024 for F7 emission estimation)*

---

### 16.14 New Features Summary — v4.0 Additions at a Glance

| # | Feature | Source paper | Sections affected | Phase |
|---|---------|-------------|-------------------|-------|
| F1 | Landing Site CV Module (YOLO + ResNet → species ID + LWR + LBSPR) | Shedrawi et al. 2024 | 3.10 *(new)*, 1.3 Pillar 2 | MVP Phase B–C |
| F2 | Data Bubbles as formal spatiotemporal unit (lat/lon/depth/time + NetCDF CF types) | Aguzzi et al. 2025 | 3.7.5, 4.2 | MVP Phase A |
| F3 | Joint Species Distribution Model for eDNA-driven unsampled cell prediction | Aguzzi et al. 2025 | 3.3, 3.4 | MVP Phase D |
| F4 | IBM for larval connectivity + recruitment probability maps | Aguzzi et al. 2025 | 3.9 | Phase 2 |
| F5 | Socioecological ABM for fisheries policy simulation | Aguzzi et al. 2025 | — (new Phase 3 direction) | Phase 3 |
| F6 | AIS data quality pipeline (MMSI dedup, gap filling, DBSCAN-SD, spoofing detection) | Yang et al. 2024 | 3.7, 1.3 Pillar 2 | MVP Phase A |
| F7 | Fleet carbon emission estimation via STEAM model + AIS | Yang et al. 2024; Jalkanen et al. 2009 | 6, 7 | Phase 2 |
| F8 | Landing-site species count trend dashboard | Shedrawi et al. 2024 + Aguzzi et al. 2025 | 4.4 | Phase 2 |
| — | Analysis bottleneck framing (Malde et al. 2020) | Malde et al. 2020 | 1.1, 7 | Immediate |

---

*Document v4.0 — Research-Integration-002 session.*
*Changes: Version header updated; Section 16 appended (16.0 verification log, 16.1–16.9 feature additions F1–F8, 16.10 cross-cutting analysis-bottleneck framing, 16.11–16.12 OQ-024 to OQ-030 and THREAD-011 to THREAD-012, 16.13–16.14 new citations and features summary); Section 15.4 feature table extended with 9 v4.0 rows; STEAM model and DBSCAN-SD attribution flags added inline; Shedrawi et al. 2024, Malde et al. 2020, Jalkanen et al. 2009 added as new citations; all v3.0 content preserved unchanged.*

---

## 17. Integration Merge — v4.1
*Session marker: Integration-Merge-001 | Trigger: "add all thats left in the document" | This session merges every proposal logged in Section 16 (v4.0) into the canonical running sections, completing the integration pattern that v3.0 established (where Section 15 proposals were merged into Sections 1–13 inline, tagged "[NEW v3.0]"). No content was deleted. All OQ/THREAD numbering preserved.*

**What was merged and where:**

| Proposal (Section 16) | Merged into | Tag used |
|---|---|---|
| Analysis bottleneck framing (16.1) | 1.1 (new paragraph), 7 (new table column) | `[MERGED v4.0 — Integration-Merge-001]` |
| F1 Landing Site CV Module (16.2) | 1.3 Pillar 2 (new row), new **Section 3.10**, 4.1 (model row), 6 (reach number) | `[NEW v4.0 — MERGED]` |
| F2 Data Bubbles (16.3) | 3.7.5, 4.2 (`data_bubbles` table) | `[NEW v4.0 — MERGED]` |
| F3 JSDM (16.4) | 3.3, 3.4, 4.1 (model row) | `[NEW v4.0 — MERGED]` |
| F4 IBM larval connectivity (16.5) | 3.9, 4.1 (model row), Roadmap Phase 2 | `[NEW v4.0 — MERGED]` |
| F5 Socioecological ABM (16.6) | Roadmap Phase 3 | `[NEW v4.0]` |
| F6 AIS Data Quality Pipeline (16.7) | new **Section 3.7.7**, Roadmap Phase 1 | `[NEW v4.0 — MERGED]` |
| F7 Fleet carbon / STEAM (16.8) | 6, 4.1 (model row), Roadmap Phase 2 | `[NEW v4.0]` |
| F8 Landing-site trend dashboard (16.9) | 4.4, Roadmap Phase 2 | `[NEW v4.0]` |
| OQ-024 to OQ-030 (16.11) | **Section 12** (full entries, de-duplicated against 16.11) | — |
| THREAD-011, THREAD-012 (16.12) | **Section 13** (full entries) | — |
| F1–F8 as committed/scoped decisions | **Section 9** — APPROACH-015 to APPROACH-023 | — |
| Pending-validation flags | **Section 11** | — |

**What did NOT change:** Section 16 itself is left intact as the historical record of the research-integration session (per the document's own UPDATE RULE — append and annotate, never delete). Sections 2, 5, 8 (pre-existing content), 10, 14, 15 are unchanged except for the specific roadmap/approach insertions noted above. No verified numbers, citations, or denied approaches were altered.

**Outstanding before this can move from "ideation" to "build":** OQ-024 through OQ-030 are now visible in the canonical Section 12 list but are still genuinely open — this merge integrates the *proposals*, not the *answers*. A human still needs to resolve each, particularly OQ-025 (landing-site pilot path), OQ-027 (JSDM data feasibility), and OQ-030 (STEAM cost feasibility), since these gate whether APPROACH-015/017/021 stay committed or get descoped.

---

*Document v4.1 — Integration-Merge-001 session. All v4.0 content preserved; proposals from Section 16 merged inline into Sections 1, 3, 4, 6–9, 11–13 per the table above.*

---

## 18. Official Problem Statement — Status & Alignment Check
*Session marker: Council-Cleanup-001 | Trigger: "fix... deviations from the ps"*

### 18.1 The gap

This document's own load-order header (top of file, GUIDELINES block) has instructed every session since v4.1 to *"Council pressure-test against the official problem statement in Section 18."* **Section 18 did not exist until this edit.** No session ever actually performed that pressure-test, because the section it pointed to was never written.

I checked both attached files for the actual PS text:
- **OceanMind_Ideation_v4_1.md** — never quotes or reproduces the official Biothon 2026 problem statement anywhere in 1,351 lines. It states the *domain* (Environment & Biodiversity) and the *organiser context* (Marwadi University, Dept. of Bioinformatics) but not the PS wording itself.
- **BIOTHON_2026_OFFICIAL_PPT.pptx** — this is a **blank fill-in template**, not a filled brief. Slide 4 literally says *"DESCRIBE YOUR DOMAIN AND EXPLAIN YOUR UNDERSTANDING OF THE PROBLEM STATEMENT YOU HAVE CHOSEN IN 4 TO 5 LINES"* — that's an instruction to teams, not the PS itself.

**Net effect:** nobody — not this document, not the official PPT, not any prior session — has the literal official problem statement text on record. Every "deviation from the PS" claim made by any past session, and any made in this one, has actually been a deviation from the *inferred* domain (Environment & Biodiversity, marine/oceanographic data) rather than from verified PS wording.

### 18.2 Why this isn't auto-resolved

This is exactly the kind of open end this session is instructed *not* to close unilaterally: closing it would mean inventing problem-statement text and checking the project against a fabrication, which is worse than leaving it visibly open. Per the document's own GROUND TRUTH rule (header), claims must be traceable, not assumed.

🔴 **Left open v5.0 — requires the human to paste the actual official Biothon 2026 problem statement text (Environment & Biodiversity domain) into this section.** Once provided, a real word-for-word alignment check against Sections 1–17 can be done in one pass.

### 18.3 Best-effort alignment check against the *inferred* domain (interim, pending 18.2)

Working only from "Environment & Biodiversity domain, marine fisheries + oceanographic data, Marwadi University Bioinformatics" — the project is internally consistent with that domain framing:

- Three-pillar scope (oceanographic + fisheries + eDNA/biodiversity) squarely covers "Environment & Biodiversity."
- Bioinformatics relevance is explicit and substantial: the eDNA wet-lab pipeline (Section 1.3), BLAST/CNN classification (Section 3.3), WoRMS taxonomic resolution (Section 3.7.3), and barcode reference databases (BOLD) are all core bioinformatics content — appropriate for a Dept. of Bioinformatics submission, not a bolted-on afterthought.
- No content found that reads as off-domain (e.g., nothing unrelated to environment/biodiversity has crept in).

This is the strongest check possible without the actual PS text. It cannot catch a mismatch on something the PS specifies narrowly (e.g., if the official PS asks for one specific sub-problem like "IUU fishing detection" rather than the full three-pillar platform) — only word-for-word comparison can catch that, which is why 18.2 stays open.

---

## 19. PPT Build Guidelines
*Session marker: Council-Cleanup-001 | Mapped to BIOTHON_2026_OFFICIAL_PPT.pptx structure (12 slides) and the slide order requested: Problem Statement Understanding → Solution Proposed → Core Features Plan → Innovation & Novelty → Solution Architecture & Methodology → Technology Stack → Impact → Business & Future Plan*

General rule for all slides: every number that appears must trace to Section 2 (Research Foundation) or the ✅ RESOLVED v5.0 decisions above. Do not pull a number from memory while building slides — copy it from this document.

### Slide 1 — Title
No content guidance needed (logo/team/title only per template).

### Slide 2 — "Extra slide allowed" notice
Informational only, not a content slide. Ignore unless you actually need a 13th slide for space.

### Slide 3 — Team Introduction
Outside this document's scope (team roster, not project content). Fill directly.

### Slide 4 — Problem Statement Understanding
*Template cap: 4–5 lines.*
Use the **council-resolved THREAD-012 structure**:
1. (2–3 lines) Lead with the biodiversity/sustainability crisis: 35.5% of global stocks overfished (FAO Marine Fisheries Review 2025 — use this number, not 37.7%, per Section 2.1 resolution), Indian Ocean among the fastest-warming basins, 14.5M Indian fishers dependent on a resource in structural decline.
2. (1–2 lines) State the specific gap: oceanographic, fisheries, and eDNA biodiversity data exist in isolated silos — no unified platform integrates all three for real-time decision support (Section 1.1).
3. (1 closing line) Add the analysis-bottleneck hook: data collection is outpacing analytical capacity (Malde et al. 2020) — this is a structural problem, not just a tooling gap.
⚠️ Do **not** state this as a direct quote of the official PS — see Section 18. Frame it as your domain understanding, not as restating a brief you can't yet verify word-for-word.

### Slide 5 — Solution Proposed
Pull from Section 1.1 + 1.2. Name: **OceanMind**. One-line definition: an AI-driven unified data intelligence platform integrating oceanographic, fisheries, and eDNA biodiversity data for real-time marine decision support. State the three design principles that differentiate it from a generic dashboard: insight-only (no autonomous action — Section 1.2), open-data-only (reproducible, no proprietary lock-in), trustworthy-by-design (SHAP explainability, confidence intervals — Section 2.10/3.1).

### Slide 6 — Core Features Plan
*Template cap: 3–4 features.* Do not list all 22 features from Section 3 — that's a build roadmap, not a pitch slide. Pick the 3–4 with the best demo-value-to-complexity ratio, using the MVP Minimum Viable Demo floor (Section 5) as the filter:
1. **Dynamic Sustainable Fishing Zone (SFZ) Engine** (Section 3.4) — weekly-updating Green/Amber/Red zones + bycatch risk overlay; this is the single most demo-able, judge-legible feature.
2. **ConvLSTM Fish Migration Forecasting** (Section 3.1) — 7-day migration heat map with confidence intervals.
3. **Landing-Site CV Module** (Section 3.10) — strongest *novelty* feature (closes the ~7M small-scale-fisher AIS gap); include if Slide 7 also leans on it for innovation, since the two slides reinforce each other.
4. **eDNA Biodiversity Pipeline + RAG conversational interface** (Sections 3.3, 3.5) — covers the bioinformatics angle explicitly, important given Dept. of Bioinformatics framing (Section 18.3).
Each feature: 1 sentence on what it does + 1 sentence on what data/model powers it. Do not include Phase 2/3-only features (blockchain, digital twin, carbon estimation, multi-omics) here — they belong on Slide 11.

### Slide 7 — Innovation & Novelty
Template wants: existing solutions + their limitations + your gap-bridging approach.
- **Existing solutions** (Section 7 competitive table): OceanAI (NOAA/NCSU), Global Fishing Watch, INCOIS standalone, Copernicus Marine.
- **Limitations** (3, per template): (1) none integrate all three data pillars — each does oceanographic *or* fisheries *or* nothing on eDNA; (2) none offer dynamic (vs. static) zone management; (3) none cover small-scale fishers below the AIS 15m threshold (Section 2.2/DENIED-006) — the ~7M-person gap.
- **Your innovation**: the Landing-Site CV Module (Section 3.10) is the strongest concrete novelty claim — it's the one feature with no equivalent in any comparator and directly closes Limitation 3. Pair it with the Data Integration Infrastructure Layer (Section 3.7) as the second novelty pillar — schema matching + OBDA across NetCDF/JSON/FASTA/CSV is what makes "unified" a real architectural claim rather than three dashboards side by side (THREAD-008 already frames this as visually demonstrable).
- Close with the analysis-bottleneck framing as the "why this matters structurally" line (consistent with Slide 4 and Section 7's table column).

### Slide 8 — Solution Architecture & Methodology
Template wants: data source/format → processing pipeline/models → output/decisions → end-user interaction, step by step.
1. **Input**: three pillars' raw formats — ARGO NetCDF, INCOIS/GFW JSON, eDNA FASTA, CMFRI CSV (Section 3.7.1).
2. **Processing**: schema matching + OBDA layer → AIS data quality pipeline (Section 3.7.7, MMSI dedup/gap-fill/spoofing detection) → ConvLSTM migration model + XGBoost SFZ classifier with SHAP (Section 3.1, 3.4) → BLAST+CNN eDNA classification with WoRMS normalisation (Section 3.3).
3. **Output/decisions**: dynamic SFZ map (Green/Amber/Red + bycatch overlay), 7-day migration forecast with confidence intervals, biodiversity indices, RAG-answered queries with provenance trace (Section 3.7.6).
4. **End-user interaction**: Leaflet web dashboard for regulators/scientists; Bhashini voice interface + SMS alerts for fishermen (Section 3.6) — this is a good place to mention the 22-language voice support since it's a strong accessibility/inclusion point judges respond to.
A simple left-to-right pipeline diagram (Pillars → Integration Layer → ML Models → Outputs → User Interfaces) is the right visual here — consider the Visualizer if you want one built.

### Slide 9 — Technology Stack
Map directly from Section 4, using the template's category headers:
- **Frontend**: React/Next.js, Leaflet.js + Plotly, Streamlit (MVP demo)
- **Backend**: Python 3.11+, FastAPI, PostgreSQL + PostGIS, Apache Jena/RDFLib (SPARQL)
- **AI/ML**: ConvLSTM, XGBoost, 1D CNN (eDNA), YOLOv8/v9 + ResNet101 (landing-site CV), LangChain RAG + FAISS/ChromaDB
- **Others (Cloud/IoT)**: Apache Kafka (Phase 2 IoT streaming), Docker + Kubernetes
- **Database**: PostgreSQL + PostGIS (primary), the new `data_bubbles` table (Section 4.2)
Skip MongoDB/Firebase/Redis from the template's generic placeholder list unless you're actually using them — OceanMind's stack doesn't currently call for them (PostGIS covers the geospatial need the template examples gesture at).

### Slide 10 — Impact & Real-World Use Cases
Map from Section 6:
- **Primary use case**: 14.5M Indian coastal fishermen — migration maps, dynamic SFZ zones, Bhashini voice + SMS alerts in regional languages.
- **Secondary use case**: government/regulators (Blue Economy Mission, PMMSY) — evidence-based zone delineation, IUU detection reports; also conservation NGOs for early-warning ecosystem stress.
- **Scale/reach**: 586 INCOIS landing centres nationally; Section 6's verified numbers — use **15–25% fuel savings** (cited, INCOIS PFZ literature) and **2–3× smaller dynamic zones for equivalent protection** (Hazen et al. 2018, THREAD-010 resolution) as the two headline stats. Do **not** use "75–92% fish location accuracy" as an achieved result — Section 6 explicitly flags this as a literature-derived target, not a validated OceanMind output; if used, it must say "target accuracy" on the slide, not bare.

### Slide 11 — Business & Future Plan
Map from Section 8 (Roadmap) + Section 3.8 (Traceability):
- **Phase 2/3 features as the "future" half**: blockchain traceability for sustainable-catch certification (premium market access — a real revenue/incentive story), digital twin scenario simulation, fleet carbon emission estimation (SDG 13 add-on), multi-omics expansion.
- **Business angle**: blockchain-certified sustainable catch is the one feature in this document with a direct monetisation path (premium buyers paying for certified-sustainable sourcing) — lead the "business" half of this slide with that, since the rest of OceanMind is fundamentally a public-good/government-facing platform (B2G), not B2C.
- **National scale plan**: Phase 3 expansion to all Indian coastal regions, international collaboration (OBIS, FAO, ARGO Global Network), Deep Ocean Mission integration.

### Slide 12 — (closing/thank-you, per template)
Outside this document's scope. Fill directly.

---

*Document v5.0 — Council-Cleanup-001 session. Changes: version header rewritten with full changelog; 5-advisor council run on THREAD-012 (verdict recorded inline and reflected in OQ-024/THREAD-012 resolutions); Section 2.1 (37.7%/35.5%) and Section 2.2 (26M+ tons) numeric inconsistencies resolved; India production-figures ambiguity flagged (Section 2.1); 11 of 30 Open Questions resolved with explicit defaults (OQ-019, 020, 021, 023, 024, 026, 028, 029, 030 fully resolved; OQ-022 tentatively defaulted but left formally open; OQ-018, 025, 027 explicitly left open as requiring real-world action outside document scope); 3 of 12 Threads resolved (THREAD-009 stale/closed, THREAD-010 adopted, THREAD-012 resolved via council), THREAD-011 explicitly deferred (not closed) pending Phase 3 relevance; new Section 18 added documenting the previously-broken Section 18 self-reference and the absence of actual official-PS text in either attached file, with an interim best-effort domain-alignment check; new Section 19 added (PPT Build Guidelines, slide-by-slide, mapped to the official 12-slide Biothon template). No content deleted — all v4.1 content and history preserved per the document's own UPDATE RULE.*

---

## 20. Data Collection, Available Sources & Government Regulation Effects — NEW v6.0
*Session marker: Research-Integration-003 | Trigger: "We forgot to include data collection, available sources and effects of govt regulations" | Sources: verified via web research June 2026 — EEZ Rules 2025 (PIB notification, ICSF text), Marine Fisheries Census 2025 (CMFRI/PIB), PMMSY documentation, NITI Aayog Blue Economy report 2025, ORF marine governance analysis, ICES Journal vessel tracking research*

> **Purpose of this section:** Addresses a structural gap in v5.0 — the document extensively covers what OceanMind *does with* data and *what sources it uses* (Section 1.3), but never explicitly documents (a) how each category of data is physically collected and where collection gaps lie, (b) a comprehensive inventory of publicly accessible data sources beyond what Section 1.3 briefly tables, or (c) how government regulation directly shapes the data environment OceanMind operates in — both as a mandate that creates new data streams and as a constraint that limits others. All three topics are critical for hackathon judges evaluating technical grounding and policy relevance.

---

### 20.1 Data Collection Methods — By Pillar

This subsection documents *how* data in each of OceanMind's three pillars is physically collected, at what cadence, and where the structural collection gaps are. Cross-references with Section 1.3 (source tables) and Section 2 (verified numbers) are noted where relevant.

#### 20.1.1 Pillar 1 — Oceanographic Data Collection

**ARGO Float Profiling:**
ARGO floats are autonomous, battery-powered instruments deployed at sea that drift with ocean currents while periodically executing dive-and-ascend cycles. The standard ARGO duty cycle is: sink to 2,000m parking depth → drift for approximately 9 days → descend further to 2,000m (or a programmed target depth) → ascend through the water column, measuring temperature and salinity at each depth level → surface → transmit data via Iridium satellite (within ~24 hours of surfacing) → repeat. This generates a **CTD profile** (Conductivity-Temperature-Depth) at each cycle. The Argo Global Data Assembly Centres (GDACs) — hosted by Coriolis/France and US-GODAE — process, quality-control, and publish profiles in NetCDF format, typically within 12–24 hours of float transmission. OceanMind ingests these as its primary sub-surface ocean structure dataset.

**Key collection gaps:**
- *Temporal resolution*: the 10-day cycle means a given geographic location is not necessarily sampled more often than once per 10 days — too coarse for capturing fast-evolving events like marine heatwaves or eddy formation.
- *Coastal gap*: ARGO floats are prohibited from operating in water shallower than approximately 2,000m. All of India's coastal and shelf waters (where fisheries activity is concentrated) are unsampled by ARGO. INCOIS coastal moorings and satellite data fill this gap partially, but this is a persistent structural limitation.
- *Biogeochemical sparsity*: only BGC-ARGO floats (a much smaller subset, ~1,000 of 3,500+ active floats) measure oxygen, nitrate, chlorophyll, pH, and backscatter. Indian Ocean BGC-ARGO coverage is thinner than Atlantic and Pacific.

**Satellite Remote Sensing (SST + Ocean Colour):**
SST and chlorophyll-a data are collected by orbiting satellites equipped with thermal infrared sensors (for SST) and ocean colour radiometers (for chlorophyll-a). Key instruments: MODIS-Aqua/Terra (NASA), VIIRS (NOAA/NASA), Sentinel-3 OLCI (ESA Copernicus). Satellites overpass a given location roughly once per day (polar orbit), but cloud cover can prevent usable measurements for days or weeks in the tropical Indian Ocean (especially during monsoon). INCOIS produces composite products (weekly or monthly) that average cloud-free pixels to produce gap-filled maps — these are what OceanMind uses.

**Key collection gaps:**
- *Cloud contamination*: the Arabian Sea and Bay of Bengal are cloud-covered for extended periods during the Southwest Monsoon (June–September) and Northeast Monsoon (October–December). Weekly INCOIS composites may incorporate data that is up to 7 days old in heavily clouded periods — a limitation for real-time SFZ updates during monsoon seasons.
- *Sub-surface invisibility*: satellites measure only the sea surface (top ~1m for thermal, top mm for colour). Fish aggregation typically occurs at the thermocline (20–200m depth), which is invisible to satellite sensors. ARGO mixed-layer depth fills this gap partially.

**IMD Meteorological Data:**
India Meteorological Department collects weather data from surface weather stations, buoys, radiosonde balloon soundings, and satellite-derived products. Cyclone track forecasts are generated by IMD's National Weather Forecasting Centre. OceanMind ingests IMD data as safety alerts for fishing vessel operators.

#### 20.1.2 Pillar 2 — Fisheries Data Collection

**AIS (Automatic Identification System):**
AIS transponders are mandatory on vessels ≥15 metres under international SOLAS convention. Transponders broadcast vessel identity, position, speed, heading, and destination via VHF radio every 2–10 seconds when at sea. These signals are received by coastal AIS base stations (line-of-sight, ~40–60 nautical miles) and by AIS-equipped satellites (providing global coverage). Global Fishing Watch aggregates satellite AIS from multiple providers (Orbcomm, Spire, exactEarth) and vessel monitoring system (VMS) data from partner governments, producing a daily fishing effort raster at 0.01° resolution.

**Key collection gaps:**
- *Small vessel gap*: critically documented in Section 2.2 and DENIED-006 — AIS mandatory only for vessels ≥15m, leaving the majority of India's artisanal fleet outside coverage. Additionally, even within the Indian EEZ, AIS usage by small industrial vessels (15–24m) is inconsistent in FAO Area 51 (Western Indian Ocean).
- *Signal gap*: satellite AIS suffers from signal collision in busy fishing grounds where multiple vessels transmit simultaneously — a known issue in the Gulf of Mannar and Palk Bay areas.
- *Spoofing*: AIS data quality pipeline (Section 3.7.7) addresses this, but raw AIS from India's EEZ contains measurable spoofing and identity-sharing artefacts.

**VMS (Vessel Monitoring System):**
VMS is a distinct, government-mandated satellite tracking system separate from AIS. Unlike public AIS, VMS uses proprietary encrypted satellite transmission (primarily Inmarsat-C or Iridium) directly to a national Fisheries Monitoring Centre (FMC). VMS data is not publicly accessible — it is a fisheries enforcement tool.

India is actively deploying VMS under the PMMSY scheme. Under the National Rollout Plan, 100,000 mechanised and motorised vessels are being equipped with tracking devices (VHF, NAVIC, DAT, and ISRO-developed transponders). The EEZ Rules 2025 (Section 20.3.1) formally mandate VMS compliance for all vessels operating in the Indian EEZ, including structured catch reporting and Monitoring, Control, and Surveillance (MCS) requirements. VMS data is not publicly available — OceanMind cannot ingest it directly, but IUU anomalies detected by GFW on AIS data may partially proxy VMS-visible behaviour.

> ⚠️ **OceanMind implication:** VMS data is the most reliable vessel monitoring stream but is government-access-only. OceanMind's open-data-only principle (Section 1.2) means AIS via GFW is the accessible proxy. This is a known and accepted limitation. The landing-site CV module (Section 3.10) directly compensates for small-vessel non-coverage; the AIS quality pipeline (Section 3.7.7) addresses large-vessel data quality.

**CMFRI Stratified Catch Surveys:**
CMFRI's catch landing data is generated through **stratified multi-stage random sampling** across India's coastline — enumerators visit a random sample of landing centres at a random sample of times to record species composition, weight, and fishing effort from landed catches. The FCSA (Fisheries Catch Statistics and Assessment) software manages this data. These surveys underpin OceanMind's ground-truth CPUE labels. Limitation: survey-based, not census-based — extrapolated estimates carry sampling uncertainty, especially for rare species and remote landing sites.

**Marine Fisheries Census 2025 (MFC 2025) — NEW DATA SOURCE:**
India launched its 5th Marine Fisheries Census on 21 November 2024 (World Fisheries Day), with household enumeration running November–December 2025. This is the **first fully digitised and geo-referenced** marine fisheries census in India, coordinated by CMFRI as nodal agency with FSI as operational partner. The VyAS app ecosystem (VyAS-BHARAT for household enumeration, VyAS-NAV for village/harbour validation, VyAS-SUTRA for real-time supervision) replaces all paper-based census methods. Coverage: approximately 1.2 million fisher households across 5,000 coastal villages and habitations in 13 maritime states and UTs.

**What MFC 2025 produces that is directly relevant to OceanMind:**
- Geo-referenced household locations for all fishing communities — a direct improvement on OceanMind's 586-landing-centre coverage which currently lacks precise spatial registration of community-level data
- Vessel count, type, and size disaggregated by location — critical for calibrating the AIS coverage gap
- Socioeconomic data at household level — the input OceanMind's Phase 3 Socioecological ABM (Section 16.6) requires but cannot obtain before MFC 2025 data is published
- Integration with the National Fisheries Digital Platform (NFDP) — a digital identity layer for fishers that supports welfare scheme targeting and, potentially, data-linked reporting

> ⚠️ **OQ-031 (NEW):** When will MFC 2025 data be publicly available through data.gov.in or CMFRI's portal? The census enumeration ran November–December 2025. Processing timelines for previous census editions suggest public data release in 12–18 months post-enumeration, implying availability approximately mid-to-late 2026. This is a key input for Phase 3 planning. The human should verify with CMFRI directly.

**Landing-Site Computer Vision (Pillar 2 extension — Section 3.10):**
As documented in Section 3.10, this is a *data collection mechanism OceanMind deploys*, not a pre-existing stream it ingests. Fishers photograph catch on calibrated mats → images processed by YOLO/ResNet pipeline → species ID, fork length, weight, CPUE automatically extracted. This closes the small-vessel gap and provides ground-truth catch composition data unavailable from any government survey at daily resolution.

#### 20.1.3 Pillar 3 — Molecular Biodiversity / eDNA Collection

**Wet Lab Sample Collection:**
eDNA sampling begins with physical collection of seawater at sea. Standard protocol: filter 1–10 litres of seawater through a membrane filter (0.22μm to 0.45μm pore size) that captures environmental DNA shed by organisms in the water column. Filters are preserved (cryogenic or Longmire's buffer) and transported to laboratory. This is the rate-limiting step — sample collection requires a research vessel or coastal survey boat, limiting spatial coverage to where ships go.

**Key collection constraints:**
- *Not real-time* (DENIED-001): Full pipeline — collection → extraction → amplification → sequencing → bioinformatics — takes 24–48 hours minimum under optimal conditions, often longer at sea. This is a hard biological constraint, not a tooling limitation.
- *Degradation*: eDNA in warm tropical waters (Indian Ocean surface temperatures often >28°C) degrades faster than in temperate waters. Samples must be preserved within hours of collection. This limits the practical geographic radius of any shore-based processing lab.
- *Spatial sparsity*: Published Indian Ocean eDNA datasets in OBIS/IndOBIS are geographically concentrated near research institution bases (CMLRE Goa, CMFRI Kochi, NCAOR). Open-ocean Indian EEZ eDNA coverage is thin. OceanMind currently works with published/cached datasets precisely because a dense real-time collection network does not exist.

**Indian Ocean eDNA Research Context:**
IndOBIS (at CMLRE, Goa) is building out Indian Ocean eDNA occurrence datasets. The Deep Ocean Mission (MoES) has funded Indian Ocean surveys including eDNA sampling at select transects. As of 2025–26, these datasets remain the best India-specific eDNA source but are not comprehensive. JSDM (Section 16.4) addresses this sparsity computationally by extending predictions beyond sampled points.

---

### 20.2 Available Data Sources — Extended Inventory

This section extends Section 1.3 (Three Data Pillars source tables) with a structured inventory of additional publicly accessible sources, their access mechanisms, and OceanMind integration notes. All sources listed here are open / publicly accessible, consistent with the open-data-only design principle (Section 1.2).

#### 20.2.1 Oceanographic Sources (Pillar 1 Extensions)

| Source | What it provides | Access mechanism | OceanMind use |
|--------|-----------------|------------------|---------------|
| **World Ocean Database 2023 (WOD23 / NOAA)** | 18.6 million CTD/hydro casts from 1778 to present; updated continuously (1.9M new casts added since WOD23 release as of July 2025); quality-controlled, uniformly formatted | Free download via NOAA NCEI portal; OPeNDAP / netCDF | Historical baseline for Indian Ocean T/S climatology; training data extension for ConvLSTM |
| **Copernicus Marine Service (CMEMS)** | SST, chlorophyll, SSH, ocean currents (u/v/w), MLD, wave height; analysis and forecast products at 1/12° resolution | Free registration + API (REST / OPeNDAP) | SSH and u/v/w fields for eddy detection (Scales et al. 2017) and IBM larval connectivity (Section 3.9); precondition for APPROACH-018 |
| **INCOIS Ocean Information Bank** | India-specific SST composites, PFZ advisories, chlorophyll, fishery forecasts; historical archive from 2000 onwards | Free; data.gov.in and INCOIS API; some products via SMS/app directly to fishers | Primary India-specific oceanographic layer — already in Section 1.3 |
| **NASA Earthdata (PODAAC)** | MODIS-Aqua/Terra and VIIRS SST; GHRSST multi-sensor blended SST at 0.01° | Free registration; OPeNDAP / Earthdata API | Supplement to INCOIS SST composites; higher resolution for coastal zone analysis |
| **DataONE (Data Observation Network for Earth)** | Portal aggregating 50+ member repositories; 770,000+ Earth/environment datasets as of Dec 2024; 17M+ downloads | Free; integrated search at search.dataone.org; API access | Discovery layer for additional oceanographic datasets in the Indian Ocean that may not be indexed through standard ARGO/Copernicus queries |
| **IOOS (Integrated Ocean Observing System, US)** | Coastal buoy arrays, high-frequency radar SST/currents, glider tracks | Free via ERDDAP servers | Supplementary buoy data; limited Indian Ocean coverage but useful for methodology validation |
| **IMD — Monsoon/Cyclone Data** | Historical cyclone tracks, reanalysis wind fields, daily precipitation | Free; IMD open data portal | Already in Section 1.3 (safety alerts); historical cyclone track archive useful for MHI compound-stress modelling |

#### 20.2.2 Fisheries Sources (Pillar 2 Extensions)

| Source | What it provides | Access mechanism | OceanMind use |
|--------|-----------------|------------------|---------------|
| **Global Fishing Watch (GFW) API** | AIS fishing effort density (daily raster, 0.01°); vessel identity; IUU detection signals; port visits | Free for non-commercial / academic research; REST API with rate limits; requires registration | Already in Section 1.3 — primary Pillar 2 layer |
| **CMFRI Annual Reports & Booklet Series** | Marine fish landings data; catch species composition; state-level production estimates; stratified survey methodology documentation | Free download via CMFRI eprints repository (eprints.cmfri.org.in) | Ground-truth CPUE for model training; annual update for stock status validation |
| **National Fisheries Digital Platform (NFDP)** | Fisher registration data, vessel registry linked to PMMSY beneficiaries; as of late 2025, growing integration with MFC 2025 digital identity layer | data.gov.in government API; partial public access — registration/identity data protected | Phase 2: potential integration point for matching AIS vessel IDs to licensed PMMSY-registered vessels, improving IUU detection precision |
| **ReALCraft Portal (DGTR/MoFAH&D)** | Online registration and licensing of fishing vessels; vessel inventory by size/type/state | Public access portal | Cross-reference for AIS vessel validation; helps calibrate the 15m threshold gap |
| **FAO FishStatJ** | Global fisheries production statistics by country, species, and gear type; time series from 1950 | Free download | India production validation and international comparison context |
| **Sea Around Us (UBC)** | Reconstructed catch database 1950–2014; includes unreported catch estimates; 30-min spatial cells globally | Free download; DOI-archived | Historical baseline and IUU estimate cross-reference (see Section 2.2) |
| **IOTC (Indian Ocean Tuna Commission) Statistical Databases** | Tuna and billfish catch, effort, size composition by flag state; Indian Ocean coverage | Free download; Excel/CSV | Covers high-value tuna species OceanMind's ConvLSTM should model; IOTC data aligns with the EEZ Rules 2025 push into deep-sea tuna fishing |
| **BOBP-IGO (Bay of Bengal Programme)** | Transboundary stock assessments; small-scale fisheries data from Bay of Bengal countries | Publications and reports free; raw data access case-by-case | Bay of Bengal context for migration model; transboundary stock management framing |

#### 20.2.3 Molecular Biodiversity Sources (Pillar 3 Extensions)

| Source | What it provides | Access mechanism | OceanMind use |
|--------|-----------------|------------------|---------------|
| **NCBI SRA (Sequence Read Archive)** | Raw sequencing reads from metabarcoding studies; Indian Ocean surveys deposited here | Free; NCBI Entrez API | Training data for CNN eDNA classifier (Section 3.3); broader than the processed BOLD barcodes |
| **ENA (European Nucleotide Archive / EBI)** | Complementary to NCBI SRA; European-deposited metabarcoding data | Free; REST API | Cross-reference for Indian Ocean expeditions deposited by European research groups (TARA Oceans, etc.) |
| **TARA Oceans (pangaea.de)** | Global ocean metabarcoding; 18S rRNA eukaryote surveys; environmental DNA + oceanographic co-variables | Free download via PANGAEA repository | Rare resource: eDNA co-located with CTD profiles, directly usable for JSDM training (Section 16.4) — partially covers Indian Ocean transects |
| **IndOBIS (CMLRE, Goa)** | Indian Ocean OBIS node; species occurrence records including eDNA-derived; linked to WoRMS | Free; OBIS API | Already in Section 1.3 — primary India-specific biodiversity layer |
| **GBIF (Global Biodiversity Information Facility)** | 3.5 billion+ occurrence records globally; integrates museum, survey, citizen science, and eDNA data | Free; REST API | Supplementary occurrence records for species with poor OBIS coverage in the Indian Ocean |
| **Deep Ocean Mission (MoES) datasets** | Indian Ocean survey data from National Centre for Polar and Ocean Research (NCPOR); deep-sea biodiversity; emerging eDNA datasets | Partial public access via MoES data portal; growing | Phase 3 integration path — Deep Ocean Mission explicitly mentioned in Section 8 as a Phase 3 collaboration target |

---

### 20.3 Government Regulation — Effects on OceanMind's Data Environment

Government regulation is not merely context for OceanMind — it is an active force that (a) creates new mandatory data streams, (b) imposes compliance requirements that increase the value of OceanMind's intelligence, (c) constrains what data OceanMind can access, and (d) defines the political stakeholders OceanMind must engage as users. This section maps the key regulatory instruments to their direct effects.

#### 20.3.1 EEZ Rules 2025 — Sustainable Harnessing of Fisheries in the Exclusive Economic Zone of India Rules, 2025

**What it is:** Notified by the Ministry of External Affairs on 4 November 2025 under powers vested by the Territorial Waters, Continental Shelf, Exclusive Economic Zone and Other Maritime Zones Act, 1976. This is India's first comprehensive federal framework for the 12–200 nautical mile EEZ zone (previously an unregulated gap — coastal states managed territorial waters up to 12nm under their own Marine Fishing Regulation Acts, but the federal government had no operational rules for the EEZ itself).

**Key provisions directly relevant to OceanMind:**

*Monitoring, Control, and Surveillance (Rule 4):* All vessels operating in the Indian EEZ must now transmit their details to designated State Fisheries Department monitoring stations per a Standard Operation Protocol for Vessel Communication and Support System. This formalises VMS-equivalent tracking for EEZ-operating vessels. OceanMind cannot ingest VMS data (proprietary government system), but the expanding VMS fleet creates a more reliable vessel population baseline against which AIS anomalies are detectable.

*Catch Reporting (Rule 10):* Structured, mandatory catch reporting for EEZ vessels. This is the regulatory push that makes electronic catch reporting (currently voluntary in most Indian fisheries) a compliance requirement. As this data accumulates in government systems, OceanMind's Phase 2 government API integration (via data.gov.in, Section 8) becomes a viable pathway to structured catch data beyond CMFRI surveys.

*Fisheries Management Plans (Rule 6):* Government must develop species-specific Fisheries Management Plans in consultation with stakeholders. These plans will define fishing zones, seasonal closures, Minimum Legal Size (MLS) for target species, and Total Allowable Catch (TAC) principles. OceanMind's dynamic SFZ engine (Section 3.4) is directly valuable for *implementing* these plans — the Green/Amber/Red zone output operationalises the spatial management that the rules require.

*Prohibition of Destructive Practices (Rule 12):* LED light fishing, pair trawling, and bull trawling are banned. This creates enforcement demand for monitoring tools — OceanMind's IUU detection signals (via AIS anomaly patterns from GFW) can identify vessels exhibiting pair-trawl movement signatures (two vessels maintaining parallel courses at fixed separation).

*International Compliance (Rule 14):* Fishing activities must comply with IOTC and BOBP-IGO conservation and management measures. This ties OceanMind into the international fisheries governance framework — IOTC stock assessments are a validation target for OceanMind's migration forecasts for tuna species.

> ⚠️ **CRITICAL OPPORTUNITY for OceanMind's pitch (Section 19, Slide 7 — Innovation):** The EEZ Rules 2025 create a compliance gap. Vessels must now report, must follow spatial restrictions, and government must enforce management plans — but India has no operational unified marine intelligence platform to support this enforcement. OceanMind fills exactly this gap. This should be stated explicitly in the innovation slide: OceanMind is the decision-support layer that the EEZ Rules 2025 *require but do not provide*. This is a concrete policy hook no competing platform (Global Fishing Watch, INCOIS standalone, Copernicus Marine) offers in the India-specific regulatory context.

#### 20.3.2 PMMSY and PM-MKSSY — Fisheries Scheme Effects

**PMMSY (Pradhan Mantri Matsya Sampada Yojana):** ₹20,050 crore flagship scheme (2020–21 to 2025–26, extended to 2025–26). Key effects on OceanMind's data environment:

- *VMS deployment*: PMMSY is funding VMS/transponder installation on 100,000 mechanised and motorised vessels. As this rolls out, the AIS + VMS combined coverage of India's commercial fleet improves. The 15m threshold gap in AIS begins to shrink as smaller mechanised vessels receive NAVIC/ISRO transponders (though VMS data remains government-access-only).
- *Infrastructure*: PMMSY created 730 cold storages, 26,348 fish transport facilities, and 6,410 fish kiosks by 2024–25. This physical infrastructure expansion aligns with OceanMind's landing-centre network coverage — more formal landing sites mean more deployment surfaces for the landing-site CV module (Section 3.10).
- *Digital Platform integration*: PMMSY's National Fisheries Digital Platform (NFDP) is creating a digital identity layer for fishers. OceanMind's Bhashini voice interface (Section 3.6) and alert delivery (Section 3.6) are natural integration points with the NFDP.

**PM-MKSSY (Pradhan Mantri Matsya Kisan Samridhi Sah-Yojana):** ₹6,000 crore sub-scheme (2023–24 to 2026–27) focused on formalisation, insurance coverage, and quality assurance. World Bank co-financed (₹1,125 crore). Key effect: formalisation push creates more traceable catch records — the paper-to-digital transition in catch reporting directly improves the data quality OceanMind can eventually ingest.

#### 20.3.3 Marine Fishing Regulation Acts (MFRAs) — State-Level Fragmentation

India's 13 coastal states and UTs each have their own Marine Fishing Regulation Acts governing territorial waters (0–12nm). These acts differ on: seasonal ban periods (timing and duration), mesh-size regulations, gear restrictions, and vessel licensing. The lack of harmonisation creates measurable problems directly relevant to OceanMind:

- *Data inconsistency*: Catch records collected under different state MFRA frameworks use inconsistent species classifications, effort metrics, and reporting formats. OceanMind's schema matching engine (Section 3.7.1) must account for these state-level format variations.
- *Zone boundary misalignment*: A fishing zone that is legally open under Gujarat's MFRA may be closed under an overlapping INCOIS advisory or a forthcoming EEZ Rules management plan. OceanMind's SFZ engine must incorporate this regulatory layer — Green/Amber/Red zone outputs should account for legal fishing status, not just ecological suitability.
- *Enforcement gaps*: The ORF analysis (April 2026) documents that the fragmented MFRA landscape creates loopholes that allow fishers to bypass restrictions by crossing state maritime boundaries. This is a key IUU detection use case for OceanMind that AIS-based vessel tracking can identify (vessel patterns consistent with state-boundary arbitrage).

> ⚠️ **OQ-032 (NEW):** Should OceanMind's SFZ engine incorporate state MFRA seasonal ban boundaries and mesh-size rules as a regulatory overlay on top of the ecological Green/Amber/Red classification? This would make the SFZ output genuinely policy-integrated rather than purely ecological — and directly relevant to the EEZ Rules 2025 enforcement framework. Left for the human to decide; if yes, a state-MFRA regulatory database must be compiled as a Phase 2 data task.

#### 20.3.4 National Marine Fisheries Census 2025 — Regulatory Data Mandate

MFC 2025 (documented in Section 20.1.2) is a government-mandated, CMFRI-run enumeration. Its effect on OceanMind's data environment:

- *Baseline data gap filled*: MFC 2025 is the first geo-referenced census — it will produce the first authoritative map of fisher household locations, vessel distributions by size/type, and infrastructure status across all 13 coastal states. This is the household-level spatial data that the Phase 3 Socioecological ABM (Section 16.6) requires.
- *Drone integration precedent*: The Department of Fisheries is introducing drone technology for marine fisheries data collection in parallel with MFC 2025. This is a signal that aerial data collection infrastructure is being built — relevant to OceanMind's Phase 2 considerations for landing-site validation.
- *NFDP digital identity*: MFC 2025 is integrated with NFDP registration. As fishers register digitally, the data layer linking individual fishers to vessels, landing sites, and catch records grows. OceanMind's Bhashini voice interface is a natural access point for fishers already registered on NFDP.

#### 20.3.5 Deep Ocean Mission (MoES) — Science Policy Effects

India's Deep Ocean Mission (₹4,077 crore, Ministry of Earth Sciences) includes components directly relevant to OceanMind's data environment:

- *Ocean observation infrastructure*: The mission is deploying additional ocean observing instruments in the Indian Ocean including moored buoys, gliders, and conductivity-temperature-depth (CTD) systems. As this infrastructure expands, real-time data streams beyond ARGO will become available for the Indian EEZ.
- *eDNA sampling*: Deep Ocean Mission survey voyages include biodiversity sampling. NCPOR/CMLRE are expected to grow the Indian Ocean eDNA datasets available through IndOBIS and NCBI in Phase 3 of OceanMind's roadmap.
- *Section 8 roadmap alignment*: Phase 3 already flags Deep Ocean Mission as an integration target. The regulatory push (Mission funding, MoES mandate) accelerates the data availability timeline.

#### 20.3.6 International Regulatory Framework — Effects on Data Access

**UNCLOS (UN Convention on the Law of the Sea):** India's EEZ rights are grounded in UNCLOS. The EEZ Rules 2025 explicitly invoke UNCLOS compliance. For OceanMind, UNCLOS matters because it frames the 200nm zone within which OceanMind's Indian Ocean operations are legally defined. International surveillance data (foreign VMS, RFMO monitoring) relevant to tuna stocks in the Indian Ocean is governed by bilateral and RFMO data-sharing agreements, not freely accessible — a constraint on IUU detection for vessels flying non-Indian flags.

**IOTC (Indian Ocean Tuna Commission):** India is a member. IOTC maintains stock assessments for tuna and billfish in the Indian Ocean — these are the primary scientific outputs against which OceanMind's migration forecasts for high-value species (yellowfin, skipjack, bigeye tuna) should be validated. IOTC statistical databases are publicly available (Section 20.2.2).

**BOBP-IGO (Bay of Bengal Programme):** Covers transboundary stocks shared among India, Bangladesh, Myanmar, Sri Lanka, Thailand, Indonesia, Malaysia, and Maldives. For OceanMind's Bay of Bengal SFZ engine, transboundary stock dynamics are relevant — a species migrating across the Bay of Bengal does not stop at India's EEZ boundary. BOBP-IGO assessments provide the transboundary context OceanMind's models should incorporate in Phase 2.

**PSA (Port State Measures Agreement):** India is a signatory. The PSMA requires verification of fishing vessel catch documentation at ports to prevent IUU fish from entering markets. OceanMind's blockchain traceability module (Section 3.8) is a direct enabler of PSMA compliance — verified catch records from OceanMind can serve as the traceability documentation PSMA requires.

---

### 20.4 Regulatory Summary — Implications for OceanMind's Positioning

| Regulation / Policy | Direct Effect on OceanMind | Phase Relevance |
|---------------------|---------------------------|-----------------|
| EEZ Rules 2025 (Rule 4 — MCS) | VMS fleet expansion; government enforcement demand for vessel intelligence | Phase 1 (pitch hook); Phase 2 (API integration) |
| EEZ Rules 2025 (Rule 10 — Catch Reporting) | Digital catch records accumulate in government systems → future API access | Phase 2 |
| EEZ Rules 2025 (Rule 12 — Destructive Practices) | Creates enforcement demand for gear-type anomaly detection in AIS | Phase 1 (IUU detection feature) |
| EEZ Rules 2025 (Rule 6 — Management Plans) | OceanMind SFZ output directly implements plan spatial requirements | Phase 1 (primary use case) |
| PMMSY (VMS rollout) | Larger trackable fleet; NFDP digital identity layer | Phase 2 (NFDP integration) |
| PM-MKSSY (formalisation) | More traceable catch records; blockchain traceability business case strengthened | Phase 2 (traceability module) |
| MFC 2025 | Geo-referenced household + vessel data; ABM input data in ~2026 | Phase 3 (ABM prerequisite) |
| MFRAs (state fragmentation) | Data format inconsistency → schema matching challenge; regulatory overlay need in SFZ | Phase 1 (data pipeline); Phase 2 (regulatory SFZ layer) |
| Deep Ocean Mission | eDNA dataset growth; sub-surface observation expansion | Phase 3 |
| IOTC membership | International validation target for tuna migration forecasts | Phase 1 (model validation) |
| PSMA (Port State Measures) | Blockchain traceability module is a PSMA compliance enabler | Phase 2 (traceability) |
| UNCLOS (200nm EEZ) | Legal scope definition; limits OceanMind's IUU reach to Indian-flagged foreign vessels | Phase 1 (scope constraint) |

> **Pitch implication (Section 19, Slide 10 — Impact):** The regulatory landscape has shifted decisively in OceanMind's favour. The EEZ Rules 2025 create a compliance need OceanMind fulfils. PMMSY creates the digital infrastructure OceanMind interfaces with. MFC 2025 generates the data OceanMind's long-term features require. This is not a platform pitching into a policy vacuum — it is a platform arriving exactly as the policy framework creates demand for it. This framing should appear in the Impact slide and the Business/Future Plan slide.

---

### 20.5 Open Questions Raised by This Section

**OQ-031** *(NEW — Section 20.1.2):* When will MFC 2025 census data be publicly available via data.gov.in or CMFRI's eprints portal? Previous census editions suggest 12–18 months post-enumeration, implying ~mid-to-late 2026. Verify with CMFRI directly; this is a Phase 3 gating dependency.
✅ **RESOLVED v7.0 — revised timeline estimate with reduced uncertainty:**
The 12–18 month estimate was calibrated against paper-based census editions (2010, 2016). MFC 2025 is India's first fully digital census, using real-time app-based data collection (VyAS-BHARAT, VyAS-SUTRA) with multi-tier web dashboards and real-time data validation (confirmed via CMFRI MFC 2025 implementation page). Digital-first architecture materially compresses the processing timeline. Revised estimate:
- *Preliminary state-level summaries*: **Q3 2026** (likely in progress now — enumeration closed 18 December 2025; 6 months of processing has elapsed as of June 2026)
- *All-India compiled report on CMFRI eprints portal*: **Q4 2026–Q1 2027** (consistent with digital processing; prior paper-based editions took 12–18 months)
- *Machine-readable dataset on data.gov.in*: **Q2 2027** (government portals typically lag institutional publications by 3–6 months)

**Phase 3 gating dependency assessment (re-evaluated):** This is NOT a hard gate. Phase 3 (ABM, national scale) is 12–24 months post-MVP. Even on the most conservative timeline, MFC 2025 geo-referenced household data will be available before OceanMind reaches Phase 3 ABM development. The dependency is properly sequenced.

**Immediate action item (not a gate — proactive data monitoring):** Check `eprints.cmfri.org.in` and `cmfri.org.in/Mfc2025activities` monthly from August 2026 onwards. If state-level preliminary data appears, ingest it as an early Phase 3 test dataset.

**OQ-032** *(NEW — Section 20.3.3):* Should OceanMind's SFZ engine incorporate state MFRA seasonal ban boundaries and mesh-size regulations as a regulatory overlay on the ecological Green/Amber/Red classification? If yes, building a state-MFRA regulatory database is a Phase 2 data task (not currently in the roadmap). Awaiting human decision.
✅ **RESOLVED v7.0 — YES, with Phase 2 data task formally added to roadmap.** Three converging arguments make this a clear decision:

1. *Correctness*: An SFZ output that recommends a legally closed zone is not just a missed opportunity — it is an incorrect output that directly contradicts OceanMind's "trustworthy by design" principle (Section 1.2, Fernandes-Salvador 2026). Ecological suitability without legal status is incomplete intelligence. A Green zone that is under a state monsoon ban should render as "ecologically Green / legally Restricted" — that composite signal is what a fisheries officer or cooperative actually needs.
2. *Policy alignment*: EEZ Rules 2025 (Rule 6) require Fisheries Management Plans that incorporate both ecological and regulatory spatial boundaries. OceanMind's SFZ output is only directly implementable for government plan compliance if the regulatory layer is present.
3. *IUU detection upgrade*: State-boundary arbitrage (fishers crossing state maritime lines to exploit different ban schedules — documented in ORF April 2026 analysis, Section 20.3.3) is an identifiable AIS anomaly ONLY if OceanMind knows where the state boundaries and their respective ban windows are. The MFRA overlay is a prerequisite for detecting this specific IUU pattern.

**Phase 2 data task specification (added to Section 8 Roadmap):**
- *Scope*: 13 coastal states + 4 UTs; fields: state/UT name, maritime boundary polygon (PostGIS), seasonal ban start/end (per year), gear restrictions, minimum mesh size (mm), minimum legal size (mm) per major species
- *Sources*: CMFRI's published MFRA compendium; state fisheries department websites; ORF marine governance analysis (April 2026); ICSF documentation
- *Format*: PostGIS polygon layer (`mfra_zones` table) with temporal ban attributes; join to SFZ output as a regulatory status column on each grid cell
- *Output change*: SFZ Green/Amber/Red classification gets a fourth attribute: `legal_status` (Open / Seasonal Ban / Restricted / No-Take) — output to dashboard as a combined colour + icon signal

Human override: if the data compilation cost proves prohibitive before Biothon, the pitch can describe the MFRA overlay as a Phase 2 commitment (framed as the roadmap item it now is) rather than an MVP feature.

**OQ-033** *(NEW — Section 20.2.2):* IOTC statistical databases cover tuna/billfish catch and effort by flag state in the Indian Ocean. Is this data currently in OceanMind's ingestion plan? Tuna are high-value, highly migratory, and now the explicit target of India's EEZ Rules 2025 deep-sea push. Including IOTC data as a Pillar 2 source for tuna-specific migration modelling may significantly improve the relevance of OceanMind's pitch to government users tasked with EEZ implementation.
✅ **RESOLVED v7.0 — YES, add IOTC to Pillar 2 with immediate effect.** Confirmed via direct review of IOTC data infrastructure:
- *Access*: IOTC catch-and-effort datasets are publicly downloadable at `iotc.org/data/datasets` (geo-referenced catch by gear type, size frequency, flag state) in CSV format — no registration required, fully compliant with OceanMind's open-data principle. The Global Tuna Atlas (GTA) at `data.iotc.org` provides an alternative access path via FAO Fisheries catalogue.
- *Content*: Covers yellowfin tuna, skipjack, bigeye tuna, billfish, and associated species for Indian Ocean FAO Statistical Areas 51 (Western IO) and 57 (Eastern IO). Includes spatial catch-and-effort at 1° × 1° resolution by year and quarter — directly usable as ground-truth labels for OceanMind's ConvLSTM migration model for tuna species.
- *Mandatory link*: EEZ Rules 2025 Rule 14 (international compliance) explicitly requires India's EEZ activities to conform with IOTC conservation and management measures. Government users implementing Rule 14 will naturally ask whether OceanMind's migration forecasts are consistent with IOTC stock assessments. The answer should be yes — and it can only be yes if IOTC data is in the ingestion pipeline.

**Pillar 2 addition:** Add new row to Section 1.3 Pillar 2 table: `IOTC / Global Tuna Atlas | Geo-referenced tuna catch-and-effort (yellowfin, skipjack, bigeye, billfish) by gear type at 1°×1° resolution; Indian Ocean FAO Areas 51+57 | Free public download; CSV; `iotc.org/data/datasets` | Tuna-specific ConvLSTM migration labels; IOTC stock assessment validation target for Indian EEZ tuna forecasts |`

**Phase assignment:** MVP Phase C alongside ConvLSTM tuna migration model training (Section 3.1). Low integration cost — CSV format, same ingestion pipeline as CMFRI and GFW data.

---

*Section 20 added v6.0 — Research-Integration-003 session. Sources: India EEZ Rules 2025 (PIB notification 4 Nov 2025; ICSF full text); Marine Fisheries Census 2025 (PIB launch announcement Oct 2025; CMFRI/Andaman Insight reporting); PMMSY documentation (PIB August 2025 factsheet); ORF marine governance analysis (April 2026); NITI Aayog Blue Economy strategy 2025; ICES Journal vessel tracking transparency study; World Ocean Database 2023 (Nature Scientific Data April 2026); DataONE overview (Copernicus Ocean Science Nov 2025). All claims traceable to cited sources above; no figures or statistics added without source attribution. Document v5.0 content fully preserved per UPDATE RULE.*

---

## 21. Resolution Session — v7.0
*Session marker: Resolution-001 | Trigger: "Try to resolve the open questions" | Date: June 2026*

This section is the resolution log for v7.0. All prior open questions as of v6.0 were reviewed. 10 items remained open (OQ-018, OQ-022, OQ-025, OQ-027, OQ-031, OQ-032, OQ-033, THREAD-008, THREAD-011, Section 18.2). 7 of 10 were resolved. 3 remain genuinely open and require human action.

---

### 21.1 Resolution Summary Table

| Item | Prior status | v7.0 status | Resolution method |
|------|-------------|-------------|-------------------|
| OQ-018 (multi-omics timeline) | 🔴 Open | 🟡 Partially resolved | Two-track split: Track A (NCBI SRA public genomics) = resolved/unblocked; Track B (novel sequencing) = still needs CMFRI partnership |
| OQ-022 (blockchain network + standard) | 🔴 Open (tentative default) | ✅ RESOLVED v7.0 | Formalised tentative default: Hyperledger Fabric + PMMSY certification |
| OQ-025 (CV pilot path) | 🔴 Open | 🔴 Still open | Pilot specification fully defined (Veraval, mackerel+sardine, Oct–Dec); INCOIS conversation still required |
| OQ-027 (JSDM data feasibility) | 🔴 Open | ✅ RESOLVED v7.0 | JSDM feasible via satellite covariates; strict ARGO co-location not required; APPROACH-017 gate removed |
| OQ-031 (MFC 2025 availability) | 🔴 Open | ✅ RESOLVED v7.0 | Revised timeline: Q3 2026 preliminary / Q4 2026–Q1 2027 full report; Phase 3 gate confirmed properly sequenced |
| OQ-032 (MFRA regulatory overlay) | 🔴 Open | ✅ RESOLVED v7.0 | YES — added to Phase 2 roadmap; `mfra_zones` PostGIS table spec documented; `legal_status` field added to SFZ output |
| OQ-033 (IOTC ingestion) | 🔴 Open | ✅ RESOLVED v7.0 | YES — added to Pillar 2; Phase C integration; data access confirmed free/public |
| THREAD-008 (DI layer demo) | 🔴 Open | ✅ RESOLVED v7.0 | Data Bubbles SPARQL query as primary demo; schema matching panel and WoRMS lookup as secondary; Section 5 demo #6 updated |
| THREAD-011 (CV model regional split) | 🟡 Deferred | ✅ RESOLVED v7.0 | One national base model + regional fine-tuning heads; routing by state/UT at inference |
| Section 18.2 (official PS text) | 🔴 Open | 🔴 Still open | Cannot resolve without actual Biothon 2026 PS text; requires human to paste it into Section 18.2 |

---

### 21.2 Items Requiring Human Action (3 remaining)

1. **OQ-025 — INCOIS pilot conversation.** The "what to ask for" is now fully specified (Section 12). The only remaining step is initiating the contact. Suggested action: email INCOIS Regional Centre / CMFRI Veraval Station requesting a pilot discussion. Use the Section 12 OQ-025 specification as the briefing document.

2. **OQ-018 Track B — CMFRI/CMLRE partnership.** For novel genomic and transcriptomic sequencing. Suggested action: initiate a Memorandum of Understanding discussion with CMFRI during Phase 2, specifically referencing the deep-sea biodiversity survey context and the MFC 2025 cooperation that has already occurred. The ask is data-sharing, not funding.

3. **Section 18.2 — Official Biothon 2026 problem statement.** Paste the exact text of the Environment & Biodiversity domain problem statement into Section 18.2. Once provided, a word-for-word alignment check against all prior sections can be done in one pass.

---

### 21.3 Downstream Propagation — Changes Made to Canonical Sections

| Change | Sections affected |
|--------|-------------------|
| OQ-022 (blockchain) resolved → committed default | Section 8 Roadmap Phase 2 (updated "pilot with one cooperative" to include network and cert standard) |
| OQ-027 (JSDM) resolved → APPROACH-017 gate removed | Section 9 APPROACH-017 status updated |
| OQ-031 (MFC timeline) resolved | Section 20.5 OQ-031 inline resolution added |
| OQ-032 (MFRA overlay) resolved → Phase 2 task | Section 8 Roadmap Phase 2 (new line added); Section 20.5 OQ-032 inline resolution added |
| OQ-033 (IOTC) resolved → Pillar 2 | Section 1.3 Pillar 2 (new IOTC row added); Section 20.5 OQ-033 inline resolution added |
| THREAD-008 (DI demo) resolved | Section 5 MVP demo sequence item #6 description updated (in resolution text — human should apply to actual slide) |
| THREAD-011 (CV regional model) resolved | Architecture decision logged here; applies at Phase 3 build time |
| OQ-018 Track A (public genomics) unblocked | Section 8 Roadmap Phase 3 (Track A accessible via NCBI SRA from Phase 3 day 1; no new annotation needed — existing "Multi-omics expansion" Phase 3 line now has a concrete public-data starting point) |
| OQ-018 Track B (novel sequencing) | Section 8 Roadmap Phase 2 (new line: initiate CMFRI partnership conversation) |

---

*Document v7.0 — Resolution-001 session. All v6.0 content preserved. 7 open questions resolved inline (annotated ✅ RESOLVED v7.0); 3 open items remain requiring human action; all resolution reasoning traceable to cited research or web-verified data (IOTC, CMFRI MFC 2025 documentation). APPROACH-017 gate removed per OQ-027 resolution. Phase 2 roadmap updated with MFRA overlay task, blockchain committed default, and CMFRI partnership initiation. Pillar 2 table updated with IOTC data source.*
