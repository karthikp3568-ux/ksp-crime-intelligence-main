# Modernization Progress

Updated: 2026-10-12

## Phase 0 — Audit and baseline

**Status: Complete.**

- Added `docs/AUDIT.md`, `docs/FEATURE_MATRIX.md`, and `docs/DECISIONS.md`.
- Created local work branch `modernization/prototype-upgrade`.
- Confirmed application stack: React/TypeScript/Vite, Express, SQLite.
- Confirmed no external AI or CCTNS credentials are configured; keep all example records synthetic.
- Baseline commands and observed output:
  - `npm run build --prefix client` — passed; Vite built 2,334 modules; minified JS is 1,803.69 kB.
  - `.\client\node_modules\.bin\tsc.cmd --noEmit -p client/tsconfig.app.json` — failed with 6 diagnostics.
  - `npm run lint --prefix client` — failed with 321 errors, 12 warnings, 23 files.
  - `npm test --prefix functions/ksp` — auth, datastore adapter, and RAG contract tests passed; ethical-intelligence suite failed because the risk scorer still returns `threat_level: "High Risk"`.
  - `node functions/ksp/test/e2e-pillar-verification.js` — reports 10/10; not a meaningful feature-completeness gate: local dynamic NLP was selected, finance transactions were 0, and CDR tower locations were 0.
  - `npm start`; GET `/`; GET `/api/health/live` — server starts and both HTTP checks return 200.
  - `npm audit --json` — client 8 advisories (5 high); backend 14 advisories (7 high, 2 critical).
- Local app is running at `http://localhost:3001`.

### Phase 0 post-phase gate

- TypeScript check: failed with the same 6 baseline diagnostics.
- Frontend lint: failed with 321 errors and 12 warnings.
- Backend tests: failed at the same ethical-intelligence assertion after three passing suites.
- Production frontend build: passed, with the same large-bundle warning.
- Local smoke check: `GET /` and `GET /api/health/live` both returned HTTP 200.

## Phase 1 — Authentication hardening and policy-safe analytics

**Status: Implemented; targeted verification passed.**

- New passwords use bcrypt; legacy salted SHA-256 hashes remain verifiable and are upgraded at login.
- Removed the demo JWT signature bypass; JWT validation checks header, role, subject, expiry, and signature.
- Production requires a sufficiently long `JWT_SECRET`; removed the embedded Compose fallback.
- Synthetic demo users are not seeded in production.
- Disabled individual risk/threat scoring across chat, summary, timeline, anomalies, early warnings, biometric outputs, warrant and analyst surfaces; removed individual score values from both schema/seed paths and added a fail-closed legacy-column migration.
- Backend ethical test now asserts the disabled service response and chat router refusal.
- Verification after the changes:
  - `npm test --prefix functions/ksp` — passed all four suites, including the ethical-policy tests.
  - `npm run build --prefix client` — passed; Vite still reports a large JavaScript chunk.
  - TypeScript check — still reports baseline diagnostics; current output has five diagnostics in `OnboardingTour.tsx`, `ForecastAlertPanel.tsx`, and `main.tsx` (the `services/api.ts` tool-union diagnostic was corrected).
  - Database inspection — no risk/threat columns remain in `FIR_Accused` after startup migration.
  - New-code local HTTP smoke check on port 3002 — `GET /` and `GET /api/health/live` returned HTTP 200; unauthenticated `POST /api/chat` returned HTTP 401. The temporary server was stopped after the check.
  - Targeted ESLint remains unsuccessful on touched frontend files; diagnostics include `any`-type and React hook/ref rules. No broad lint cleanup was included in this phase.
  - The tracked synthetic SQLite database was updated by the legacy-column migration; the active `FIR_Accused` table was verified to contain no risk/threat columns.

## Current implementation priority

Replace client-side fake-success fallbacks with explicit error/empty states, then implement and verify deterministic synthetic core workflows. Every behavior must be verified; the smoke script's current "10/10" result is not an acceptance signal by itself.

## Blockers and scope boundaries

- TypeScript and lint gates remain red from known baseline issues; the build and backend suite pass.
- No real integrations/credentials were supplied; external provider and government API validation is out of scope.
- A local Git remote exists, but this session will not upload source code or credentials externally.
- The prompt requested a commit per phase. Local commits may be made on the modernization branch after each phase; no push will be performed.
