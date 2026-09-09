import { useState } from 'react'
import { armInfo, armOrder, ROLE_LABEL } from '../lib/roster'
import { T, FONT_SANS, FONT_SERIF } from './theme'
import { Tooltip, type Tip } from './Columns'

export type HeatCell = { arm: string; col: string; rate: number | null; pass: number; n: number; models: number }
export type HeatData = { exam: string; battery: string; columns: string[]; difficulty: string[]; cells: HeatCell[] }

// Sequential single hue (the site accent), light → dark, on a neutral cell.
function ramp(t: number, dark: boolean): string {
  const a = dark ? [38, 42, 60] : [238, 242, 252]
  const b = [37, 99, 200]
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

export default function Heatmap({ data, panelW, dark }: { data: HeatData; panelW: number; dark: boolean }) {
  const [tip, setTip] = useState<Tip>(null)
  const arms = [...new Set(data.cells.map(c => c.arm))].sort(armOrder)
  const cols = [...data.columns, ...data.difficulty]
  const labelW = 150, cellH = 34, padT = 64, padB = 16
  const cellW = Math.max(34, Math.min(96, (panelW - labelW - 24) / cols.length))
  const width = Math.max(panelW, labelW + cols.length * cellW + 24)
  const H = padT + arms.length * cellH + padB
  const cell = (arm: string, col: string) => data.cells.find(c => c.arm === arm && c.col === col)
  return (
    <div className="chart-wrap" onMouseLeave={() => setTip(null)}>
      <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-label="pass rate by category and difficulty">
        {cols.map((col, j) => (
          <text key={col} x={labelW + j * cellW + cellW / 2} y={padT - 10} textAnchor="end" fontSize={9.5} fill={T.muted} fontFamily={FONT_SANS}
            transform={`rotate(-32 ${labelW + j * cellW + cellW / 2} ${padT - 10})`}>{col}</text>
        ))}
        {data.difficulty.length > 0 && (
          <line x1={labelW + data.columns.length * cellW - 3} x2={labelW + data.columns.length * cellW - 3} y1={padT - 4} y2={padT + arms.length * cellH} stroke={T.baseline} strokeDasharray="3 4" />
        )}
        {arms.map((arm, i) => {
          const info = armInfo(arm)
          const yy = padT + i * cellH
          return (
            <g key={arm}>
              <rect x={0} y={yy + 6} width={4} height={cellH - 12} fill={info.color} rx={1} />
              <text x={12} y={yy + cellH / 2 - 2} fontSize={11.5} fontWeight={600} fill={T.ink} fontFamily={FONT_SERIF}>{info.short}</text>
              <text x={12} y={yy + cellH / 2 + 10} fontSize={8.5} fill={T.muted} fontFamily={FONT_SANS}>{ROLE_LABEL[info.role]}</text>
              {cols.map((col, j) => {
                const c = cell(arm, col)
                const x = labelW + j * cellW
                if (!c || c.rate == null) return <rect key={col} x={x + 1} y={yy + 1} width={cellW - 2} height={cellH - 2} fill={T.grid} rx={3} />
                const t = c.rate / 100
                const ink = t > 0.62 ? '#ffffff' : T.ink
                return (
                  <g key={col}
                    onMouseMove={e => {
                      const rc = (e.currentTarget.ownerSVGElement!.parentElement as HTMLElement).getBoundingClientRect()
                      setTip({ x: e.clientX - rc.left, y: e.clientY - rc.top, lines: [`${info.short} · ${col}`, `${c.rate.toFixed(1)}% of ${c.n} attempts`, `${c.models} model${c.models === 1 ? '' : 's'} pooled`] })
                    }}>
                    <rect x={x + 1} y={yy + 1} width={cellW - 2} height={cellH - 2} fill={ramp(t, dark)} rx={3} />
                    <text x={x + cellW / 2} y={yy + cellH / 2 + 4} textAnchor="middle" fontSize={10.5} fontWeight={600} fill={ink} fontFamily={FONT_SANS}>{c.rate.toFixed(0)}</text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
      <Tooltip tip={tip} />
    </div>
  )
}
