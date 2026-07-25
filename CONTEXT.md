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
The cohort a Student is placed into based on Score, ranked from best to worst as S1, S2, then T1 through T12.
_Avoid_: Training Group, Group

**Branch**:
A Student's academic field of study (e.g. CS, CSE-AI, CSE-DS) — not an organizational department.
_Avoid_: Department

**Score**:
The composite value (0-100) that determines a Student's Batch and Rank.
_Avoid_: Marks, Final Score

**Rank**:
A Student's position when Students are ordered by Batch and then by Score, expressed both within their Batch and across the whole Leaderboard.
_Avoid_: Position, Placement

**Provisional**:
A Student whose Batch placement is incomplete because their written test hasn't been scored yet. Shown within their parent Batch (not a separate Batch), flagged distinctly.
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
