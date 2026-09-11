// The Results scorecard: one verdict per measure × comparator, computed at
// build time from the same rows and the same engine as the figures, so the
// table can never disagree with the figure it links to.
//
// LIKE FOR LIKE BY CONSTRUCTION: every cell compares TrueArchitect and the
// comparator over the models BOTH ran (their shared roster), pooled with
// equal weight per protocol × battery × model cell. A raw-token measure over
// a shared roster spanning two vendors is compared per model and reported
// as a range of ratios (tokenizers differ; such counts are never pooled).
import type { RunRow } from './types'
import { FIGURES, type Figure } from './figures'
import { rowsFor } from './measures'
import { buildGroups, fmt, type Row } from '../charts/engine'
import { armInfo, vendorOf, modelLabel, modelOrder, type ArmInfo } from './roster'

export type Verdict = 'win' | 'loss' | 'tie' | 'none'

export type ScoreCell = {
  arm: ArmInfo
  models: string[]            // the shared roster the cell pools over
  ta: number | null           // TrueArchitect's pooled value over that roster
  other: number | null        // the comparator's
  verdict: Verdict
  headline: string            // "+6.2 pts" · "0.35× the tokens" · "1.9–2.9× fewer"
  detail: string              // "95.6% vs 89.4% · 6 shared models"
  perModel?: { model: string; ta: number; other: number }[]   // vendor-split cells
}

export type ScoreRow = { fig: Figure; cells: ScoreCell[] }
export type Scorecard = {
  rows: ScoreRow[]
  comparators: ArmInfo[]      // column order
  tally: Record<string, { win: number; tie: number; loss: number }>
  slice: string
}

const SLICE = { exams: ['ZeroShotExam', 'MultiTurnExam'], battery: 'both' as const }

// CONSISTENCY — the run-to-run spread of accuracy: the coefficient of variation
// (sd ÷ mean, in %) of run accuracy within a protocol × battery × model cell,
// averaged with equal weight over the cells. Lower = the same tool gives the
// same answer quality run after run. It reads Figure 2's rows (every run is a
// dot there), so the card links to Figure 2; the statistic itself is the
// engine's own `cv` cell kind. Not a figure of its own (yet).
const ACCURACY_FIG = FIGURES.find(f => f.slug === 'accuracy')!
export const CONSISTENCY_FIG: Figure = {
  ...ACCURACY_FIG,
  slug: 'accuracy', short: 'Consistency', title: 'Run-to-run spread of accuracy',
  measure: { key: 'pct', cell: 'cv', label: 'run-to-run variation of accuracy (coefficient of variation, %)', unit: 'pct', better: 'low' },
}
// HARD BATTERY — accuracy on memos-hard alone: the 20 questions written to
// defeat text search (15 grep-hostile, 5 false-premise). Same figure, same
// statistic, one battery instead of both. Where the tools separate.
export const HARD_FIG: Figure = { ...ACCURACY_FIG, short: 'Hard battery', title: 'Accuracy on the hard battery', defaults: { ...ACCURACY_FIG.defaults, battery: 'memos-hard' } }
const SCORECARD_FIGS = ['accuracy', 'accuracy-hard', 'pass-rate', 'consistency', 'context-tokens', 'tokens-per-correct', 'cost-per-correct', 'tool-calls', 'tool-result-tokens', 'wall-time']
const figFor = (slug: string): Figure => (slug === 'consistency' ? CONSISTENCY_FIG : slug === 'accuracy-hard' ? HARD_FIG : FIGURES.find(f => f.slug === slug)!)
// the slice a scorecard row pools over: both batteries, except the hard-battery row
const sliceFor = (fig: Figure) => (fig === HARD_FIG ? { ...SLICE, battery: 'memos-hard' as const } : SLICE)

const TA = (id: string) => armInfo(id).role === 'trueArchitect'

function pooled(fig: Figure, rows: Row[], models: string[], model: string | 'all') {
  const gs = buildGroups(fig, rows.filter(r => models.includes(r.model)), { ...sliceFor(fig), columns: 'pooled', model }, false)
  return gs
}

// spread statistics (sd, cv) are compared as ratios even though they print as %
const ratioLike = (fig: Figure) => fig.measure.unit !== 'pct' || fig.measure.cell === 'cv' || fig.measure.cell === 'sd'

function verdictOf(fig: Figure, ta: number, other: number): Verdict {
  const better = fig.measure.better
  if (!ratioLike(fig)) {
    const d = ta - other
    if (Math.abs(d) < 1) return 'tie'
    return (better === 'high' ? d > 0 : d < 0) ? 'win' : 'loss'
  }
  if (ta <= 0 || other <= 0) return 'none'
  const ratio = other / ta
  if (ratio > 0.95 && ratio < 1.05) return 'tie'
  return (better === 'low' ? ratio > 1 : ratio < 1) ? 'win' : 'loss'
}

const x = (r: number) => (r >= 10 ? r.toFixed(0) : r.toFixed(1)) + '×'

function cell(fig: Figure, rows: Row[], taId: string, other: ArmInfo): ScoreCell {
  const scored = (id: string) => new Set(rows.filter(r => r.arm === id && r.ok && r.score != null && SLICE.exams.includes(r.exam)).map(r => r.model))
  const shared = [...scored(taId)].filter(m => scored(other.id).has(m)).sort(modelOrder)
  const none: ScoreCell = { arm: other, models: shared, ta: null, other: null, verdict: 'none', headline: 'no shared model', detail: '' }
  if (!shared.length) return none
  const vendors = new Set(shared.map(vendorOf))
  const nModels = `${shared.length} shared model${shared.length === 1 ? '' : 's'}`

  // raw tokens over a multi-vendor roster: per model, reported as a range of ratios
  if (fig.measure.vendorBound && vendors.size > 1) {
    const per: { model: string; ta: number; other: number }[] = []
    for (const m of shared) {
      const gs = pooled(fig, rows, [m], m)
      const t = gs.find(g => g.arm.id === taId)?.pooled, o = gs.find(g => g.arm.id === other.id)?.pooled
      if (t != null && o != null) per.push({ model: m, ta: t, other: o })
    }
    if (!per.length) return none
    const ratios = per.map(p => p.other / p.ta)
    const lo = Math.min(...ratios), hi = Math.max(...ratios)
    const verdicts = per.map(p => verdictOf(fig, p.ta, p.other))
    const wins = verdicts.filter(v => v === 'win').length, losses = verdicts.filter(v => v === 'loss').length
    // a split roster earns a verdict only when every model agrees; otherwise it is mixed (shown as ≈)
    const verdict: Verdict = wins === per.length ? 'win' : losses === per.length ? 'loss' : 'tie'
    const range = lo === hi ? x(lo) : `${x(lo)}–${x(hi)}`
    const headline = lo >= 0.95 && hi >= 1.05 && lo >= 1 ? `${range} more than TrueArchitect` : hi <= 1 ? `${range} of TrueArchitect's` : `${range} TrueArchitect's, mixed by model`
    return { arm: other, models: shared, ta: null, other: null, verdict, headline, detail: `per model · ${nModels} · ${per.map(p => `${modelLabel(p.model)} ${fmt(fig, p.ta)} vs ${fmt(fig, p.other)}`).join('; ')}`, perModel: per }
  }

  const gs = pooled(fig, rows, shared, 'all')
  const t = gs.find(g => g.arm.id === taId)?.pooled ?? null, o = gs.find(g => g.arm.id === other.id)?.pooled ?? null
  if (t == null || o == null) return none
  const verdict = verdictOf(fig, t, o)
  const asRatio = ratioLike(fig)
  // the per-model pairs as well (the headlines quote the range at the same model)
  const perModel: { model: string; ta: number; other: number }[] = []
  for (const m of shared) {
    const g1 = pooled(fig, rows, [m], m)
    const a = g1.find(g => g.arm.id === taId)?.pooled, b = g1.find(g => g.arm.id === other.id)?.pooled
    if (a != null && b != null) perModel.push({ model: m, ta: a, other: b })
  }
  let headline: string
  if (!asRatio) {
    const d = t - o
    headline = `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} pts`
  } else {
    const ratio = o / t
    headline = verdict === 'tie' ? 'about the same' : ratio >= 1 ? `${x(ratio)} more than TrueArchitect` : `${x(ratio)} of TrueArchitect's`
  }
  return { arm: other, models: shared, ta: t, other: o, verdict, headline, detail: `${fmt(fig, t)} vs ${fmt(fig, o)} · ${nModels}`, perModel }
}

/**
 * The three headlines above the table — the one thing a reader takes away
 * if they read nothing else. Each is derived from the scorecard cells, so a
 * headline can never say something the table does not.
 */
// A ledger row also carries its two points on the card's axis (the gap strip):
// ta / cmp in axis units. A vendor-split row has no single comparator point;
// it carries the comparator's per-model range instead.
export type CardRow = { name: string; detail: string; delta: string; verdict: Verdict; ta: number | null; cmp: number | null; spanLo?: number; spanHi?: number }
export type Card = {
  label: string        // ACCURACY
  direction: string    // higher is better
  number: number       // the figure the card links to
  figure: string       // its slug
  headline: string     // the range statement
  sub: string          // one sentence of qualification
  rows: CardRow[]      // one per comparator
  tally: string        // "4 of 4 better"
  axis: { lo: number; hi: number; loLabel: string; hiLabel: string }   // zoomed to the card's own range
}

/**
 * The headline cards (the design handoff's editorial ledger, 2026-09-11):
 * one card per measure, a headline that holds against EVERY comparator, and
 * a ledger row per comparator (Claude Code, Codex, Cursor Agent, the best
 * indexing tool on that measure) so no reader has to ask "but what about X".
 * Every number is a scorecard cell; the card can never say what the table
 * does not. A headline range spans the comparators the verdict is a win
 * against; a mixed-by-model comparator is shown as ≈ and excluded.
 */
export function headlines(sc: Scorecard): Card[] {
  const row = (slug: string, short?: string) => sc.rows.find(r => r.fig.slug === slug && (!short || r.fig.short === short))
  const x = (r: number) => r.toFixed(1) + '×'
  const nameOf = (c: ScoreCell) => (c.arm.id === 'best-indexer' ? `${c.arm.short.replace('Best indexing tool: ', '')} (best indexer)` : c.arm.name.replace(' (bare)', ''))
  const shared = (c: ScoreCell) => `${c.models.length} shared model${c.models.length === 1 ? '' : 's'}`
  const ratioRange = (c: ScoreCell) => {
    const rs = (c.perModel ?? []).map(p => p.other / p.ta)
    return rs.length ? { lo: Math.min(...rs), hi: Math.max(...rs), n: rs.length } : null
  }
  const tallyOf = (rows: CardRow[]) => {
    const w = rows.filter(r => r.verdict === 'win').length, t = rows.filter(r => r.verdict === 'tie').length, n = rows.filter(r => r.verdict !== 'none').length
    return `${w} of ${n} better${t ? ` · ${t} ≈` : ''}`
  }
  const out: Card[] = []

  // an axis zoomed to the card's own points, snapped outward to a round step
  const axisOf = (rows: CardRow[], step: number, floor: number | null, label: (v: number) => string) => {
    const pts = rows.flatMap(r => [r.ta, r.cmp, r.spanLo ?? null, r.spanHi ?? null]).filter((v): v is number => v != null)
    let lo = Math.floor(Math.min(...pts) / step) * step, hi = Math.ceil(Math.max(...pts) / step) * step
    if (floor != null) lo = Math.max(floor, lo)
    if (hi <= lo) hi = lo + step
    return { lo, hi, loLabel: label(lo), hiLabel: label(hi) }
  }

  // points-delta cards (accuracy, reliability): delta = TA − comparator, in points; axis in %
  const pointsCard = (r: ScoreRow, label: string, headline: (lo: number, hi: number) => string, sub: string) => {
    const rows: CardRow[] = r.cells.map(c => ({
      name: nameOf(c), verdict: c.verdict, ta: c.ta, cmp: c.other,
      detail: c.ta != null && c.other != null ? `${c.ta.toFixed(1)}% vs ${c.other.toFixed(1)}% · ${shared(c)}` : 'no shared model',
      delta: c.ta != null && c.other != null ? `${c.ta - c.other >= 0 ? '+' : '−'}${Math.abs(c.ta - c.other).toFixed(1)} points` : '—',
    }))
    const leads = r.cells.filter(c => c.ta != null && c.other != null && c.verdict === 'win').map(c => c.ta! - c.other!)
    if (!leads.length) return
    out.push({ label, direction: 'higher is better', number: r.fig.number, figure: r.fig.slug, headline: headline(Math.min(...leads), Math.max(...leads)), sub, rows, tally: tallyOf(rows), axis: axisOf(rows, 5, 0, v => `${v}%`) })
  }
  // ratio cards (tokens, cost, spread): delta = comparator ÷ TA, "less" for TrueArchitect.
  // Axis: the comparator as a multiple of TrueArchitect (TrueArchitect sits at 1×) —
  // the only common scale when the per-model magnitudes differ; a card whose values
  // are already on one scale (the spread %) plots the values themselves.
  const ratioCard = (r: ScoreRow, label: string, headline: (lo: number, hi: number) => string, sub: (peak: number | null) => string, opts: { perModelDetail?: boolean; values?: boolean; pctLess?: boolean; plotValues?: boolean } = {}) => {
    const rows: CardRow[] = r.cells.map(c => {
      const rr = ratioRange(c)
      // a vendor-split cell (raw tokens over a two-vendor roster) has no pooled pair — it is its per-model range
      if (c.ta == null || c.other == null) {
        if (rr) return { name: nameOf(c), verdict: c.verdict, ta: 1, cmp: null, spanLo: rr.lo, spanHi: rr.hi, detail: `${x(rr.lo)}–${x(rr.hi)} · varies by model · ${shared(c)}`, delta: c.verdict === 'tie' ? `${x(rr.lo)}–${x(rr.hi)}` : c.verdict === 'win' ? `${x(rr.lo)}–${x(rr.hi)} less` : `${x(rr.lo)}–${x(rr.hi)} more` }
        return { name: nameOf(c), verdict: c.verdict, ta: null, cmp: null, detail: 'no shared model', delta: '—' }
      }
      const ratio = c.other / c.ta
      const values = opts.values ? `${fmt(r.fig, c.ta)} vs ${fmt(r.fig, c.other)} · ` : ''
      const detail = opts.perModelDetail && rr ? `${values}${x(rr.lo)}–${x(rr.hi)} · ${shared(c)}` : `${values}${shared(c)}`
      const delta = c.verdict === 'tie' ? 'about equal'
        : opts.pctLess ? (ratio >= 1 ? `${Math.round((1 - 1 / ratio) * 100)}% less` : `${Math.round((ratio - 1) * 100)}% more`)
        : ratio >= 1 ? `${x(ratio)} less` : `${x(1 / ratio)} more`
      return { name: nameOf(c), verdict: c.verdict, ta: opts.plotValues ? c.ta : 1, cmp: opts.plotValues ? c.other : ratio, detail, delta }
    })
    const wins = r.cells.filter(c => c.verdict === 'win' && c.ta != null && c.other != null).map(c => c.other! / c.ta!)
    if (!wins.length) return
    const peaks = r.cells.map(ratioRange).filter((v): v is NonNullable<typeof v> => !!v).map(v => v.hi)
    const axis = opts.plotValues ? axisOf(rows, 1, 0, v => `${v}%`) : axisOf(rows, 0.5, 1, v => `${v}×`)
    out.push({ label, direction: 'lower is better', number: r.fig.number, figure: r.fig.slug, headline: headline(Math.min(...wins), Math.max(...wins)), sub: sub(peaks.length ? Math.max(...peaks) : null), rows, tally: tallyOf(rows), axis })
  }

  const acc = row('accuracy', 'Accuracy'), hard = row('accuracy', 'Hard battery'), rel = row('pass-rate'), con = row('accuracy', 'Consistency'), ctx = row('context-tokens'), cost = row('cost-per-correct')
  if (acc) pointsCard(acc, 'Accuracy', (lo, hi) => `${lo.toFixed(0)}–${hi.toFixed(0)} points more accurate`, 'than every comparator, at the models each of them ran.')
  if (hard) pointsCard(hard, 'Hard battery', (lo, hi) => `${lo.toFixed(0)}–${hi.toFixed(0)} points more accurate on the hard battery`, 'the 20 questions written to defeat text search: 15 grep-hostile, 5 false-premise. On the base battery every arm is near the ceiling; this is where the tools separate.')
  if (rel) pointsCard(rel, 'Reliability', (lo, hi) => `${lo.toFixed(0)}–${hi.toFixed(0)} points more runs at 90%+ accuracy`, 'share of full-battery runs scoring at least nine in ten. Each arm was run repeatedly; this is how often a run lands in the top band.')
  if (con) ratioCard(con, 'Consistency', (lo, hi) => {
    const a = Math.round((1 - 1 / lo) * 100), b = Math.round((1 - 1 / hi) * 100)
    return `${a === b ? `${a}%` : `${Math.min(a, b)}–${Math.max(a, b)}%`} less run-to-run variation`
  }, () => 'in accuracy. Same tool, same model, same questions, run again: how far the score moves. Coefficient of variation of run accuracy, lower is steadier.', { values: true, pctLess: true, plotValues: true })
  if (ctx) ratioCard(ctx, 'Context tokens', (lo, hi) => `${x(lo)}–${x(hi)} fewer context tokens`, peak => `on average at the same model${peak ? `, up to ${x(peak)} at individual models` : ''}. Uncached input plus cache reads, summed over every call of a run.`, { perModelDetail: true })
  if (cost) ratioCard(cost, 'Cost per correct', (lo, hi) => `${x(lo)}–${x(hi)} lower cost per correct answer`, () => 'against every comparator, at the models each of them ran. USD per correct answer; vendor-reported where available, otherwise estimated from published rate tables.', { values: true })
  return out
}

/** Build the scorecard. Comparators: every bare harness, then the best indexer per measure. */
export function buildScorecard(runs: RunRow[]): Scorecard {
  const armIds = [...new Set(runs.map(r => r.arm))]
  const taId = armIds.find(TA)!
  const bare = armIds.filter(id => armInfo(id).role === 'bare').map(armInfo).sort((a, b) => a.id === 'cold' ? -1 : b.id === 'cold' ? 1 : a.short.localeCompare(b.short))
  const indexers = armIds.filter(id => armInfo(id).role === 'indexer').map(armInfo)
  const bestIndexer: ArmInfo = { id: 'best-indexer', name: 'Best indexing tool', role: 'indexer', color: '#8a8f9c', short: 'Best indexing tool' }
  const comparators = [...bare, bestIndexer]
  const rows: ScoreRow[] = []
  const tally: Scorecard['tally'] = {}
  for (const c of comparators) tally[c.id] = { win: 0, tie: 0, loss: 0 }
  for (const slug of SCORECARD_FIGS) {
    const fig = figFor(slug)
    const data = rowsFor(runs, fig.measure.key)
    const cells: ScoreCell[] = bare.map(b => cell(fig, data, taId, b))
    // the best indexer on THIS measure (its own shared roster with TrueArchitect)
    const idx = indexers.map(i => cell(fig, data, taId, i)).filter(c => c.other != null)
    const best = idx.sort((a, b) => (fig.measure.better === 'high' ? b.other! - a.other! : a.other! - b.other!))[0]
    cells.push(best ? { ...best, arm: { ...bestIndexer, short: `Best indexing tool: ${best.arm.short}`, color: best.arm.color } } : { arm: bestIndexer, models: [], ta: null, other: null, verdict: 'none', headline: 'no shared model', detail: '' })
    rows.push({ fig, cells })
    cells.forEach((cl, i) => { const k = i < bare.length ? bare[i].id : bestIndexer.id; if (cl.verdict !== 'none') tally[k][cl.verdict]++ })
  }
  return { rows, comparators, tally, slice: 'ZeroShot + MultiTurn protocols · both batteries · shared models only' }
}
