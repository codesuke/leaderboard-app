# PRD: Filter Bar UI/UX Redesign

## Problem Statement

Staff filtering the Leaderboard's 1,448 Students hit four problems with the current filter bar (`leaderboard/app/_components/filters-bar.tsx`):

- No feedback on which filters are currently active without visually scanning every control.
- On mobile, the filter panel renders ~1300px tall before any Student data is visible, and its toggle-group controls wrap into cramped, hard-to-tap rows.
- Attendance Status and Coding Grade render as full always-visible `ToggleGroup` rows while Batch and Branch render as compact dropdowns — the same filter bar uses two different visual weights for equivalent controls, with inconsistent row alignment (top-aligned vs. end-aligned).
- The Roll Number "from"/"to" filter does a lexical (alphabetical) string comparison on values that look numeric, with no indication of that to the person using it.

## Solution

Restructure the filter bar into three visual tiers, shared between desktop (always inline) and mobile (behind a bottom sheet):

1. **Active filter chips** — rendered only when at least one filter is set. One chip per active filter dimension (e.g. `Batch: S1, T2 ×`, `Score: 40–80 ×`), each removable independently, plus a trailing "Clear all." Derived by a new pure function, `describeActiveFilters`.
2. **Primary filters** — Batch, Branch, Attendance Status, Coding Grade, unified as the same `MultiSelectFilter` dropdown+badge control. Attendance Status and Coding Grade convert from `ToggleGroup` rows to this pattern for visual consistency with Batch/Branch.
3. **Refinements** — Score slider, Roll Number from/to (with a helper caption clarifying the range is alphanumeric, not numeric), Search, Provisional-only checkbox.

**Desktop** (`lg` and up): all three tiers render inline in the filter card, always expanded — no collapse toggle.

**Mobile** (below `lg`): the chips row (if any) plus a "Filters" trigger button showing an active-filter count badge. Tapping it opens a shadcn `Sheet` sliding up from the bottom containing tiers 2 and 3. The table is visible by default without opening the sheet.

Both breakpoints render the same `FilterControls` component for tiers 2–3 so there's one source of truth for the filter fields.

## User Stories

1. As a staff member filtering Students, I want to see which filters are currently active at a glance, so that I don't have to scan every control to remember my current view.
2. As a staff member removing a single filter, I want to click one chip, so that I don't have to reopen a dropdown or use the all-or-nothing Reset button.
3. As a staff member on a phone, I want the Student table visible without scrolling past a full-screen filter panel, so that I can browse results immediately.
4. As a staff member using the Roll Number range filter, I want to know it's an alphanumeric range, so that I don't expect numeric-range behavior it doesn't provide.

## Implementation Decisions

- Decision: Attendance Status and Coding Grade convert from `ToggleGroup` to `MultiSelectFilter`, matching Batch/Branch — no new component needed, just reuse.
- Decision: Chips are one per filter _dimension_ (not one per selected value) — removing a chip clears that whole dimension; individual values within a multi-select are still adjustable by reopening its dropdown.
- Decision: Mobile uses a shadcn `Sheet` (added via `pnpm dlx shadcn@latest add sheet`), not a full route or plain accordion — keeps the table the default view and avoids a navigation round-trip.
- Decision: `describeActiveFilters(filters: StudentFilters, branches: string[]): FilterChip[]` lives in `_lib/filtering.ts` next to `filterStudents`, returning `{ key, label }` per active dimension; the component layer maps `key` to an `onRemove` handler.
- Decision: No client-side media-query detection — desktop/mobile layout split is pure Tailwind (`hidden lg:flex` / `lg:hidden`), avoiding hydration-mismatch risk.

## Testing Decisions

- `describeActiveFilters` gets Vitest unit tests in `_lib/filtering.test.ts` (existing file, same pattern as `filterStudents`'s tests) — covers each filter dimension present/absent, label formatting, and the empty-filters case.
- No new component-level test infra (RTL/jsdom) is introduced for this slice — chip removal wiring, the `MultiSelectFilter` conversion, and the mobile `Sheet` are verified visually in-browser (`shot`) per this repo's UI-change rule, at both desktop and mobile viewports.
- `filterStudents` matching logic is unchanged — existing tests continue to cover it.

## Out Of Scope

- Item: Changes to `StudentFilters` shape or `filterStudents` matching semantics (including the Roll Number range's lexical comparison itself — only its label/caption changes).
- Item: URL or localStorage persistence of filter state.
- Item: A collapse/expand toggle for the desktop filter bar (stays always-expanded).
- Item: Component-level test infrastructure (RTL/jsdom) — a repo-wide tooling decision, not scoped to this change.

## Further Notes

- Note: Source conversation settled via one-question-at-a-time clarification (not a formal `docs/QnA/` grill session) — priorities were: visual hierarchy/polish, active-filter visibility, mobile usability, and Roll Number range clarity, all four in scope.
- Note: Follows the existing Linear-inspired dark design system already implemented in `globals.css` — no new color or type tokens needed.
