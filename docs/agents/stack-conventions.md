# Stack Conventions

This file is empty by design. Fill it in once this project's language and framework are chosen — see `BOOTSTRAP.md` step 3.

## What Belongs Here

Version-accurate, curated rules for the actual stack in use: rendering/execution model, data-fetching and mutation patterns, caching, security boundaries specific to the framework, bundling/asset rules, and a "version watch" section noting what breaks on the next major upgrade.

For a worked example of the shape and depth this should reach, see [ListItUp's `docs/agents/nextjs-conventions.md`](https://github.com/VirtuNode-dev/ListItUp/blob/main/docs/agents/nextjs-conventions.md) — a curated, version-pinned subset of the relevant framework skills, not a restatement of the framework's own docs.

## Suggested Structure

```md
# {Framework} Conventions

Rules for `{stack}` version `{X.Y}`. This is a curated subset of `{relevant skill(s)}`; consult those directly for anything not covered here, and re-check this doc when bumping major versions.

## {Rendering / Execution Model}

## {Data Fetching & Mutations}

## {Caching, if applicable}

## Security

## Version Watch

Things that will bite on the next major upgrade.
```

Once filled in, consider renaming this file to something stack-specific (e.g. `nextjs-conventions.md`, `django-conventions.md`) and updating the `@docs/agents/stack-conventions.md` import in `AGENTS.md` and the reference in `docs/agents/code-quality.md` to match.
