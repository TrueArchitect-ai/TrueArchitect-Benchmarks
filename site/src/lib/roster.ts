// The roster: names, colors, order, roles. Colors are IDENTITY — one color per
// arm on every figure of the site and in the benchmark's own application, so a
// reader who learns "terracotta = bare Claude Code" once is never re-taught.
//
// Palette note (validated with the dataviz six-check script, both surfaces,
// 2026-09-09): with nine identities the red/orange family cannot pass the
// adjacent-pair colorblind separation checks (worst pairs: CodeGraph↔GitNexus,
// Serena↔CodebaseMemory). The relief rule therefore holds everywhere: color is
// a redundant cue, never the sole channel — every column carries its name in
// ink directly beneath it, groups are separated by labelled dividers, and every
// figure ships its data table.

export const ARM_COLORS: Record<string, string> = {
  'ta-ask': '#3987e5',
  cold: '#d97757',
  codex: '#8890b5',
  cursor: '#5fb8a5',
  graphify: '#eda100',
  gitnexus: '#b8434e',
  codegraph: '#a86a48',
  cbm: '#d55181',
  serena: '#e34948',
  auggie: '#d4a63a',
  'prime-agent': '#6fa8a0',
}

export type Role = 'trueArchitect' | 'bare' | 'indexer'

export type ArmInfo = { id: string; name: string; role: Role; color: string; short: string }

// TA instance arms are named ta-ask-fz-NNN in the tree; they all resolve to the
// concept color. A future arm not listed here gets a neutral grey and its id as
// its name — the site never invents a description.
export function armInfo(id: string): ArmInfo {
  if (id.startsWith('ta-ask')) return { id, name: 'TrueArchitect', role: 'trueArchitect', color: ARM_COLORS['ta-ask'], short: 'TrueArchitect' }
  const named: Record<string, [string, Role, string]> = {
    cold: ['Claude Code (bare)', 'bare', 'CC Bare'],
    codex: ['Codex (bare)', 'bare', 'Codex Bare'],
    cursor: ['Cursor Agent (bare)', 'bare', 'Cursor Bare'],
    auggie: ['Auggie (bare)', 'bare', 'Auggie Bare'],
    'prime-agent': ['prime-agent (bare)', 'bare', 'prime-agent Bare'],
    graphify: ['Graphify', 'indexer', 'Graphify'],
    gitnexus: ['GitNexus', 'indexer', 'GitNexus'],
    codegraph: ['CodeGraph', 'indexer', 'CodeGraph'],
    cbm: ['CodebaseMemory', 'indexer', 'CodebaseMemory'],
    serena: ['Serena', 'indexer', 'Serena'],
  }
  const n = named[id]
  if (n) return { id, name: n[0], role: n[1], color: ARM_COLORS[id] ?? '#8a8f9c', short: n[2] }
  return { id, name: id, role: 'indexer', color: '#8a8f9c', short: id }
}

// Presentation order: TrueArchitect · the bare band (each ecosystem's null
// hypothesis) · the indexing tools (installed on top of bare Claude Code).
const BARE_ORDER = ['cold', 'codex', 'cursor', 'auggie', 'prime-agent']
const INDEXER_ORDER = ['graphify', 'gitnexus', 'codegraph', 'cbm', 'serena']
export function armOrder(a: string, b: string): number {
  const rank = (id: string) => {
    if (id.startsWith('ta-ask')) return 0
    const bi = BARE_ORDER.indexOf(id)
    if (bi >= 0) return 10 + bi
    const ii = INDEXER_ORDER.indexOf(id)
    if (ii >= 0) return 100 + ii
    return 1000
  }
  return rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0)
}

export const ROLE_LABEL: Record<Role, string> = {
  trueArchitect: 'TrueArchitect',
  bare: 'bare harness',
  indexer: 'indexing tool on Claude Code',
}

// ── models ──
const MODEL_LABEL: Record<string, string> = {
  'claude-haiku-4-5': 'Haiku 4.5', 'claude-sonnet-5': 'Sonnet 5', 'claude-opus-4-6': 'Opus 4.6',
  'claude-opus-4-8': 'Opus 4.8', 'claude-opus-5': 'Opus 5', 'claude-fable-5': 'Fable 5',
  'gpt-5.6-luna': 'GPT 5.6 Luna', 'gpt-5.6-terra': 'GPT 5.6 Terra', 'gpt-5.6-sol': 'GPT 5.6 Sol',
  'composer-2.5': 'Composer 2.5', 'grok-4.6': 'Grok 4.6',
}
export const modelLabel = (m: string) => MODEL_LABEL[m] ?? m

export const vendorOf = (m: string) =>
  m.startsWith('claude') ? 'anthropic' : m.startsWith('gpt') ? 'openai' : m.startsWith('grok') ? 'xai' : m.startsWith('composer') ? 'cursor' : 'other'
const VENDOR_ORDER = ['anthropic', 'openai', 'xai', 'cursor', 'other']
const MODEL_FAMILY = ['haiku', 'sonnet', 'opus', 'fable', 'luna', 'terra', 'sol', 'grok', 'composer']
export function modelOrder(a: string, b: string): number {
  const va = VENDOR_ORDER.indexOf(vendorOf(a)), vb = VENDOR_ORDER.indexOf(vendorOf(b))
  if (va !== vb) return va - vb
  const rank = (m: string) => {
    const tail = m.replace('claude-', '').replace('gpt-5.6-', '')
    const fam = MODEL_FAMILY.findIndex(f => tail.startsWith(f))
    return { fam: fam === -1 ? MODEL_FAMILY.length : fam, ver: tail.replace(/^[a-z]+-?/, '').split('-').map(Number) }
  }
  const ra = rank(a), rb = rank(b)
  if (ra.fam !== rb.fam) return ra.fam - rb.fam
  for (let i = 0; i < Math.max(ra.ver.length, rb.ver.length); i++) {
    const x = ra.ver[i] ?? 0, y = rb.ver[i] ?? 0
    if (x !== y) return x - y
  }
  return a < b ? -1 : a > b ? 1 : 0
}

// Capability tiers — the like-for-like pairing across vendors (declared, never
// inferred): each tier names the models a vendor positions at that price and
// speed point.
export const TIERS: Record<string, string[]> = {
  fast: ['claude-haiku-4-5', 'gpt-5.6-luna'],
  everyday: ['claude-sonnet-5', 'gpt-5.6-terra'],
  frontier: ['claude-opus-5', 'gpt-5.6-sol', 'composer-2.5'],
}

export const EXAM_LABEL: Record<string, string> = {
  HumanExam: 'HumanExam', ZeroShotExam: 'ZeroShot', MultiTurnExam: 'MultiTurn',
}
export const EXAMS = ['ZeroShotExam', 'MultiTurnExam', 'HumanExam']
export const BATTERY_LABEL: Record<string, string> = { memos: 'base battery (30 q)', 'memos-hard': 'hard battery (20 q)' }

// The public repository the figures link into.
export const REPO_URL = 'https://github.com/TrueArchitect-ai/TrueArchitect-Benchmarks'
export const runUrl = (path: string) => `${REPO_URL}/tree/main/${path}`

// Lighter / darker shades of an arm color for per-model sub-columns.
export function mix(hex: string, other: string, t: number): string {
  const h = (x: string) => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16))
  const a = h(hex), b = h(other)
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('')
}
export function shade(base: string, idx: number, total: number, dark: boolean): string {
  if (total <= 1) return base
  const t = idx / (total - 1)
  const light = dark ? '#ffffff' : '#ffffff', deep = dark ? '#05060d' : '#1a1b26'
  return t < 0.5 ? mix(base, light, 0.30 * (1 - 2 * t)) : mix(base, deep, 0.26 * (2 * t - 1))
}
