OceanMind — Technical Requirements Document	Biothon 2026

**OceanMind**

Technical Requirements Document (TRD)

*AI-Driven Unified Marine Data Intelligence Platform*

Biothon 2026 — Environment & Biodiversity Domain

Marwadi University, Dept. of Bioinformatics

Version 1.0  |  Derived from Ideation Document v7.0


# **1. System Architecture Overview**
OceanMind is a five-layer architecture: (1) Data Sources, (2) Data Integration & Storage Layer, (3) ML/AI Processing Layer, (4) API & Backend Layer, (5) Frontend & User Interface Layer. Data flows from heterogeneous open sources through a unified integration layer into specialised ML models whose outputs are delivered to users via a RESTful API and rendered in web/mobile/voice interfaces.

|**Layer**|**Components**|**Technology**|
| :- | :- | :- |
|Layer 1 — Data Sources|ARGO GDAC, INCOIS, Copernicus CMEMS, GFW, CMFRI, NCBI, IndOBIS, IOTC, IMD, WOD23, GBIF|NetCDF, JSON, FASTA, CSV, REST APIs|
|Layer 2 — Data Integration|Schema matching, OBDA/SPARQL, entity resolution, AIS quality pipeline, data bubbles, provenance tagging|PostgreSQL/PostGIS, Apache Jena/RDFLib, Gensim, Flair NER|
|Layer 3 — ML / AI|ConvLSTM migration, XGBoost SFZ, 1D CNN eDNA, YOLOv8/v9 CV, JSDM, RAG interface, Isolation Forest MHI|PyTorch, scikit-learn, HMSC, LangChain, FAISS|
|Layer 4 — API / Backend|RESTful endpoints, SPARQL, Bhashini, alert dispatch, blockchain traceability (Phase 2)|FastAPI, Python 3.11+, Twilio, Firebase, Hyperledger Fabric (Phase 2)|
|Layer 5 — Frontend / UX|Web dashboard, geospatial map, voice interface, mobile app|React/Next.js, Leaflet.js + Plotly, Streamlit (MVP), Bhashini API|


# **2. Data Sources & Ingestion**
## **2.1 Pillar 1 — Oceanographic Data**

|**Source**|**Data Type / Format**|**Ingestion Method**|**Cadence**|
| :- | :- | :- | :- |
|ARGO GDAC (Coriolis/US-GODAE)|CTD T/S profiles; NetCDF; ~3,500 active floats; 100,000+ profiles/yr|GDAC FTP/OPeNDAP; Xarray + NetCDF4; Iridium satellite within 24h of float surfacing|~10-day per float; ~daily new profiles globally|
|INCOIS (MoES)|SST composites, chlorophyll-a, PFZ advisories, ocean info bank; JSON/GeoTIFF|INCOIS API + data.gov.in; raster ingestion via GDAL/Xarray|Daily to twice-weekly composites|
|Copernicus CMEMS|SST, chlorophyll, SSH/sea level anomaly, u/v/w currents, MLD, wave height; NetCDF|Copernicus Marine API (REST / OPeNDAP); free registration|Daily analysis; 5-day forecast|
|NASA Earthdata (PODAAC)|MODIS-Aqua/Terra + VIIRS SST at 0.01° resolution; NetCDF/HDF|Earthdata API; OPeNDAP; free registration|Daily overpass; 1-day composites|
|World Ocean Database 2023 (NOAA NCEI)|18\.6M CTD casts (1778–present); quality-controlled; NetCDF|NOAA NCEI portal; OPeNDAP; free download|Continuous (updated periodically)|
|IMD|Weather forecasts, cyclone tracks, wind fields; JSON/CSV|IMD open data portal API|Daily to hourly for severe events|

## **2.2 Pillar 2 — Fisheries Data**

|**Source**|**Data Type / Format**|**Ingestion Method**|**Cadence**|
| :- | :- | :- | :- |
|Global Fishing Watch (GFW)|AIS fishing effort density raster (0.01°, daily); vessel identity; IUU signals; CSV/GeoJSON|GFW REST API; free non-commercial academic; rate limits apply|Daily|
|INCOIS PFZ Advisories|Twice-weekly to daily advisories (SST + chlorophyll derived)|INCOIS API; already in Pillar 1 ingestion|Daily to twice-weekly|
|CMFRI Catch Statistics (FCSA)|Marine fish landings; species composition; CPUE estimates; stratified surveys; CSV|CMFRI eprints repository (eprints.cmfri.org.in); manual download + scheduled pull|Annual reports; monthly provisional|
|IOTC / Global Tuna Atlas|Tuna catch-and-effort (yellowfin, skipjack, bigeye, billfish) by gear type; 1°x1° resolution; Indian Ocean FAO Areas 51+57; CSV|Free download: iotc.org/data/datasets; GTA: data.iotc.org|Annual IOTC datasets; quarterly updates|
|FAO FishBase|Fish biology, feeding habits, migration patterns, breeding records|FishBase REST API|Static reference + periodic updates|
|ReALCraft Portal (DGTR)|Vessel registration and licensing by size/type/state|Public portal download|As updated|
|MFC 2025 (CMFRI/Dept. of Fisheries)|Geo-referenced fisher household data; vessel inventory; digital identity layer; Q3 2026 preliminary expected (OQ-031 resolved)|data.gov.in + CMFRI eprints; check monthly from Aug 2026|Census (once); preliminary Q3 2026|

## **2.3 Pillar 3 — Molecular Biodiversity / eDNA**

|**Source**|**Data Type / Format**|**Ingestion Method**|**Use in OceanMind**|
| :- | :- | :- | :- |
|NCBI SRA + GenBank|Raw sequencing reads (FASTQ); metabarcoding datasets; population genetics (COI, mtDNA, RADseq) for Indian Ocean target species|NCBI Entrez API (Biopython); BLAST+ for sequence alignment|eDNA CNN training data; Phase 3 population genomics (Track A, unblocked)|
|EBI / ENA (European Nucleotide Archive)|Complementary metabarcoding datasets; TARA Oceans Indian Ocean transects|ENA REST API; free|Cross-reference for NCBI; TARA provides eDNA co-located with CTD for JSDM training|
|IndOBIS (CMLRE, Goa)|Indian Ocean OBIS node; georeferenced species occurrence records; eDNA-derived|OBIS API; free|Primary India-specific biodiversity layer; JSDM occurrence records|
|OBIS (global)|100M+ species occurrence records globally|OBIS REST API; free|Supplementary occurrence records for JSDM environmental covariate assignment|
|BOLD (Barcode of Life)|Reference DNA barcodes by species|BOLD API; free|1D CNN reference training; WoRMS ID cross-reference|
|GBIF|3\.5B+ occurrence records; integrates museum, survey, citizen science, eDNA|GBIF REST API; free|Supplementary occurrence for species with low IndOBIS coverage|
|TARA Oceans (PANGAEA)|Global metabarcoding + oceanographic co-variables; covers Indian Ocean transects|Free download via PANGAEA repository|JSDM training data — rare resource with eDNA co-located with CTD profiles|


# **3. Data Integration Layer**
The Data Integration Layer is the backbone that makes the three-pillar architecture genuinely unified. It implements the three-phase DI process (Sagi et al. 2020): Discover → Merge → Evaluate/Correct.

## **3.1 Schema Matching & Mapping Engine**
Aligns field names and semantics across heterogeneous source formats to OceanMind's unified mediated schema.

|**Source Format**|**Sample Field**|**OceanMind Schema Field**|**Conversion**|
| :- | :- | :- | :- |
|ARGO NetCDF|TEMP [°C], PSAL [PSU], PRES [dbar]|temperature\_c, salinity\_psu, depth\_m|dbar → m: depth\_m = 0.994 \* pres + 0.0002 \* pres^2; PSU dimensionless|
|INCOIS SST JSON|sea\_surface\_temperature, salinity|temperature\_c, salinity\_psu|Direct mapping; unit normalisation|
|NCBI FASTA|Sequence ID, sequence string, taxonomy|sequence\_id, dna\_sequence, species\_name (WoRMS normalised)|BLAST alignment; WoRMS API for canonical name|
|CMFRI CSV|SpeciesName (regional), Weight\_kg, LandingSite|species\_name (WoRMS), weight\_kg, landing\_site\_id|WoRMS entity resolution; site ID lookup|
|GFW AIS JSON|lat, lon, fishing\_hours, mmsi|latitude, longitude, fishing\_effort\_h, vessel\_mmsi (deduped)|AIS quality pipeline first|

- Tool candidates: COMA schema matching framework; GeoLink ontology SPARQL mappings; custom mapping for INCOIS-specific fields
- Generates conversion functions for unit mismatches automatically where patterns are known

## **3.2 OBDA Layer — Ontology-Based Data Access**
Maps OceanMind's PostgreSQL/PostGIS schema to marine domain ontologies and exposes a SPARQL endpoint for ontological queries.

|**Ontology**|**Coverage**|**OceanMind Use**|
| :- | :- | :- |
|GeoLink / OceanLink|Interdisciplinary oceanographic data discovery; SPARQL at data.geolink.org|Schema alignment for ARGO, satellite, and sensor data; cross-dataset discovery|
|MarineTLO|Marine species, ecosystems, fishers; taxonomic hierarchy|Species-level entity resolution for eDNA + FishBase integration|
|WoRMS (World Register of Marine Species)|Canonical marine species taxonomy; AphiaID for every species|Taxonomic normalisation across NCBI, IndOBIS, BOLD, CMFRI|
|SWEET (NASA)|6,000+ Earth and environmental science concepts|Oceanographic parameter alignment across source datasets|

- Tools: Apache Jena (TDB triplestore) + RDFLib (Python); SPARQL 1.1 endpoint
- Example query: "SELECT all datasets containing any diatom species within 200km of Gujarat coast in the last 30 days"

## **3.3 Data Bubbles — Spatiotemporal Fusion Abstraction**
Replaces bespoke per-dataset-pair fusion rules with a single generic join key as the number of data sources grows (Aguzzi et al. 2025).

### **PostGIS Schema**
CREATE TABLE data\_bubbles (

`  `bubble\_id     SERIAL PRIMARY KEY,

`  `geom          GEOMETRY(POINT, 4326),

`  `radius\_km     FLOAT,  -- adaptive: 5km coastal / 50km open ocean

`  `time\_window\_start  TIMESTAMPTZ,

`  `time\_window\_end    TIMESTAMPTZ

);

-- bubble\_id FK added to every observation table:

ALTER TABLE argo\_profiles    ADD COLUMN bubble\_id INT REFERENCES data\_bubbles(bubble\_id);

ALTER TABLE incois\_sst       ADD COLUMN bubble\_id INT REFERENCES data\_bubbles(bubble\_id);

ALTER TABLE gfw\_ais          ADD COLUMN bubble\_id INT REFERENCES data\_bubbles(bubble\_id);

ALTER TABLE edna\_occurrences ADD COLUMN bubble\_id INT REFERENCES data\_bubbles(bubble\_id);

ALTER TABLE landing\_site\_cv  ADD COLUMN bubble\_id INT REFERENCES data\_bubbles(bubble\_id);

- NetCDF CF Conventions feature type per source: ARGO → Profile; INCOIS SST → Grid; AIS → Trajectory; eDNA/CV → Point
- Primary MVP demo: one SPARQL query across bubble\_id = 'B-247' returns rows from ARGO, INCOIS SST, and landing-site CV in a unified result table (THREAD-008 resolved)

## **3.4 Entity Resolution Engine**
- Deduplicates records across ARGO, IndOBIS, OBIS, NCBI: blocking on (geo-coordinates + date + parameter type) for sensor records; taxon barcode sequence for eDNA records
- Resolves taxonomic synonyms using WoRMS AphiaID as the canonical key (e.g., "Rastrelliger kanagurta" in CMFRI → AphiaID 217044 in WoRMS → linked in BOLD and FishBase)
- Identifies multi-repository duplicates before model training to prevent data leakage

## **3.5 AIS Data Quality Pipeline**
Stage 0 preprocessing between raw GFW download and ais\_processed table. Source: Yang et al. 2024. Mandatory correctness fix — not optional enhancement.

|**Step**|**Method**|**Addresses**|
| :- | :- | :- |
|MMSI Deduplication|Flag/resolve multiple physical vessels sharing one MMSI; cross-reference ReALCraft vessel registry|AIS identity conflicts that corrupt IUU anomaly signal|
|Trajectory Gap Filling|Linear/Kalman interpolation for short gaps (< 6h); LSTM-based reconstruction for longer gaps|Signal loss in coastal AIS coverage shadow zones|
|Outlier Removal|DBSCAN on (position, speed) to identify physically impossible positional jumps ("teleportation")|AIS data artifacts appearing as anomaly signal|
|Spoofing Detection|Vessel stationary at port while logbook shows at sea; positional jumps > rated max speed|Deliberate AIS manipulation — key IUU precursor|
|Route Clustering (DBSCAN-SD)|DBSCAN extended with SOG/COG as non-spatial features; extracts typical fishing routes per area/season|Richer baseline for SFZ model vs. raw effort density raster|

*⚠ Attribution: DBSCAN-SD original algorithm attributed to Vespe et al. (AIS literature). Yang et al. 2024 is the survey citation. Cite Vespe et al. if challenged on the algorithm.*

## **3.6 Data Quality & Provenance Layer**
- Every ingested record tagged: source\_system, ingestion\_ts, schema\_version, quality\_flag, fusion\_method
- Quality flags: GOOD, PROBABLY\_GOOD, BAD, MISSING (aligned with ARGO Argo QC conventions)
- Provenance exposed through RAG interface: every AI-generated answer traces to specific source records
- Required for Fernandes-Salvador et al. 2026 Trustworthy AI compliance


# **4. ML / AI Models**
## **4.1 Fish Migration Prediction — ConvLSTM**
Primary architecture. Handles spatial structure of the ocean grid natively by performing convolution on the LSTM hidden state — capturing spatial propagation of oceanographic signals (e.g., an SST anomaly spreading westward across the Arabian Sea).

|**Component**|**Specification**|
| :- | :- |
|Architecture|ConvLSTM (CATCH model, Agmata & Guðmundsson 2025 Biology Methods & Protocols)|
|Input tensor|(batch, time\_steps=52\_weeks, height=grid\_H, width=grid\_W, features=11) — 11-feature vector per grid cell|
|Input features|SST weekly composite + anomaly, Chl-a, MLD (ARGO), u/v ocean currents, DO, AIS fishing effort density, SSH anomaly, ILD, wind stress curl|
|Output|Probability distribution map over Indian EEZ grid (migration zones) for target week + confidence intervals (MC Dropout)|
|Uncertainty quantification|Monte Carlo Dropout at inference (OQ-021 resolved): retain dropout layers active during inference; run N=50 stochastic forward passes; compute mean + std as confidence interval|
|Benchmark|2-layer LSTM (128 hidden units, dropout 0.3) + ARIMA; compare F1 and Brier score|
|Training data|25 years INCOIS SST composites (2000–2025); ARGO GDAC historical profiles; GFW AIS effort density; IOTC tuna catch-and-effort for tuna-specific tuning|
|Performance target (literature)|HE-DFNETS: 99% on Indian Ocean PFZ prediction; XGBoost CPUE: r=0.93 — aspirational targets for OceanMind|

## **4.2 Sustainable Fishing Zone — XGBoost + CNN-XGBoost Fusion**

|**Component**|**Specification**|
| :- | :- |
|Primary model|XGBoost classifier with 5-fold cross-validation; SHAP values for per-prediction explainability|
|Upgrade path|CNN-XGBoost fusion (Zhang 2025): CNN extracts spatial features from satellite imagery; XGBoost handles tabular environmental variables|
|Output classes|Green (recommended), Amber (caution), Red (avoid); plus bycatch\_risk\_score (0–1) from JSDM predictions|
|Update cadence|Weekly — driven by incoming INCOIS SST + chlorophyll composites|
|Phase 2 addition|legal\_status attribute from mfra\_zones PostGIS layer: Open / Seasonal Ban / Restricted / No-Take|
|SHAP target|Top-3 feature importances surfaced to RAG interface and dashboard for each zone classification|

## **4.3 eDNA Classification — BLAST + 1D CNN**

|**Stage**|**Method**|**Detail**|
| :- | :- | :- |
|QC|FastQC + Trimmomatic|Adapter trimming, quality filtering on FASTQ reads|
|Clustering|DADA2 / VSEARCH|Amplicon Sequence Variant (ASV) denoising; OTU clustering|
|Alignment (Stage 1)|BLAST+ against NCBI, BOLD, IndOBIS|Identifies known species; gaps passed to Stage 2|
|Classification (Stage 2)|1D CNN trained on BOLD barcode sequences|Handles novel / uncharacterised barcodes; trained on 12S rRNA (MiFish) + 18S rRNA regions|
|Taxonomy normalisation|WoRMS API (AphiaID lookup)|Canonical species names across all databases|
|Indices|R Vegan package|Shannon, Simpson, Bray-Curtis; community composition per sampling event|

## **4.4 Joint Species Distribution Model (JSDM)**
Extends eDNA pipeline from sampled-point description to whole-ocean prediction. Predicts species assemblage probability across unsampled Indian EEZ grid cells (OQ-027 resolved: feasible via satellite covariates).

|**Component**|**Specification**|
| :- | :- |
|Implementation|HMSC R package (Ovaskainen et al. 2017) or BayesComm; Python via rpy2 or PyMC/Stan equivalents|
|Occurrence input|IndOBIS / NCBI-derived species occurrence records (georeferenced, WoRMS-normalised)|
|Environmental covariates|INCOIS SST weekly composites + Copernicus chlorophyll-a (complete Indian EEZ coverage); interpolated ARGO profiles for depth-stratified species where co-located (supplementary)|
|Output|Predicted species composition probability map at 1°×1° grid across Indian EEZ; feeds bycatch risk overlay in SFZ engine|
|Feasibility check (pre-training)|Run spatial overlap query on IndOBIS: verify >10 records per 1°×1° cell for target species in Indian EEZ (calibration, not a go/no-go gate)|

## **4.5 Marine Health Index — Isolation Forest**
- Multi-parameter anomaly detection across: SST anomaly, Chl-a deviation, DO, pH, salinity from ARGO CTD
- Compound stress detection: synergistic DO + pH interaction modelled as joint feature
- Output: MHI score (0–100) per grid cell; threshold alerts at configurable levels

## **4.6 Landing Site Computer Vision — YOLOv8/v9 + ResNet101**

|**Stage**|**Model**|**Output**|
| :- | :- | :- |
|Image preprocessing|Geometric correction; perspective transform|Orientation-corrected fish image on calibrated mat|
|Pixel calibration|Calibration markers on mat → pixel-to-mm mapping|Physical scale factor per image|
|Fish detection|YOLOv8/v9 (bounding box detection)|Bounding boxes per fish in catch image|
|Species identification|ResNet101 fine-tuned on Indian Ocean species|Species ID + confidence score per detected fish|
|Morphometrics|Pixel-to-mm conversion → fork length; length-weight relationship|Fork/total length (mm), estimated weight (g)|
|Stock assessment|Length-Based Spawning Potential Ratio (LBSPR) + Fulton's K (Phase 2)|Stock status estimate; population condition index|

*⚠ Recall degrades when >150 new low-sample-count species are added simultaneously (Shedrawi et al. 2024). Strategy: build on well-represented Indian Ocean species first; expand via transfer learning. Phase 3: one national base model + regional fine-tuning heads (Arabian Sea head / Bay of Bengal head) routed by state/UT at inference (THREAD-011 resolved).*

## **4.7 RAG Conversational Interface**

|**Component**|**Specification**|
| :- | :- |
|Framework|LangChain; LLaMA 3 or GPT-4o-mini as language model|
|Vector store|FAISS or ChromaDB|
|Embeddings|Ocean-specific Word2Vec fine-tuned on Bar 2020b corpus (175M tokens, 30,000 oceanographic papers — DOI 10.17605/OSF.IO/8VAFS). Expected 11× F1 improvement vs. general-purpose embeddings (Sagi et al. 2020: F1 0.068 general → 0.738 domain-specific)|
|NER component|Flair NER retrained on Bar 2020a annotated oceanic NER dataset (DOI 10.17605/OSF.IO/MY2NK)|
|Provenance|Every answer annotated with source record IDs, ingestion timestamp, and quality flags from the provenance layer (Section 3.6)|
|Bhashini integration (Phase 2)|Bhashini STT → RAG query → Bhashini TTS; all 22 scheduled Indian languages; primary fisherman interface|

## **4.8 Digital Twin & Scenario Simulation (Phase 2)**
- Generative AI / Diffusion model or VAE for data imputation (cloud-occluded satellite pixels, ARGO gaps, AIS coverage holes)
- MHW scenario: "If SST rises +2°C for 3 weeks, what does the MHI score become and how do migration zones shift?"
- Larval Connectivity IBM (Phase 2): Lagrangian particle tracking using CMEMS u/v/w current fields + species spawning parameters; 30–90 day recruitment probability maps (Aguzzi et al. 2025; Clavel-Henry et al. 2020)
- Socioecological ABM (Phase 3): simulate policy scenarios; requires MFC 2025 microdata


# **5. Technology Stack**
## **5.1 ML / AI Stack**

|**Model/Framework**|**Library/Tool**|**Phase**|
| :- | :- | :- |
|ConvLSTM (fish migration)|PyTorch; custom ConvLSTM cell or predefined implementations|MVP (Phase C)|
|XGBoost SFZ classifier|xgboost; shap; scikit-learn (5-fold CV)|MVP (Phase D)|
|1D CNN (eDNA classification)|PyTorch; trained on BOLD 12S/18S barcodes|MVP (Phase B)|
|JSDM|HMSC (R + rpy2 bridge) or PyMC/Stan|MVP (Phase D)|
|Isolation Forest (MHI)|scikit-learn IsolationForest|MVP (Phase C)|
|YOLOv8/v9 + ResNet101 (CV)|ultralytics (YOLOv8); torchvision (ResNet101)|MVP (Phase B-C)|
|LangChain RAG|langchain; FAISS or chromadb; ocean-specific embeddings (Gensim)|MVP (Phase E)|
|ARIMA (benchmark)|statsmodels|MVP (Phase C — benchmark only)|
|Generative AI / Diffusion (digital twin)|PyTorch; diffusers library|Phase 2|
|Lagrangian IBM|OceanParcels (oceanparcels.org) + CMEMS current fields|Phase 2|

## **5.2 Data Engineering & Backend**

|**Tool**|**Version / Notes**|**Role**|
| :- | :- | :- |
|Python|3\.11+|Primary language|
|FastAPI|Latest stable|RESTful API backend; async; OpenAPI docs auto-generated|
|PostgreSQL + PostGIS|PostgreSQL 15+; PostGIS 3.3+|Geospatial database; ST\_Within / ST\_Distance / bubble joins|
|Apache Jena + RDFLib|Apache Jena 4.x; RDFLib 6.x (Python)|SPARQL endpoint (OBDA layer); GeoLink/MarineTLO ontology mapping|
|NetCDF4 + Xarray|Latest stable|ARGO float and satellite raster ingestion|
|Pandas + NumPy|Pandas 2.x; NumPy 1.26+|Feature engineering; tabular data processing|
|Gensim|4\.x|Ocean-specific Word2Vec embedding training on Bar 2020b corpus|
|Apache Kafka|3\.x|IoT streaming for Phase 2 live buoy feeds|
|Docker + Kubernetes|Docker 24+; Kubernetes 1.28+|Containerised deployment; auto-scaling|

## **5.3 Bioinformatics Pipeline**

|**Tool**|**Role**|
| :- | :- |
|FastQC + Trimmomatic|Quality control and adapter trimming for FASTQ reads from sequencing pipeline|
|DADA2 / VSEARCH|ASV denoising and OTU clustering from amplicon data|
|BLAST+ (NCBI)|Sequence alignment against NCBI nt, BOLD, IndOBIS reference databases|
|Biopython|NCBI Entrez API programmatic access; FASTA file handling and parsing|
|WoRMS REST API|Taxonomic name normalisation (species → AphiaID); batch lookup via aphiamatch endpoint|
|R Vegan (via rpy2)|Community ecology statistics: Shannon, Simpson, Bray-Curtis dissimilarity|

## **5.4 Frontend & Visualisation**

|**Tool**|**Role**|
| :- | :- |
|React / Next.js|Web dashboard; interactive UI for researchers and government stakeholders|
|Leaflet.js + Plotly|Geospatial map overlays: SST heatmap, SFZ Green/Amber/Red zones, bycatch risk, migration probability; interactive charts|
|Streamlit|MVP rapid demo interface; Python-native; suitable for hackathon demo flow|
|Twilio SMS|Alert dispatch to fishermen (SMS to 586 INCOIS landing-centre network)|
|Firebase Cloud Messaging (FCM)|Push notifications to Android fishermen app|
|Bhashini API (bhashini.gov.in)|Voice I/O in all 22 scheduled Indian languages; primary fisherman interface; GoI open-source multilingual AI platform|
|Grafana-style time-series panels|Landing-site CPUE trend dashboard (Phase 2): species count trend per landing centre|

## **5.5 Phase 2 Additional Stack**
- Hyperledger Fabric: permissioned blockchain for catch traceability; smart contracts for PMMSY-linked certification (OQ-022 resolved)
- OceanParcels: Lagrangian particle tracking for larval connectivity IBM
- STEAM emission model: GT-based engine power regression (Jalkanen et al. 2009/2012); applied per vessel per AIS trip segment


# **6. Core Database Schema**
## **6.1 Key Tables**

|**Table**|**Key Columns**|**Notes**|
| :- | :- | :- |
|data\_bubbles|bubble\_id (PK), geom POINT, radius\_km, time\_window\_start, time\_window\_end|Unified spatiotemporal join key for all observations; adaptive radius 5km/50km|
|argo\_profiles|profile\_id, bubble\_id (FK), float\_id, datetime, depth\_m, temperature\_c, salinity\_psu, dissolved\_o2, quality\_flag|NetCDF CF Profile feature type; WMO float IDs|
|incois\_sst|raster\_id, bubble\_id (FK), composite\_date, geom (RASTER), sst\_c, chlorophyll\_mgl, pfz\_advisory|NetCDF CF Grid feature type; weekly composites|
|gfw\_ais|record\_id, bubble\_id (FK), mmsi (deduped), datetime, latitude, longitude, sog, cog, fishing\_hours, quality\_flag|NetCDF CF Trajectory; post AIS quality pipeline|
|edna\_occurrences|occurrence\_id, bubble\_id (FK), species\_aphia\_id, latitude, longitude, collection\_date, sequence\_hash, detection\_method, database\_source|NetCDF CF Point; WoRMS AphiaID as canonical key|
|landing\_site\_cv|cv\_id, bubble\_id (FK), landing\_site\_id, fisher\_id, species\_aphia\_id, fork\_length\_mm, weight\_g, cpue, image\_path, datetime|NetCDF CF Point; links to blockchain catch record (Phase 2)|
|mfra\_zones (Phase 2)|zone\_id, state\_name, geom POLYGON, ban\_start\_month, ban\_end\_month, gear\_restrictions, min\_mesh\_size\_mm, legal\_status|Regulatory overlay for SFZ output; 13 states + 4 UTs|
|sfz\_output|zone\_id, grid\_cell\_id, week\_start, ecological\_class (Green/Amber/Red), bycatch\_risk\_score, legal\_status (Phase 2), shap\_top3, model\_version|Weekly SFZ classification; SHAP explainability fields|
|provenance\_log|record\_id, source\_table, source\_system, ingestion\_ts, schema\_version, quality\_flag, fusion\_method, ai\_answer\_id|Every record + every AI output traceable to data source|


# **7. API Architecture**
## **7.1 REST API Endpoints (FastAPI)**

|**Endpoint**|**Method**|**Description**|
| :- | :- | :- |
|/api/v1/migration/forecast|GET|ConvLSTM migration probability map for next N weeks; returns GeoJSON with confidence intervals per grid cell|
|/api/v1/sfz/current|GET|Current week SFZ classification GeoJSON; Green/Amber/Red + bycatch\_risk + legal\_status (Phase 2)|
|/api/v1/mhi/status|GET|Marine Health Index scores per grid cell; most recent observation window|
|/api/v1/edna/biodiversity|GET|Species richness, Shannon, Simpson indices; WoRMS-normalised species list per location|
|/api/v1/alerts/subscribe|POST|Register fisher phone / device for zone-change SMS/push alerts; language preference|
|/api/v1/rag/query|POST|Natural language query; returns answer + provenance citations + source record IDs|
|/api/v1/data/bubble|GET|Retrieve all observations within a specified bubble\_id and time window (unified multi-source join)|
|/api/v1/landing/cpue|GET|CPUE trend per landing site from CV module; species-level time series|
|/api/v1/trace/catch (Phase 2)|POST|Register verified catch event to blockchain; returns transaction ID + PMMSY cert reference|

## **7.2 SPARQL Endpoint**
Exposed via Apache Jena Fuseki at /sparql. Supports ontological discovery queries aligned with GeoLink, MarineTLO, and WoRMS ontologies. Example:

SELECT ?species ?depth ?temperature WHERE {

`  `?obs oceanlink:hasBubble <bubble:B-247> .

`  `?obs worms:hasSpecies ?species .

`  `?obs oceanlink:hasTemperature ?temperature .

`  `?obs oceanlink:hasDepth ?depth .

`  `FILTER (?depth < 200)

}


# **8. Performance & Infrastructure Requirements**

|**Component**|**Requirement**|**Rationale**|
| :- | :- | :- |
|ARGO data ingestion|New profiles available within 24h of float surfacing|ARGO GDAC publishes within 12–24h; OceanMind scheduled pull must match|
|SFZ update cycle|Weekly zone refresh; alert triggered within 2h of new INCOIS composite availability|Fishermen plan week-ahead trips; sub-week updates add disproportionate value|
|ConvLSTM inference|Full Indian EEZ grid prediction < 30 seconds|Interactive dashboard; judges' live demo|
|RAG query response|< 5 seconds end-to-end (retrieval + generation)|Conversational UX expectation|
|Landing-site CV inference|< 10 seconds per catch photo batch|Field use; fishermen at busy landing sites|
|Alert delivery (SMS/push)|< 60 seconds from zone-change event to first SMS dispatched|Safety-critical for cyclone/MHW alerts|
|PostGIS spatial query|< 500ms for bubble join across 1M records|Indexed geometry columns; ST\_Within with R-tree|
|SPARQL endpoint|< 2 seconds for typical ontological discovery query|Interactive exploration use case|

## **8.1 Infrastructure**
- Containerisation: Docker images per service (ingestion, ML inference, API, frontend)
- Orchestration: Kubernetes for auto-scaling inference pods during peak periods
- Storage: PostgreSQL/PostGIS on persistent volume; model checkpoints on object storage (S3-compatible)
- Streaming: Apache Kafka for Phase 2 IoT buoy feeds; consumer groups per processing service
- MVP demo environment: single-node deployment acceptable for hackathon; Streamlit + FastAPI on localhost with pre-loaded fallback data

## **8.2 Fallback Data Strategy**
All fallback datasets must be pre-downloaded and validated before development begins (DENIED-007 retained). Required pre-validated datasets:

- ARGO: Pre-downloaded NetCDF for Arabian Sea + Bay of Bengal (2020–2025) in repo
- eDNA: Cached NCBI eDNA dataset for Indian Ocean fish (MiFish 12S primers; representative Indian Ocean species)
- INCOIS PFZ: Static PFZ advisory dataset from 2022–2024
- GFW AIS: Pre-downloaded fishing effort density for Indian EEZ (2022–2024)
- IOTC: Pre-downloaded tuna catch-and-effort CSV for Indian Ocean FAO Areas 51+57
- IndOBIS: Cached species occurrence records for Indian Ocean (OBIS API export)


# **9. Security & Compliance**

|**Requirement**|**Implementation**|
| :- | :- |
|Open data only|All data sources publicly accessible without licensing fees (confirmed for each source in Section 2); no proprietary data ingested|
|No personally identifiable fisher data|Fisher ID in landing\_site\_cv table is anonymised token linked only to landing\_site\_id; no name/phone/address stored in OceanMind core database|
|FAIR data principles|CF Conventions feature types; DOI-linked provenance; SPARQL endpoint for machine-discoverability; WoRMS/GeoLink for interoperability|
|EEZ Rules 2025 compliance framing|SFZ output structured for Rule 6 (management plan implementation); IUU detection for Rule 12 (destructive practices); IOTC data for Rule 14 (international compliance)|
|PSMA catch documentation|Phase 2: Hyperledger Fabric immutable catch records serve as verifiable catch documentation required under PSMA|
|Trustworthy AI (Fernandes-Salvador 2026)|SHAP on all XGBoost models; MC Dropout confidence intervals on ConvLSTM; data provenance on all RAG answers; uncertainty surfaced to dashboard users|
|API security (production)|JWT authentication on REST API; HTTPS/TLS; rate limiting per API key; SPARQL endpoint read-only|


# **10. Phased Build Plan**

|**Phase**|**Key Deliverables**|**Completion Criteria**|
| :- | :- | :- |
|Phase A — Data & Integration|PostgreSQL/PostGIS + data\_bubbles table; schema matching engine; OBDA/SPARQL endpoint; AIS quality pipeline; spatio-temporal fusion rules|SPARQL query across bubble B-247 returns rows from ARGO + INCOIS SST + one CV record in unified table|
|Phase B — Biodiversity & CV|WoRMS entity resolution; domain NER (Flair, oceanographic corpus); landing-site CV smartphone app + base YOLO pipeline; eDNA BLAST+CNN pipeline|WoRMS demo: AphiaID lookup for 3 species across CMFRI + BOLD; CV demo: species ID from catch photo with length estimate|
|Phase C — Migration & Health|ConvLSTM trained on ARGO+INCOIS; MC Dropout confidence intervals; Marine Health Index (Isolation Forest); IOTC tuna data integration|7-day Indian EEZ migration heatmap rendered in Leaflet with confidence interval bands visible|
|Phase D — SFZ & JSDM|Dynamic SFZ weekly update (XGBoost + SHAP); bycatch risk overlay from JSDM; SFZ GeoJSON API endpoint|SFZ map shows Green/Amber/Red zones with bycatch\_risk\_score per cell; SHAP top-3 features readable from API response|
|Phase E — RAG Interface|LangChain RAG with ocean-specific embeddings; provenance layer; data\_bubbles SPARQL integration in retrieval|Query "marine health near Gujarat this week" returns answer with source record IDs and quality flags cited|
|Phase F — Alerts & Voice|Twilio SMS alert dispatch; Firebase push; Bhashini API partial integration (at least 2 Indian languages)|Simulated zone-change SMS delivered to demo phone within 60 seconds of trigger|
|Phase G — Digital Twin|MHW scenario simulation (early version); generative AI data imputation for cloud-gap INCOIS SST|Demo: "+2°C SST for 3 weeks" scenario shows projected MHI score change on dashboard|
|Phase H — Blockchain|Hyperledger Fabric MVP; catch event logging; PMMSY certification reference field|Demo: verified catch record written to Fabric ledger; transaction ID returned via API|


# **11. Testing Strategy**
## **11.1 Model Validation**

|**Model**|**Validation Method**|**Benchmark**|
| :- | :- | :- |
|ConvLSTM migration|Held-out 2023–2024 ARGO+INCOIS data; compare to CMFRI catch hotspot records; Brier Score + F1|Beat 2-layer LSTM baseline on Brier Score|
|XGBoost SFZ|5-fold cross-validation (by year); SHAP stability check across folds|F1 ≥ 0.75 on Amber/Red classification; CPUE prediction r ≥ 0.85|
|JSDM|Held-out IndOBIS occurrence records; compare predicted vs. observed species composition at known sample sites; Tjur R²|Tjur R² > 0.20 for primary target species|
|CV species identification|Hold-out image set per species; species recall per class|Recall ≥ 90% for top-20 Indian Ocean species by volume|
|RAG interface|Manual evaluation of 50 test queries against known answers; measure provenance coverage (% answers with cited source)|Provenance coverage 100%; factual accuracy evaluated by domain expert|

## **11.2 Integration Testing**
- Data pipeline end-to-end: ARGO GDAC pull → schema matching → data\_bubbles insert → SPARQL query
- SFZ pipeline: INCOIS SST raster → feature engineering → XGBoost → GeoJSON output → Leaflet render
- Alert pipeline: zone change event → Twilio SMS → delivery confirmation log
- RAG pipeline: text query → Flair NER → embedding retrieval → LLM generation → provenance annotation → response

## **11.3 Performance Testing**
- Load test: 50 concurrent RAG queries; target < 5 seconds p95 response time
- Spatial query benchmark: data\_bubbles join across 1M records; target < 500ms
- ConvLSTM inference benchmark: full Indian EEZ grid; target < 30 seconds on CPU, < 5 seconds on GPU


# **12. Technical References**
All architectural and model decisions in this TRD are traceable to primary research cited in OceanMind Ideation Document v7.0. Key references for technical specifications:

- Sagi, Lehahn & Bar (2020). AI for ocean science data integration. Elementa. DOI: 10.1525/elementa.418
- Agmata & Gudmundsson (2025). ConvLSTM CATCH model. Biology Methods & Protocols 10. DOI: 10.1093/biomethods/bpaf045
- Hazen et al. (2018). Dynamic ocean management. Science Advances 4. DOI: 10.1126/sciadv.aar3001
- Yang et al. (2024). ML for AIS-driven maritime research. Transportation Research Part E. DOI: 10.1016/j.tre.2024.103426
- Shedrawi et al. (2024). Ikasavea CV system. Scientific Reports 14. DOI: 10.1038/s41598-024-71763-y
- Aguzzi et al. (2025). Digital-twin strategy. Ecological Informatics 91. DOI: 10.1016/j.ecoinf.2025.103409
- Fernandes-Salvador et al. (2026). Trustworthy AI for marine management. Fish and Fisheries. DOI: 10.1111/faf.70052
- Zhang (2025). CNN-XGBoost fusion for marine fishery prediction. Scientific Reports 16. DOI: 10.1038/s41598-025-33175-4
- Alsharabi et al. (2024). Blockchain and AI for fisheries. Journal of Cloud Computing 13. DOI: 10.1186/s13677-024-00696-8
- Bar (2020a). Oceanic NER dataset. DOI: 10.17605/OSF.IO/MY2NK
- Bar (2020b). Oceanographic text corpus (175M tokens). DOI: 10.17605/OSF.IO/8VAFS
- Malde et al. (2020). Machine intelligence and marine science analysis bottleneck. ICES Journal of Marine Science 77(4). DOI: 10.1093/icesjms/fsz057
- Jalkanen et al. (2009/2012). STEAM ship emission model. Atmospheric Chemistry and Physics.
OceanMind TRD v1.0  |  Confidential  	Page  of 
