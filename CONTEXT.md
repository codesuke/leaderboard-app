# Leaderboard

Tracks and ranks Students in a training program by Score, letting staff view, filter, and compare them across Batches and Branches.

## Language

**Student**:
A person tracked in the Leaderboard, uniquely identified by their Roll Number.
_Avoid_: User, Candidate

**Roll Number**:
The university-issued identifier that uniquely identifies a Student.
_Avoid_: ID, Student ID

**Batch**:
The cohort a Student is placed into based on Score, ranked from best to worst as S1, S2, then T1 through T13. As of the July+September merge, this specifically means Current Batch — see below.
_Avoid_: Training Group, Group

**Old Batch**:
A Student's Batch placement as of the July snapshot. Display-only: it does not drive ranking, sorting, or filtering.
_Avoid_: Previous Batch, July Batch

**Current Batch**:
A Student's Batch placement as of the September snapshot. The single source of truth for ranking, sorting, and filtering — what "Batch" means everywhere outside the Old Batch column.
_Avoid_: New Batch, September Batch

**Coding Score Trend**:
A Student's coding assessment scores across the three graded coding assessments (17 Aug, 18 Aug, 3 Sep), used to see whether their coding performance is trending up or down across retests. A missing date is `null`, not a zero score.
_Avoid_: Coding History

**Branch**:
A Student's academic field of study (e.g. CS, CSE-AI, CSE-DS) — not an organizational department.
_Avoid_: Department

**Score**:
The composite value that determines a Student's Batch and Rank. As of the July+September merge, this is the September value (an unbounded cumulative figure, not the July 0-100 scale) — the July value lives in Old Score, a display-only field on a different scale.
_Avoid_: Marks, Final Score

**Rank**:
A Student's position when Students are ordered by Batch and then by Score, expressed both within their Batch and across the whole Leaderboard.
_Avoid_: Position, Placement

**Provisional**:
A Student whose Batch placement is incomplete because their written test hasn't been scored yet. Shown within their parent Batch (not a separate Batch), flagged distinctly. As of the July+September merge, this means current (September) Provisional status; the July-derived value lives in Old Provisional, a display-only field.
_Avoid_: Temp, Temporary

**Attendance Status**:
A sincerity rating (Very Sincere, Sincere, Poor, Very Poor) assigned to a Student. Independent of Assessment Attendance — the two are unrelated data points despite both concerning attendance.
_Avoid_: Status, Sincerity

**Assessment Attendance**:
A count (0-5) of how many scored assessments a Student attended. Distinct from Attendance Status.
_Avoid_: Attendance (bare)

**Coding Grade**:
A ranked proficiency tier for a Student's coding ability: Beginner < Novice < Learner < Proficient < Expert.
_Avoid_: Coding Level
