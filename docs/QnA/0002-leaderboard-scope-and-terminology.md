# Grill Session: Leaderboard Scope And Terminology

## Context

Designing the Leaderboard feature: a way to view, filter, and compare Students using the data already sitting in `leaderboard/data/training_groups_July.csv` (1,448 rows — Batch, Branch, Score, and test-level detail per Student, already sorted into S1/S2/T1-T12 by an upstream process).

## Questions

### 1. Should the app own the logic that sorts Students into Batches, or just display an already-decided assignment?

**Recommended answer**:

Read-only display. The CSV already shows Batches ranked by average Score (confirmed by computing per-Batch averages: S1 81.6 > S2 63.1 > T1 55.2 > ... > T12 14.0), so re-deriving the sorting rule is a separate, riskier feature with no signal it's actually needed yet.

**User answer**:

Read-only display with advanced filters — nothing else.

**Settled outcome**:

The Leaderboard is a read-only view with filtering; no batch-assignment engine.

### 2. What determines the leaderboard's sort order?

**Recommended answer**:

Primary sort by Score (`Final_Score_100`) as the single ranking metric, individual test columns shown as detail only.

**User answer**:

Primarily sort by Batch (S1 > S2 > T1 > ... > T12).

**Settled outcome**:

Primary sort: Batch, in rank order. Secondary sort: Score, descending, within each Batch. This matches the CSV's existing row order.

### 3. How should `_Temp` Batch variants (e.g. `EM-T12_Temp`, 39 Students total) be handled?

**Recommended answer**:

Fold into the parent Batch but flag with a badge, since these look like students placed before their written test was scored (all have `Written_Score_20 == 0`), and 30 of the 39 are a real cohort size, not a rounding error worth hiding.

**User answer**:

Option 3 (fold + badge) confirmed.

**Settled outcome**:

A Student is **Provisional** when their source Batch ends in `_Temp`. Provisional Students are shown within their parent Batch, flagged, not listed as a separate Batch.

### 4. Canonical term: "Batch" or "Training Group"?

**Recommended answer**:

Batch — matches the language the user reached for throughout, shorter and more leaderboard-native than "Training Group."

**User answer**:

Either is fine, pick what's convenient.

**Settled outcome**:

**Batch** is canonical; **Training Group** goes under `_Avoid_` in `CONTEXT.md`.

### 5. Canonical term: "Branch" or "Department"?

**Recommended answer**:

Branch — matches the CSV column and the actual concept (academic field of study), "Department" would misleadingly imply an org-chart structure.

**User answer**:

Branch.

**Settled outcome**:

**Branch** is canonical; **Department** goes under `_Avoid_`.

### 6. What should the Very Sincere/Sincere/Poor/Very Poor rating be called?

**Recommended answer**:

Sincerity Rating.

**User answer**:

Attendance Status.

**Settled outcome**:

**Attendance Status** is canonical. Later clarified (Q9) that this is unrelated to Assessment Attendance — the two are independent data points, not one derived from the other.

### 7. Should `Coding_Grade` be treated as an ordered scale or a flat label?

**Recommended answer**:

Ordered scale — alphabetical display would misrepresent progress (e.g. "Beginner, Expert, Learner..." reads nonsensically).

**User answer**:

Use this (the ordered scale).

**Settled outcome**:

**Coding Grade** is a ranked scale: Beginner < Novice < Learner < Proficient < Expert.

### 8. What should student comparison show?

**Recommended answer**:

Full row breakdown (all test scores, not just final Score), since the point of comparing specific Students is usually to see *why* one outscored another.

**User answer**:

Yes, full breakdown.

**Settled outcome**:

Comparison shows every field on the Student's row, not just Batch/Score/Rank.

### 9. How many Students can be compared at once?

**Recommended answer**:

An arbitrary number up to a small cap (4-6), not locked to exactly 2.

**User answer**:

Up to 5.

**Settled outcome**:

Comparison supports up to **5** Students at once.

### 10. Which fields are filterable in v1?

**Recommended answer**:

Batch, Branch, Attendance Status, Coding Grade (all multi-select) plus a Score range and a name/roll-number search — all reuse the same filtering mechanism, so there's no reason to cut any of them.

**User answer**:

Yes, all four (plus range and search).

**Settled outcome**:

Filters: Batch, Branch, Attendance Status, Coding Grade, Score range, name/Roll Number search.

### 11. Is the CSV a one-time snapshot, or does the app need recurring uploads and multi-cohort history?

**Recommended answer**:

One-time snapshot: read the file server-side, no database, no upload UI. Introducing upload + history is a meaningfully bigger feature with no signal it's needed yet.

**User answer**:

One-time snapshot for now.

**Settled outcome**:

See [ADR 0002](../ADR/0002-static-csv-data-source.md). No database for v1; a new CSV means a manual file swap and redeploy.

### 12. Suggested improvements — which to fold into v1?

**Recommended answer**:

Fold in Rank display (per-Batch and overall — cheap, directly serves "keep track of each person") and a Provisional filter toggle (cheap, reuses existing filter mechanism, useful for finding Students still missing a written score). Defer a visual (bar/chart) comparison view to v2 — genuinely nice but a bigger lift. Also flagged that `Attendance_in_Assessment` (a 0-5 count) is a distinct field from Attendance Status and shouldn't be conflated with it.

**User answer**:

Confirmed Attendance Status is unrelated to Assessment Attendance (not derived from it). Agreed to defer visual comparison to v2. Proceed.

**Settled outcome**:

v1 includes Rank (per-Batch and overall) and a Provisional filter. Visual/chart-based comparison is a v2 idea, not built now. `Assessment Attendance` and `Attendance Status` are documented as distinct, unrelated terms in `CONTEXT.md`.

## Date

2026-07-24

## Follow-Ups

- Glossary updates: `CONTEXT.md` — Student, Roll Number, Batch, Branch, Score, Rank, Provisional, Attendance Status, Assessment Attendance, Coding Grade.
- ADRs created: [0002-static-csv-data-source.md](../ADR/0002-static-csv-data-source.md).
- Specs affected: none yet — this session sets up the scope for a future PRD/issue breakdown (`to-prd` / `to-issues`) covering the Leaderboard table, filters, Rank, and comparison view.
