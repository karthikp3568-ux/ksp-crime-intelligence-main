# Modernization Decisions

## 2026-10-12 — Local-only synthetic-data scope

- Keep React/TypeScript, Express, and SQLite; no demonstrated need justifies a stack rewrite.
- Treat the product as a fictional local prototype. Do not access real government/private data or connect real case data to an external AI provider.
- No AI provider credential was supplied; configure no external provider by default and expose provider availability honestly.
- Preserve useful existing flows, but do not preserve individual risk scoring, demographic indicators, or automated/adverse-action recommendations because the user-provided requirements explicitly prohibit them.
- Do not add infrastructure or dependencies without a specific implementation need; document any exception before installation.
- Avoid destructive database changes. Use forward migrations and fixture backups if the schema needs modification.
- Keep simulators only when visibly labelled and deterministic; never silently replace API failures with success-shaped synthetic responses.
- Work on local branch `modernization/prototype-upgrade`. The workspace has an `origin` remote, but do not push source or secrets to an external system from this session.
- Section 0 execution budget, audience and deadline were left blank. Work incrementally, run the stated gates, and report any scope not reached rather than claiming full completion.
