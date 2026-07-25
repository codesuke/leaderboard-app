# Architecture

Repo layout and where new code belongs for Leaderboard.

## File Structure

```text
/
├── CONTEXT.md
├── Brand.md
├── DESIGN.md
├── Architecture.md
├── AGENTS.md / CLAUDE.md
├── leaderboard/            # Next.js App Router app (the product)
│   ├── app/                # routes, layouts, pages — see nextjs-conventions.md
│   ├── public/              # static assets
│   ├── next.config.ts
│   └── package.json
└── docs/
    ├── ADR/
    ├── QnA/
    ├── Specs-Planned/
    ├── Specs-Completed/
    ├── Templates/
    └── agents/
```

The root `package.json` only holds repo-wide tooling (`husky`, `lint-staged`, `prettier`). The app's own dependencies, scripts, and lockfile live in `leaderboard/`.

## Import & Module Conventions

- Path alias `@/*` resolves to `leaderboard/*` (configured in `leaderboard/tsconfig.json`). Import app code via `@/...` rather than relative `../../` chains.
- No `src/` directory — routes and colocated code live directly under `leaderboard/app/`.
- See `docs/agents/nextjs-conventions.md` for the rendering model, data-fetching, and caching rules that govern how code inside `app/` is structured.

## Where New Code Belongs

- **A new route/page** → a folder under `leaderboard/app/`, e.g. `leaderboard/app/scores/page.tsx`.
- **Shared UI or logic used by only one route** → colocate it in a private folder next to that route, e.g. `leaderboard/app/scores/_components/`.
- **Shared UI or logic used across multiple routes** → a top-level folder under `leaderboard/app/` (e.g. `_components/`, `_lib/`) once a second consumer exists — don't pre-create it speculatively.
- **A new API endpoint** → a `route.ts` file under the relevant `leaderboard/app/**` segment.

## Data Layer

No database or ORM has been chosen yet. When one is added, record the decision as an ADR under `docs/ADR/` and update this section with the chosen tool and the rule for how schema changes are made.

`leaderboard/data/` holds Student data containing PII. `training_groups_July.csv` is the raw source export — git-ignored, never committed. `students.json` is a converted copy of it (via `leaderboard/scripts/csv-to-json.mjs`) that **is committed** so the deployed app has data to read — see [ADR 0002](docs/ADR/0002-static-csv-data-source.md) for why, and its consequences. Neither file may ever be moved into `public/` — that folder is served verbatim by Next.js. Read `data/` server-side only.
