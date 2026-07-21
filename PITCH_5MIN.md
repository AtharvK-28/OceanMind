# OceanMind — 5-Minute Demo Day Script

> **Biothon 2026 · Environment & Biodiversity · Marwadi University**
> Format: **5 min presentation + 3 min Q&A** · Rubric: 5 × 20 marks

---

## ⚠️ Read this first — why this script differs from `DEMO_SCRIPT.md`

The old 6–7 min script is a **feature tour**. Against this rubric a pure feature tour
scores ~20/100 on *Tech & Feasibility*, maybe 12/20 on *Presentation*, and close to
**zero on Business Plan (20 marks)** — because it never mentions who pays.

This script is **weighted to the rubric**, not to the codebase:

| Rubric criterion | Marks | Where it is earned |
|---|---|---|
| Problem Solving & Impact | 20 | Beat 1 (0:00–0:40) + Beat 6 (4:05–4:40) |
| Innovation & Originality | 20 | Beat 2 (0:40–1:20) + SHAP & Ledger in demo |
| Tech & Feasibility | 20 | Beat 3–5 live demo + Data Trust page |
| Business Plan / Impact | 20 | Beat 6 (3:20–4:05) — **do not cut this** |
| Presentation & Pitch | 20 | Timing, one idea per beat, the close, Q&A |

**Rule: you are cutting 14 modules down to 4 screens.** Everything you don't show is
Q&A ammunition, not stage time. That is a feature — you *want* unshown depth when
3 minutes of questions are coming.

---

## Pre-flight checklist (do 10 minutes before)

- [ ] Backend up — `curl localhost:8000/health` → `mhi_model: loaded`, `rag: ready`
- [ ] Frontend up — `localhost:3000` → 200
- [ ] Browser at **Fisher View**, port set to **Kochi**, zoom 90%, sidebar expanded
- [ ] `image-data/IndianMackerel1.jpg` on the desktop, **one click away**
- [ ] **Pop-ups allowed on localhost:3000** ← the exporter certificate needs this
- [ ] Pre-open these tabs in order so you never wait on a load:
      `/` · `/sfz` · `/biodiversity` · `/exporter` · `/pricing` · `/trust`
- [ ] Phone hotspot ready as network backup (CV + RAG need internet)
- [ ] Close Slack/notifications. Screen at 1920×1080.

---

# THE SCRIPT

**Total spoken words ≈ 660. Target pace 140 wpm. Do not add sentences.**

---

## ⏱ 0:00 – 0:40 | The Problem
### 🎯 *Rubric: Problem Solving & Impact*

**[Screen: Fisher View — Kochi. Don't touch anything yet. Let them look.]**

> "This is what a fisher in Kochi sees at 4 a.m. before deciding whether to take
> his boat out.
>
> That decision costs him **three lakh rupees** — fuel alone is ₹1.5 lakh for a
> three-day trip, and fuel is **54% of his operating cost**. If he guesses wrong,
> he burns it for nothing.
>
> There are **14.5 million** Indians in marine fisheries making that guess every
> morning. **35.5% of the world's fish stocks are now overfished** — FAO reviewed
> 2,570 stocks last year, the largest assessment ever done. And the Indian Ocean
> is warming faster than almost any basin on Earth.
>
> So the fisher loses money, and the ocean loses fish. **Same bad guess.**"

**Delivery:** Slow. This is the only 40 seconds where you're not clicking.
Land "three lakh rupees" and "same bad guess" — pause after each.

---

## ⏱ 0:40 – 1:20 | Why This Isn't Already Solved
### 🎯 *Rubric: Innovation & Originality*

> "Now — India *does* have an answer to this. INCOIS publishes free Potential
> Fishing Zone advisories from satellite data.
>
> They have three structural limits. They're valid **24 hours** — same-day
> satellite, no forecast. They tell you *where*, never **why** or **how much**.
> And they arrive as a port name and a latitude-longitude pair — which is not
> usable if you're one of the **7 million small-scale fishers** below the 15-metre
> AIS threshold, often reading it in a second language.
>
> OceanMind does three things a satellite advisory structurally cannot:
> **it explains its reasoning, it speaks the fisher's language, and it verifies
> the catch after the boat lands.**
>
> That last one is the whole business."

**Delivery:** This beat is your originality mark. Naming INCOIS *first*, honestly,
is what makes it land — you're not pretending the field is empty, you're showing
you know it better than the judges do.

---

## ⏱ 1:20 – 1:50 | Demo 1 — The Fisher
### 🎯 *Rubric: Tech & Feasibility + Problem Solving*

**[Action: gesture at the screen you're already on]**

> "Same screen, now read it. **GO** — one word, decided from live sea state.
> Wind, swell, water temperature, tide times — pulled live from the Open-Meteo
> Marine API right now, not a cached demo file. Safe zones near his port, and a
> sunset-based return time computed from his latitude."

**[Action: switch port → Veraval]**

> "Veraval, Gujarat — different sea, different answer. And he can ask it out loud,
> in Hindi or Tamil, because he may not read."

**Delivery:** 30 seconds. Don't linger. The point is *"it's real and it's for him"* —
not a feature list.

---

## ⏱ 1:50 – 2:25 | Demo 2 — Explainability
### 🎯 *Rubric: Innovation & Originality + Tech*

**[Action: sidebar → Fishing Zones (`/sfz`)]**

> "Every zone on this map is classified Green, Amber or Red by an **XGBoost**
> model — sea surface temperature, chlorophyll, sea-surface-height anomaly,
> mixed-layer depth, fishing effort, wind stress curl.
>
> And here's the part that matters —"

**[Action: click a zone → SHAP chart]**

> "**SHAP feature attribution.** This zone is Green *because* chlorophyll-a drove
> 40% of that decision, then the SST front. A fisher won't read this — but a
> **fisheries officer closing a zone has to justify it**, and a black box can't be
> defended in a policy hearing.
>
> This is the model explaining itself."

**Delivery:** The line *"a black box can't be defended in a policy hearing"* is the
strongest sentence in the deck. Say it slowly.

---

## ⏱ 2:25 – 3:00 | Demo 3 — Live Computer Vision
### 🎯 *Rubric: Tech & Feasibility — this is your proof-of-realness*

**[Action: sidebar → Biodiversity & CV. Upload `IndianMackerel1.jpg`.]**

> "At the landing site, the catch gets photographed. **YOLOv8** finds the fish,
> a **ResNet50** classifier names the species.
>
> This is running live, right now, on a photo — not a stored result."

**[Wait for result. Read what's actually on screen.]**

> "**Indian Mackerel — 87% confidence.** Source field says `yolov8 + resnet50` —
> that's real inference. It estimates fork length and weight from **FishBase
> allometric equations**, and resolves the species to its **WoRMS AphiaID —
> 217044** — so this record is taxonomically joinable to NCBI, OBIS and IUCN.
>
> That AphiaID is what turns a photo into **biodiversity data**."

**Delivery:** This is your mic-drop. If the upload is slow, keep talking about
AphiaID — don't stand in silence. If it *fails*, see the failure table below.

---

## ⏱ 3:00 – 3:20 | Demo 4 — From Fish to Certificate
### 🎯 *Rubric: bridge into Business Plan*

**[Action: go to `/exporter` tab]**

> "That identified catch, with its GPS origin and vessel ID, gets hashed into a
> tamper-evident ledger — and comes out as **this**."

**[Action: point at the certificate]**

> "A catch certificate for **EU IUU Regulation 1005/2008**, Japan's IUU Act, the
> UK scheme. Chain of custody from boat to export.
>
> **India exported ₹60,523 crore of seafood last year** — about **7 billion
> dollars** — and none of it reaches the EU without one of these."

---

## ⏱ 3:20 – 4:05 | The Business Model
### 🎯 *Rubric: Business Plan / Impact — 20 marks. NEVER cut this beat.*

**[Action: go to `/pricing`]**

> "So who pays? **Not the fisher.** The fisher is free, forever — he's not the
> customer, he's the **supply side**. Every catch he logs is ground truth that
> makes the next advisory sharper. That's the flywheel.
>
> Three people pay:
>
> **Exporters** — ₹100 per verified certificate, or ₹25,000 a month. That's our
> primary revenue, and it's a compliance cost they *already* carry.
>
> **Institutions** — ₹2.5 lakh a year for API and bulk data access.
>
> **Government** — per-district partnerships. And there's a live channel here:
> the **National Fisheries Digital Platform already has 26 lakh registered
> fishers**, and PMMSY put **₹2,703 crore** into the sector this year. We don't
> have to build distribution — we plug into it.
>
> Our entire run cost at pilot scale is **₹25,000 a month**, because every data
> source we use is open."

**Delivery:** Fast, confident, no hedging. Judges have heard 20 teams with no
revenue model. "Not the fisher — he's the supply side" is the line they'll repeat.

---

## ⏱ 4:05 – 4:40 | Impact, Honestly
### 🎯 *Rubric: Problem Solving & Impact + Tech credibility*

**[Action: go to `/impact`]**

> "A 500-fisher pilot: **₹2.05 crore** of fuel saved a year — about **₹41,000 back
> in each fisher's pocket** — and **579 tonnes of CO₂** avoided. Every one of those
> numbers is derived from five assumptions printed on the page. Nothing hidden."

**[Action: go to `/trust` — do this deliberately]**

> "And this page exists because you're going to ask. **Data Trust** — every source,
> labelled live or synthetic. Open-Meteo, the vision model, the LLM, WoRMS — live.
> ARGO, GFW and INCOIS feeds run on synthetic fallback in this demo because we
> have no GFW key today; the pipelines are written and the schema is real.
>
> **We'd rather show you that than have you find it.**"

**Delivery:** ⭐ This is a **scoring move, not a confession.** Volunteering your
weakness before the judges dig for it converts your biggest Q&A risk into a
credibility mark. Say it evenly — no apology in your voice.

---

## ⏱ 4:40 – 5:00 | Close
### 🎯 *Rubric: Presentation & Pitch*

**[Action: back to Fisher View — the fisher's screen. End here.]**

> "Fourteen modules, four trained models, eight open data sources — and one
> question it answers, in a language he speaks, at 4 a.m.:
>
> **'Do I go out today?'**
>
> Get that answer right, and the fisher keeps his three lakh rupees — and the
> ocean keeps its fish.
>
> That's OceanMind. Thank you."

**[STOP. Hands off the keyboard. Look up. Wait for the first question.]**

---

# 🚨 If Something Breaks

| Failure | Do this — **do not apologise twice** |
|---|---|
| CV upload hangs >8s | Keep talking about AphiaID / WoRMS. It usually lands. |
| CV fails outright | "Vision service is offline — here's the same pipeline's stored output," switch to **Species Encyclopedia**, keep moving. Never debug on stage. |
| Internet dies | CV, RAG and Open-Meteo die together. Pivot to **`/sfz` + `/pricing` + `/impact`** — all render from local state. Say: "we're on synthetic fallback — that's exactly what the Data Trust page describes." |
| Backend 500s | Refresh once. If still dead: "the platform's in fallback mode," and present the remaining beats as walkthrough. **Never open a terminal.** |
| Page won't load | Move to the next tab immediately. You pre-opened them for this reason. |
| You're at 4:00 and only on Demo 3 | **Skip `/exporter` and `/impact`. Go straight to `/pricing`, then close.** Business Plan is 20 marks; the exporter page is 0 marks on its own. |

---

# 🎤 Delivery Notes

- **One idea per beat.** If you catch yourself listing features, stop and move on.
- **Say numbers slowly.** ₹60,523 crore, 14.5 million, 35.5%, ₹2,703 crore. Numbers
  are what judges write down.
- **Never say "basically", "kind of", "we tried to".** You built it. Say what it does.
- **Practise the first 40 seconds until it's muscle memory.** If the opening lands
  clean, everything after is easier.
- **Time yourself out loud three times.** Reading silently always runs 25% fast.
- **End on the fisher's screen**, not the dashboard. Human face beats data density.

---

## The one-sentence version (if a judge asks "what is it?")

> "OceanMind tells an Indian fisher where it's safe and worth fishing today, in
> his language — and turns his catch into an export certificate that pays for the
> whole platform."
