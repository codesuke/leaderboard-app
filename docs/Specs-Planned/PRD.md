# PRD: Leaderboard

## Problem Statement

A training-program coordinator has a spreadsheet of 1,448 Students, each already placed into a Batch (S1, S2, T1–T12) and scored, but no way to browse, filter, or compare them without opening the raw CSV and scrolling or writing formulas. Finding a specific Student, seeing how their Branch peers stack up, or lining a handful of Students up side by side to compare their test-by-test performance is slow and manual.

## Solution

A read-only Leaderboard page lists every Student ordered by Batch (S1 → S2 → T1 → ... → T12) and then by Score within each Batch — mirroring the order the source data already implies. Each Student shows their Rank (both within their Batch and overall). Coordinators can filter the list by Batch, Branch, Attendance Status, and Coding Grade (multi-select each), narrow by a Score range, or search by name/Roll Number — filters combine. Students missing a written score are shown inline in their Batch, flagged as Provisional, and can be isolated with a dedicated filter. Selecting up to 5 Students opens a comparison view showing their full row of data side by side.

## User Stories

1. As a coordinator, I want to see every Student listed in Batch order (S1 → S2 → T1–T12), so that the view matches how the program is actually organized.
2. As a coordinator, I want Students within a Batch ordered by Score (highest first), so that I can immediately see who's leading each Batch.
3. As a coordinator, I want to see each Student's Rank within their Batch, so that I know exactly where they stand among their peers.
4. As a coordinator, I want to see each Student's overall Rank across all Batches, so that I can gauge their standing program-wide.
5. As a coordinator, I want to filter the list to one or more Batches, so that I can focus on a specific cohort.
6. As a coordinator, I want to filter the list to one or more Branches, so that I can see how a specific field of study is performing.
7. As a coordinator, I want to filter by Attendance Status, so that I can find Students rated Poor or Very Poor and follow up.
8. As a coordinator, I want to filter by Coding Grade, so that I can find Students at a specific proficiency tier.
9. As a coordinator, I want to filter by a Score range, so that I can isolate Students scoring within a specific band.
10. As a coordinator, I want to search by name or Roll Number, so that I can jump straight to a specific Student.
11. As a coordinator, I want to combine multiple filters and a search at once, so that I can narrow down to exactly the group I care about (e.g. "CSE-DS Branch, T3–T5, Poor Attendance Status").
12. As a coordinator, I want a clear indication when a Student is Provisional, so that I know their Score is incomplete rather than assuming it's final.
13. As a coordinator, I want to filter to show only Provisional Students, so that I can chase down whoever is still missing a written score.
14. As a coordinator, I want to reset all filters back to the full list, so that I'm not stuck in a narrowed view.
15. As a coordinator, I want to see a clear empty state when my filters match no Students, so that I know the result is "none," not a broken page.
16. As a coordinator, I want to select up to 5 Students to compare, so that I can line up specific individuals against each other.
17. As a coordinator, I want the comparison view to show every field on the Student's row (all test scores, Attendance Status, Assessment Attendance, Coding Grade — not just Score), so that I can see *why* one Student outscored another.
18. As a coordinator, I want to be stopped (not silently overridden) if I try to select a 6th Student for comparison, so that I understand the 5-Student cap rather than being confused by a swap.
19. As a coordinator, I want to remove a Student from an active comparison, so that I can adjust the group without starting over.
20. As a coordinator, I want to click a table column header to sort the list by that column, so that I can inspect the data along dimensions other than the default Batch-then-Score order.
21. As a coordinator, I want to filter by a Roll Number range, so that I can isolate a specific block of enrollment numbers.
22. As a coordinator, I want to see summary KPIs (total Students, average Score, Provisional count, Batch count) at a glance, so that I don't have to derive them myself from the table.
23. As a coordinator, I want a chart of how many Students landed in each Batch, so that I can see the cohort's shape without counting rows.
24. As a coordinator, I want the comparison view to include a chart plotting selected Students across their score dimensions, so that differences are visible at a glance, not just readable in a table.

## Implementation Decisions

- **Data loading**: a server-side data module (e.g. `leaderboard/app/_lib/students.ts`) reads and parses `leaderboard/data/training_groups_July.csv` once per request/build. No database — see [ADR 0002](../ADR/0002-static-csv-data-source.md).
- **Batch normalization**: the raw `Training_Group` column (e.g. `EM-T12_Temp`) is parsed into a canonical `Batch` (`T12`) plus a `provisional: boolean` flag (true when the source value ends in `_Temp`). The `EM-` prefix is dropped entirely — it's a program-code artifact, not part of the Batch concept.
- **Batch ordering**: an explicit ordered list (`S1, S2, T1, T2, ..., T12`) drives both the primary sort and Batch-filter validation — never derived from string/alphabetical sort, which would misorder `T1` before `T10`/`T11`/`T12`.
- **Coding Grade ordering**: an explicit rank map (`Beginner < Novice < Learner < Proficient < Expert`) drives sorting/filtering of this field — never alphabetical.
- **Rank computation**: after sorting by Batch then Score, each Student gets a `rankInBatch` (1-based position within their Batch) and `rankOverall` (1-based position across the full sorted list).
- **Filtering**: Batch, Branch, Attendance Status, and Coding Grade are multi-select (a Student matches if their value is in the selected set, or if the set is empty). Score range is an inclusive min/max. Name/Roll Number search is a case-insensitive substring match against both fields. All filters, the search, and the Provisional-only toggle combine with AND semantics.
- **Rendering strategy**: the page is a Server Component that loads and ranks the full Student list server-side; filtering/search/comparison-selection are client-side interactions over that already-loaded, already-ranked list (no server round-trip per filter change).
- **List size handling**: with 1,448 rows, the table is paginated (client-side, e.g. 50 Students per page) rather than rendered in full or virtualized — simplest option that keeps the DOM small; revisit if UX testing shows pagination is the wrong call for this use case.
- **Comparison selection**: client-side selection state capped at 5 Students; attempting to add a 6th is rejected with a visible message rather than evicting an existing selection.
- **Column sorting**: a pure comparator-selection function maps a column key + direction to a sort, independent of the default Batch-then-Score ranking (which still drives `rankInBatch`/`rankOverall` regardless of the active column sort — sorting the view doesn't recompute Rank).
- **UI components**: shadcn/ui (installed into `leaderboard/`) supplies Table, Card, Badge, Select, Slider, and Dialog primitives; charts render via shadcn's Chart wrapper (Recharts). DESIGN.md's tokens (canvas/surface/ink/hairline/primary) are wired as CSS variables in `globals.css` and consumed as shadcn's semantic color slots rather than raw hex values in components.
- **Stats/chart data**: pure functions compute overview KPIs and per-Batch counts from the already-loaded Student list — no separate data fetch.

## Testing Decisions

- Introduce Vitest as the project's test runner (none exists yet — see `docs/agents/nextjs-conventions.md`'s Version Watch note). This PRD is what adds it.
- Test only the pure data-layer functions: CSV parsing (raw rows → typed Students, including Batch normalization and Provisional derivation), ranking (Batch+Score ordering, `rankInBatch`/`rankOverall` assignment), filtering (each dimension individually, combined, the Provisional-only toggle, and the empty-result case), and pagination.
- Tests exercise these functions through their public input/output signature (e.g. "given these raw rows, ranked/filtered output is X") — not internal helpers — using small hand-built fixture datasets, not the full 1,448-row CSV, so tests stay fast and deterministic.
- No component-level or end-to-end tests in this PRD. Filter/search/comparison *interactions* (the UI layer) are not automated yet — see Out of Scope.
- No prior test patterns exist in this repo yet; this PRD establishes the first ones.

## Out Of Scope

- The algorithm that sorts Students into Batches in the first place — the source data already does this; the Leaderboard only displays the result (settled in [docs/QnA/0002](../QnA/0002-leaderboard-scope-and-terminology.md)).
- CSV upload UI, multiple cohorts/history, and any database — see [ADR 0002](../ADR/0002-static-csv-data-source.md). A new cohort means manually replacing the file and redeploying.
- Authentication/access control on the Leaderboard page.
- Component-level or end-to-end automated tests for the filter/search/comparison/sort/chart UI — only the underlying data-layer logic (filtering, sorting, stats, chart data) is tested in this PRD.
- Editing or correcting Student data — the Leaderboard is read-only.

## Further Notes

- Domain vocabulary (Student, Batch, Branch, Score, Rank, Provisional, Attendance Status, Assessment Attendance, Coding Grade) is defined in `CONTEXT.md`; use those exact terms in code, tests, and UI copy.
- `training_groups_July.csv` contains real student PII (names, university roll numbers, grades) and lives in `leaderboard/data/` (git-ignored) rather than `leaderboard/public/` specifically so it is never web-served as a static file — keep any new data files out of `public/` too.
- Pagination page size (50) and the exact comparison-cap rejection UX (toast vs. inline message) are implementation details worth a quick sanity check once there's something to look at, not blocking decisions for this PRD.
