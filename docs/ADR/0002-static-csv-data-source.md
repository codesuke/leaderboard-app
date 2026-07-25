# Static CSV As The Leaderboard's Data Source

The Leaderboard displays a one-time snapshot of Student data (`leaderboard/data/training_groups_July.csv`, 1,448 rows). We decided to read this file directly server-side rather than introduce a database: v1 has no upload flow and no requirement to keep multiple cohorts side by side, so a database would add real infrastructure for a need that doesn't exist yet.

## Status

accepted

## Considered Options

- Static CSV read server-side, no database (chosen).
- A database from the start, anticipating future CSV uploads and multi-cohort history.

## Consequences

- Getting a new cohort's data into the app means manually replacing the CSV and redeploying — there is no upload UI.
- There is no way to compare this cohort against a past one until a real data store is introduced.
- Revisit this decision the moment a second cohort needs to coexist with this one, or an upload flow is requested.
