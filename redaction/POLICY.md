# Redaction policy

**What is withheld:** the text of the queries the TrueArchitect agent sends to its
codebase index, and the raw result envelopes those queries return. Both are
product surface, not benchmark evidence. Everything else — the questions, the
gold, every answer, every verdict and reason, the tokens, the timings, the tool
call sequence, the symbol names and file:line anchors the agent cites — is
published.

**How:** the product already carries a display-level record of every index query
(the sentence its own UI shows the user, e.g. "Found callers of X"), plus the
call's status, latency and result size. The published transcript record for a
query call is exactly that composition. Where the agent's prose quotes a query,
the span is replaced by the marker `[ArchMap query]` (a quoted result
envelope line by `[ArchMap query result]`, a fenced block by
`[ArchMap query redacted]`, a confidence attribute by
`[ArchMap confidence tier]`), and the query language's internal name by
"ArchMap". Markers are never deletions: the count and placement of index queries is
part of the proof of method.

**Component names:** the internal code names of the TrueArchitect components that
ran the arm (the agent, the gateway, the indexer, the exam harness) are replaced
by descriptive names everywhere they appear — the arm and freeze identifiers, the
transcript records' agent field, and the provenance version blocks. The manifest's
`arm_map` and `freeze_map` list the published identifiers. No
measurement rides a name; the substitution is one-to-one and stable across exports.

**What is never touched:** symbol names, qualified names, file paths and line
anchors, counts, prose, the comparison group's transcripts (published verbatim),
the grading key.

**Path normalization (both sides):** a machine-local home directory prefix
(`/Users/<name>/`) becomes `~/` in every published text file. This is
hygiene, not redaction.

**Not published at all:** the agent's system prompt and tool manifest, the raw
LLM-facing capture files, operational logs and launch scripts, the bench's own raw
wire taps and SSE stream captures on the external-harness lanes (they duplicate
the harness's conversation record, which IS published, at several times the
size), the per-run copy of a vendor's model catalog, and the human operators'
local paths beyond the normalization above.

**The validator:** every published byte is scanned against a forbidden-pattern
list before the tree is written. The list itself names the vocabulary it withholds,
so it stays with the benchmark's own records and is not published. TrueArchitect-side
and grading-key files must be clean of every pattern; comparison-group files must be
clean of every high-severity pattern (a hit there would be a contamination finding,
not something to redact), and low-severity hits — short bracket tokens that also occur
in ordinary source code — are counted here as review items and kept verbatim.
`summary.json` carries the per-class redaction counts of the last export.
