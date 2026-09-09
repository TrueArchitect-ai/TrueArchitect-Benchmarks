// Build-time construction of the category / difficulty heatmap: per arm, for
// one exam and one battery (or both), the pass rate over the questions
// carrying a category (or at a difficulty), pooled with equal weight over the
// arm's models.
import { armOrder, modelOrder } from './roster'
import { mean } from './stats'
import type { PerQuestion, Question } from './types'
import type { HeatData, HeatCell } from '../charts/Heatmap'

const DIFF = ['', 'difficulty 1', 'difficulty 2', 'difficulty 3', 'difficulty 4', 'difficulty 5']

export function buildHeat(pq: PerQuestion[], questions: Record<string, Question[]>, exam: string, battery: 'memos' | 'memos-hard' | 'both'): HeatData {
  const batteries = battery === 'both' ? ['memos', 'memos-hard'] : [battery]
  const meta = new Map<string, Question>()
  for (const b of batteries) for (const q of questions[b] ?? []) meta.set(b + '|' + q.qid, q)
  const cats = [...new Set([...meta.values()].flatMap(q => q.categories))].sort()
  const diffs = [...new Set([...meta.values()].map(q => q.difficulty))].sort((a, b) => a - b).map(d => DIFF[d] ?? `difficulty ${d}`)
  const rows = pq.filter(r => r.exam === exam && batteries.includes(r.battery))
  const arms = [...new Set(rows.map(r => r.arm))].sort(armOrder)
  const cells: HeatCell[] = []
  const colKeys = [...cats.map(c => ({ col: c, test: (q: Question) => q.categories.includes(c) })),
    ...diffs.map(d => ({ col: d, test: (q: Question) => (DIFF[q.difficulty] ?? `difficulty ${q.difficulty}`) === d }))]
  for (const arm of arms) {
    const armRows = rows.filter(r => r.arm === arm)
    const models = [...new Set(armRows.map(r => r.model))].sort(modelOrder)
    for (const { col, test } of colKeys) {
      const perModel: number[] = []
      let pass = 0, n = 0
      for (const m of models) {
        let mp = 0, mn = 0
        for (const r of armRows) {
          if (r.model !== m) continue
          const q = meta.get(r.battery + '|' + r.qid)
          if (!q || !test(q)) continue
          mp += r.pass; mn += r.n
        }
        if (mn > 0) { perModel.push((100 * mp) / mn); pass += mp; n += mn }
      }
      cells.push({ arm, col, rate: perModel.length ? mean(perModel) : null, pass, n, models: perModel.length })
    }
  }
  return { exam, battery, columns: cats, difficulty: diffs, cells }
}
