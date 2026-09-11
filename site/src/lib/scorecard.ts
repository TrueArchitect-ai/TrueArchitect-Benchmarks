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
const SCORECARD_FIGS = ['accuracy', 'pass-rate', 'context-tokens', 'tokens-per-correct', 'cost-per-correct', 'tool-calls', 'tool-result-tokens', 'wall-time']

const TA = (id: string) => armInfo(id).role === 'trueArchitect'

function pooled(fig: Figure, rows: Row[], models: string[], model: string | 'all') {
  const gs = buildGroups(fig, rows.filter(r => models.includes(r.model)), { ...SLICE, columns: 'pooled', model }, false)
  return gs
}

function verdictOf(fig: Figure, ta: number, other: number): Verdict {
  const better = fig.measure.better
  if (fig.measure.unit === 'pct') {
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
  let headline: string
  if (fig.measure.unit === 'pct') {
    const d = t - o
    headline = `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} pts`
  } else {
    const ratio = o / t
    headline = verdict === 'tie' ? 'about the same' : ratio >= 1 ? `${x(ratio)} more than TrueArchitect` : `${x(ratio)} of TrueArchitect's`
  }
  return { arm: other, models: shared, ta: t, other: o, verdict, headline, detail: `${fmt(fig, t)} vs ${fmt(fig, o)} · ${nModels}` }
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
    const fig = FIGURES.find(f => f.slug === slug)!
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
