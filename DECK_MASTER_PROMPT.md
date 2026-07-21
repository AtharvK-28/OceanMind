# OceanMind — Master Prompt for AI Deck Generation

> **How to use this:** Step 1 grounds the facts, Step 2 renders the design.
> The anti-hallucination guarantee comes from *what you upload*, not from asking
> nicely — so do Step 0 properly.

---

## ⚠️ Tooling reality check

**NotebookLM will not give you a PowerPoint file.** It produces grounded summaries,
briefing docs, FAQs, mind maps, and Audio/Video Overviews — all cited back to your
uploaded sources. There is no `.pptx` or Google Slides export.

That's fine, because it's the right tool for the hard half of this job:

| Step | Tool | Why |
|---|---|---|
| **1. Content** | **NotebookLM** | Answers *only* from your uploaded files, with citations. This is what actually prevents hallucination. |
| **2. Design** | **Gamma** (best), Canva Magic, or your existing Prezi | These generate real slides from a text outline. |

If you'd rather skip both: I can build the deck directly as a self-contained HTML
slide file (projector-ready, arrow-key navigation, your real brand tokens and
screenshots). Say the word — content is already verified, so there's nothing to
hallucinate.

---

## STEP 0 — Upload these sources to NotebookLM

Upload **all** of these. Everything the deck says must trace to one of them:

```
e:\OceanMind\PITCH_5MIN.md          ← the verified 5-min script
e:\OceanMind\QNA_PREP.md            ← number cheat sheet + forbidden claims
e:\OceanMind\JUDGE_HANDOUT_BRIEF.md ← final handout copy
e:\OceanMind\SLIDE_REVIEW.md        ← what's wrong with the current deck
e:\OceanMind\README.md              ← architecture, phases, data sources
e:\OceanMind\docs\OceanMind_PRD.md  ← problem statement, personas
```

Do **not** upload the old `DEMO_SCRIPT.md` — it contains the outdated "685 green
zones" and "94% accuracy" framings you've since corrected, and NotebookLM will
happily cite them.

---

# 📋 THE MASTER PROMPT

Copy everything between the lines into NotebookLM (or Gamma, which also accepts it).

---

You are building the slide content for a **5-minute hackathon final pitch** with a
**3-minute Q&A** that follows. This is Biothon 2026, Environment & Biodiversity
domain, at Marwadi University's Department of Bioinformatics. Judges include
biologists and bioinformaticians, not only software people.

## Absolute grounding rules — these override every other instruction

1. **Use only facts present in the uploaded sources.** If a fact is not in them, do
   not include it. No filler statistics, no "industry standard" claims, no invented
   market sizes, no rounded-up numbers.
2. **Never alter a number.** Reproduce every figure exactly as written in the
   sources, with its unit and its citation.
3. If you believe a slide needs a fact you cannot find, **output the line
   `[UNVERIFIED — needs a source]`** instead of writing something plausible. I would
   rather have a gap than a guess.
4. **These claims are forbidden. They are factually wrong for this project:**
   - ❌ "Our model is 94% accurate" — that is Shedrawi et al. 2024's Ikasavea system,
     not ours. Any accuracy figure must be labelled *"literature benchmark we're
     targeting, not our measured output."*
   - ❌ "ConvLSTM forecasts fish migration" / "predictive migration model" — the
     ConvLSTM is **scaffolded and untrained**. Migration routes are literature-derived
     waypoints from CMFRI and IOTC tagging studies. Say that instead.
   - ❌ "All data is live" — ARGO, Global Fishing Watch and INCOIS feeds run on
     synthetic fallback.
   - ❌ "It's on the blockchain" — it is a SHA-256 hash chain, labelled
     `MOCK_IN_MEMORY` in the API response. Hyperledger Fabric is Phase 2.
   - ❌ "We replace INCOIS" — always complementary. INCOIS is a data source.
   - ❌ Any mention of **coral reefs, ocean plastic, or aquaculture** — OceanMind
     addresses none of these, and naming problems we don't solve costs marks.
5. **Use 35.5% for overfished stocks** (FAO 2025 review of 2,570 stocks). Do not use
   37.7% — an older FAO figure that would contradict our printed handout.
6. **Cite the source file for every factual claim** in the speaker notes.

## What this deck must accomplish

It is scored out of 100 on five equally weighted criteria. Every slide must be
earning against one of these, and the deck must visibly cover all five:

| Criterion | Marks | What judges look for |
|---|---|---|
| Problem Solving & Impact | 20 | A real, significant problem; solution hits the root cause; impact on target users |
| Innovation & Originality | 20 | Uniqueness; novel approach; differentiation from existing solutions |
| Tech & Feasibility | 20 | Technical soundness; implementable; appropriate technology |
| Business Plan / Impact | 20 | Revenue model clarity; scalability; long-term social and economic value |
| Presentation & Pitch | 20 | Structure, clarity, confidence, handling questions |

**The Business Plan criterion is worth as much as the technology.** Give it a full
slide with real prices and unit economics — not adjectives.

## Timing budget — this is a hard constraint

Total stage time is **5:00**, and **a live product demo takes 2:15 of it.** That
leaves **2:45 for all slides combined.**

Produce **exactly 5 slides**, budgeted:

| # | Slide | Time | Primary criterion |
|---|---|---|---|
| 1 | Title | 0:10 | Presentation |
| 2 | The problem | 0:35 | Problem Solving & Impact |
| 3 | Why it isn't already solved | 0:35 | Innovation & Originality |
| — | *(LIVE DEMO — no slide, placeholder only)* | 2:15 | Tech & Feasibility |
| 4 | Business model | 0:45 | Business Plan |
| 5 | Honesty + impact + close | 0:40 | Tech credibility + Impact |

Speaker notes must fit the time budget at **140 words per minute**. A 0:35 slide gets
**at most 80 words of speech.** Count them and state the count.

## Slide content requirements

**Slide 2 — The problem.** Lead with the economics of one fisher's decision, not
global ocean statistics. Must include: the cost of a wrong decision, fuel as a share
of operating cost, how many Indians depend on marine fisheries, the overfishing
figure, and how many small-scale fishers sit below the AIS tracking threshold. End on
the idea that the fisher losing money and the ocean losing fish are the same bad guess.

**Slide 3 — Why it isn't already solved.** Must name **INCOIS** explicitly and
positively, then give the structural limits of a same-day satellite advisory across
four dimensions: validity window, whether it explains its reasoning, who it reaches,
and what happens after the catch. Frame as *"building on INCOIS, not replacing it."*

**Slide 4 — Business model.** Must state that the fisher never pays and is the supply
side of a data flywheel. Must include all three paying tiers with their exact prices,
the export market size, the regulation that forces the compliance spend, monthly run
cost, and break-even volume. Numbers, not adjectives.

**Slide 5 — Honesty, impact, close.** Must include a clearly labelled three-way split
of what is live, what is synthetic today and why, and what is not yet validated. Then
the pilot impact figures with the note that they derive from five stated assumptions.
Close on the fisher's question.

## Domain requirement — this is a Bioinformatics department

Somewhere in slides 3–5, use the biological vocabulary that shows domain command:
**WoRMS AphiaID entity resolution**, **eDNA metabarcoding (12S MiFish marker, BLAST+
against NCBI)**, **Shannon / Simpson / Pielou diversity indices**, **IUCN Red List
status**, **FishBase allometric length–weight parameters**. These are all implemented —
find them in the sources and place them where they fit naturally.

## Output format

For each of the 5 slides, produce exactly this structure:

```
SLIDE n — [TITLE]
Time: 0:xx | Rubric: [criterion]

HEADLINE:      (max 8 words, the one idea)
SUBHEAD:       (max 15 words, optional)

ON-SLIDE TEXT: (max 40 words total — bullets or stat tiles.
                Slides are read, not narrated. Never a paragraph.)

VISUAL:        (what image/chart/screenshot goes here and why)

SPEAKER NOTES: (what is actually said aloud — write it as spoken words,
                not as description. State the word count. Must fit the time
                budget at 140 wpm.)

SOURCES:       (which uploaded file each fact came from)
```

## Style

- Short declarative sentences. No marketing language — no "revolutionary",
  "cutting-edge", "seamless", "leverage", "empower", "game-changing".
- Numbers do the persuading. Put them on the slide, big.
- Indian context throughout: rupees, Indian ports, Indian institutions.
- The tone is a confident engineer explaining their work, not a startup founder
  raising money.
- Assume the judge is smart, skeptical, and has seen six decks already today.

Now produce the five slides.

---

# 🎨 STEP 2 — Turn the content into slides

Take NotebookLM's output into **Gamma** (gamma.app — best free option that actually
generates decks) and prepend this:

> Build a 5-slide presentation from the content below. Do not add, remove or reword
> any facts or numbers — the copy is final and verified.
>
> **Design system:** background `#f1ece1` warm paper (not white) with deep-teal
> `#16434c → #0e2d34` gradient blocks for emphasis; accent `#1f7a8c`; mint `#9fe0d6`
> for large numbers on dark; green `#3a8c5f`, amber `#d49a2e`, red `#c25a44` for
> status. Headlines and big numbers in **Newsreader** serif; body in **IBM Plex Sans**;
> small uppercase labels in **IBM Plex Mono** with wide letter-spacing.
>
> **Style:** editorial and scientific — a journal spread, not a startup deck.
> Generous white space, hairline rules, no drop shadows, no stock photography of any
> kind. Statistics should be very large. 16:9. Must be legible from the back of a
> room — minimum 20pt body text.
>
> Leave a clearly marked image placeholder on every slide where a product screenshot
> is indicated.

---

# ✅ Verification pass — do this before you present

AI-generated decks drift even with grounding. Check each line:

- [ ] Every number on every slide appears in `QNA_PREP.md`'s cheat sheet
- [ ] **35.5%** everywhere — not 37.7%
- [ ] No slide says the ConvLSTM predicts or forecasts migration
- [ ] No accuracy percentage is claimed as *ours*
- [ ] "SHA-256 hash chain", never "blockchain" unqualified
- [ ] INCOIS named, framed as complementary
- [ ] No coral reefs, no plastic, no aquaculture
- [ ] Business slide has ₹100, ₹2.5L, ₹25k/mo, ₹60,523 Cr, 250 certificates
- [ ] The live/synthetic split appears and is honest
- [ ] Speaker notes total ≤ 400 words across all 5 slides *(2:45 at 140 wpm)*
- [ ] Every screenshot placeholder has a real screenshot in it
- [ ] Slide numbers match the handout's claims exactly — a judge holds both

**Then read it aloud with a timer.** Silent reading always runs ~25% fast, and the
demo is unforgiving of a deck that overruns.
