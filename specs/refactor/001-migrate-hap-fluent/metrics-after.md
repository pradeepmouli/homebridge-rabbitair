# Post-Refactoring Metrics (After Refactoring)

**Timestamp**: Thu Jan 22 2026 (local)
**Branch**: refactor/001-migrate-hap-fluent

---

## Performance

- Build Time: 1.03s (time -p `pnpm build`)
- Test Time: 7.31s (time -p `pnpm test`)
- Coverage Run Time: 7.24s (time -p `pnpm test:coverage`)
- Bundle Size: 60K (`du -sh dist`)

## Test Coverage (Vitest + Istanbul)

Overall coverage from `pnpm test:coverage`:

```
All files          |   40.66 |    36.09 |   51.38 |   40.03
 index.ts          |  100.00 |   100.00 |  100.00 |  100.00
 platform.ts       |   97.87 |    94.11 |  100.00 |   97.87
 platformAccessory.ts | 79.80 |   47.36 |   85.00 |   79.80
 rabbitair-client.ts  | 24.10 |   23.68 |   31.91 |   23.00
 settings.ts       |  100.00 |   100.00 |  100.00 |  100.00
```

## Comparison vs Before

Reference: metrics-before.md (Mocha + c8)

- Overall Coverage: 50.96% (before) → 40.66% (after)
- `platform.ts`: 97.88% → 97.87% (parity)
- `platformAccessory.ts`: 67.11% → 79.80% (improved)
- `rabbitair-client.ts`: 34.76% → 24.10% (regressed)
- Build Time: n/a before → 1.03s after
- Bundle Size: n/a before → 60K after

Notes:
- Coverage instrumentation changed (c8 → Istanbul). File-level deltas reflect test refactors and runner differences.
- Key target files `platform.ts` and `platformAccessory.ts` remain high-coverage; `rabbitair-client.ts` needs additional tests to recover lost coverage.

---

Metrics captured with pnpm scripts on macOS.
