# Issue Tracker: GitHub

Issues and PRDs for this repo live as GitHub Issues. Use the `gh` CLI for issue operations.

## Repository

`{ORG}/{REPO}`

## Conventions

- Create an issue: `gh issue create --title "..." --body "..."`
- Read an issue: `gh issue view <number> --comments`
- List issues: `gh issue list --state open --json number,title,body,labels,comments`
- Comment on an issue: `gh issue comment <number> --body "..."`
- Apply a label: `gh issue edit <number> --add-label "..."`
- Remove a label: `gh issue edit <number> --remove-label "..."`
- Close an issue: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v`; `gh` should do this automatically inside the clone.

## Local Spec Copies

GitHub Issues are the tracker. Durable product specs may also be copied into `docs/Specs-Planned/` and moved to `docs/Specs-Completed/` when shipped.

## When A Skill Says "Publish To The Issue Tracker"

Create a GitHub issue and apply the appropriate triage label from `docs/agents/triage-labels.md`.

## When A Skill Says "Fetch The Relevant Ticket"

Run `gh issue view <number> --comments`.
