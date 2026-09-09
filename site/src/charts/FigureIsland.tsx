import { useEffect, useMemo, useRef, useState } from 'react'
import type { Figure, BatteryChoice, ColumnsMode } from '../lib/figures'
import { EXAMS, EXAM_LABEL, BATTERY_LABEL, modelLabel, modelOrder, vendorOf, runUrl, ROLE_LABEL } from '../lib/roster'
import { buildGroups, referenceLines, fmt, ordinal, type Selection, type Group } from './engine'
import { unpackRows, type Packed } from '../lib/measures'
import Columns from './Columns'
import Dots from './Dots'
import Stack from './Stack'
import Heatmap, { type HeatData } from './Heatmap'

function useTheme(): boolean {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const el = document.documentElement
    const read = () => setDark(el.dataset.theme === 'dark')
    read()
    const mo = new MutationObserver(read)
    mo.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [])
  return dark
}

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [w, setW] = useState(960)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(es => { for (const e of es) setW(Math.max(480, e.contentRect.width)) })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

function Seg<T extends string>({ name, value, options, onChange }: { name: string; value: T; options: { v: T; label: string; disabled?: boolean }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="radiogroup" aria-label={name}>
      <span className="seg-name">{name}</span>
      {options.map(o => (
        <button key={o.v} type="button" role="radio" aria-checked={o.v === value} disabled={o.disabled}
          className={'seg-btn' + (o.v === value ? ' on' : '')} onClick={() => onChange(o.v)}>{o.label}</button>
      ))}
    </div>
  )
}

function csvOf(fig: Figure, groups: Group[]): string {
  const head = ['arm', 'role', 'columns_label', 'models', 'value', 'unit', 'n_runs', 'cells', 'min', 'max', 'sd', 'rank']
  const lines = [head.join(',')]
  for (const g of groups) for (const c of g.columns) {
    lines.push([g.arm.short, g.arm.role, c.label, c.models.join(' '), c.value?.toFixed(4) ?? '', fig.measure.unit, c.n, c.cells,
      c.min?.toFixed(4) ?? '', c.max?.toFixed(4) ?? '', c.sd?.toFixed(4) ?? '', g.rank ?? ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  }
  return lines.join('\n') + '\n'
}

export default function FigureIsland({ fig, data, heat, compact, controls, table }: {
  fig: Figure; data: Packed[]; heat?: HeatData[]
  compact?: boolean        // summary use: no controls, no table
  controls?: boolean       // explicit overrides
  table?: boolean
}) {
  const showControls = controls ?? !compact
  const showTable = table ?? !compact
  const dark = useTheme()
  const [ref, panelW] = useWidth<HTMLDivElement>()
  const rows = useMemo(() => unpackRows(data), [data])
  const [sel, setSel] = useState<Selection>({ exams: fig.defaults.exams, battery: fig.defaults.battery, columns: fig.defaults.columns, model: fig.defaults.model ?? 'all' })
  const models = useMemo(() => [...new Set(rows.filter(r => r.ok && r.score != null).map(r => r.model))].sort(modelOrder), [rows])
  const groups = useMemo(() => (fig.kind === 'heatmap' ? [] : buildGroups(fig, rows, sel, dark)), [fig, rows, sel, dark])
  const refs = useMemo(() => referenceLines(fig, groups), [fig, groups])
  // the heatmap is per protocol: it follows the first selected protocol
  const heatNow = heat?.find(h => h.exam === sel.exams[0] && h.battery === (sel.battery === 'both' ? 'both' : sel.battery)) ?? heat?.[0]
  const toggleExam = (e: string) => setSel(s => ({ ...s, exams: s.exams.includes(e) ? (s.exams.length > 1 ? s.exams.filter(x => x !== e) : s.exams) : EXAMS.filter(x => x === e || s.exams.includes(x)) }))
  const vendorsSel = sel.model === 'all' ? new Set(models.map(vendorOf)) : new Set([vendorOf(sel.model)])
  const pooledBlocked = !!fig.measure.vendorBound && vendorsSel.size > 1

  const download = (name: string, mime: string, body: string) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([body], { type: mime }))
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }
  const downloadSVG = () => {
    const svg = ref.current?.querySelector('svg')
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    // bake the CSS variables so the file stands alone
    const cs = getComputedStyle(document.documentElement)
    const vars = ['--ink', '--muted', '--faint', '--grid', '--baseline', '--surface', '--accent', '--stack-incorrect', '--stack-dnf']
    let xml = new XMLSerializer().serializeToString(clone)
    for (const v of vars) xml = xml.split(`var(${v})`).join(cs.getPropertyValue(v).trim())
    xml = xml.replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg" style="background:${cs.getPropertyValue('--surface').trim()}"`)
    download(`figure-${fig.number}-${fig.slug}-${sel.exams.join('+')}-${sel.battery}.svg`, 'image/svg+xml', xml)
  }

  const rankTotal = groups.filter(g => g.rank != null).length
  const examsLabel = fig.kind === 'heatmap' ? EXAM_LABEL[sel.exams[0]] : sel.exams.map(e => EXAM_LABEL[e]).join(' + ')
  const slice = `${examsLabel} · ${sel.battery === 'both' ? 'both batteries' : BATTERY_LABEL[sel.battery]}${sel.model !== 'all' ? ' · ' + modelLabel(sel.model) : ''}`

  return (
    <div className="figure" ref={ref}>
      {showControls && (
        <div className="controls">
          {fig.kind === 'heatmap' ? (
            <Seg name="protocol" value={sel.exams[0]} options={EXAMS.map(e => ({ v: e, label: EXAM_LABEL[e] }))} onChange={exam => setSel(s => ({ ...s, exams: [exam] }))} />
          ) : (
            <div className="seg" role="group" aria-label="protocols">
              <span className="seg-name">protocols</span>
              {EXAMS.map(e => (
                <button key={e} type="button" role="checkbox" aria-checked={sel.exams.includes(e)}
                  className={'seg-btn' + (sel.exams.includes(e) ? ' on' : '')} onClick={() => toggleExam(e)}>{EXAM_LABEL[e]}</button>
              ))}
            </div>
          )}
          <Seg<BatteryChoice> name="battery" value={sel.battery}
            options={[{ v: 'memos-hard', label: 'hard (20 q)' }, { v: 'memos', label: 'base (30 q)' }, { v: 'both', label: 'both' }]}
            onChange={battery => setSel(s => ({ ...s, battery }))} />
          {fig.kind !== 'heatmap' && (
            <Seg name="model" value={sel.model} options={[{ v: 'all', label: 'all' }, ...models.map(m => ({ v: m, label: modelLabel(m) }))]} onChange={model => setSel(s => ({ ...s, model }))} />
          )}
          {fig.kind !== 'heatmap' && fig.kind !== 'stack' && (
            <Seg<ColumnsMode> name="columns" value={sel.columns}
              options={[
                { v: 'per-model', label: 'per model' },
                { v: 'pooled', label: 'pooled models', disabled: pooledBlocked },
              ]}
              onChange={columns => setSel(s => ({ ...s, columns }))} />
          )}
        </div>
      )}
      <div className="chart-head">
        <span className="chart-title">{fig.title}</span>
        <span className="chart-better">{fig.measure.better === 'high' ? 'higher is better' : 'lower is better'}</span>
        <span className="chart-slice">{slice}</span>
      </div>
      {fig.kind === 'columns' && <Columns fig={fig} groups={groups} refs={refs} panelW={panelW} />}
      {fig.kind === 'dots' && <Dots fig={fig} groups={groups} refs={refs} panelW={panelW} />}
      {fig.kind === 'stack' && <Stack fig={fig} groups={groups} panelW={panelW} />}
      {fig.kind === 'heatmap' && heatNow && <Heatmap data={heatNow} panelW={panelW} dark={dark} />}
      {pooledBlocked && fig.kind !== 'heatmap' && (
        <p className="chart-note">Raw token counts are never pooled across vendors (tokenizers differ), so arms whose selected models span vendors are shown one column per model; ★ marks the best value at each model.</p>
      )}
      {showTable && fig.kind !== 'heatmap' && (
        <details className="data" open>
          <summary>Data behind this figure <span className="muted">— {slice}</span></summary>
          <div className="table-actions">
            <button type="button" onClick={() => download(`figure-${fig.number}-${fig.slug}-${sel.exams.join('+')}-${sel.battery}.csv`, 'text/csv', csvOf(fig, groups))}>download CSV</button>
            <button type="button" onClick={downloadSVG}>download SVG</button>
          </div>
          <table>
            <thead>
              <tr><th>arm</th><th>role</th><th>column</th><th className="num">{fig.measure.label}</th><th className="num">runs</th><th className="num">cells</th><th className="num">min</th><th className="num">max</th><th className="num">sd</th><th>rank</th><th>runs in the repository</th></tr>
            </thead>
            <tbody>
              {groups.map(g => g.columns.map((c, i) => (
                <tr key={g.arm.id + c.key}>
                  {i === 0 && <td rowSpan={g.columns.length}><span className="swatch" style={{ background: g.arm.color }} />{g.arm.short}</td>}
                  {i === 0 && <td rowSpan={g.columns.length} className="muted">{ROLE_LABEL[g.arm.role]}</td>}
                  <td>{c.label}{c.best ? ' ★' : ''}</td>
                  <td className="num">{c.value != null ? fmt(fig, c.value) : '—'}</td>
                  <td className="num">{c.n}</td>
                  <td className="num">{c.cells}</td>
                  <td className="num">{c.min != null ? fmt(fig, c.min) : '—'}</td>
                  <td className="num">{c.max != null ? fmt(fig, c.max) : '—'}</td>
                  <td className="num">{c.sd != null ? fmt(fig, c.sd) : '—'}</td>
                  {i === 0 && <td rowSpan={g.columns.length}>{g.rank != null ? `${ordinal(g.rank)} of ${rankTotal}` : '—'}</td>}
                  <td>
                    {c.models.map(m => (
                      <a key={m} href={runUrl(`runs/${g.arm.id}/${m}`)} target="_blank" rel="noopener">{modelLabel(m)}</a>
                    )).reduce<React.ReactNode[]>((acc, el, j) => (j ? [...acc, ' · ', el] : [el]), [])}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </details>
      )}
      {showTable && fig.kind === 'heatmap' && heatNow && (
        <details className="data" open>
          <summary>Data behind this figure <span className="muted">— {slice}</span></summary>
          <table>
            <thead><tr><th>arm</th><th>column</th><th className="num">pass rate</th><th className="num">attempts</th><th className="num">correct</th><th className="num">models</th></tr></thead>
            <tbody>
              {heatNow.cells.filter(c => c.rate != null).map(c => (
                <tr key={c.arm + c.col}><td>{c.arm}</td><td>{c.col}</td><td className="num">{c.rate!.toFixed(1)}%</td><td className="num">{c.n}</td><td className="num">{c.pass}</td><td className="num">{c.models}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  )
}
