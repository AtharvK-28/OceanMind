# OceanMind — Demo Script (6–7 minutes)

> **Setup before recording:** Both servers running. Browser open to `localhost:3000`. Have `image-data/IndianMackerel1.jpg` ready on desktop for the CV demo. Start on the Fisher View page with Kochi selected.

---

## 0:00 – 0:30 | Opening Hook (Fisher View)

**[Screen: Fisher View — Kochi, Kerala]**

> "Imagine you're a fisher in Kochi, Kerala. It's early morning. Before you head out, you open OceanMind on your phone.
>
> Right here — you see 18 safe zones near your port, real sea conditions pulled live from Open-Meteo — wind at 4 knots, 1.6 meter swell, water temperature 29.9 degrees. Tide times are real — computed from NOAA-class sea level models. And a sunset-based return time calculated from your latitude.
>
> This isn't dummy data. This is live."

**[Action: Switch port to Veraval → show data change]**

> "Switch to Veraval, Gujarat — different zones, different weather, different tides. Everything updates from real APIs."

---

## 0:30 – 1:15 | Dashboard Overview

**[Action: Click Dashboard in sidebar]**

> "The research dashboard gives the full picture. Four KPIs — Marine Health Index at 72 out of 100, sea surface temperature, 685 green zones out of 1400, and 5 active stress alerts.
>
> The map shows Sustainable Fishing Zones classified by our XGBoost model — green for recommended, amber for caution, red for avoid. These dots follow India's actual continental shelf, not a uniform grid. Each one is positioned at a real fishing ground — Veraval Bank, Kochi Shelf, Mangalore, Vizag Deep.
>
> On the right — today's top recommendation, pulled dynamically from the first green zone in the SFZ data. Below it, the catch traceability ledger — every entry is SHA-256 hashed."

---

## 1:15 – 2:00 | Marine Health Index

**[Action: Click Marine Health Index]**

> "Marine Health Index uses an Isolation Forest anomaly detector — an unsupervised ML model that scores ocean health from 0 to 100 based on five parameters: SST, chlorophyll-a, dissolved oxygen, pH, and salinity.
>
> The key here — these are real ARGO float measurements. We ingest 70 ARGO GDAC profiles from the Indian Ocean, then interpolate their oceanographic values to our continental shelf grid. The model flags anomalies — cells that deviate from the regional climatology.
>
> Below the map — stress distribution. You can see the breakdown: how many cells are critical, warning, watch, or normal. And the single-point scorer lets you plug in custom oceanographic values and get an instant MHI prediction."

---

## 2:00 – 2:45 | Fishing Zones + Explainability

**[Action: Click Fishing Zones]**

> "Sustainable Fishing Zones — this is our XGBoost classifier with SHAP explainability. Every zone gets classified as Green, Amber, or Red based on SST, chlorophyll, SSH anomaly, mixed layer depth, fishing effort, and wind stress curl.
>
> What makes this different is the SHAP feature importance chart — for any zone, you can see exactly WHY it was classified that way. Chlorophyll-a drives 40% of the decision here, followed by SST front detection. This is not a black box — the model explains itself.
>
> The single-point classifier below lets you input custom oceanographic parameters and get an instant zone classification with SHAP breakdown."

---

## 2:45 – 3:45 | Fish Migration — 3D Globe

**[Action: Click Migration Forecast]**

> "This is our fish migration tracker — a 3D globe visualizing real migration routes for five commercially important Indian species.
>
> Every route here is sourced from peer-reviewed literature. Oil Sardine — CMFRI documented northward migration along the Malabar upwelling zone, 8 to 14 degrees north. Indian Mackerel — post-monsoon inshore migration from the deep continental slope to shallow surf zones. The waypoints are real coordinates."

**[Action: Click Yellowfin Tuna → show route around India → south of Sri Lanka → Andaman]**

> "Yellowfin Tuna — tagged by the IOTC Regional Tuna Tagging Programme, 63,000 fish tagged. Average movement 710 nautical miles. The route goes from the Somali Basin through the Maldives, around Sri Lanka, to the Andaman shelf."

**[Action: Toggle "All Species" → show all routes simultaneously]**

> "All five routes simultaneously. Toggle ocean currents on — these are the real Somali Current, SW Monsoon Current, and Equatorial Counter-current that drive the migration."

**[Action: Click +2°C climate shift toggle]**

> "And here's the climate projection. Plus 2 degrees Celsius shifts every route poleward — Oil Sardine shifts the most at 1 degree latitude, Yellowfin the least at 0.6. Ghost arcs show the original position. This is based on Cheung et al. 2013 shift rates."

**[Action: Scroll down to fishing calendar]**

> "The fishing calendar below shows when each species is at peak catch, spawning, or should be avoided — month by month, sourced from CMFRI catch statistics."

---

## 3:45 – 4:30 | Computer Vision — Live Demo

**[Action: Click Biodiversity & CV]**

> "Now the computer vision pipeline. We trained a ResNet50 species classifier on 13 Indian fish species — Mackerel, Sardine, Hilsa, Pomfret, Rohu, Sea Bass, and more.
>
> Let me show you it working live."

**[Action: Upload IndianMackerel1.jpg → click "Detect fish species"]**

> "I'm uploading a real Indian Mackerel photo. The pipeline runs YOLOv8 for bounding box detection, then our ResNet50 classifier identifies the species.
>
> And there — Indian Mackerel, 86% confidence. The source field says 'yolov8 plus resnet50 classifier' — that's real inference, not synthetic. It also estimates fork length and weight from allometric equations sourced from FishBase."

**[Action: Click Species Reference tab briefly]**

> "All 19 species in our database are validated against WoRMS — the World Register of Marine Species — with canonical AphiaID entity resolution."

---

## 4:30 – 5:00 | Real-Time Fishing Advisory

**[Action: Click Fishing Advisory → show pre-loaded Kerala Coast result]**

> "Real-time fishing advisory — this pulls live data from the Open-Meteo Marine API. SST, wave height, wind speed — 7-day history plus 3-day forecast.
>
> The system computes a fishing score from 0 to 100 and gives a GO, CAUTION, or AVOID recommendation with specific reasons — optimal SST range, calm seas, monsoon warnings.
>
> The SST chart shows the last 7 days of real sea surface temperature. Wave and wind forecasts are hourly for the next 3 days. And best fishing windows are highlighted — specific time slots when conditions are optimal."

---

## 5:00 – 5:20 | Species Encyclopedia

**[Action: Click Species Encyclopedia]**

> "Our species database — 13 species with real training images, WoRMS-validated taxonomy, IUCN status, habitat data, and allometric parameters from FishBase. Filter by marine, freshwater, or migratory. Each card links to its WoRMS record for full taxonomic verification."

**[Action: Click Indian Mackerel card → show detail panel]**

> "Every species has depth range, diet, max length, and a direct AphiaID link. This is the reference library our CV model was trained against."

---

## 5:20 – 5:50 | Digital Twin

**[Action: Click Digital Twin → show auto-loaded scenario result]**

> "The Digital Twin scenario engine. Set an SST perturbation — say plus 2 degrees for 3 weeks — and the model projects what happens to marine health and fish migration.
>
> MHI projection shows which grid cells enter critical or warning status. Migration shift shows poleward displacement — 0.8 degrees latitude. And the species impact table breaks down abundance change, thermal stress, and collapse risk per species.
>
> This is parameterised — you can test IPCC scenarios from the preset dropdown. Mild, moderate, severe, extreme."

---

## 5:50 – 6:20 | RAG + Voice + Alerts + Blockchain (Quick hits)

**[Action: Click Ask OceanMind → show auto-loaded answer with provenance]**

> "RAG conversational interface — LangChain, Llama-3 8B, FAISS vector store. Ask any question about ocean conditions. Full provenance tracing — every answer cites its source: INCOIS, CMFRI, ARGO, or GFW."

**[Action: Click Voice → show language pills + mic button]**

> "Bhashini voice interface — Hindi and Tamil. Fishers who can't type ask by voice. The pipeline: Bhashini ASR transcription, machine translation, RAG answer, then Bhashini TTS playback."

**[Action: Click Catch Ledger → show 4 KPIs + recent activity]**

> "Catch traceability — every landing is logged to a SHA-256 hash chain with species, quantity, landing site, and PMMSY certification reference. Phase 2 replaces this with Hyperledger Fabric."

**[Action: Click Alerts → show pipeline tab]**

> "Zone-change alerts via Twilio SMS and Firebase push. Under 60-second delivery SLA. Three languages, four alert types. The pipeline diagram shows the full flow from INCOIS data update to fisher notification."

---

## 6:20 – 6:50 | Closing

**[Action: Click back to Dashboard]**

> "That's OceanMind — 14 interconnected modules. 8 real data sources: ARGO floats, INCOIS satellite composites, Global Fishing Watch AIS, CMFRI catch statistics, WoRMS taxonomy, Open-Meteo marine weather, FishBase allometry, and peer-reviewed migration literature.
>
> 4 trained ML models: Isolation Forest for marine health, XGBoost with SHAP for fishing zones, ConvLSTM for migration forecasting, and ResNet50 for species identification from photographs.
>
> Real-time APIs, 3D visualization, multilingual voice access, blockchain traceability, climate projections, and SMS alerts — all in one platform, designed for the Indian fisher who needs to know one thing: where should I go today, and is it safe?
>
> Thank you."

---

## Key Demo Tips

- **Don't rush.** Pause on each visual for 3–4 seconds before speaking about it.
- **The CV upload is your mic-drop moment.** Make sure the image is ready on the desktop — no fumbling.
- **The 3D globe grabs attention.** Spend time here — rotate it, toggle climate shift, toggle currents.
- **If something fails to load,** move on smoothly. Every page has pre-loaded data.
- **End on the dashboard** — it's the strongest visual to leave on screen.
