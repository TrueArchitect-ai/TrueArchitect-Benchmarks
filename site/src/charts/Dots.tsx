import { useState } from 'react'
import type { Figure } from '../lib/figures'
import { modelLabel } from '../lib/roster'
import { fmt, fmtAxis, niceTicks, spreadLabels, type Group, type RefLine } from './engine'
import { layoutGroups, GroupFooter, Tooltip, shortModel, type Tip } from './Columns'
import { T, FONT_SANS } from './theme'

// Deterministic jitter so the picture is identical on every render.
function jitter(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

export default function Dots({ fig, groups, refs, panelW }: { fig: Figure; groups: Group[]; refs: RefLine[]; panelW: number }) {
  const [tip, setTip] = useState<Tip>(null)
  const { xs, width, colW, padL, padR } = layoutGroups(groups, panelW, 44, 8, 44, 72, refs.length ? 104 : 28)
  const narrow = colW < 40 && groups.some(g => g.columns.length > 1)
  const slotW = (i: number) => (i + 1 < xs.length ? (xs[i + 1].x0 + xs[i].x1) / 2 : width - padR) - (i > 0 ? (xs[i - 1].x1 + xs[i].x0) / 2 : padL)
  const H = narrow ? 580 : 540, padT = 36, padB = narrow ? 118 : 96, plotH = H - padT - padB
  const all = groups.flatMap(g => g.columns.flatMap(c => c.runs.map(r => (fig.measure.cell === 'mean' ? r.v : r.pct)!)))
  const lo = all.length ? Math.min(...all) : 0, hi = all.length ? Math.max(...all) : 1
  const span = Math.max(hi - lo, Math.abs(hi) * 0.05, 1e-9)
  const vmin = lo - span * 0.08, vmax = hi + span * 0.12
  const y = (v: number) => padT + plotH - ((v - vmin) / (vmax - vmin)) * plotH
  const ticks = niceTicks(vmin, vmax, 6)
  const rankTotal = groups.filter(g => g.rank != null).length
  const floor = padT + plotH

  return (
    <div className="chart-wrap" onMouseLeave={() => setTip(null)}>
      <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-label={`${fig.title}: every run as a dot`}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={padL} x2={width - padR} y1={y(t)} y2={y(t)} stroke={T.grid} />
            <text x={padL - 8} y={y(t) + 3.5} textAnchor="end" fontSize={10} fill={T.muted} fontFamily={FONT_SANS}>{fmtAxis(fig, t)}</text>
          </g>
        ))}
        {xs.slice(1).map((s, i) => {
          const xd = (xs[i].x1 + s.x0) / 2
          return <line key={'d' + i} x1={xd} x2={xd} y1={padT - 8} y2={floor + 6} stroke={T.grid} strokeDasharray="3 4" />
        })}
        {(() => { const ly = spreadLabels(refs.map(r => y(r.value))); return refs.map((r, i) => (
          <g key={'r' + i}>
            <line x1={padL} x2={width - padR} y1={y(r.value)} y2={y(r.value)} stroke={r.color} strokeDasharray="6 5" strokeWidth={1.2} opacity={0.85} />
            {ly[i] !== y(r.value) && <line x1={width - padR} x2={width - padR + 4} y1={y(r.value)} y2={ly[i]} stroke={r.color} strokeWidth={1} opacity={0.6} />}
            <text x={width - padR + 6} y={ly[i] + 3.5} textAnchor="start" fontSize={9.5} fill={r.color} fontFamily={FONT_SANS}>{r.label} {fmt(fig, r.value)}</text>
          </g>
        )) })()}
        {xs.map((s, gi) => (
          <g key={s.g.arm.id}>
            {s.cols.map(({ c, x }) => {
              const cx = x + colW / 2
              const vs = c.runs.map(r => (fig.measure.cell === 'mean' ? r.v : r.pct)!)
              const mn = Math.min(...vs), mx = Math.max(...vs)
              return (
                <g key={c.key}>
                  <line x1={cx} x2={cx} y1={y(mx)} y2={y(mn)} stroke={c.color} strokeWidth={1.2} opacity={0.7} />
                  {c.runs.map((r, i) => {
                    const v = (fig.measure.cell === 'mean' ? r.v : r.pct)!
                    const jx = (jitter(i * 7 + c.key.length) - 0.5) * (colW - 12)
                    return (
                      <circle key={r.path} cx={cx + jx} cy={y(v)} r={4} fill={c.color} opacity={0.42} stroke={T.surface} strokeWidth={1}
                        onMouseMove={e => {
                          const rc = (e.currentTarget.ownerSVGElement!.parentElement as HTMLElement).getBoundingClientRect()
                          setTip({ x: e.clientX - rc.left, y: e.clientY - rc.top, lines: [
                            `${s.g.arm.short} · ${modelLabel(r.model)} · rep ${r.rep}`,
                            `${fmt(fig, v)} — ${r.score}/${r.denominator} correct`,
                            r.path,
                          ] })
                        }} />
                    )
                  })}
                  {c.value != null && <line x1={x + 4} x2={x + colW - 4} y1={y(c.value)} y2={y(c.value)} stroke={c.color} strokeWidth={2.5} />}
                  {c.value != null && (
                    <text x={x + colW + 3} y={y(c.value) + 3.5} fontSize={9.5} fontWeight={600} fill={T.ink} fontFamily={FONT_SANS}>{fmt(fig, c.value)}</text>
                  )}
                  <text x={cx} y={y(mn) + 12} textAnchor="middle" fontSize={8.5} fill={T.muted} fontFamily={FONT_SANS}>{fmt(fig, mn)}</text>
                  <text x={cx} y={y(mx) - 6} textAnchor="middle" fontSize={8.5} fill={T.muted} fontFamily={FONT_SANS}>{fmt(fig, mx)}</text>
                  {s.g.columns.length > 1 && (colW >= 40 ? (
                    <text x={cx} y={floor + 13} textAnchor="middle" fontSize={8.5} fill={T.muted} fontFamily={FONT_SANS}>{shortModel(c.label)}</text>
                  ) : (
                    <text x={cx + 3} y={floor + 6} textAnchor="end" fontSize={8} fill={T.muted} fontFamily={FONT_SANS}
                      transform={`rotate(-45 ${cx + 3} ${floor + 6})`}>{shortModel(c.label)}</text>
                  ))}
                </g>
              )
            })}
            <GroupFooter g={s.g} cx={(s.x0 + s.x1) / 2} y={floor + (colW >= 40 || s.g.columns.length === 1 ? 36 : 52)} rankTotal={rankTotal} slotW={slotW(gi)} />
          </g>
        ))}
      </svg>
      <Tooltip tip={tip} />
    </div>
  )
}
