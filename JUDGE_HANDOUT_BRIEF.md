# OceanMind — Judge Handout: Design Brief

> Hand this file to Claude (design) to produce the documents. **All copy below is
> final and verified** — the designer's job is layout only, not writing. Nothing
> here needs to be invented or approximated.

---

## ⏱ First: a reality check on printing

It is demo day. Before you plan around paper, confirm you can actually print in
colour in the next hour. If you can't:

**Fallback → a QR code on your final slide pointing to a single hosted web page.**
Judges scan it during Q&A and still have it after. This is *not* a downgrade —
it's arguably better, because the page can embed the live product. Say the word
and I'll build and publish that page directly instead of briefing it out.

Decide this first. It changes nothing about the content below, only the format.

---

## What to make — and what NOT to make

The instinct is to hand judges a lot. Resist it. **Judges read a handout for about
30 seconds**, usually while you're still talking, and then again for ~60 seconds
while scoring. Anything past two sides is decoration.

| # | Document | Priority | When it's used |
|---|---|---|---|
| **A** | **Judge One-Pager** — double-sided A4 | ⭐ **Essential** | Handed out *before* you start |
| **B** | **Architecture & Model Card** — single A4 | Optional | Slid across the table *only* if a technical judge probes |
| **C** | **Business Model Card** — single A4 | Optional | Slid across *only* if a business judge probes |

**The tactic for B and C:** don't distribute them. Keep them face-down beside you.
When a judge asks *"what's actually your model vs. an API call?"* — answer verbally
in 25 seconds, then slide Card B across. That single move reads as preparation
better than any slide, and it's what "ability to engage and answer questions"
(Presentation, 20 marks) is actually measuring.

**Print quantity:** 1 per judge + 2 spare. Assume 4 judges → **6 copies of A**,
**2 copies each of B and C** (they're shared across the table, not distributed).

---

## Shared design system — use the product's real tokens

The handout must look like it came out of the same studio as the app. These are
pulled from `frontend-react/src/app/globals.css` — use them exactly.

**Typography**
| Role | Font | Notes |
|---|---|---|
| Headlines, big numbers | **Newsreader** (serif) | Google Fonts. Slightly tight tracking, `-0.01em` |
| Body text | **IBM Plex Sans** | Default for everything |
| Labels, stats, captions | **IBM Plex Mono** | Uppercase, `letter-spacing: 0.15em`, ~10px, for section eyebrows |

**Colour**
| Token | Hex | Use |
|---|---|---|
| Page background | `#f1ece1` | Warm paper base — **not white**. This is the signature. |
| Deep teal (headers/dark blocks) | `#16434c` → `#0e2d34` | Gradient, 177° |
| Accent | `#1f7a8c` | Links, rules, icons |
| Mint highlight | `#9fe0d6` | Big numbers **on dark backgrounds only** |
| Green | `#3a8c5f` (bg `#eaf3ef`) | GO / sustainable / positive |
| Amber | `#d49a2e` (bg `#f7efdb`) | Caution / **revenue highlight** |
| Red | `#c25a44` (bg `#f6e6e1`) | Avoid / critical |
| Text | `#16323a` primary · `#6d7e80` secondary · `#8a9698` muted |
| Card border | `#ece5d6` | Hairline, 1px |

**Feel:** editorial and calm — closer to a scientific journal or a Monocle spread
than a startup pitch deck. Generous white space, hairline rules, no drop shadows on
paper, no gradients except the deep-teal header block. Warm paper `#f1ece1`
background is what will make it stand out on a table of white A4s.

---

# 📄 DOCUMENT A — Judge One-Pager (double-sided A4)

**The organising principle: the two sides mirror the five rubric criteria in
scoring order.** A judge filling in a "Business Plan /20" box should find a block
literally labelled that. This isn't gaming — it's making your work legible to the
form they're holding.

---

## SIDE 1 — The Case

### Block 1 · Masthead *(deep teal gradient block, full bleed, ~22% of page)*

- **OCEANMIND** — Newsreader, large, `#f3f8f6`
- Tagline, mint `#9fe0d6`: *AI-driven marine intelligence for the Indian fisher*
- Mono eyebrow, small, muted: `BIOTHON 2026 · ENVIRONMENT & BIODIVERSITY · MARWADI UNIVERSITY`
- Bottom-right: **QR code** (white on teal) labelled `LIVE DEMO` — link to the
  deployed app or repo

### Block 2 · The Problem *(label: PROBLEM SOLVING & IMPACT)*

Pull-quote, Newsreader, ~20px, `#16323a`:

> **A fisher's decision to sail costs ₹3 lakh. He makes it on a guess, at 4 a.m.**

Then a row of 4 stat tiles — big number in Newsreader, label in IBM Plex Mono:

| Number | Label |
|---|---|
| **54%** | of a trawler's operating cost is fuel *(CMFRI)* |
| **14.5 M** | Indians depend on marine fisheries |
| **35.5%** | of world fish stocks overfished *(FAO 2025, 2,570 stocks)* |
| **~7 M** | small-scale fishers below the 15 m AIS threshold |

Closing line, secondary text:
*The fisher loses money and the ocean loses fish — from the same bad guess.*

### Block 3 · Why It Isn't Already Solved *(label: INNOVATION & ORIGINALITY)*

Small intro: *India's INCOIS already publishes free Potential Fishing Zone
advisories. Three structural limits remain:*

Three-column comparison — **left column amber/red-tinted, right column green-tinted:**

| | Today's advisory | OceanMind |
|---|---|---|
| **Validity** | 24 hours, same-day satellite, no forecast | Forecast-driven, re-classified weekly |
| **Reasoning** | Tells you *where* — never *why* or *how much* | SHAP attribution on every zone |
| **Reach** | Port name + lat/long, text, one language | Voice in Hindi & Tamil, GO/CAUTION/AVOID |
| **After the catch** | *Nothing* | Hash-verified export certificate |

⚠️ Designer note: keep the framing **complementary, not hostile**. Header the block
*"Building on INCOIS, not replacing it."*

### Block 4 · The Product *(3 screenshots, thin `#ece5d6` border, captioned in mono)*

1. **Fisher View** — *One word: GO. Live sea state, tides, return time.*
2. **Fishing Zones + SHAP** — *The model explains why a zone is green.*
3. **Catch certificate** — *EU IUU Reg. 1005/2008, ready for export.*

---

## SIDE 2 — The Proof

### Block 5 · How It's Built *(label: TECH & FEASIBILITY)*

A compact architecture strip — 4 stages, left to right, connected by thin arrows:

```
OPEN DATA          INTEGRATION            AI LAYER              DELIVERY
ARGO · INCOIS  →   Schema matching   →    Isolation Forest  →   PWA · SMS
GFW · CMFRI        PostGIS fusion         XGBoost + SHAP        Voice (Hi/Ta)
WoRMS · FishBase   AIS quality QC         YOLOv8 + ResNet50     REST API
Open-Meteo · NCBI  Provenance tagging     RAG (Llama 3.3 70B)   Ledger
```

Then a **model table** — and note the fourth column, it is deliberate:

| Model | Job | Why this model | Status |
|---|---|---|---|
| Isolation Forest | Marine Health Index | Unsupervised — no ground truth exists for "ocean health" | ✅ Working |
| XGBoost + SHAP | Fishing zone classification | Tabular, 6 features; exact attributions, not approximations | ⚠️ Unvalidated vs. CPUE |
| YOLOv8 + ResNet50 | Species ID from catch photo | 13 species = majority of Indian landings by volume | ✅ Live inference |
| ConvLSTM | Migration forecast | Routes are CMFRI/IOTC literature-derived | ⚠️ Scaffolded, untrained |

### Block 6 · Validation & Honesty *(bordered box, `#f7efdb` amber tint)* ⭐

**This box is the highest-leverage element on the entire handout. Do not cut it.**

Header: **What's live, and what isn't**

> **Live now:** Open-Meteo marine weather & tides · YOLOv8 + ResNet50 vision
> inference · Llama 3.3 70B RAG answers · WoRMS taxonomy · IUCN status
>
> **Synthetic fallback in this demo:** ARGO, Global Fishing Watch and INCOIS feeds —
> blocked on an API credential, not on engineering. Pipelines and schema are built.
>
> **Not yet validated:** the zone classifier against real catch-per-unit-effort.
> That is what the pilot is for — and why fishers use it free.

Footer line, italic: *The platform ships a `/trust` page that states this publicly.*

Every other team's handout claims everything works. A judge who has sat through six
of those will read this box twice and remember you. It converts your weakest point
into your most credible one.

### Block 7 · Who Pays *(label: BUSINESS PLAN / IMPACT — deep teal block)*

**Headline, mint:** *The fisher never pays. He's the supply side.*

Flywheel — 5 nodes in a circle or arc, mono labels:
`Fishers log catches → Models learn ground truth → Advisories sharpen → More fishers join → Traceability data compounds`

Three revenue cards — **make the exporter card the visual hero (amber `#d49a2e` badge, "PRIMARY")**:

| Tier | Price | Buyer |
|---|---|---|
| 🏅 **Exporter Traceability** | **₹100** / verified certificate · or ₹25k/mo | Seafood exporters — an existing compliance cost |
| **Institution Pro** | **₹2.5 L** / year | Universities, labs, consultancies — API + bulk data |
| **Government** | Custom, per district | State fisheries departments |

Market strip beneath, 4 mono stats:
`₹60,523 Cr — India's seafood exports FY24` · `EC 1005/2008 — EU IUU, no certificate = no market access` ·
`₹2,703 Cr — PMMSY allocation 2025–26` · `26 lakh — fishers already on the National Fisheries Digital Platform`

Closing line: *We don't build distribution — we plug into it. Platform run cost at
pilot scale: **₹25,000/month**, because every input is open data.*

### Block 8 · Impact *(label: PROBLEM SOLVING & IMPACT)*

Four tiles + a transparency note:

| **₹2.05 Cr** | **₹41,000** | **579 t** | **79%** |
|---|---|---|---|
| fuel saved / yr, 500-fisher pilot | back per fisher, per year | CO₂ avoided / yr (≈126 cars) | of logged catch rated sustainable *(live)* |

Small print, muted — **keep it, it's a credibility signal:**
*Derived from 5 stated assumptions: 500 fishers × 12 trips/mo × 3 L saved/trip ×
₹95/L. Deliberately conservative — INCOIS advisory studies report 15–25% fuel
reduction; we modelled far below that because we haven't measured it ourselves yet.*

SDG badges in a row: **3** Good Health · **8** Decent Work · **12** Responsible
Consumption · **13** Climate Action · **14** Life Below Water

### Block 9 · Footer *(thin, deep teal)*

`OceanMind v1.0 · Adi (Crriminson) · Atharv (AtharvK-28) · Dept. of Bioinformatics, Marwadi University`
+ repo QR, + contact email

---

# 📄 DOCUMENT B — Architecture & Model Card *(single A4, optional)*

**Purpose:** answers *"what did you actually build vs. call an API for?"* on paper.
Hand across only when asked.

- **Header:** `TECHNICAL APPENDIX — what we built`
- **Full-page data-flow diagram**: the three pillars (Oceanographic / Fisheries /
  Biodiversity) converging into the integration layer, then the AI layer, then
  delivery. Use the deep-teal palette; this should be the prettiest thing you print.
- **A two-column "Ours / Third-party" table** — this is the point of the card:

| Third-party | Ours |
|---|---|
| Open-Meteo (weather) · Groq (LLM inference) · Roboflow (vision hosting) · Bhashini (voice) | Schema matching across ARGO NetCDF, INCOIS JSON, NCBI FASTA · PostGIS spatio-temporal fusion · AIS 5-stage quality pipeline · MHI + SFZ models · SHAP layer · provenance tagging · hash ledger · entire product surface |

- **Bio credentials strip** (this is a Bioinformatics department — lead with it):
  `WoRMS AphiaID entity resolution` · `eDNA: 12S MiFish marker, BLAST+ vs NCBI, 1D CNN for novel sequences` ·
  `Shannon / Simpson / Pielou evenness` · `FishBase allometric length-weight` · `IUCN Red List integration`
- **API surface:** 20 REST endpoints, Swagger at `/docs`

---

# 📄 DOCUMENT C — Business Model Card *(single A4, optional)*

**Purpose:** answers *"how does this survive after the hackathon?"*

- Full-width **flywheel diagram** at the top (the 5 nodes, as a proper loop)
- **Unit economics block:** run cost ₹25k/mo → break-even ≈ **250 certificates/month**
- **Go-to-market, 3 phases:**
  1. **Pilot** — one cooperative, Kochi or Veraval, 500 fishers. Success metric is
     *measured fuel spend vs. a control group*, not downloads.
  2. **Revenue** — onboard exporters already filing EU catch certificates via MPEDA
  3. **Scale** — distribute through NFDP's 26 lakh registered fishers; per-district
     government partnerships
- **Defensibility:** *"The models are copyable in a month. The catch-log ground
  truth takes years and cooperative relationships — that's the moat."*
- **Risk box, stated plainly:** *"The main risk is adoption, not technology.
  Changing a 4 a.m. habit is harder than any model here."*

---

# 🎨 Ready-to-paste prompt for Claude (design)

Copy everything below into a fresh Claude conversation, and attach this file plus
3 screenshots of the app.

---

> I need a **double-sided A4 judge leave-behind** for a hackathon final
> (Biothon 2026, Environment & Biodiversity). It's judged on five criteria worth
> 20 marks each: Problem Solving & Impact, Innovation & Originality, Tech &
> Feasibility, Business Plan, and Presentation.
>
> I'm attaching a complete content brief — **all copy in it is final and verified,
> please don't rewrite or invent facts, especially numbers.** Lay it out exactly as
> the block structure describes. Produce it as a self-contained HTML page styled
> for A4 print (210×297mm, `@page` margins ~12mm, two pages).
>
> **Design system — use these exactly, they're from the product's own CSS:**
> - Page background `#f1ece1` (warm paper, not white) — this is the signature look
> - Deep teal gradient `#16434c → #0e2d34` for header/dark blocks
> - Accent `#1f7a8c`, mint `#9fe0d6` (big numbers on dark only)
> - Green `#3a8c5f`/`#eaf3ef`, amber `#d49a2e`/`#f7efdb`, red `#c25a44`/`#f6e6e1`
> - Text `#16323a` / `#6d7e80` / `#8a9698`; hairline borders `#ece5d6`
> - Fonts: **Newsreader** serif for headlines and big numbers, **IBM Plex Sans**
>   for body, **IBM Plex Mono** uppercase `0.15em` tracking for small labels
>
> **Tone:** editorial and scientific — closer to a journal spread or Monocle than a
> startup deck. Generous white space, hairline rules, no drop shadows, no gradients
> except the teal blocks. It must survive black-and-white printing, so don't rely
> on colour alone to carry meaning.
>
> **Priorities:** the amber "What's live, and what isn't" box on side 2 is the most
> important element — it must draw the eye. The three revenue cards should make the
> Exporter card the clear visual hero. Big numbers should be genuinely big.
>
> Leave a placeholder box for a QR code in the masthead and clearly marked slots for
> the three screenshots.

---

## Before you send it — 3 things to have ready

1. **Screenshots** (crop tight, no browser chrome, 2× resolution):
   Fisher View with GO · Fishing Zones with the SHAP chart open · the exporter certificate
2. **QR code** → wherever the demo is reachable (deployed URL, or the GitHub repo
   if it isn't deployed). Generate at ≥300 dpi.
3. **Contact line** — emails for both team members. Judges who want to follow up
   after a hackathon are the entire point of a leave-behind, and teams forget this
   constantly.
