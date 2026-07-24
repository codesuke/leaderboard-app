# Bootstrap Checklist

Run through this once, right after creating a new repo from the Starter-Pack template. Delete this file when done — it has no purpose once the project is configured.

## 1. Identity

- [ ] Replace `{Project Name}` in `README.md`, `CONTEXT.md`, `Brand.md`, `DESIGN.md`, and `Architecture.md`.
- [ ] Set `name`, `description`, `repository`, `homepage`, and `bugs` in `package.json`.
- [ ] Set the repo slug (`{ORG}/{REPO}`) in `docs/agents/issue-tracker.md`.
- [ ] Update `LICENSE` with the current year and copyright holder (or replace it entirely if this project isn't MIT/isn't open-source).

## 2. Domain & Product Docs

- [ ] Fill in `CONTEXT.md` as real product terms get settled — use `grill-with-docs` to do this properly rather than guessing terms upfront.
- [ ] Fill in `Brand.md` and `DESIGN.md`, or replace each with `N/A — ...` if this project has no user-facing surface (see the comment in each file).
- [ ] Fill in `Architecture.md` once the stack and top-level layout are decided.

## 3. Stack Conventions

- [ ] Fill in `docs/agents/stack-conventions.md` with the actual language/framework rules for this project (see the ListItUp `docs/agents/nextjs-conventions.md` for the shape this should take: rendering model, data fetching, caching, security, version-upgrade notes).
- [ ] Rename the file if you want it to read stack-specific, e.g. `docs/agents/nextjs-conventions.md`, and update the `@docs/agents/stack-conventions.md` import in `AGENTS.md` to match.

## 4. CI & Tooling

- [ ] Run `corepack enable` (or your package manager's equivalent) and `npm install` / `pnpm install` at the root so `husky` installs its git hook.
- [ ] Fill in `.github/workflows/ci.yml` with real lint/typecheck/test/build steps for this project's stack, then remove the `workflow_dispatch`-only trigger comment so it runs on push/PR.
- [ ] Fill in `.github/workflows/codeql.yml` with the correct `language` matrix entry, then remove the `workflow_dispatch`-only trigger comment.
- [ ] Fill in `.github/dependabot.yml` with the correct `package-ecosystem` (e.g. `npm`, `pip`, `cargo`) and `directory`.
- [ ] Decide whether `.lintstagedrc` / `.prettierrc` need stack-specific tuning (e.g. a `plugins` array for a non-JS formatter, or per-language overrides).

## 5. Governance

- [ ] Update `CONTRIBUTING.md`'s "Development Setup" section with real prerequisites and steps.
- [ ] Update `SECURITY.md`'s contact/reporting instructions.
- [ ] Confirm `CODE_OF_CONDUCT.md`'s contact email.
- [ ] Decide if this project is actually going public. If not, it's fine to leave the governance files in place — they cost nothing sitting unused in a private repo.

## 6. Design-Engineer (only if this project has a UI)

- [ ] Leave `.design-engineer/` as-is; it fills in naturally the first time you run the `de-*` skill suite against a real feature.

## 7. Finish

- [ ] Remove the "Using This As A Template" section from `README.md`.
- [ ] Delete this file (`BOOTSTRAP.md`).
- [ ] Commit: `chore: bootstrap project from Starter-Pack template`.
