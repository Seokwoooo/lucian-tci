# Frozen official sources

Client retrieval date: 2026-10-16 (Asia/Seoul). Dataset version: 2026-10-16.1. The date comes from the client context; it is not inferred from the host clock.

The parent session retrieved newTCIKey.htm and newTCITable.htm before delegation. The dataset agent retrieved the three guidance pages. Original bytes are preserved. See [sources.json](sources.json) for URLs, SHA-256, sizes, declared encodings, and retrieval attribution.

- [newTCIKey.htm](https://ipip.ori.org/newTCIKey.htm)
- [newTCITable.htm](https://ipip.ori.org/newTCITable.htm)
- [newScoringInstructions.htm](https://ipip.ori.org/newScoringInstructions.htm)
- [newPermission.htm](https://ipip.ori.org/newPermission.htm)
- [newNorms.htm](https://ipip.ori.org/newNorms.htm)

The extraction is offline and independently parses the key and comparison table. It treats C2's no-negative-items note as an annotation, preserves all scoring signs and item positions, maps only the S domain code to SD, and does not invent ST3.

[openscales-comparison.json](openscales-comparison.json) records a pinned, read-only comparison with official OpenScales GitHub raw data. No OpenScales implementation is vendored. The reference has 258 entries (30 sections, 228 Likert items), 61 omitted official occurrences, and one truncated retained sentence. Its root CC BY-NC-SA 4.0, implementation CC BY 4.0, and scale Public Domain labels have separate scopes; see [the full audit](../docs/DATA_AUDIT.md).

Run `node scripts/validate-data.mjs --self-test` from the repository root to recheck all official hashes and data invariants.
