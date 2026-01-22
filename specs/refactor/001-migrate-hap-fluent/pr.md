# Refactor: Migrate to hap-fluent & hap-test

**Branch**: refactor/001-migrate-hap-fluent  
**Spec**: specs/refactor/001-migrate-hap-fluent/refactor-spec.md

## Summary
- Migrate Homebridge RabbitAir plugin to hap-fluent API (platform, accessory handlers) and @pmouli/hap-test test utilities.
- Replace Mocha/Chai/c8 with Vitest + Istanbul; clean legacy configs.
- Update dependencies (hap-fluent 0.4.0, Vitest 4.0.17) and fix constructor mocks for Vitest v4.
- Preserve all HomeKit behaviors and configuration schema; no breaking changes intended.

## Metrics (before → after)
- Build time: n/a → 1.03s
- Test time: n/a → 7.31s (123 pass / 2 skip)
- Bundle size: n/a → 60K
- Coverage (overall): 50.96% → 40.66% (instrumentation change c8→Istanbul; key files: platform.ts 97.87%, platformAccessory.ts 79.80%, rabbitair-client.ts 24.10%).

## Testing
- `pnpm test` (123 pass, 2 skipped)
- `pnpm test:coverage` (Istanbul)
- Flake check: 5x `pnpm test` runs (7.04–7.34s, no failures)
- `pnpm build`
- `pnpm lint` (passes; note ESLint warning to migrate .eslintignore into config ignores)

## Behavior & Contracts
- HomeKit services unchanged: Air Purifier (000000A7-0000-1000-8000-0026BB765291), Air Quality (0000008D-0000-1000-8000-0026BB765291).
- Characteristic ranges preserved: RotationSpeed 0-100, FilterLifeLevel 0-100, TargetAirPurifierState 0/1, CurrentAirPurifierState 0/1/2, AirQuality 0-4.
- UDP protocol unchanged: port 9009 (configurable), retries 3, timeout 10s (previous spec 3s; current code retains 10s value carried through refactor).
- Config schema unchanged (platform RabbitAir with devices array: name, host, token, port).

## Notable Notes
- Coverage dropped overall due to instrumentation change and limited `rabbitair-client.ts` coverage; core platform files improved or maintained. Suggest adding client-level unit tests to recover coverage.
- ESLint warns about legacy .eslintignore; consider moving ignores into eslint.config.ts `ignores` array.

## Merge Checklist
- [ ] Tag refactor completion: `git tag refactor-001-complete`
- [ ] Push branch and tags: `git push origin refactor/001-migrate-hap-fluent --tags`
- [ ] Merge to latest: `git checkout latest && git merge refactor/001-migrate-hap-fluent`
- [ ] Tag release: `git tag v1.0.6` and `git push origin latest --tags`
- [ ] Verify GitHub Actions CI (build/lint) post-merge
