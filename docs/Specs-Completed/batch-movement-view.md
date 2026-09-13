# Batch Movement View: Cohort-Level Old vs Current Batch Comparison

## Problem Statement

Issue #17 lets staff see one Student's Batch history at a time, in the Comparison dialog. There is no way to see the shift for the cohort as a whole — how many Students moved out of each Batch, how many moved into each Batch, where specifically they moved from and to, and whether any one Branch is progressing differently from the rest. Answering "how did the cohort shift between July and September?" today means manually cross-referencing the table, which does not scale past a handful of Students.

## Solution

A new, dedicated route presenting a cohort-level view of Batch movement, built directly on top of the `oldBatch` / `currentBatch` / `progress` data introduced in issue #17. It shows: a card per Batch tier comparing its July headcount to its September headcount; a full Old Batch × Current Batch movement matrix; a net movement summary (moved up / moved down / stayed); and the same three views filterable down to a single Branch.

## User Stories

1. As a staff member, I want a dedicated page separate from the main Student Table, so that cohort-level Batch movement doesn't clutter the per-Student leaderboard view.
2. As a staff member, I want to navigate to this page from the main Leaderboard page, so that I can find it without knowing its URL.
3. As a staff member, I want one card per Batch tier (S1, S2, T1...T13) showing its July headcount next to its September headcount, so that I can see at a glance which Batches grew and which shrank.
4. As a staff member, I want each Batch size card to show the numeric and directional delta (e.g. "+23" or "-8"), so that I don't have to do the subtraction myself.
5. As a staff member, I want a Batch that only exists in one snapshot (e.g. "T13," which is September-only) to still show a card, with the missing side's headcount shown as "N/A" or 0 with a clear label, so that the new tier isn't silently dropped from the view.
6. As a staff member, I want a movement matrix showing, for every Old Batch × Current Batch pair, how many Students made that specific move, so that I can see not just net change but where the movement actually came from and went to.
7. As a staff member, I want the movement matrix's diagonal (Old Batch === Current Batch) to be visually distinct from off-diagonal cells, so that "stayed" is easy to tell apart from "moved" at a glance.
8. As a staff member, I want an empty cell in the movement matrix (zero Students made that move) to be visually de-emphasized rather than shown as a bare "0", so that the matrix stays scannable at 14×14 (soon 14×13 with T13) size.
9. As a staff member, I want a net movement summary showing three counts — moved up, moved down, stayed — so that I get a one-glance read on overall cohort direction before drilling into the matrix.
10. As a staff member, I want Students who are one-sided (present in only one snapshot, per issue #17's data model) counted separately and shown as their own summary number, so that they don't get miscounted as "moved" or "stayed."
11. As a staff member, I want to filter the entire page (cards, matrix, and summary) down to a single Branch, so that I can check whether, say, CSE-DS is progressing differently from CS.
12. As a staff member, I want a "clear filter" affordance to return to the cohort-wide view after filtering by Branch, so that switching between Branches or back to "all" is quick.
13. As a staff member, I want the Branch filter's option list to come from the same Branches already known to the app (per the existing Branch filter on the main Leaderboard page), so that the two Branch pickers stay consistent.
14. As a staff member, I want this page to load with the same data the main Leaderboard page uses, so that the two pages never disagree about which Students are in which Batch.
15. As a developer, I want the cohort-aggregation logic to live in a pure, testable module independent of the page/component that renders it, so that batch-size, matrix, and summary calculations can be tested the same way the rest of this codebase's business logic is tested.

## Implementation Decisions

- **New route**: `app/batch-movement/page.tsx`, an async Server Component that loads Students the same way `app/page.tsx` does today (`loadStudentsFromDisk()` + `rankStudents()`), then renders a Client Component with the resulting Students.
- **New `_lib` module**: `app/_lib/batch-movement.ts`, holding pure functions that take `RankedStudent[]` (optionally pre-filtered by Branch) and return:
  - `computeBatchSizeComparison`: one entry per Batch in `BATCH_ORDER` (as extended by issue #17 to include `"T13"`), each with `oldCount`, `currentCount`, and `delta`. A Batch with zero Students on either side still appears, with that side's count as `0` and a flag (`oldUnavailable` / `currentUnavailable`) distinguishing "genuinely zero" from "this tier didn't exist in that snapshot" (relevant for T13 on the July side).
  - `computeMovementMatrix`: a flat list of `{ from: Batch; to: Batch; count: number }` for every Old Batch × Current Batch pair with `count > 0`, plus the full set of `from`/`to` Batch values needed to render an exhaustive grid (including zero-count pairs, which the UI renders de-emphasized per user story 8, rather than the data layer omitting them).
  - `computeNetMovementSummary`: `{ movedUp: number; movedDown: number; stayed: number; oneSided: number }`, derived from each Student's `progress.batchMovement.tiersMoved` (positive/negative/zero) introduced in issue #17, with one-sided Students (`oldBatch` or `currentBatch` is `null`) counted separately rather than folded into any of the three movement buckets.
  - A `filterByBranch(students, branch)` helper (or reuse of the existing `matchesSet`-style filtering already in `filtering.ts`) so the same three functions above run once for "all Branches" and once per selected Branch, rather than the aggregation logic knowing about Branch filtering itself.
- **UI — page layout**: three sections stacked vertically — Batch size cards (a responsive card grid, same visual pattern as the existing `StatCard`/`StatsOverview` cards), the movement matrix (a table/grid component, new), and the net movement summary (three large stat cards, same `StatCard` pattern). A Branch `<Select>` (reusing the existing shadcn `Select` component already used elsewhere in the app) sits above all three sections and drives all of them from one selected value.
- **Navigation**: the app currently has no shared nav between routes (`app/layout.tsx` renders only page content). This spec adds a minimal shared nav element (e.g. a small top bar with "Leaderboard" / "Batch Movement" links) in `app/layout.tsx` or a new `app/_components/site-nav.tsx` it renders, since this is the first second route the app has ever had.
- **Movement matrix rendering**: for a 14-Batch-tier cohort (soon 15 with T13), a full HTML table is preferred over a charting library grid — it's simpler, matches the existing `Table`/`TableRow`/`TableCell` components already used in `student-table.tsx` and `comparison-dialog.tsx`, and needs no new dependency.
- **Data dependency**: this feature has a hard dependency on issue #17 shipping first — it reads `oldBatch`, `currentBatch`, and `progress.batchMovement` directly from the `Student` shape #17 introduces. This spec does not duplicate or re-derive that merge logic.

## Testing Decisions

- Tests target the new `app/_lib/batch-movement.ts` pure functions, following the same pattern as `stats.test.ts` and `ranking.test.ts`: construct plain `Student`/`RankedStudent` arrays by hand (including edge cases below) and assert on the computed output, not on rendering.
- Cases to cover:
  - `computeBatchSizeComparison`: a Batch present in both snapshots with different counts; the September-only `"T13"` Batch (old side unavailable, not just zero); a Batch with zero Students on both sides.
  - `computeMovementMatrix`: a Student who stayed (diagonal entry); a Student who moved up; a Student who moved down; confirming a zero-count pair is either omitted or present-but-zero per the data-layer decision above, consistently.
  - `computeNetMovementSummary`: mixed up/down/stayed Students, plus at least one one-sided Student, asserting it lands in `oneSided` and not in any of the other three counts.
  - Branch filtering: the same three functions produce different, correctly-scoped results when given a Branch-filtered subset versus the full Student list.
- No component/DOM tests are introduced, consistent with the rest of this codebase (see issue #17's Testing Decisions for the same rationale).

## Out of Scope

- Any change to how Batch movement itself is computed (`progress.batchMovement`) — that logic belongs to issue #17; this spec only consumes it.
- Drilling from a movement-matrix cell down to the list of Students who made that specific move (e.g. clicking the "T3 → S1" cell to see names). This is a natural follow-up but adds a new interaction and a new data shape (Students grouped by move) not covered here.
- Supporting more than two snapshots in the matrix/cards (e.g. a three-way July → September → future-date view). Deferred alongside issue #17's same out-of-scope item on N-snapshot support.
- Any new shared app-wide navigation beyond the minimal two-link bar needed to reach this page (e.g. a full sidebar, breadcrumbs, or mobile nav pattern) — scoped to exactly what's needed to make this route reachable.

## Further Notes

- This is the app's first second route, so the "minimal shared nav" implementation decision above is a small but real precedent-setting change — worth a quick look during review even though it's a small piece of this spec.
- Depends on issue #17 (Old Batch / Current Batch columns + Comparison improvement stats) shipping first; this spec's data model is entirely inherited from it, not re-specified here.
