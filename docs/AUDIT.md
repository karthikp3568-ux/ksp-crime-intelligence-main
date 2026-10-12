# Phase 0 Audit

Audit date: 2026-10-12  
Scope: current repository source, local build/test execution, and local SQLite-backed application.  
Run parameters: local-only; fictional/synthetic records only; no live AI provider or external agency integration configured. The current Node.js runtime observed during checks was v24.12.0. No execution budget or demo deadline was supplied.

## Executive summary

This is a React/TypeScript + Express/SQLite full-stack prototype with role-labelled dashboards, a large API surface, and seeded fictional case data. The production frontend bundle builds and the local application starts. The current smoke script reports 10/10 pillars, but this is not evidence of complete feature behavior: it accepts empty financial/CDR results and reports local dynamic NLP as a successful chat result.

Baseline quality gates are not green:

- Frontend production build succeeds, but produces a 1.8 MB minified JavaScript bundle.
- Correct TypeScript checking fails with six diagnostics.
- ESLint reports 321 errors and 12 warnings in 23 files.
- Three backend test files pass before the ethical-intelligence suite fails because the implementation still returns the prohibited legacy `threat_level` field.
- Dependency audit reports 8 client advisories (5 high) and 14 backend advisories (7 high, 2 critical).

The app must remain a synthetic-data demonstration. It is not verified as a live police system, must not be used for real investigative decisions, and must not connect real personal data to an external AI provider.

## Project structure and execution

- **Project type:** full-stack web application.
- **Frontend:** `client/`, React 19 + TypeScript + Vite; `src/main.tsx` is the browser entry point and `src/App.tsx` selects role dashboards and top-level workspace tabs. UI is primarily component-local React state and CSS/Tailwind.
- **Backend:** `functions/ksp/`, Node.js CommonJS + Express 4. `server.js` serves the API and the built SPA, applies CORS, JSON parsing, rate limiting and JWT middleware, then dispatches feature routes.
- **Persistence:** SQLite through `functions/ksp/shared/catalyst-sdk.js` / `datastore-adapters.js`. Main schema is `functions/ksp/datastore/schema.sql`; a second schema exists at root `datastore/schema.sql`. The backend resolves its own bundled datastore schema first. Schema divergence needs reconciliation before database changes.
- **Seed data:** a tracked SQLite database exists at `functions/ksp/datastore/ksp_crime.db`; there are Python seed scripts under `datastore/seed/` and `functions/ksp/datastore/seed/`.
- **Build/deploy:** root/client/backend npm manifests, Dockerfile, docker-compose, Catalyst config, and GitHub Actions workflow. There is no `.env.example`.
- **Current source branch:** `modernization/prototype-upgrade`, created for this work from `main`. `origin` is configured to the GitHub URL supplied by the user. Source is not being pushed externally.

## Frontend inventory

`client/src/App.tsx` contains the authenticated shell, top-level tabs, local-storage session restoration, role-to-dashboard selection, CCTNS sync modal, onboarding state, and a random client-side geofence alert loop. The user-facing role screens are:

- `InvestigatorDashboard.tsx`: FIR lookup, finance/similar-case/court/prison views, evidence, BNS helpers, chargesheet UI, OCR, biometrics, and workspace pinning.
- `AnalystDashboard.tsx`: map, network, demographic/forecast views, CDR, and workspace pinning.
- `SupervisorDashboard.tsx`: audit logs, anomalies, CCTNS sync, dispatch, overrides.
- `PolicymakerDashboard.tsx`: trends, demographic aggregates, and forecasts.
- `SmartBrowzDashboard.tsx`, `CollaborativeWorkspace`, `ChatInterface`, `WarrantDesk`, and visualization components provide additional screens and controls.

There is no URL router for the role workspaces; navigation is state-driven. The API client is `client/src/services/api.ts`. It stores JWTs and role/user context in `localStorage` and contains in-memory sample fallbacks for multiple API methods. Most method parameters named `_userId` and `_role` are unused; authorization must be derived from the backend token, not client values.

## Backend/API inventory

The Express entry point defines authentication/refresh; chat and streaming chat; translation, voice and PDF export; anomalies and audit log/override; FIR, financial trail, similar cases, forecasts, socio-demographics and dashboard stats; OCR, CDR, biometrics and dispatch; workspace reads/pins/notes; CCTNS runs/status/sync; warrants and bulk updates; investigation timeline, early warning and case summary; SmartBrowz stats/actions; court and prison lookups/release alerts; evidence register/read/verify; BNS mapping/lookup/advisor/chargesheet; TEE status/process; health/live/readiness; and memory/agent proxy APIs.

The README's `GET /api/network` endpoint is not defined as a corresponding route in `server.js`. The UI's network experience is routed through chat/tool output instead. Endpoint method, payload, authorization, error and feature-state details still need a maintained API contract; see the follow-up API documentation task.

Most API paths are behind JWT middleware, with explicit public login/health paths. Middleware attaches the token's role, but route-level role/resource authorization is not uniformly evident. Some queries use `getRLSFilter`/`getUserScope`; every route still requires a targeted authorization review and cross-role/IDOR tests.

## Data, AI, and integrations

- The SQLite schema contains operational FIR/accused/victim/location/case-link, financial transaction, forecast, officer, audit, warrant, court, evidence, witness, BNS, memory/agent, and CCTNS reference entities, plus legacy CCTNS-style tables. Actual entity/table contracts are documented in schema source rather than a typed model layer.
- CCTNS client explicitly runs in `DEMO_SIMULATOR` mode without configured credentials and generates randomized records. ICJS adapter states live mode is not implemented. Court/prison/biometric/dispatch/forecast features include local or synthetic behavior.
- Chat supports configured providers but can fall back to `local-dynamic-nlp`; the smoke test observed that provider. This must not be labelled as a live LLM/RAG answer.
- Biometric fallback can return synthetic matches and computes mock similarity values. OCR UI submits the literal `MOCK_BASE64` instead of uploaded document bytes.
- The application and seed data include individual-level risk scores, threat labels, and recommendations. The user-provided requirements prohibit individual risk scoring and demographic indicators; this code requires a deliberate, cross-surface removal/replacement, not merely a test adjustment.
- The PDF service calls a Catalyst-shaped SDK abstraction locally. A local 468-byte response passed the smoke test, but this does not establish official status, authenticity, legal admissibility, or live Catalyst connectivity.
- Evidence registration currently accepts a supplied file hash; the inspected UI/API path does not establish that the backend computes a hash from uploaded file contents.
- The client API substitutes sample data on failed or non-OK fetches in multiple methods, including anomalies, audit logs, case, finance, similar cases, forecasts, workspace, and several others. These fallbacks can mask backend failures and must be replaced by explicit error/empty states.

## Security and reliability findings to address

1. **Production secret default:** `docker-compose.yml` supplies a hard-coded fallback `JWT_SECRET` while setting `NODE_ENV=production`. Remove the fallback and require an externally supplied secret; never publish a real secret.
2. **Password hashing:** `auth-middleware/jwt-utils.js` uses one-pass SHA-256 with salt and string equality. This is not a password-hashing KDF and must be migrated safely with existing synthetic seed data.
3. **Development token bypass:** `verifyToken` recognizes `demo_signature` outside production. Remove this bypass and test that malformed/unsigned tokens always fail.
4. **Browser token storage:** JWT is stored in `localStorage`, exposing it to script injection. This requires a documented threat decision and secure session design.
5. **Authorization:** JWT authentication alone does not establish role permission or resource ownership. RLS use is inconsistent; test every privileged read/write, policymaker aggregation boundary, cross-user access and overrides.
6. **Error handling:** several API handlers return raw exception messages. The app lacks one consistent safe error/request-ID contract and centralized error middleware.
7. **Audit claims:** a database hash chain can detect some changes but is not immutable; direct database write access can rewrite it. The README uses stronger claims than the implementation warrants.
8. **Production Compose configuration:** contains a checked-in fallback JWT secret. Other deployment and Catalyst claims must remain labelled as unverified until actually exercised.
9. **Demo data and UI:** randomly generated geofence alerts and response-shaped fallbacks can look like live activity. Every simulator and synthetic record must be visibly labelled.
10. **Tracked database:** `functions/ksp/datastore/ksp_crime.db` is tracked. Treat it as synthetic fixture data only, inspect before any publication, and never put real personal data in it.

## Baseline evidence

Executed from the repository root unless noted:

| Command/check | Observed result |
|---|---|
| `npm run build --prefix client` | Passed; Vite built 2,334 modules. Minified JS chunk is 1,803.69 kB; Vite warns chunks exceed 500 kB. |
| `.\client\node_modules\.bin\tsc.cmd --noEmit -p client/tsconfig.app.json` | Failed with six TypeScript diagnostics in `OnboardingTour.tsx`, `ForecastAlertPanel.tsx`, `main.tsx`, and `services/api.ts`. |
| `npm run lint --prefix client` | Failed: 321 errors, 12 warnings, 23 files with errors. |
| `npm test --prefix functions/ksp` | Failed at `test/ethical_ai.test.js`; auth, datastore adapter, and RAG contract test files passed. Failure: expected `profile.threat_level` absent, observed `"High Risk"`. |
| `node functions/ksp/test/e2e-pillar-verification.js` | Script completed with 10/10, but observed chat provider `local-dynamic-nlp`, finance transactions 0, CDR towers 0, and PDF response 468 bytes. Its assertions do not validate useful data or live integrations. |
| `npm start`, GET `/`, GET `/api/health/live` | Server starts locally; frontend returned HTTP 200 and health/live returned HTTP 200 with `live: true`. |
| `npm audit --json` (client/backend) | Client: 8 advisories (5 high); backend: 14 (7 high, 2 critical). These are lockfile audit counts, not proof of exploitability. |

The server is currently running locally at `http://localhost:3001`. No source edits had been made before the Phase 0 audit was recorded.

## Audit conclusion

Current status is a locally runnable prototype with a successful client build and smoke boot, but failing type/lint/backend gates, no demonstrated live integrations, misleading client fallbacks, and security design gaps. Phase work should prioritize safe authentication/authorization and transparent data states, then connect and test deterministic synthetic core workflows. No real records or external live agency integrations are in scope.
