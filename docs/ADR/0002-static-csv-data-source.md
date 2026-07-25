# Static Data File As The Leaderboard's Data Source

The Leaderboard displays a one-time snapshot of Student data (1,448 rows). We decided to read a static file directly server-side rather than introduce a database: v1 has no upload flow and no requirement to keep multiple cohorts side by side, so a database would add real infrastructure for a need that doesn't exist yet.

The source export, `leaderboard/data/training_groups_July.csv`, contains real student PII and is git-ignored — it never leaves the machine that has it. `scripts/csv-to-json.mjs` converts it into `leaderboard/data/students.json`, which **is committed** to this private repo so the deployed app (Vercel) has data to read without any upload/storage mechanism. Committing it relies on the repo staying private; it is not itself a privacy control (see Consequences).

## Status

accepted

## Considered Options

- Static file read server-side, no database (chosen). Raw CSV stays local/git-ignored; a converted JSON copy is committed for deployment.
- A database from the start, anticipating future CSV uploads and multi-cohort history.
- Keep the data entirely out of git and fetch it into the deployment via Vercel Blob or an environment variable at build/request time.

## Consequences

- Getting a new cohort's data into the app means replacing the CSV, re-running `node scripts/csv-to-json.mjs`, committing the regenerated `students.json`, and redeploying — there is no upload UI.
- `students.json` (student names, roll numbers, grades) sits in this repo's git history permanently. If this repo is ever made public, or access is granted to someone who shouldn't see this cohort's data, that data is exposed retroactively. Revisit this the moment either becomes a real possibility — the Vercel Blob option was explicitly passed over for now to keep deployment simple.
- There is no way to compare this cohort against a past one until a real data store is introduced.
- Revisit this decision the moment a second cohort needs to coexist with this one, or an upload flow is requested.
