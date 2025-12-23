Perfect — below is **only** the high-level, no-fluff list of *what to build*, the scope and boundaries, and the concrete deliverables and acceptance criteria. No code, no micro-tasking, no choice of stack — just the things to produce so the team can start coding with a cursor and not veer off track.

---

# MVP — WHAT TO BUILD (concise)

## Goal

Provide a demonstrable tri-model reasoning MVP that runs Thinker → Critic → Judge (all implemented on Gemini via system prompts) and **shows each model’s response side-by-side**, plus a final judgment that is demonstrably better than a single-model baseline.

---

## In-scope (must have for MVP)

1. **System prompts** — three polished system prompts (Thinker, Critic, Judge).
2. **Orchestrator** — a single controller that:

   * Accepts a user query,
   * Sends it to Thinker, collects response,
   * Sends Thinker + question to Critic, collects response,
   * Sends question + Thinker + Critic to Judge, collects final response,
   * Returns all three raw responses plus the Judge output.
3. **Baseline comparison** — single-call Gemini baseline response for the same question.
4. **Example set** — 10–20 curated test prompts (mix: factual, reasoning, ambiguous, trap) for demo.
5. **Simple demo interface** (CLI or minimal web UI) that:

   * Accepts a question,
   * Displays the baseline answer and the three-agent chain (Thinker, Critic, Judge),
   * Allows marking a preferred answer (optional).
6. **README / Run instructions** — clear one-page README describing how to run and what to demonstrate.
7. **Demo script** — 5 prepared demo cases with expected outcome notes (what to show & why it proves improvement).
8. **Acceptance checklist** — explicit pass/fail criteria for demo readiness.

---

## Out-of-scope (not for MVP)

* No fine-tuning or LoRA training.
* No heavy evaluation automation (no crowdsourced human eval pipeline).
* No full-fledged dashboard, analytics, or ML logging systems.
* No distributed multi-host deployment.
* No long-term data store for user queries or metrics.

---

## Deliverables (what to hand over)

1. **Prompts document** — final system prompts for Thinker, Critic, Judge and an instruction for baseline prompt.
2. **Orchestration spec** — brief description of orchestration inputs/outputs and error behaviors.
3. **Controller executable** — one runnable orchestrator (invokes Gemini roles) — returns JSON containing:

   * baseline_response
   * thinker_response
   * critic_response
   * judge_response
4. **Demo examples** — `demo_cases.md` with 10–20 prompts and short notes on expected improvements.
5. **Minimal UI** — tiny interface to enter a prompt and show all responses side-by-side (collapsible sections).
6. **README** — how to install, how to run, how to demo (one page).
7. **Acceptance checklist** — pass criteria and “what to show” for live demo.

---

## Acceptance criteria (how to know MVP is done)

* The system returns four texts for any query: baseline, thinker, critic, judge — reliably and within acceptable latency for demo.
* UI or CLI displays baseline and the three-agent outputs clearly and in order.
* All 10 prepared demo prompts run end-to-end and produce outputs saved to a demo results file.
* Demo script has annotated talking points for each case explaining why judge is better (or what difference the Critic made).
* README + prompts doc present and complete.

---

## UX / Presentation rules (how responses must be shown)

* Show raw outputs from each model (no filtering) plus Judge’s final polished answer.
* Display the Thinker output first, then Critic, then Judge.
* Highlight (in UI or demo notes) at least one concrete change the Critic requested and whether the Judge applied it.
* When showing improvement, use concrete examples: corrected factual claim, added missing premise, removed hallucination.

---

## Operational boundaries & constraints

* Use Gemini system prompts only; do not train models.
* Keep API usage quota and latency in mind; batch demo cases if needed.
* Ensure the orchestrator handles partial failures (e.g., if Critic times out, return baseline + thinker + error note).
* Respect privacy — do not persist PII from demo queries to public storage.

---

## Risks & mitigations

* **Risk:** Judge simply parrots Thinker or Critic and gives no added value.
  **Mitigation:** Tune Judge system prompt to require explicit Decision line and list of resolved contradictions.
* **Risk:** Latency too high for demo.
  **Mitigation:** Limit max tokens; prepare precomputed demo outputs as fallback.
* **Risk:** Baseline looks better on some prompts.
  **Mitigation:** Choose demo prompts that highlight reasoning errors (hallucinations, missing premises) where tri-model helps.

---

## Who delivers what (high-level roles)

* **Prompt lead** — finalize the three system prompts and baseline prompt.
* **Orchestration lead** — implement controller & error handling (single-file runnable).
* **Demo lead** — pick demo prompts, write demo script & talking points, prepare results file.
* **UI lead (optional)** — minimal interface showing side-by-side responses.
* **Owner** — validate acceptance criteria and run the demo.

(These are role suggestions — you can map them to individuals.)

---

## Demo checklist (what to show during demo)

1. Run the orchestrator on 3–5 live prompts (selected from demo set).
2. For each prompt, show:

   * Baseline output
   * Thinker output
   * Critic output (highlight 1–2 critique points)
   * Judge final (highlight applied fixes)
   * Narration: “Here the Critic caught X; Judge fixed Y — baseline had Z error.”
3. End with aggregated statement: “Out of 10 demo cases, tri-model corrected/ improved N cases versus baseline.”

---

## Final quick decisions (pick offline — no need to discuss unless you want)

* Do we show precomputed demo outputs as a fallback? (recommended: Yes)
* Do we build a very small UI or use CLI for demo? (recommended: small UI if time allows)
* Which 10 prompts to include? (owner picks from suggested pool)

---

That’s the complete **WHAT** — scope, boundaries, deliverables, acceptance, risks, and demo plan. No micro-management, no code, no implementation detail.

Use this checklist to start coding with a cursor and to keep the implementation focused on exactly what needs to be delivered for the MVP.
