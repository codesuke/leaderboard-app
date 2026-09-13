# Filters & Drill-Down Expansion

## Problem Statement

Issues #17 and #18 add Old Batch / Current Batch tracking per Student and a cohort-level movement matrix, but neither lets staff actually work with that data beyond looking at it. Staff cannot ask "who was in T3 in July, and where did they end up?" without manually cross-referencing two columns. Staff also cannot see, filter, or act on several pieces of real September data that already exist in the source export but are surfaced nowhere in the app today: the "Suspicious"/"Mobile Phone" remarks on coding assessments, PPE Attendance %, and whether a Student even attempted the offline round. And once staff do build a useful filter combination, there is no way to save, share, or export it — every session starts from a blank filter state.

## Solution

A set of filtering, drill-down, and workflow additions layered on top of #17 and #18: an Old Batch filter and a movement-direction/Coding-Grade-movement filter on the Student Table; click-a-cell drill-down on the #18 movement matrix; new filters for assessment flags, PPE Attendance %, and offline-round participation; a standing quick-filter for flagged Students; a per-row trend sparkline; CSV export of the current filtered view; and filter state that round-trips through the URL so it can be bookmarked or shared.

## User Stories

**Old Batch & movement filtering (Student Table)**

1. As a staff member, I want to filter the Student Table by Old Batch, so that I can see "everyone who was in T3 in July," with each row's existing Current Batch column showing where they are now.
2. As a staff member, I want to combine an Old Batch filter with the existing Current Batch filter, so that I can ask precise questions like "who was in T3 and is now in S1."
3. As a staff member, I want to filter by movement direction (moved up / moved down / stayed / one-sided), so that I can pull up everyone who regressed, or everyone whose placement is still unresolved.
4. As a staff member, I want to filter by Coding Grade movement (improved / regressed / same), so that I can find Students whose coding tier changed independent of Batch.

**Assessment-flag, attendance, and offline-round filtering**

5. As a staff member, I want to filter by whether a Student was flagged Suspicious or Mobile Phone on either coding assessment, so that I can follow up on integrity concerns that currently exist only inside the raw PDF.
6. As a staff member, I want to filter by PPE Attendance % range, so that I can find Students with poor August attendance separately from the existing Assessment Attendance count filter (a different metric, from a different month).
7. As a staff member, I want to filter by whether a Student attempted the offline VS Code round at all, so that I can find Students who skipped it entirely, not just those who scored poorly on it.
8. As a staff member, I want a Batch tier range filter (e.g. "S1 through S2 only"), so that I can quickly scope to the top or bottom of the cohort without multi-selecting every tier by hand.

**Movement matrix drill-down (extends #18)**

9. As a staff member viewing the #18 movement matrix, I want to click a specific Old Batch → Current Batch cell, so that I can see the exact list of Students who made that move.
10. As a staff member, I want the drill-down list to show the same core columns as the main Student Table (Name, Roll Number, Branch, Score), so that it's immediately useful without re-deriving context.
11. As a staff member, I want to close the drill-down and click a different cell without leaving the Batch Movement page, so that I can explore several moves in one sitting.
12. As a staff member, I want a cell with zero Students to be non-interactive (no drill-down opens), so that I don't click into an empty result.

**Flagged Students, trend visibility, export, and shareable state**

13. As a staff member, I want a one-click "Flagged Students" quick filter, so that I can see, in one action, everyone with an assessment flag or a regressed Coding Grade, without manually building that filter combination each time.
14. As a staff member, I want a small trend sparkline directly in each Student Table row (not just inside the Comparison dialog), so that I get a glance-able signal across many Students at once.
15. As a staff member, I want to export the currently filtered (and sorted) Student list to CSV, so that I can take a specific slice of the data outside the app.
16. As a staff member, I want the exported CSV to reflect exactly the filters and sort currently applied, not the full unfiltered dataset, so that the export matches what I'm looking at on screen.
17. As a staff member, I want my current filter selection reflected in the page URL, so that I can bookmark it or send the link to a colleague and have them see the same filtered view.
18. As a staff member, I want to load a URL with filter parameters in it and see the Student Table pre-filtered accordingly, so that shared links actually work, not just look like they should.
19. As a developer, I want every new filter predicate to be a pure, independently testable function added to the existing filtering module, so that this large a feature doesn't require a new testing pattern.

## Implementation Decisions

- **Student shape extensions (beyond what #17 already specifies)**: this spec adds three fields to the `Student` shape that #17 does not yet include, since they come from September source columns no prior spec models: `assessmentFlags: string[]` (parsed from the "Remark (17-Aug-26)" / "Remark (18-Aug-26)" source columns — values like "Suspicious," "Mobile Phone," or both combined, split into a flat list of flags per Student), `currentPpeAttendance: number | null` (the September PPE Attendance % column), and `offlineProblem1Attempted: boolean | null` (the September "Problem-1" Yes/No column, `null` for one-sided/missing Students). These are additive to #17's shape, not a redesign of it.
- **`StudentFilters` extensions** (`app/_lib/filtering.ts`): `oldBatches?: Batch[]` (symmetric to the existing `batches`, matched against `student.oldBatch`), `movementDirection?: "up" | "down" | "stayed" | "oneSided"` (derived from `progress.batchMovement.tiersMoved`'s sign, or the one-sided case where either Batch is `null`), `codingGradeMovement?: "improved" | "regressed" | "same"` (derived by comparing the ordinal rank of `progress.codingGradeMovement.from`/`.to` against the existing Beginner < Novice < Learner < Proficient < Expert ordering), `flaggedOnly?: boolean` (`assessmentFlags.length > 0`), `ppeAttendanceMin?: number` / `ppeAttendanceMax?: number`, `offlineAttempted?: boolean`, and `batchTierMin?: Batch` / `batchTierMax?: Batch` (matched via each Batch's index in the existing `BATCH_ORDER`, same range-matching approach already used for `scoreMin`/`scoreMax`). Each new filter gets a corresponding `FilterChip`/`describeActiveFilters`/`removeFilterChip` case, following the existing pattern exactly.
- **"Flagged Students" quick filter**: implemented as a single toggle button in the filters bar (not a new dedicated route, unlike #18's Batch Movement view) that sets `flaggedOnly: true` OR `codingGradeMovement: "regressed"` as a combined preset. Chosen over a separate page because it's a filter shortcut, not a new dataset or visualization — the existing Student Table already renders the result.
- **Movement matrix drill-down** (extends #18's `app/batch-movement/`): a new pure function, `getStudentsForMove(students, from, to)`, returns the Students whose `oldBatch === from && currentBatch === to`. The matrix UI opens a Dialog (reusing the existing `Dialog` primitives already used by `ComparisonDialog`) showing those Students in a compact table (Name, Roll Number, Branch, Score). A cell with `count === 0` renders without a click handler.
- **Row-level sparkline**: a new small presentational component reusing the existing `recharts`/`ChartContainer` setup, rendered inside a new `StudentTable` cell, fed by each Student's `progress.codingScoreTrend` (from #17). No new data is computed for this — it's a new rendering of an existing field.
- **CSV export**: a pure function, `studentsToCsv(students: Student[]): string`, hand-rolled the same way the existing CSV reader in `app/_lib/students.ts` is hand-rolled (no new dependency). Triggered client-side from the currently `displayed` (filtered + sorted) list in `leaderboard-app.tsx`, downloaded via a Blob/anchor click, matching the values already shown in the table rather than re-fetching or re-deriving anything.
- **Shareable filter state**: `StudentFilters` is encoded to and decoded from the URL's query string using Next.js's `useSearchParams`/`router.replace` (`next/navigation`), via two new pure functions, `encodeFiltersToSearchParams(filters)` and `decodeFiltersFromSearchParams(searchParams)`. `leaderboard-app.tsx`'s filter state is initialized from the decoded URL on mount and kept in sync on every filter change, so the URL is always a valid, reload-safe representation of the current view.
- **Dependency chain**: the Old Batch, movement-direction, Coding-Grade-movement, flag, PPE-attendance, and offline-attempted filters all depend on Student fields from #17 (plus this spec's three additive fields above). The matrix drill-down additionally depends on #18's movement matrix UI existing to click on. The sparkline, CSV export, and URL state pieces depend only on the existing Student Table/filter infrastructure and can ship independently of #17/#18 if sequencing requires it.

## Testing Decisions

- Every new filter predicate is tested the same way `filtering.test.ts` already tests `filterStudents` today: construct a small hand-built `Student[]` covering the relevant edge case (e.g. a Student with no `assessmentFlags`, a one-sided Student for `movementDirection`, a Student exactly at a `batchTierMin`/`batchTierMax` boundary) and assert on the filtered result.
- `getStudentsForMove` is tested with the same pattern used in #18's `batch-movement.test.ts`: hand-built Students covering a real move, the diagonal (stayed) case, and the zero-result case.
- `studentsToCsv` is tested by asserting on the exact string output for a small, known `Student[]` input — including a case with a comma or quote in a field (Student names in the source data are plain, but the test should not assume that holds forever), following the same "assert on output, not on implementation" standard as the rest of the suite.
- `encodeFiltersToSearchParams` / `decodeFiltersFromSearchParams` are tested as a round-trip pair: encode a `StudentFilters` object, decode it back, and assert the result equals the original — plus a case decoding a hand-written query string, so malformed/partial URLs (e.g. a colleague editing the link by hand) are covered.
- No new component/DOM tests are introduced; the sparkline and drill-down dialog are thin renderings of already-tested data, consistent with #17 and #18's same testing rationale.

## Out of Scope

- Persisting filter presets server-side or per-user (e.g. a saved-views list). This spec's "shareable state" is URL-only — copy/paste or bookmark, nothing stored.
- Any change to how `assessmentFlags` values are combined or interpreted beyond a flat list (e.g. no distinct handling for "Suspicious+Mobile Phone" versus the two flags separately) — the flag filter matches on presence, not on which specific combination occurred.
- CSV export of anything other than the currently visible Student Table columns plus the new fields this spec adds — not a full raw-data dump of every field in `students.json`.
- Editing or correcting the underlying assessment-flag/PPE-attendance/offline-attempted source data. This spec only surfaces what's already in the September export.
- A dedicated "Flagged Students" page/route. This spec ships it as a quick-filter toggle on the existing Student Table, not a new page like #18's.

## Further Notes

- This spec bundles a large number of independent-ish pieces into one issue at the user's explicit request. For implementation, the natural internal slicing (even within one issue) is: (1) Old Batch + movement-direction + Coding-Grade-movement filters, since they only need #17's fields; (2) the three new Student fields (`assessmentFlags`, `currentPpeAttendance`, `offlineProblem1Attempted`) plus their filters and the Flagged Students quick filter; (3) the matrix drill-down, once #18 exists to drill into; (4) the sparkline, CSV export, and URL state, which are the most independent of the three groups and could ship first or last without affecting the others.
- Depends on #17 (Old Batch / Current Batch + Comparison improvement stats) for the base Student shape, and on #18 (Batch Movement View) for the matrix UI the drill-down attaches to.
