# Progress Check: Old Batch / Current Batch And Comparison Improvement Stats

## Problem Statement

The Leaderboard currently shows a single snapshot of Student data (the July cohort export). A second, later snapshot (the September re-assessment) now exists for the same Students, but the app has no way to show it. Staff comparing two Students today only see one point in time — they cannot see whether a Student's Batch changed, whether their Coding Grade improved, or how their coding assessment scores trended across the retest dates. There is no way to answer "is this Student improving?" from inside the app.

## Solution

Merge the July and September snapshots for each Student into the existing data shape, expose the two Batch placements side by side (Old Batch, Current Batch) as new Student Table columns, and extend the Comparison dialog with a set of improvement stats computed from the two snapshots: Batch movement, Coding Grade movement, a coding-score trend across the three graded coding assessments, and a raw score delta (clearly labeled as not like-for-like, since the two underlying scores are on different scales).

Ranking, sorting, and Batch filtering switch to Current Batch (the September placement) as the single source of truth for "Batch" going forward; Old Batch becomes read-only, display-only information.

## User Stories

1. As a staff member viewing the Student Table, I want to see each Student's Old Batch and Current Batch side by side, so that I can spot Batch movement without opening the Comparison dialog.
2. As a staff member, I want the Student Table's existing Batch column, sorting, and filters to reflect the Student's Current Batch, so that the leaderboard reflects where each Student stands today, not where they stood in July.
3. As a staff member, I want a Student whose Old Batch and Current Batch differ to be visually distinguishable in the table, so that I can scan for movement at a glance.
4. As a staff member, I want to still filter and sort by Batch the way I do today, so that adding Old Batch does not change my existing workflow.
5. As a staff member comparing 2–5 Students, I want to see each Student's Batch movement (e.g. "T3 → S1"), so that I can tell who moved up, down, or stayed.
6. As a staff member comparing Students, I want to see each Student's Coding Grade movement (e.g. "Proficient → Expert"), so that I can see skill-tier progress independent of Batch.
7. As a staff member comparing Students, I want to see a small trend of each Student's coding assessment scores across 17 Aug, 18 Aug, and 3 Sep, so that I can see whether their coding performance is trending up or down across retests.
8. As a staff member comparing Students, I want to see the raw score delta between the July Score and the September Final Score, clearly labeled as not directly comparable, so that I still have the number available without being misled into treating it as a clean improvement percentage.
9. As a staff member, I want a Student who is missing one side of the data (present in only one of the two snapshots) to still appear in the app, with the missing side shown as unavailable, so that a single incomplete row doesn't hide a whole Student.
10. As a staff member, I want Provisional status tracked separately for July and September, so that a Student who was Provisional in July but resolved by September (or vice versa) is represented accurately in each Batch.
11. As a staff member filtering by "Provisional only," I want that filter to reflect current (September) Provisional status, consistent with Current Batch being the ranking source of truth.
12. As a staff member, I want the overview stats (total count, average score, Batch count) to reflect Current Batch data, so that the summary numbers match the table and filters below them.
13. As a developer maintaining this app, I want the July+September merge to happen at data-build time (like the existing CSV→JSON conversion), not at request time, so that the deployed app keeps reading a single static JSON file with no new runtime data-fetching.
14. As a developer, I want the new Batch value introduced by the September cohort (T13) to be a first-class Batch, ranked appropriately, so that Students placed in it show up correctly instead of being dropped or crashing the ranking logic.

## Implementation Decisions

- **Ranking basis**: `batch` (and everywhere it's consumed today — `ranking.ts`, `filtering.ts`, `stats.ts`, sort/filter UI) keeps its current meaning but is repointed to mean the **Current Batch** (September `Updated Training Group`). No structural changes needed in those modules. A new field, `oldBatch`, carries the July `Training Group` for display only; nothing in ranking/filtering/stats reads it.
- **Score field**: `score` is repointed the same way — it becomes the Current (September) `Final Score (AS)`, used as today's in-batch tiebreaker. A new field, `oldScore`, carries the July `Final Score[100]`. These two scores are on different scales (July: 0–100; September: an unbounded cumulative value per NIET's own formula, `AS = Previous Final Score + Coding Score (AQ) + Offline Score (AP) + 0.5 × PPE Attendance %`) — this is why they are two separate fields, not one field overwritten.
- **Provisional**: `provisional` is repointed to mean **current** provisional status (derived from the September Batch's `_Temp` suffix, same parsing rule as today). A new field, `oldProvisional`, carries the July-derived value.
- **`Batch` type / `BATCH_ORDER`**: extended to include `"T13"`, appended after `"T12"`. This is a new tier that only appears in the September data (`EM-T13`) and must rank last.
- **New `Student` fields**: `oldBatch: Batch`, `oldProvisional: boolean`, `oldScore: number`, plus a `progress` object holding the improvement stats:
  - `progress.batchMovement`: `{ from: Batch; to: Batch; tiersMoved: number }` — `tiersMoved` computed from each Batch's index in `BATCH_ORDER`; positive means moved up (toward S1), negative means moved down.
  - `progress.codingGradeMovement`: `{ from: CodingGrade; to: CodingGrade }`.
  - `progress.codingScoreTrend`: an ordered array of `{ date: string; score: number | null }` for the three graded coding assessments (17 Aug, 18 Aug, 3 Sep); `null` where the source data has no value for that date, rather than 0, so it renders as "no data" and not as a real zero score.
  - `progress.rawScoreDelta`: `number` (`oldScore` will always be present; September-side value may be null if the Student is one-sided — see below), computed as `score - oldScore`, always rendered in the UI next to a "not like-for-like" note.
- **One-sided Students**: a Roll Number present in only one snapshot still produces a `Student` row. Whichever side is missing gets `null` for that side's Batch/score/provisional fields and for every `progress` field; the UI renders these as "Not available" rather than 0/blank, matching the existing pattern of nullable fields already present in the September assessment columns (e.g. missing Offline Assessment data).
- **Branch label mismatch**: the July source uses `"SE-Cyber Securi"` (a truncated PDF cell, corrected to `"SE-Cyber Security"`) and the September source uses the short code `"SE-CYS"` for the same Branch. The data-build step canonicalizes both to `"SE-Cyber Security"` (the fuller existing label, to avoid changing already-displayed Branch strings for the July-only view).
- **Data source shape**: extend `scripts/csv-to-json.mjs` (or a new `scripts/merge-snapshots.mjs`, decided during implementation) to read both `data/training_groups_July.csv` and a new `data/training_groups_September.csv` (git-ignored raw export, same handling as the existing CSV per ADR 0002), join them by Roll Number, and write the enriched rows into the single committed `data/students.json`. No second JSON file, no database — this stays inside ADR 0002's static-file model, extended to two source CSVs instead of one.
- **`app/_lib/students.ts` changes**: `parseStudentRow` reads both snapshots' raw fields and produces the extended `Student` shape described above; `RawCsvRow` becomes two shapes (`RawJulyRow`, `RawSeptemberRow`) merged before parsing, or one flattened row shape produced by the build script — final field-naming decided during implementation, but the merge/computation logic belongs in `students.ts` (or a sibling `_lib` module it delegates to), not in any component.
- **UI — Student Table** (`student-table.tsx`): add two columns, "Old Batch" and "Current Batch" (the existing "Batch" column is renamed "Current Batch" and reuses the existing `batch` field — no behavior change). A Student whose `oldBatch !== currentBatch` gets a visual indicator (e.g. a small up/down icon or colored badge) next to Current Batch.
- **UI — Comparison dialog** (`comparison-dialog.tsx`): add four new `ComparisonRow`s — Batch Movement, Coding Grade Movement, Raw Score Delta (with a visible "not like-for-like" caption) — plus a small coding-score trend visualization (sparkline or 3-point line, reusing the existing `recharts`/`ChartContainer` setup already used for the test-score radar chart) across 17 Aug / 18 Aug / 3 Sep.
- **CONTEXT.md**: add new glossary entries for **Old Batch**, **Current Batch**, and **Coding Score Trend** before/while implementing, since these are new domain terms this feature introduces. Existing **Batch** entry gets a note that it now specifically means Current Batch.

## Testing Decisions

- Tests target the pure `_lib` functions, not the UI components — matching every existing test file in this codebase (`students.test.ts`, `ranking.test.ts`, `stats.test.ts`, `filtering.test.ts`, `sorting.test.ts`), which all construct plain `Student`/`RankedStudent` objects and assert on pure-function output. No component/DOM tests exist today and this feature does not introduce the first one.
- New/extended coverage needed:
  - The merge function that joins a July row and a September row into one enriched `Student`, including the one-sided case (present in only one snapshot).
  - `progress.batchMovement` computation, including a same-Batch case (`tiersMoved: 0`) and the new `"T13"` tier.
  - `progress.codingGradeMovement` computation.
  - `progress.codingScoreTrend`, including a Student missing one or more of the three dates (asserts `null`, not `0`).
  - `progress.rawScoreDelta` arithmetic.
  - `ranking.ts` and `filtering.ts` need no new tests for logic changes (they don't change), but their existing tests should be re-run against the extended `Student` shape to confirm nothing broke by the new fields being present.
- Good tests here assert on the computed values only (e.g. "a Student who was T3 in July and S1 in September has `batchMovement.tiersMoved === 2`"), not on internal implementation details of how the merge is performed.

## Out of Scope

- Reconciling the one Roll Number mismatch between the two real source exports (the same Student, "SHIVAM," appears as `0251DCSML312` in July and `2501331539015` in September). This is a data-entry correction to make before running the merge script for real cohort data, not a code change — the merge logic simply needs to handle one-sided Students correctly (which it does, per Implementation Decisions).
- Supporting a third or later snapshot (e.g. an October re-assessment). This spec locks in a two-snapshot join; extending to N snapshots is the long-form "one row per assessment" model discussed separately, deferred to a future spec.
- A toggle to let staff choose Old-Batch-based ranking instead of Current-Batch-based ranking. Current Batch is the single ranking source of truth for this spec.
- Any change to how Score/Batch is computed upstream (i.e., this app does not recompute NIET's `Final Score (AS)` formula; it only displays the value already present in the source export).
- An upload flow for future snapshots. Getting new snapshot data into the app still means replacing the CSV(s), re-running the build script, committing the regenerated `students.json`, and redeploying, per ADR 0002.

## Further Notes

- This spec extends, rather than replaces, ADR 0002's static-JSON model. It does not require a new ADR on its own, since the "static file, no database" decision still holds — only the number of source CSVs feeding the build script changes from one to two. If a third snapshot is requested later, that is the trigger ADR 0002 already names for revisiting the decision.
- The July and September PDFs this data comes from were manually parsed into two CSVs (`Training_Groups_27-July-2026.csv`, `Training_Groups_14-Sep-2026.csv`) in a separate conversation; those files, or a re-export in the same shape, are the expected input to `data/training_groups_September.csv` for this feature.
