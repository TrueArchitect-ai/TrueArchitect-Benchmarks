# What We 

# Opinionated Overview {TLDR}

> Autonomous agent programming has an irresistible appeal. 

If I can say a few sentences, or even a few paragraphs, and an LLM agent (or swarm) creates it as intended, with the right architecture and product vision, then *everyone* becomes like a CEO of their own set of perfect employees. Say a few things, get high performance code out, the right code done the right way. Amazing.

What *mires* this utopia of software development is multifaceted to say the least. We have experienced how LLM Agents vary in their outputs and completion. Each idea spawns a handful (or a dozen) new ideas, and many go incomplete but with partial artifacts in the codebase. This is far less about model capability and what patterns exist in the model training, most models have more than enough training on coding, instead, it's far more about the infinite variables of context, instruction, and pattern matching within the context *of that particular agent.*

> If accuracy is matching the right solution to the right understanding of the problem, then the exact same model, cheap or expensive, at any tier, can produce both accurate and inaccurate results, regardless of how they are marketed and the opinions on social media. 

Read popular Reddit channels for a few days and you will see the dichotomy, a plethora of "this model is incredible" and "this model is sh-t"... for the same exact model. The **challenge** is that it is hard to know exactly *when* an LLM is correct, did things correctly, and when it didn't. For instance, if the LLM is correct 80% of the time, phenomenal, except on any given step or task, was that task part of the 80% or part of the 20%? This is one of the cornerstones of agentic development, when to trust it, and how to ensure quality when the volume of output far exceeds human ability to read it. 

## The Coding Hydra

Coding tasks and steps cascade, and with multi-agent autonomous development, it compounds what is being developed via prompt and context engineering. If coding tasks involve many different processes, systems, and dependencies, and you can't tell if a given task was done correctly, the downstream negative effects grow exponentially. Agents that spawn agents can develop what we call "poisoned context", a slightly (or not so slightly) incorrect codebase understanding that becomes the artifacts the parallel or next agent reads. When things go wrong, even if it's slightly, it results in wasting tokens, wasting time, and lowered trust (and a host of other psychological effects we won't go into). Future agents and other agents will read the outputs of previous agents, so when context is *poisoned* with incorrect intent, assumptions and code patterns, it can go *viral* in a codebase quickly and without easy detection.

While not quite a misunderstanding, nor poisoned context, overgeneration on one task, can lead to cascading overgeneration of unasked-for features, altering of standards and codebase patterns, and codebase bloat for unnecessary features that were not intentional. Sometimes, this can go right, code for things not thought of can be beneficial, but it's still out-of-control in the sense that it was unspecified, and when it goes wrong, it can lead to a lot of poor, and difficult to debug, code. This happens so often that there are so many memes of this everywhere, and we call it Vibe Coding, or coding without much consideration of code quality or testing.

> This means **correct context** and **correct codebase understanding** is not just important, it is, to borrow AI colloquialism, "load-bearing" and the "most insightful thing said in this entire overview." Humor aside, ***context is the most controllable aspect of agentic coding*** and it is not just true for LLMs, it's true for humans just as much. 

All those meetings, all those whiteboards, plans, tracking, tickets, they are all to try to create alignment amongst humans. We have performance reviews, slidedecks, slack channels, standups, company weeklys, all to try to align our thinking and have a shared context together. At every company, and any task of any department, there is a percentage of wasted work due to slight misunderstanding. While for most tasks, this is likely incalculable, but for coding, actually for many things, it can be calculated. 

Not every human, nor every LLM, will understand everything the same, in fact no one understands anything exactly the same. This is one of the beauties of the complexity of the human mind and experience. Despite this, in a hundred or so years we've gone from horse and buggy to landing on Mars, hundreds of billions invested in LLMs, and contemplating robots for everyday tasks. However, when agent to agent does not understand the codebase the same and you are relying on agents for interdependence consistency and deep functional applications (not talking about brochureware sites), then the codebase understanding of *any agent* in the system is paramount. When they differ, then that inconsistency will manifest in the codebase.

## The Problem with Lexical and Semantic Search 

> The tools that help an LLM with code discovery, and develop some level of codebase understanding, is exactly what also leads it astray.

Lexical and semantic search have fundamental problems. With vector search and RAG, it's well known that yes, you can find information that contains similar concepts, they will [cosine] locate near each other in latent space, but the *meaning* of the related concepts can contradict or decohere the response depending on what the actual content is. Just because embeddings are in a similar landscape/direction, does not mean, they correlate or add nuanced understanding. Humans have a stronger ability to differentiate and denoise information, we call this experience, focus, prioritization, and other terms. 

Every token in the window is a weight, and nothing marks a token as wrong. A stale comment and a live function enter the same attentional computation on the same terms; the model can discount the stale one only if something else in the window shows it to be stale, and usually nothing does. LLMs cannot easily distinguish between correct and incorrect information. They can only *find* information and process it in the context, depending completely, on what is in the context window. Stale or stray markdown files, code comments/docstrings, and also searching for words that aren't quite right results in a codebase understanding that may be incomplete, or incorrect. 

If a codebase has different naming conventions in different parts of the application, then semantic search often will fail to discover, and again improper code will be written, and have to be rewritten, if it's found at all. 

Overall, the consensus seems to be, and it has been our experience, is that with LLM assisted coding, you can go twice as fast, and also have to retrace your steps four times as often. Is there an answer? 

**The TrueArchitect Motto**: Better context, better results.

## What We Did

