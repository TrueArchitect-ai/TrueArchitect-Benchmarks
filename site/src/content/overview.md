# Better Context, Better Results

<!-- Sections 1–3 (TL;DR · Why we built this · The problem with lexical and semantic
     search) are a first hack at the restructure, 2026-09-14. Sections 4–7 are your
     text, moved into the new order with headings normalised to ## and nothing else
     changed; the unfinished lines are marked with comments like this one, which do
     not render. -->

## TL;DR

This is TrueArchitect's own benchmark. We built the tool, we wrote the questions, we ran every arm ourselves, and we published all of it: every run, every transcript, every judged answer, and the code that produced the numbers. Read it with that in mind. It is also why the numbers are worth reading: nothing here is a summary of something you cannot open.

> Better context, better results.

What a model can do at any given tier is decided more by what is in its context window than by the tier, the training, or what people say about the model online. We set out to test that claim on the one part of context that can be built deterministically, codebase understanding, and to measure it against the tools developers actually use.

Against bare Claude Code, Codex and Cursor Agent, and against the best of the codebase indexing tools on each measure, at the models each of them ran, TrueArchitect showed:

* **28–54% fewer context tokens** per run, up to 65% at individual models
* **7–9 points more accurate** on the twenty hard questions, where the tools separate
* **14–30% less run-to-run variation** in accuracy: the same tool gives the same result again
* **5–22 points more runs at 90%+ accuracy**: a good average became a dependable one
* **18–56% lower cost per correct answer**
* **3–6 points more accurate** over all fifty questions, easy ones included

Every one of those is a card on the [results page](/), and every card opens the figure and the runs behind it.

## Why we built this

> Autonomous agent programming has an irresistible appeal.

If I can say a few sentences, or a few paragraphs, and an agent or a swarm of them builds what I meant, with the right architecture and the right product sense, then everyone becomes the CEO of a perfect engineering team. Say a few things, get the right code done the right way. Amazing.

What mires that utopia is not model capability. Most models have more than enough training on code. It is the infinite variables of context, instruction, and pattern matching inside the window of that particular agent, on that particular task. The same model, cheap or expensive, produces accurate and inaccurate work depending on what it was shown. Read a coding forum for a few days and you will see "this model is incredible" and "this model is garbage" about the exact same model, in the same week, and both are true reports of what those people saw.

> If the agent is right 80% of the time, that is phenomenal, except that on any given step you do not know whether you are in the 80% or the 20%.

That is the cornerstone problem of agentic development: when to trust it, and how to keep quality when the volume of output outruns any human's ability to read it. And it compounds. Coding tasks cascade. Agents spawn agents, and every agent reads the artifacts the last one left. A slightly wrong understanding of the codebase, a stale assumption, an invented pattern, becomes the input to the next agent, and the one after that. We call it **poisoned context**, and it goes viral in a codebase faster than anyone can detect it. Its milder cousin is overgeneration: one task grows unasked-for features, alters the codebase's conventions, and leaves behind code nobody specified. Sometimes that turns out fine. When it does not, it is the hardest kind of code to debug, because nobody intended it.

> Context is the most controllable aspect of agentic coding.

It is the one variable in that whole system a developer can actually set. Humans know this; it is what every meeting, whiteboard, ticket and standup is for: getting a group of minds to hold the same picture of the work. No two people understand a thing identically, and neither do two agents. When the agents building a deep, interdependent application do not share the same understanding of the codebase, the difference shows up in the codebase. So the question we cared about was not which model is best. It was how to give every agent the same, correct understanding of the code, every time, and how much that is worth.

## The problem with lexical and semantic search

> The tools that help an agent discover a codebase are the same tools that lead it astray.

Today an agent learns a codebase the way a new hire does on day one: it greps for names, opens files, reads what it finds, and builds a picture from fragments. Harnesses add semantic search on top, and developers add Markdown files, skills and memory systems to tell the model what the structure is. Every one of those inputs is text, and every one of them has the same flaw: nothing marks any of it as wrong.

Every token in the window is a weight. A stale comment and a live function enter the same computation on the same terms; the model can discount the stale one only if something else in the window shows it to be stale, and usually nothing does. The model cannot tell correct information from incorrect information. It can only find what is there and reason from it. A stray Markdown file, an outdated docstring, a search for a word that is nearly but not quite the name used in this part of the code, and the agent now holds a picture of the codebase that is incomplete or simply false, with no signal that it is.

Semantic search does not fix this; it changes its shape. Embeddings put related concepts near each other, and that is genuinely useful for finding things. But nearby in latent space does not mean consistent in meaning. Two passages can sit close together and contradict each other, and a retrieval that returns both hands the model a coherent-looking context that is not coherent. Humans are good at discounting that kind of noise; we call it experience, or focus. An LLM has only what is in the window. And when a codebase uses different names for the same thing in different places, which every real codebase does, lexical search misses the other half outright, and the code gets written twice.

The consensus among people doing this seriously, and it has been our experience, is that assisted coding lets you go twice as fast and retrace your steps four times as often. The retracing is the context problem. So we asked whether the context could be built a different way.

## Our question

> Can we build context more deterministically?

LLM Harnesses (Claude Code, Codex, Cursor, etc.) provide a set of tools for the LLM to do "codebase discovery." Developers create Markdown files, Skills, and sometimes "Agentic Memory" systems to tell the model the structure, user intent, or a myriad of other approaches that each developer figures out on their own.

## What we did

<!-- TODO (yours): the short version of the Procedure page — one repository, fifty
     questions in two batteries, the arms, the models, the protocols, the judge, the
     public package. Three or four paragraphs; link to /procedure/ for the rest. -->

## What we discovered

> It's not only possible to have much more deterministic context, it performs better on nearly every metric.

The problem of creating codebase indexing is not actually a new problem that we solved in isolation. We have numerous tools for this going back decades. The newer problem is that all those systems were for several purposes: developer assistance in IDEs, syntax highlighting and error surfacing while coding, application profiling, dynamic compilation feedback.

LLMs weren't in the picture when all of our solutions to various coding technologies were developed; they weren't optimized for the LLM architecture with limited context and targeted changes. SCIP, Tree-sitter and the rest were not designed for LLMs, they were designed to solve specific problems.

<!-- TODO (yours): the discoveries themselves. Two candidates from the data:
     (1) the cross-tier result — on the hard battery, TrueArchitect at Haiku 4.5 scores
         above bare Claude Code at Opus 4.6 and Opus 4.8 (Figure 11 with the hard battery
         selected) — which is the defensible form of "tier matters less than context";
         the raw form ("once you get to mid-tier, accuracy is not determined by tier")
         is contradicted by the bare-harness numbers, which climb steeply with tier.
     (2) the reliability gap being wider than the accuracy gap (Figure 5 vs Figure 2). -->

**The TrueArchitect motto**: better context, better results.
