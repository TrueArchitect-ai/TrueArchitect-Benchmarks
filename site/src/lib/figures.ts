// The figure registry — every figure the site shows, declared once: what it
// measures, how the columns are formed, its caption (three sentences: what it
// measures, how to read it, what it shows) and its formal explanation. The
// registry is pure data so the same declaration drives the build-time page,
// the client island and the navigation.
import type { CellKind } from './stats'

export type MeasureKey = 'ctx' | 'ctx_per_correct' | 'pct' | 'tool_calls' | 'wall' | 'llm_calls' | 'out_tokens' | 'cost' | 'cost_per_correct' | 'tool_result_tokens'
// per-model: one column per model for every arm · pooled: one column per arm
// (a vendor-bound measure over a multi-vendor roster still splits — see engine).
export type ColumnsMode = 'per-model' | 'pooled'
export type BatteryChoice = 'memos' | 'memos-hard' | 'both'

export type Figure = {
  slug: string
  number: number
  title: string       // the figure title, e.g. "Context tokens per run"
  short: string       // nav label
  kind: 'columns' | 'dots' | 'stack' | 'heatmap'
  measure: {
    key: MeasureKey     // which per-run value the rows carry (pct for spread statistics)
    cell: CellKind      // the statistic inside a cell
    label: string       // axis / table label
    unit: 'tokens' | 'pct' | 'ms' | 'count' | 'd' | 'usd'
    better: 'high' | 'low'
    vendorBound?: boolean // raw token counts: never pooled across vendors (tokenizers differ)
  }
  defaults: { exams: string[]; battery: BatteryChoice; columns: ColumnsMode; model?: string }
  // The columns choice is SITE-WIDE (remembered, synced across every figure);
  // a figure whose meaning is one mode declares it here and hides the control.
  lockColumns?: ColumnsMode
  reference: 'bare' | 'none'   // dashed lines at TrueArchitect's and the bare harnesses' pooled values
  caption: [string, string, string]
  explanation: string[]        // formal paragraphs
  disclosures?: string[]
}

export const FIGURES: Figure[] = [
  {
    slug: 'context-tokens', number: 1, title: 'Context tokens per run', short: 'Context tokens', kind: 'columns',
    measure: { key: 'ctx', cell: 'mean', label: 'context tokens per run (input + cache read)', unit: 'tokens', better: 'low', vendorBound: true },
    defaults: { exams: ['ZeroShotExam', 'MultiTurnExam'], battery: 'both', columns: 'pooled' },
    reference: 'bare',
    caption: [
      'Context tokens are the tokens the model read to answer a whole run: the uncached input plus every cache read, summed over every API call in the run, all threads included.',
      'Each column is the mean over the valid, scored runs of one arm at one model, every arm split by model because token counts are model facts; the dashed lines mark TrueArchitect\'s and each bare harness\'s pooled value wherever pooling is licensed.',
      'At every model the TrueArchitect column sits well below the same model running bare, and the indexing tools cluster at or above bare Claude Code: the index replaces reading.',
    ],
    explanation: [
      'Definition. For run r, context(r) = tokens_input(r) + tokens_cache_read(r), where tokens_input is the uncached tail of every request and tokens_cache_read the cached prefix re-read on each call. Both are summed over all API calls of the run, including sub-agent threads, from the per-call record named by token_source in the run record (a gateway ledger for TrueArchitect; the harness session logs or the harness\'s own per-call usage for the comparison group). Cache writes and output tokens are excluded here and reported in the run records.',
      'Aggregation. A column is the arithmetic mean of context(r) over the valid, scored runs of one arm at one model, for the selected exam and battery. When both batteries are selected, each battery forms its own cell and the column is the mean of the two cell means, so the longer battery does not dominate.',
      'Why per model. Token counts are tokenizer facts: a Sonnet token and a GPT token are not the same unit. The site therefore never pools raw token counts across vendors. The pooled-models view (the default) pools an arm over its roster only where the roster is a single vendor; an arm spanning two vendors stays split into one column per model whatever the columns choice, which the table discloses.',
      'Reading it. Lower is better. The like-for-like comparison is column to column at the same model: TrueArchitect at Sonnet 5 against bare Claude Code at Sonnet 5, TrueArchitect at GPT 5.6 Sol against Codex at GPT 5.6 Sol. The dashed reference lines are TrueArchitect\'s and the bare harnesses\' pooled means, drawn only where a pooled value is licensed (a single-vendor roster), so the indexing tools have both TrueArchitect and their baseline in the same picture.',
    ],
    disclosures: [
      'Exam protocols have different token denominators (a MultiTurn question replays its history; ZeroShot pays the fixed prefix per question). Switch protocols with the control above; the site never pools across them.',
      'A run whose token facts were not captured is excluded from its column, never counted as zero; the table\'s n is the number of runs behind each column.',
    ],
  },
  {
    slug: 'accuracy', number: 2, title: 'Accuracy per run', short: 'Accuracy', kind: 'dots',
    measure: { key: 'pct', cell: 'mean', label: 'accuracy (% of questions correct)', unit: 'pct', better: 'high' },
    defaults: { exams: ['ZeroShotExam', 'MultiTurnExam'], battery: 'both', columns: 'pooled' },
    reference: 'bare',
    caption: [
      'Accuracy is the share of a run\'s questions whose answer the grading pipeline marked correct, so every dot is one complete run of one arm at one model.',
      'The solid tick is the arm\'s pooled mean, the thin line its worst-to-best range, and dots are translucent so overlap reads as density; hover a dot for its model, repetition and run directory.',
      'TrueArchitect\'s distribution sits highest and tightest; the lower context use in Figure 1 is not bought with accuracy.',
    ],
    explanation: [
      'Definition. For a scored run r, accuracy(r) = 100 · score(r) / denominator(r), where score is the number of questions with an effective verdict of pass (tier T1 mechanical match or tier T2 judge, human adjudication outranking both) and denominator is the battery size. Did-not-finish runs have no score and are absent from this figure by construction.',
      'Aggregation. The mean tick is the hierarchical mean: cells of battery × model × exam are averaged with equal weight. The range line spans the minimum and maximum run. Every dot is drawn; nothing is summarised away.',
      'Reading it. Higher is better. Compare the position of the means and, separately, the vertical spread: two arms with the same mean and different spread are not equivalent instruments, and the spread is what a user experiences run to run.',
    ],
  },
  {
    slug: 'pass-rate', number: 3, title: 'Reliability: runs scoring at least 90 percent', short: 'Reliability', kind: 'columns',
    measure: { key: 'pct', cell: 'passrate90', label: 'share of runs at or above 90 % accuracy', unit: 'pct', better: 'high' },
    defaults: { exams: ['ZeroShotExam', 'MultiTurnExam'], battery: 'both', columns: 'pooled' },
    reference: 'bare',
    caption: [
      'Reliability asks a stricter question than accuracy: of all the runs an arm made, what share reached 90 percent or better?',
      'Each column is that share over the arm\'s valid, scored runs at one model (or pooled over its roster in the pooled-models view), with TrueArchitect and the bare harnesses as dashed references.',
      'The gap between arms is far wider here than in mean accuracy: the index converts a good average into a dependable result.',
    ],
    explanation: [
      'Definition. Within a cell (arm × battery × model × exam), pass-rate90 = 100 · |{r : accuracy(r) ≥ 90}| / |{r scored}|. The threshold is fixed at 90 percent of the battery, that is 27 of 30 on the base battery and 18 of 20 on the hard battery.',
      'Aggregation. Cells are averaged with equal weight across the selected batteries (and models, when pooled). The statistic is bounded in [0, 100] and is a property of the distribution, not of the mean; it is the figure to read when the question is "how often does this work well", rather than "how well does it work on average".',
      'Reading it. Higher is better. Because the threshold is strict, small differences in mean accuracy become large differences here, which is why the figure is reported alongside Figure 2 rather than instead of it.',
    ],
  },
  {
    slug: 'effect-size', number: 4, title: 'Effect size against bare Claude Code', short: 'Effect size', kind: 'columns',
    measure: { key: 'pct', cell: 'cohend', label: "Cohen's d vs bare Claude Code, accuracy", unit: 'd', better: 'high' },
    defaults: { exams: ['ZeroShotExam', 'MultiTurnExam'], battery: 'both', columns: 'pooled' },
    reference: 'none',
    caption: [
      'Cohen\'s d expresses how far an arm\'s accuracy distribution sits from bare Claude Code\'s in units of their pooled standard deviation, so it is comparable across batteries and models.',
      'Each column is the mean d over cells that contain both the arm and bare Claude Code at the same model, battery and protocol; bare Claude Code is the zero line by definition, and arms with no shared Anthropic cell have no value.',
      'By convention d of 0.2 is small, 0.5 medium and 0.8 large; TrueArchitect is the only arm above the large threshold.',
    ],
    explanation: [
      'Definition. Within a cell shared by the arm (n₁ runs, accuracies with mean m₁ and standard deviation s₁) and bare Claude Code (n₂, m₂, s₂), d = (m₁ − m₂) / s_p with s_p = √(((n₁−1)s₁² + (n₂−1)s₂²) / (n₁+n₂−2)). Standard deviations use the n−1 denominator.',
      'Aggregation. The column is the equal-weight mean of d over the cells the arm shares with bare Claude Code. A cell with a single run on either side contributes a degenerate deviation and is reported as such in the table. Codex and Cursor at non-Anthropic models have no bare Claude Code counterpart and are therefore absent, not zero.',
      'Reading it. Higher is better; negative values would mean the arm is worse than bare Claude Code. The figure answers "is the difference large relative to run-to-run noise", the question a mean alone cannot answer.',
    ],
  },
  {
    slug: 'outcomes', number: 5, title: 'Outcome composition per run', short: 'Outcomes', kind: 'stack',
    measure: { key: 'pct', cell: 'mean', label: 'questions correct · incorrect · unanswered, per run', unit: 'pct', better: 'high' },
    defaults: { exams: ['ZeroShotExam', 'MultiTurnExam'], battery: 'both', columns: 'pooled' },
    reference: 'none',
    caption: [
      'Every valid run becomes one thin column showing how its questions divided between correct (the arm\'s color), incorrect (dark) and unanswered or unjudged (black), so an arm\'s whole record is visible at once.',
      'Columns are ordered by model then repetition; the number above each group is the arm\'s mean accuracy and the number inside is its difference from TrueArchitect.',
      'The dark bands are the honesty layer: the failures are on the page, not in a footnote.',
    ],
    explanation: [
      'Definition. For a scored run, correct = score, incorrect = the count of effective verdicts of fail, and the residue denominator − correct − incorrect is the unanswered or unjudged portion (an adjudicate or infra verdict, or a question with no verdict). Each is drawn as a share of the denominator.',
      'Aggregation. None: every scored run is one column. The header figure is the hierarchical mean accuracy of the group and the inner figure is that mean minus TrueArchitect\'s.',
      'Reading it. Higher is better for the colored band. The width of a group is proportional to the number of runs the arm made in the selection, which is itself information: an arm with fewer columns has fewer runs behind its numbers.',
    ],
    disclosures: ['Did-not-finish runs have no score and do not appear here; their count per arm is in the run records and in the Limitations page.'],
  },
  {
    slug: 'tokens-per-correct', number: 6, title: 'Context tokens per correct answer', short: 'Tokens per correct', kind: 'columns',
    measure: { key: 'ctx_per_correct', cell: 'mean', label: 'context tokens per correct answer', unit: 'tokens', better: 'low', vendorBound: true },
    defaults: { exams: ['ZeroShotExam', 'MultiTurnExam'], battery: 'both', columns: 'pooled' },
    reference: 'bare',
    caption: [
      'This divides a run\'s context tokens (Figure 1) by the number of questions it answered correctly, so an arm that reads less but also answers less is not rewarded.',
      'Each column is the mean over valid, scored runs at one model (or pooled over a single-vendor roster in the pooled-models view), lower is better, and TrueArchitect and the bare harnesses are the dashed references.',
      'The ordering of Figure 1 survives the normalisation: the token saving is a saving per correct answer, not a saving bought with wrong answers.',
    ],
    explanation: [
      'Definition. For a scored run with score(r) > 0, ctx_per_correct(r) = context(r) / score(r). Runs with no correct answer have no defined value and are excluded from the mean; their count is in the table.',
      'Aggregation. As in Figure 1: cell means averaged with equal weight; raw token counts are never pooled across vendors.',
      'Reading it. Lower is better. Cost in currency is deliberately not shown here: the package publishes cost only where a vendor reported it, and TrueArchitect\'s runs carry no vendor-reported figure. Tokens are the quantity a reader can recompute from the run records.',
    ],
  },
  {
    slug: 'tool-calls', number: 7, title: 'Tool calls per run', short: 'Tool calls', kind: 'columns',
    measure: { key: 'tool_calls', cell: 'mean', label: 'tool calls per run', unit: 'count', better: 'low' },
    defaults: { exams: ['ZeroShotExam', 'MultiTurnExam'], battery: 'both', columns: 'pooled' },
    reference: 'bare',
    caption: [
      'A tool call is one invocation of any tool the arm offered its model: file reads, searches, shell commands, sub-agents, an indexing tool\'s query surface, or the TrueArchitect index.',
      'Each column is the mean number of calls per run over valid, scored runs, split by model for TrueArchitect and the bare harnesses.',
      'Fewer calls with higher accuracy is the signature of a good index: the model asks its question once instead of searching for the answer many times.',
    ],
    explanation: [
      'Definition. tool_calls(r) is the count of tool invocations recorded for the run across all sessions and threads; the run record breaks the count down by tool and by class (built-in, sub-agent, skill, an installed tool\'s MCP surface, a native harness\'s own tools, TrueArchitect file tools, and TrueArchitect index queries).',
      'Aggregation. Cell means averaged with equal weight over the selected batteries and models.',
      'Reading it. Lower is better only in combination with Figures 2 and 3: a low count with low accuracy is an arm that gave up early. Read the three together.',
    ],
  },
  {
    slug: 'wall-time', number: 8, title: 'Wall time per run', short: 'Wall time', kind: 'columns',
    measure: { key: 'wall', cell: 'mean', label: 'active answering time per run', unit: 'ms', better: 'low' },
    defaults: { exams: ['ZeroShotExam', 'MultiTurnExam'], battery: 'both', columns: 'pooled' },
    reference: 'bare',
    caption: [
      'Wall time is the sum of the active answering segments of a run: the session for HumanExam, each question\'s session for ZeroShot, each turn for MultiTurn.',
      'Each column is the mean over valid, scored runs; the benchmark\'s own dispatch and capture time between segments is excluded.',
      'Timing is environment-coupled and reported as indicative magnitude only; see the disclosures below before comparing across the host boundary.',
    ],
    explanation: [
      'Definition. wall(r) = Σ duration of the run\'s answering segments, as recorded by the lane driver. Provider latency, lane parallelism and retry back-offs all ride this figure.',
      'Aggregation. Cell means averaged with equal weight. Runs whose duration was not captured are excluded, never counted as zero.',
      'Reading it. Lower is better, with the caveat that this is not a controlled latency benchmark.',
    ],
    disclosures: [
      'The TrueArchitect arm executed on the host through its gateway; the comparison group executed in containers on the same machine. Accuracy, tokens and tool counts are location-independent; wall time is not, and the figure is published for completeness rather than as a claim.',
      'Runs executed in parallel lanes shared the host; per-lane contention is not modelled.',
    ],
  },
  {
    slug: 'model-tiers', number: 9, title: 'Accuracy by model', short: 'Accuracy by model', kind: 'columns',
    measure: { key: 'pct', cell: 'mean', label: 'accuracy (% of questions correct)', unit: 'pct', better: 'high' },
    defaults: { exams: ['ZeroShotExam', 'MultiTurnExam'], battery: 'both', columns: 'per-model' },
    lockColumns: 'per-model',
    reference: 'none',
    caption: [
      'The same accuracy as Figure 2, split into one column per model for every arm, so the cross-tier comparison is readable directly.',
      'Within an arm the columns run from the fastest, cheapest model to the frontier model of each vendor.',
      'The comparison to make is diagonal: TrueArchitect at a fast or everyday model against a bare harness or an indexing tool at a frontier model.',
    ],
    explanation: [
      'Definition and aggregation as in Figure 2, with cells restricted to one model per column.',
      'Reading it. Higher is better. The vendor tiers are declared, not inferred: fast = Haiku 4.5 and GPT 5.6 Luna; everyday = Sonnet 5 and GPT 5.6 Terra; frontier = Opus 5, GPT 5.6 Sol and Composer 2.5.',
    ],
  },
  {
    slug: 'categories', number: 10, title: 'Pass rate by question category and difficulty', short: 'Categories', kind: 'heatmap',
    measure: { key: 'pct', cell: 'mean', label: 'pass rate (% of question attempts correct)', unit: 'pct', better: 'high' },
    defaults: { exams: ['ZeroShotExam', 'MultiTurnExam'], battery: 'both', columns: 'pooled' },
    reference: 'none',
    caption: [
      'Every question carries one or more categories and a difficulty; each cell is the pass rate of an arm on the questions in that category (or at that difficulty), pooled over its models.',
      'The number in each cell is the pass rate; the color is that cell\'s difference from bare Claude Code in the same column — blue above, orange below, neutral at the baseline — so a row reads as where an arm beats or trails the null hypothesis.',
      'The categories where an index should matter most, structural questions such as callers, impact and cross-stack tracing, are where the separation is widest.',
    ],
    explanation: [
      'Definition. For an arm, model, exam, battery and question, the per-question record gives pass (attempts marked correct) and n (attempts). For a category c, the pass rate at one model is Σ pass / Σ n over the questions carrying c; the cell value is the equal-weight mean over the arm\'s models. Difficulty cells are formed the same way over the questions at that difficulty.',
      'Aggregation. One question may carry several categories and then contributes to each; category rates are therefore not additive across categories. With the model control at "all", a cell pools the arm\'s OWN roster with equal weight per model: TrueArchitect ran GPT 5.6 Luna, Terra and Sol as well as the Claude models, while bare Claude Code and the indexing tools ran Claude models only, so a pooled TrueArchitect cell averages in three models its comparators never ran. The multi-hop column is the clearest case: two questions (h06, h07) on which TrueArchitect at every Claude model matches or beats bare Claude Code, while the GPT models score far lower and pull the pooled cell down. Select one model for a like-for-like read.',
      'Reading it. Higher is better. Read a row to see an arm\'s profile and a column to see which arms handle a question class. Color encodes polarity, not magnitude: each cell is colored by its distance from bare Claude Code\'s pass rate in the same column (the column mean if that arm is absent from the selection), on a symmetric scale whose half-width is the largest difference in the figure and never less than ten points; the number is always the pass rate itself. A two-hue diverging scale with a neutral midpoint was chosen over a green-to-red one because the latter is unreadable under red–green color vision deficiency.',
    ],
  },
]

FIGURES.push(
  {
    slug: 'cost-per-correct', number: 11, title: 'Cost per correct answer', short: 'Cost per correct', kind: 'columns',
    measure: { key: 'cost_per_correct', cell: 'mean', label: 'USD per correct answer', unit: 'usd', better: 'low' },
    defaults: { exams: ['ZeroShotExam', 'MultiTurnExam'], battery: 'both', columns: 'pooled' },
    reference: 'bare',
    caption: [
      'Cost per correct answer divides what a run cost by the number of questions it answered correctly: the vendor-reported figure where the harness reported one, otherwise the benchmark\'s estimate from the published rate tables over the run\'s four token columns.',
      'Each column is the mean over valid, scored runs at one model (or pooled over the arm\'s roster in the pooled-models view); TrueArchitect and the bare harnesses are the dashed references, and the data table names each row\'s cost basis.',
      'The context saving of Figure 1 becomes a price saving at every model, and the ordering survives the normalisation by correct answers.',
    ],
    explanation: [
      'Definition. For a scored run with score(r) > 0, cost_per_correct(r) = cost(r) / score(r), where cost(r) is the vendor-reported cost when the harness reported one (Claude Code\'s own result envelope) and otherwise the estimate Σ tokens × rate for the four token columns, using the rate table that applies to the arm: Cursor\'s published prices for the Cursor arm, Augment\'s vendor-list-plus-40-percent for Auggie, the vendor list prices for everything else. The tables are published as `epochs/E00N/summary/rate-tables.json`; each run row carries `cost_basis` naming which one priced it.',
      'Aggregation. Cell means averaged with equal weight over the selected batteries, models and protocols. A run whose model has no rate row has no cost and is excluded from the mean, never counted as zero.',
      'Reading it. Lower is better. Because estimates ride list prices, an arm on a subscription plan may pay less in practice; the figure is an API-equivalent price, comparable across arms because it is computed the same way for all of them. Codex reports no cache-write split, so its estimate charges written tokens at the input rate: a disclosed floor of at most 25 percent of the input component.',
    ],
    disclosures: ['Vendor-reported and estimated costs sit in the same column; the table beneath the figure carries the basis per row and the rate tables are published beside the run rows.'],
  },
  {
    slug: 'cost-variance', number: 12, title: 'Cost per run', short: 'Cost per run', kind: 'dots',
    measure: { key: 'cost', cell: 'mean', label: 'USD per run', unit: 'usd', better: 'low' },
    defaults: { exams: ['ZeroShotExam', 'MultiTurnExam'], battery: 'both', columns: 'pooled' },
    reference: 'bare',
    caption: [
      'Every dot is what one run cost (vendor-reported where available, otherwise estimated from the rate tables), so the spread of an arm\'s price is visible, not just its mean.',
      'The solid tick is the pooled mean and the thin line the range; hover a dot for its model, repetition and run directory.',
      'A tight, low cloud is an arm whose price is predictable; a tall cloud is one whose price depends on the run.',
    ],
    explanation: [
      'Definition. cost(r) as in Figure 11, drawn per run rather than averaged.',
      'Aggregation. None for the dots; the mean tick is the equal-weight mean of battery × model × protocol cells.',
      'Reading it. Lower is better; read spread as well as position.',
    ],
  },
  {
    slug: 'tool-result-tokens', number: 13, title: 'Tool result tokens per run', short: 'Tool result tokens', kind: 'dots',
    measure: { key: 'tool_result_tokens', cell: 'mean', label: 'tool result tokens per run (estimated)', unit: 'tokens', better: 'low', vendorBound: true },
    defaults: { exams: ['ZeroShotExam', 'MultiTurnExam'], battery: 'both', columns: 'pooled' },
    reference: 'bare',
    caption: [
      'Tool result tokens are the volume of text the arm\'s tools pushed back into the model\'s context over a run — file contents, search hits, shell output, or an index query\'s result — estimated per call from the result size.',
      'Every dot is one run, split per model for every arm; the solid tick is the mean and the thin line the range.',
      'This is the mechanism behind Figure 1 seen from the tool side: the index returns a small, precise answer where a search returns pages to read.',
    ],
    explanation: [
      'Definition. tool_result_tokens(r) = Σ over the run\'s tool calls of the result\'s token estimate, taken from the capture where the harness recorded one and otherwise result bytes ÷ 4. For TrueArchitect index queries the estimate is the size of the result the model received.',
      'Aggregation. None for the dots; the mean tick is the equal-weight mean of battery × model × protocol cells. Raw token counts are never pooled across vendors.',
      'Reading it. Lower is better. Read it beside Figure 7 (tool calls): fewer calls returning less text is the signature of a good index.',
    ],
  },
)

export const figureBySlug = (slug: string) => FIGURES.find(f => f.slug === slug)
