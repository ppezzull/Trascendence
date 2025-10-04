# Contributing — short guide

Thanks for helping build Trascendence. This file is a short, actionable checklist for contributors.

1) Quick start
   - Sync main: `git checkout main && git pull origin main`
   - Run scaffold if needed: `./scripts/scaffold_project.sh`

2) Branches
   - Small feature directly from main: `feature/{layer}-{name}` (e.g. `feature/auth-login`).
   - Module work (multiple devs / multi-service): `module/{module-name}` with sub-branches `module/{module}/feature/{name}`.
   - Hotfixes: `hotfix/{short-description}`.

3) PR rules (short)
   - Base: PRs → `main` (or module branch when using module workflow).
   - Keep PRs small and focused.
   - Require: 2 reviewers (one module owner if applicable) and passing CI before merge.
   - Preferred merge: squash-and-merge.

4) Checklist to include in PR description
   - Tests included/updated where relevant
   - Lint/type checks passed
   - Docs updated if behavior/API changed
   - Migration/contract notes when applicable

5) Contracts
   - Add `forge` tests and run `forge test` locally.

6) Security
   - Never commit secrets. Use `.env` locally and CI secrets for pipelines.

Need more structure? I can add a `CODEOWNERS` file, a PR template, and a small CI workflow to enforce checks.
