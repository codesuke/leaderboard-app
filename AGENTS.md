# Agent Guide

This repo is intended to be built with AI agents, but the source of truth stays in the repository. Agents should read the docs first, make decisions explicit, and leave durable context behind when a decision changes the project.

## Auto-Loaded Context

Claude Code imports these automatically into every session in this repo (do not wrap the lines below in backticks or code fences — that disables the import):

@Architecture.md
@docs/agents/code-quality.md
@docs/agents/nextjs-conventions.md

## Working Rules

- Read `CONTEXT.md`, `Brand.md`, `DESIGN.md`, `Architecture.md`, and relevant files in `docs/` before planning work.
- Prefer small vertical slices that are demoable end to end.
- Use test-driven development for product behavior: one failing behavior test, minimal implementation, then refactor.
- Keep implementation details out of `CONTEXT.md`; it is a domain glossary, not a spec.
- Record meaningful architecture decisions in `docs/ADR/`.
- Put planned specs in `docs/Specs-Planned/` and move completed specs to `docs/Specs-Completed/` when shipped.
- Capture `grill-with-docs` sessions and their resolved answers in `docs/QnA/`.
- Avoid broad rewrites unless a spec or ADR explicitly calls for them.
- Follow `docs/agents/code-quality.md` for clean-code expectations and `docs/agents/nextjs-conventions.md` for Next.js-specific rules.

## Agent Skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default Matt Pocock skills triage vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo with root domain docs and ADRs in `docs/ADR/`. See `docs/agents/domain.md`.

### Code quality

Stack-agnostic clean-code baseline, plus Next.js-specific rules. See `docs/agents/code-quality.md` and `docs/agents/nextjs-conventions.md`.

## Preferred Skill Workflow

Use these workflows when the user asks for planning or implementation:

- `grill-with-docs`: Stress-test product ideas, clarify terms, store the session in `docs/QnA/`, update `CONTEXT.md`, and create ADRs only when decisions are meaningful and durable.
- `to-prd`: Convert a settled conversation or plan into a PRD. Publish the work item to GitHub Issues and keep a local copy in `docs/Specs-Planned/` when useful.
- `to-issues`: Break a PRD into thin vertical slices. Each issue should be independently grabbable and verify behavior end to end.
- `tdd`: Build slices with red-green-refactor. Tests should verify behavior through public interfaces, not implementation details.
- `smell`: Run against the target branch on any non-trivial `feature`, `refactor`, or `bugfix` change before opening a PR.

These skills are installed globally and are not part of this repo — this file only documents how to use them here.

## Definition Of Ready

A feature is ready for an agent when:

- The user problem is clear.
- The core domain terms are either already in `CONTEXT.md` or deliberately added there.
- Acceptance criteria describe observable behavior.
- Dependencies and out-of-scope items are explicit.
- The intended test seam is named.

## Definition Of Done

A change is done when:

- The requested behavior works.
- Relevant tests pass, or the reason they could not be run is stated.
- Docs are updated when product language, architecture, or workflow changes.
- New ADRs are added only for hard-to-reverse, non-obvious decisions with real trade-offs.
