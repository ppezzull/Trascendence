# Contributing — short guide

Thanks for helping build Trascendence. This file is a short, actionable checklist for contributors.

1) Branches
   - Small feature directly from main: `feature/{layer}-{name}` (e.g. `feature/auth-login`).
   - Module work (multiple devs / multi-service): `module/{module-name}` with sub-branches `module/{module}/feature/{name}`.
   - Hotfixes: `hotfix/{short-description}`.

2) PR rules
   - Base: PRs → `main` (or module branch when using module workflow).
   - Keep PRs small and focused.
   - Require: 2 reviewers (one module owner if applicable) and passing CI before merge.
   - Preferred merge: squash-and-merge.

3) Checklist to include in PR description
   - Tests included/updated where relevant
   - Lint/type checks passed
   - Docs updated if behavior/API changed
   - Migration/contract notes when applicable

4) Contracts
   - Add `forge` tests and run `forge test` locally.

5) Security
   - Never commit secrets. Use `.env` locally and CI secrets for pipelines.

Need more structure? I can add a `CODEOWNERS` file, a PR template, and a small CI workflow to enforce checks.
