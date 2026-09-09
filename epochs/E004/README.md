# Epoch E004

Epoch 004 — line-4

| arm | side | runs | models |
|---|---|---|---|
| ta-ask-fz-009 | ta | 515 | claude-fable-5, claude-haiku-4-5, claude-opus-4-6, claude-opus-4-8, claude-opus-5, claude-sonnet-5, gpt-5.6-luna, gpt-5.6-sol, gpt-5.6-terra |
| cbm | cg | 276 | claude-fable-5, claude-haiku-4-5, claude-opus-4-6, claude-opus-4-8, claude-opus-5, claude-sonnet-5 |
| codegraph | cg | 280 | claude-fable-5, claude-haiku-4-5, claude-opus-4-6, claude-opus-4-8, claude-opus-5, claude-sonnet-5 |
| codex | cg | 180 | gpt-5.6-luna, gpt-5.6-sol, gpt-5.6-terra |
| cold | cg | 276 | claude-fable-5, claude-haiku-4-5, claude-opus-4-6, claude-opus-4-8, claude-opus-5, claude-sonnet-5 |
| cursor | cg | 320 | claude-haiku-4-5, claude-opus-5, claude-sonnet-5, composer-2.5, gpt-5.6-luna, gpt-5.6-sol, gpt-5.6-terra, grok-4.6 |
| gitnexus | cg | 281 | claude-fable-5, claude-haiku-4-5, claude-opus-4-6, claude-opus-4-8, claude-opus-5, claude-sonnet-5 |
| graphify | cg | 281 | claude-fable-5, claude-haiku-4-5, claude-opus-4-6, claude-opus-4-8, claude-opus-5, claude-sonnet-5 |
| serena | cg | 283 | claude-fable-5, claude-haiku-4-5, claude-opus-4-6, claude-opus-4-8, claude-opus-5, claude-sonnet-5 |

`manifest.json` lists every run path in this epoch with the SHA-256 of its `run.json`, the
instrument freeze the TrueArchitect arm ran under, the container image digests the comparison
group ran in, and the scorer era every verdict carries. `summary/` is DERIVED from the runs
(regenerable; never hand-edited): `leaderboard.csv` per arm × model × exam × battery over valid
scored runs, `per-question.csv` pass counts per question.
