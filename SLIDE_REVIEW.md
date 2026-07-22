# OceanMind Prezi — Review & Revision List

> Reviewed against the built app, the verified research, and the 5×20 rubric.
> Ordered by marks at risk. Work top-down; stop when you run out of time.

---

## The one-line verdict

**The deck is about *the ocean*. The product is about *an Indian fisher*.**
Nine slides in, a judge still doesn't know that OceanMind speaks Tamil, knows about
the monsoon ban, or prints EU export certificates — which are the three things that
make it not-a-dashboard. Every slide could have been written before you built
anything, and that is exactly what loses Tech & Feasibility and Innovation marks.

Fixing the six items in 🔴 below is worth more than any visual polish.

---

# 🔴 MUST FIX — marks are actively bleeding here

## 1. There is not a single screenshot of the working product
**Rubric hit: Tech & Feasibility (20) + Innovation (20)**

Nine slides, zero evidence the software exists. Slides 4, 5, 7 and 8 use *stock
photography* — and slide 4's hero image is a **container/RoRo cargo ship**, which
has nothing to do with artisanal fishing. A judge reads stock imagery as "no product."

**Fix:** replace every stock photo with real UI. You already have the three
screenshots from the handout — Fisher View, Fishing Zones + SHAP, and the catch
certificate. The certificate especially: nobody else in the room will have one.

## 2. Nowhere do you mention INCOIS
**Rubric hit: Innovation & Originality (20)**

Slide 5 compares OceanMind to *"Traditional Systems"* illustrated with a photo of an
old wheelhouse console. That's a straw man, and any judge who knows Indian marine
science will say *"INCOIS already publishes free PFZ advisories"* — and you'll be
answering it cold instead of having pre-empted it.

**Fix:** rename slide 5 to **"Building on INCOIS — not replacing it"** and use the
real comparison (validity / reasoning / reach / after-the-catch) from the handout.
Naming the incumbent honestly is what makes the differentiation credible.

## 3. The business slide contradicts your own app
**Rubric hit: Business Plan (20) — the whole 20**

Slide 8 says target customers are *"Fisheries Departments, Marine Research
Institutes, Coastal Governments, NGOs, Sustainable Aquaculture Companies"* and
revenue is *"SaaS subscription, government contracts, API licensing."*

Three problems:
- **It contradicts `/pricing` in your own product**, where *exporters* are the
  primary revenue stream and fishers are explicitly free supply-side.
- **"Sustainable Aquaculture Companies"** — you do marine capture fisheries, not
  aquaculture. Wrong customer.
- **Not one number.** No price, no market size, no unit economics. This is the
  easiest 20 marks on the rubric and the slide scores near zero.

**Fix — replace the whole slide with:**
> **The fisher never pays. He's the supply side.**
> · Exporter traceability — **₹100 / verified certificate** or ₹25k/mo · *primary*
> · Institution Pro — **₹2.5 lakh / year**
> · Government — custom, per district
> · Market: **₹60,523 Cr** India seafood exports · gated by **EU IUU Reg. 1005/2008**
> · Run cost **₹25,000/month** (all open data) → break-even ≈ **250 certificates/mo**
> · Distribution: **26 lakh fishers already on the NFDP**

## 4. Slide 1's statistics are the wrong problem
**Rubric hit: Problem Solving & Impact (20)**

Your five stats are: overfishing · marine heatwaves · **coral reef loss** · **ocean
plastic** · IUU losses.

**OceanMind does nothing about coral reefs or plastic.** The rubric rewards *"solution
addresses the root cause"* — listing problems you don't solve actively costs you.
And every figure is global, when your product is Indian.

**Fix — swap to the numbers that set up your actual solution:**

| | |
|---|---|
| **54%** | of a mechanised trawler's operating cost is fuel *(CMFRI)* |
| **₹1.5 lakh** | fuel burned on one 3-day Kerala trip — on a guess |
| **14.5 M** | Indians dependent on marine fisheries |
| **35.5%** | of world fish stocks overfished *(FAO 2025, 2,570 stocks)* |
| **~7 M** | small-scale fishers below the 15 m AIS threshold |

## 5. ⚠️ Two slides claim a model you haven't trained
**Rubric hit: Tech & Feasibility — and credibility if challenged**

- Slide 2: *"**Predictive, Not Reactive:** Forecasts fish migration"* — headline claim
- Slide 4: *"Utilizes **ConvLSTM for migration**"*

Your ConvLSTM is **scaffolded, not trained**. The routes are literature-derived
waypoints from CMFRI/IOTC tagging studies. If a judge asks *"trained on what data?"*
you have to walk back a claim you put on a slide — which is far worse than never
making it.

**Fix:** change to *"Migration routes from CMFRI & IOTC tagging literature, with
published climate-shift projections."* That's true, still impressive, and unattackable.

## 6. There's no "what's live vs. synthetic" slide
**Rubric hit: Tech & Feasibility + Presentation**

This is the highest-leverage slide you don't have. Judges have sat through six decks
claiming everything works. One team volunteering its own limits is the one they
remember — and it defuses your single biggest Q&A risk before it's asked.

**Fix — add one slide, or a band on the "How it works" slide:**
> **Live now:** Open-Meteo weather & tides · YOLOv8 + ResNet50 vision · Llama 3.3 70B
> RAG · WoRMS taxonomy · IUCN status
> **Synthetic today:** ARGO, GFW, INCOIS feeds — blocked on an API credential, not on
> engineering
> **Not yet validated:** zone classifier vs. real catch-per-unit-effort — that's what
> the pilot is for
> *The product ships a `/trust` page saying exactly this.*

---

# 🟠 SHOULD FIX

## 7. It's a Biothon, in a Bioinformatics department — and there's no biology
The deck says "biodiversity databases" once. Missing entirely: **WoRMS AphiaID entity
resolution**, **eDNA metabarcoding** (12S MiFish, BLAST+ vs NCBI, 1D CNN), **Shannon /
Simpson / Pielou diversity indices**, **IUCN Red List**, **FishBase allometry**.

That vocabulary is what tells a biologist-judge you belong in this domain. Add a line
to the "How it works" slide at minimum — ideally give eDNA its own beat.

## 8. Fix the FAO figure for consistency
Slide 1 says **37.7% (FAO 2024)**. Your README, PRD and printed handout say **35.5%**.

Both are genuine FAO numbers — 37.7% is SOFIA 2024 (2021 data); 35.5% is the *Review
of the State of World Marine Fishery Resources 2025*, which assessed 2,570 stocks, the
largest ever. Neither is an error, **but you cannot show a judge two different numbers
on the paper and the screen.**

**Use 35.5% (FAO 2025) everywhere** — it's newer and from the bigger assessment.

Same slide: *"Doubled — marine heatwaves since the 1980s"* undersells you. The
India-specific figure is stronger: **tropical Indian Ocean MHWs have increased up to
fourfold** (Saranya et al. 2022), and the **Bay of Bengal recorded 94 MHW events
between 1982–2018**.

## 9. Slide 3 is filler — cut it
*"The Urgency for Proactive Management"* has two bullets that say the same thing
("management is reactive" / "being reactive causes damage"). Zero new information,
and at 5 minutes you cannot afford 30 seconds of restatement. **Delete.**

## 10. Nine slides doesn't fit five minutes — especially with a live demo
Nine slides ≈ 33 s each with *no* demo. If you're also demoing (you should be — it's
your strongest evidence), you have room for about **five slides total**.

**Recommended structure:**

| # | Slide | Time |
|---|---|---|
| 1 | Title (with logo) | 0:10 |
| 2 | The problem — the 5 Indian stats | 0:35 |
| 3 | Building on INCOIS — the comparison | 0:35 |
| — | **LIVE DEMO** — Fisher View → SFZ/SHAP → CV upload → certificate | 2:15 |
| 4 | Business model — the numbers | 0:45 |
| 5 | Live vs. synthetic + impact + close | 0:40 |

Keep the cut slides in the Prezi *after* the close — Prezi's zoom-out canvas makes
them perfect Q&A backup. Slide 6 (Expected Impact) and 7 (Transformative) work well
as answers you can jump to rather than things you say unprompted.

---

# 🟡 POLISH

- **Use the logo.** The title slide is plain text. You now have `logo-mark.png` and
  `logo-full.png` in `frontend-react/public/`. Put the full lockup on the title slide.
- **The Prezi watermark** (bottom-left, every slide) reads as unpolished to judges.
  Remove it if your plan allows; if not, ignore — not worth paying for today.
- **Dismiss the "Share with a QR code" popup** before presenting — it's visible in
  your slide-3 capture and would look sloppy on the projector.
- **Slide 6 "Expected Impact"** is all qualitative ("reduced", "lower", "faster").
  Quantify it: **₹2.05 Cr fuel saved/yr**, **₹41,000 per fisher**, **579 t CO₂**,
  **79% of logged catch sustainable** — all from your `/impact` page.
- **Slide 5's two text columns** are dense paragraphs. Judges skim; make them 4 short
  parallel lines per side.
- **"Why OceanMind is Better"** → **"What's different"**. Same claim, less swagger,
  and it stops inviting a fight you don't need.
- **Add a closing slide** with team names, department, and contact. Right now the deck
  ends on a stock reef photo.

---

# ✅ What's genuinely good — keep

- **The visual system is strong.** Navy/blue palette, consistent card treatment, good
  typographic hierarchy. It looks like one deck, which many won't.
- **Slide 4's left-to-right pipeline** (Data → AI → Prediction → Delivery) is the right
  way to show architecture. Just swap the cargo ship for a real screenshot and fix the
  ConvLSTM line.
- **"Explainable AI: predictions backed by SHAP"** on slide 2 — that's your genuine
  differentiator and it's correctly stated. Promote it, don't bury it fourth in a list.
- **Slide 7's closing paragraph** ("predict change instead of reacting to it") is well
  written. Reuse the phrasing verbally even if the slide is cut.

---

## If you only have 20 minutes

1. Swap slide 1's five stats to the Indian ones *(5 min)*
2. Rewrite slide 8's business content with the real pricing numbers *(5 min)*
3. Drop three product screenshots onto slides 4 and 5 *(5 min)*
4. Delete slide 3, fix the two ConvLSTM claims *(3 min)*
5. Change 37.7% → 35.5% *(1 min)*

That's the difference between a deck that describes the ocean and a deck that
presents a product.
