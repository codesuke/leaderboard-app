# Filter Bar UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the Leaderboard's filter bar into a chip-driven, visually consistent panel that collapses into a bottom sheet on mobile.

**Architecture:** Extract the filter form fields (Batch/Branch/Attendance Status/Coding Grade dropdowns + Score/Roll Number/Search/Provisional refinements) into a shared `FilterControls` component consumed by both a desktop inline panel and a mobile shadcn `Sheet`. A new pure `describeActiveFilters`/`removeFilterChip` pair in `_lib/filtering.ts` drives a removable chip row shown above the controls on both breakpoints.

**Tech Stack:** Next.js 16.2.11 App Router, React 19.2.4, TypeScript (strict), Tailwind CSS v4, shadcn (`base-nova` style, base-ui primitives), Vitest.

## Global Constraints

- Path alias `@/*` resolves to `leaderboard/*` — import via `@/app/_lib/...`, `@/components/ui/...`, never relative `../../`.
- `strict: true` in `tsconfig.json` — do not loosen it.
- `"use client"` only at the leaf that needs interactivity/state/hooks — do not add it to components that don't use hooks themselves, even if their children do.
- No magic strings duplicated across files — filter option lists (`ATTENDANCE_STATUS_OPTIONS`, `CODING_GRADE_OPTIONS`) live in exactly one file.
- TDD for product behavior: failing test first, minimal implementation, then refactor. Applies to the new `_lib/filtering.ts` logic (Task 1); the remaining tasks are UI wiring with no new business logic, verified visually per the repo's UI-change rule (start the dev server, check the browser) rather than with new component-test infrastructure.
- No new test runner or testing-library dependency — this repo only has Vitest configured for pure-logic tests (no jsdom/RTL). Don't add one for this slice.
- Don't change `StudentFilters`'s shape or `filterStudents`'s matching semantics (including the Roll Number range's lexical/string comparison) — only labeling and layout change.
- Run `pnpm --dir leaderboard lint` and `pnpm --dir leaderboard test` before each commit; both must pass.

---

### Task 1: `describeActiveFilters` and `removeFilterChip` — chip derivation logic

**Files:**

- Modify: `leaderboard/app/_lib/filtering.ts`
- Test: `leaderboard/app/_lib/filtering.test.ts`

**Interfaces:**

- Produces (consumed by Tasks 3 and 4):
  - `export type FilterChipKey = "batches" | "branches" | "attendanceStatuses" | "codingGrades" | "score" | "rollNumber" | "search" | "provisionalOnly"`
  - `export interface FilterChip { key: FilterChipKey; label: string }`
  - `export function describeActiveFilters(filters: StudentFilters): FilterChip[]`
  - `export function removeFilterChip(filters: StudentFilters, key: FilterChipKey): StudentFilters`

- [ ] **Step 1: Write the failing tests**

Append to `leaderboard/app/_lib/filtering.test.ts` (add `describeActiveFilters` and `removeFilterChip` to the existing `import { filterStudents } from "./filtering";` line so it reads `import { describeActiveFilters, filterStudents, removeFilterChip } from "./filtering";`, then add below the existing `describe("filterStudents", ...)` block):

```ts
describe("describeActiveFilters", () => {
  it("returns no chips when no filters are active", () => {
    expect(describeActiveFilters({})).toEqual([]);
  });

  it("describes a Batch selection", () => {
    expect(describeActiveFilters({ batches: ["S1", "T2"] })).toEqual([
      { key: "batches", label: "Batch: S1, T2" },
    ]);
  });

  it("describes a Branch selection", () => {
    expect(describeActiveFilters({ branches: ["CS", "CSE-AI"] })).toEqual([
      { key: "branches", label: "Branch: CS, CSE-AI" },
    ]);
  });

  it("describes an Attendance Status selection", () => {
    expect(describeActiveFilters({ attendanceStatuses: ["Poor"] })).toEqual([
      { key: "attendanceStatuses", label: "Attendance Status: Poor" },
    ]);
  });

  it("describes a Coding Grade selection", () => {
    expect(
      describeActiveFilters({ codingGrades: ["Expert", "Proficient"] })
    ).toEqual([
      { key: "codingGrades", label: "Coding Grade: Expert, Proficient" },
    ]);
  });

  it("describes a full Score range", () => {
    expect(describeActiveFilters({ scoreMin: 40, scoreMax: 80 })).toEqual([
      { key: "score", label: "Score: 40–80" },
    ]);
  });

  it("describes a partial Score range using the slider's implicit bounds", () => {
    expect(describeActiveFilters({ scoreMin: 60 })).toEqual([
      { key: "score", label: "Score: 60–100" },
    ]);
  });

  it("describes a Roll Number range", () => {
    expect(
      describeActiveFilters({
        rollNumberMin: "2401330120100",
        rollNumberMax: "2401330120200",
      })
    ).toEqual([
      {
        key: "rollNumber",
        label: "Roll Number: 2401330120100 – 2401330120200",
      },
    ]);
  });

  it("describes a Search term", () => {
    expect(describeActiveFilters({ search: "vedant" })).toEqual([
      { key: "search", label: 'Search: "vedant"' },
    ]);
  });

  it("describes Provisional only", () => {
    expect(describeActiveFilters({ provisionalOnly: true })).toEqual([
      { key: "provisionalOnly", label: "Provisional only" },
    ]);
  });

  it("combines multiple active filters into multiple chips, in a stable order", () => {
    expect(
      describeActiveFilters({
        batches: ["S1"],
        search: "vedant",
        provisionalOnly: true,
      })
    ).toEqual([
      { key: "batches", label: "Batch: S1" },
      { key: "search", label: 'Search: "vedant"' },
      { key: "provisionalOnly", label: "Provisional only" },
    ]);
  });
});

describe("removeFilterChip", () => {
  it("clears a multi-select dimension without touching other filters", () => {
    const filters: StudentFilters = { batches: ["S1"], search: "vedant" };
    expect(removeFilterChip(filters, "batches")).toEqual({ search: "vedant" });
  });

  it("clears both bounds of the Score range together", () => {
    const filters: StudentFilters = {
      scoreMin: 40,
      scoreMax: 80,
      search: "vedant",
    };
    expect(removeFilterChip(filters, "score")).toEqual({ search: "vedant" });
  });

  it("clears both bounds of the Roll Number range together", () => {
    const filters: StudentFilters = {
      rollNumberMin: "1",
      rollNumberMax: "2",
      provisionalOnly: true,
    };
    expect(removeFilterChip(filters, "rollNumber")).toEqual({
      provisionalOnly: true,
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --dir leaderboard test`
Expected: FAIL — `describeActiveFilters` and `removeFilterChip` are not exported from `./filtering`.

- [ ] **Step 3: Implement the minimal code**

Append to `leaderboard/app/_lib/filtering.ts` (after the existing `filterStudents` function):

```ts
export type FilterChipKey =
  | "batches"
  | "branches"
  | "attendanceStatuses"
  | "codingGrades"
  | "score"
  | "rollNumber"
  | "search"
  | "provisionalOnly";

export interface FilterChip {
  key: FilterChipKey;
  label: string;
}

export function describeActiveFilters(filters: StudentFilters): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.batches && filters.batches.length > 0) {
    chips.push({
      key: "batches",
      label: `Batch: ${filters.batches.join(", ")}`,
    });
  }
  if (filters.branches && filters.branches.length > 0) {
    chips.push({
      key: "branches",
      label: `Branch: ${filters.branches.join(", ")}`,
    });
  }
  if (filters.attendanceStatuses && filters.attendanceStatuses.length > 0) {
    chips.push({
      key: "attendanceStatuses",
      label: `Attendance Status: ${filters.attendanceStatuses.join(", ")}`,
    });
  }
  if (filters.codingGrades && filters.codingGrades.length > 0) {
    chips.push({
      key: "codingGrades",
      label: `Coding Grade: ${filters.codingGrades.join(", ")}`,
    });
  }
  if (filters.scoreMin !== undefined || filters.scoreMax !== undefined) {
    chips.push({
      key: "score",
      label: `Score: ${filters.scoreMin ?? 0}–${filters.scoreMax ?? 100}`,
    });
  }
  if (
    filters.rollNumberMin !== undefined ||
    filters.rollNumberMax !== undefined
  ) {
    chips.push({
      key: "rollNumber",
      label: `Roll Number: ${filters.rollNumberMin ?? "any"} – ${filters.rollNumberMax ?? "any"}`,
    });
  }
  if (filters.search) {
    chips.push({ key: "search", label: `Search: "${filters.search}"` });
  }
  if (filters.provisionalOnly) {
    chips.push({ key: "provisionalOnly", label: "Provisional only" });
  }

  return chips;
}

export function removeFilterChip(
  filters: StudentFilters,
  key: FilterChipKey
): StudentFilters {
  const next = { ...filters };
  switch (key) {
    case "batches":
      delete next.batches;
      break;
    case "branches":
      delete next.branches;
      break;
    case "attendanceStatuses":
      delete next.attendanceStatuses;
      break;
    case "codingGrades":
      delete next.codingGrades;
      break;
    case "score":
      delete next.scoreMin;
      delete next.scoreMax;
      break;
    case "rollNumber":
      delete next.rollNumberMin;
      delete next.rollNumberMax;
      break;
    case "search":
      delete next.search;
      break;
    case "provisionalOnly":
      delete next.provisionalOnly;
      break;
  }
  return next;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --dir leaderboard test`
Expected: PASS — all `describeActiveFilters` and `removeFilterChip` tests green, plus the existing `filterStudents` suite still green.

- [ ] **Step 5: Lint and commit**

Run: `pnpm --dir leaderboard lint`
Expected: no errors.

```bash
git add leaderboard/app/_lib/filtering.ts leaderboard/app/_lib/filtering.test.ts
git commit -m "feat(leaderboard): add active-filter chip derivation logic"
```

---

### Task 2: Unify primary filters as dropdowns, clarify the Roll Number range

**Files:**

- Modify: `leaderboard/app/_components/filters-bar.tsx`

**Interfaces:**

- Consumes: `MultiSelectFilter` from `./multi-select-filter` — `{ label: string; options: string[]; selected: string[]; onChange: (selected: string[]) => void }` (unchanged, already exists).
- No new interfaces produced — this task changes rendering only.

- [ ] **Step 1: Replace the file contents**

Replace the full contents of `leaderboard/app/_components/filters-bar.tsx` with:

```tsx
"use client";

import { RotateCcwIcon } from "lucide-react";
import type { StudentFilters } from "@/app/_lib/filtering";
import { BATCH_ORDER } from "@/app/_lib/ranking";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { MultiSelectFilter } from "./multi-select-filter";

const ATTENDANCE_STATUS_OPTIONS = [
  "Very Sincere",
  "Sincere",
  "Poor",
  "Very Poor",
] as const;
const CODING_GRADE_OPTIONS = [
  "Beginner",
  "Novice",
  "Learner",
  "Proficient",
  "Expert",
] as const;

interface FiltersBarProps {
  filters: StudentFilters;
  onChange: (filters: StudentFilters) => void;
  branches: string[];
}

export function FiltersBar({ filters, onChange, branches }: FiltersBarProps) {
  const scoreRange: [number, number] = [
    filters.scoreMin ?? 0,
    filters.scoreMax ?? 100,
  ];

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/30 ring-1 ring-white/[0.03]">
      <div className="flex flex-wrap items-center gap-2.5">
        <MultiSelectFilter
          label="Batch"
          options={[...BATCH_ORDER]}
          selected={filters.batches ?? []}
          onChange={(batches) =>
            onChange({
              ...filters,
              batches: batches as StudentFilters["batches"],
            })
          }
        />
        <MultiSelectFilter
          label="Branch"
          options={branches}
          selected={filters.branches ?? []}
          onChange={(branchSelection) =>
            onChange({ ...filters, branches: branchSelection })
          }
        />
        <MultiSelectFilter
          label="Attendance Status"
          options={[...ATTENDANCE_STATUS_OPTIONS]}
          selected={filters.attendanceStatuses ?? []}
          onChange={(value) =>
            onChange({
              ...filters,
              attendanceStatuses: value as StudentFilters["attendanceStatuses"],
            })
          }
        />
        <MultiSelectFilter
          label="Coding Grade"
          options={[...CODING_GRADE_OPTIONS]}
          selected={filters.codingGrades ?? []}
          onChange={(value) =>
            onChange({
              ...filters,
              codingGrades: value as StudentFilters["codingGrades"],
            })
          }
        />

        <Button
          variant="ghost"
          className="rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => onChange({})}
          disabled={Object.keys(filters).length === 0}
        >
          <RotateCcwIcon data-icon="inline-start" />
          Reset filters
        </Button>
      </div>

      <Separator />

      <div className="flex flex-wrap items-end gap-8">
        <div className="flex w-64 flex-col gap-2.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Score: {scoreRange[0]} - {scoreRange[1]}
          </Label>
          <Slider
            value={scoreRange}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => {
              const [scoreMin, scoreMax] = value as number[];
              onChange({ ...filters, scoreMin, scoreMax });
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Roll Number from
          </Label>
          <Input
            className="w-40 rounded-full"
            value={filters.rollNumberMin ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                rollNumberMin: event.target.value || undefined,
              })
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Roll Number to
          </Label>
          <Input
            className="w-40 rounded-full"
            value={filters.rollNumberMax ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                rollNumberMax: event.target.value || undefined,
              })
            }
          />
          <span className="text-xs text-muted-foreground">
            Alphanumeric range, not numeric
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Search
          </Label>
          <Input
            className="w-56 rounded-full"
            placeholder="Name or Roll Number"
            value={filters.search ?? ""}
            onChange={(event) =>
              onChange({ ...filters, search: event.target.value || undefined })
            }
          />
        </div>

        <Label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={filters.provisionalOnly ?? false}
            onCheckedChange={(checked) =>
              onChange({
                ...filters,
                provisionalOnly: checked === true || undefined,
              })
            }
          />
          Provisional only
        </Label>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in the browser**

Run: `pnpm --dir leaderboard dev` (skip if already running)
Open `http://localhost:3000` and confirm: Attendance Status and Coding Grade now render as dropdown buttons matching Batch/Branch's style (not button rows), and the Roll Number "to" field shows the "Alphanumeric range, not numeric" caption underneath.

- [ ] **Step 3: Lint and commit**

Run: `pnpm --dir leaderboard lint`
Expected: no errors.

```bash
git add leaderboard/app/_components/filters-bar.tsx
git commit -m "refactor(leaderboard): unify primary filters as dropdowns, clarify Roll Number range"
```

---

### Task 3: Active filter chip row

**Files:**

- Modify: `leaderboard/app/_components/filters-bar.tsx`

**Interfaces:**

- Consumes: `describeActiveFilters`, `removeFilterChip`, `FilterChip` from `@/app/_lib/filtering` (Task 1).

- [ ] **Step 1: Replace the file contents**

Replace the full contents of `leaderboard/app/_components/filters-bar.tsx` with:

```tsx
"use client";

import { XIcon } from "lucide-react";
import {
  describeActiveFilters,
  removeFilterChip,
  type StudentFilters,
} from "@/app/_lib/filtering";
import { BATCH_ORDER } from "@/app/_lib/ranking";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { MultiSelectFilter } from "./multi-select-filter";

const ATTENDANCE_STATUS_OPTIONS = [
  "Very Sincere",
  "Sincere",
  "Poor",
  "Very Poor",
] as const;
const CODING_GRADE_OPTIONS = [
  "Beginner",
  "Novice",
  "Learner",
  "Proficient",
  "Expert",
] as const;

interface FiltersBarProps {
  filters: StudentFilters;
  onChange: (filters: StudentFilters) => void;
  branches: string[];
}

export function FiltersBar({ filters, onChange, branches }: FiltersBarProps) {
  const scoreRange: [number, number] = [
    filters.scoreMin ?? 0,
    filters.scoreMax ?? 100,
  ];
  const chips = describeActiveFilters(filters);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/30 ring-1 ring-white/[0.03]">
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Badge
              key={chip.key}
              variant="outline"
              className="gap-1 rounded-full pr-1.5"
            >
              {chip.label}
              <button
                type="button"
                aria-label={`Remove ${chip.label} filter`}
                className="rounded-full p-0.5 hover:bg-muted"
                onClick={() => onChange(removeFilterChip(filters, chip.key))}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange({})}
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <MultiSelectFilter
          label="Batch"
          options={[...BATCH_ORDER]}
          selected={filters.batches ?? []}
          onChange={(batches) =>
            onChange({
              ...filters,
              batches: batches as StudentFilters["batches"],
            })
          }
        />
        <MultiSelectFilter
          label="Branch"
          options={branches}
          selected={filters.branches ?? []}
          onChange={(branchSelection) =>
            onChange({ ...filters, branches: branchSelection })
          }
        />
        <MultiSelectFilter
          label="Attendance Status"
          options={[...ATTENDANCE_STATUS_OPTIONS]}
          selected={filters.attendanceStatuses ?? []}
          onChange={(value) =>
            onChange({
              ...filters,
              attendanceStatuses: value as StudentFilters["attendanceStatuses"],
            })
          }
        />
        <MultiSelectFilter
          label="Coding Grade"
          options={[...CODING_GRADE_OPTIONS]}
          selected={filters.codingGrades ?? []}
          onChange={(value) =>
            onChange({
              ...filters,
              codingGrades: value as StudentFilters["codingGrades"],
            })
          }
        />
      </div>

      <Separator />

      <div className="flex flex-wrap items-end gap-8">
        <div className="flex w-64 flex-col gap-2.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Score: {scoreRange[0]} - {scoreRange[1]}
          </Label>
          <Slider
            value={scoreRange}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => {
              const [scoreMin, scoreMax] = value as number[];
              onChange({ ...filters, scoreMin, scoreMax });
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Roll Number from
          </Label>
          <Input
            className="w-40 rounded-full"
            value={filters.rollNumberMin ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                rollNumberMin: event.target.value || undefined,
              })
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Roll Number to
          </Label>
          <Input
            className="w-40 rounded-full"
            value={filters.rollNumberMax ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                rollNumberMax: event.target.value || undefined,
              })
            }
          />
          <span className="text-xs text-muted-foreground">
            Alphanumeric range, not numeric
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Search
          </Label>
          <Input
            className="w-56 rounded-full"
            placeholder="Name or Roll Number"
            value={filters.search ?? ""}
            onChange={(event) =>
              onChange({ ...filters, search: event.target.value || undefined })
            }
          />
        </div>

        <Label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={filters.provisionalOnly ?? false}
            onCheckedChange={(checked) =>
              onChange({
                ...filters,
                provisionalOnly: checked === true || undefined,
              })
            }
          />
          Provisional only
        </Label>
      </div>
    </div>
  );
}
```

Note what changed from Task 2's version: the old always-visible "Reset filters" `Button` (and its `RotateCcwIcon`/`Button` imports) is gone — its job is now done by the chip row's "Clear all," which only appears once there's something to clear.

- [ ] **Step 2: Verify in the browser**

With the dev server running, open `http://localhost:3000`, set a Batch filter and a Score range, and confirm: a chip row appears above the dropdowns showing `Batch: <value>` and `Score: <min>–<max>`, each chip's `×` removes only that filter (leaving the other active), and "Clear all" resets everything. Confirm no chip row renders when no filters are set.

- [ ] **Step 3: Lint and commit**

Run: `pnpm --dir leaderboard lint`
Expected: no errors.

```bash
git add leaderboard/app/_components/filters-bar.tsx
git commit -m "feat(leaderboard): add removable active-filter chip row"
```

---

### Task 4: Extract `FilterControls`, add the mobile filter sheet

**Files:**

- Create: `leaderboard/app/_components/filter-controls.tsx`
- Modify: `leaderboard/app/_components/filters-bar.tsx`
- Create (via CLI): `leaderboard/components/ui/sheet.tsx`

**Interfaces:**

- Produces: `FilterControls({ filters, onChange, branches }: { filters: StudentFilters; onChange: (filters: StudentFilters) => void; branches: string[] })` — same prop shape `FiltersBar` already takes, so both call sites pass it through unchanged.
- Consumes: `describeActiveFilters`, `removeFilterChip` from Task 1; `Sheet`, `SheetContent`, `SheetFooter`, `SheetHeader`, `SheetTitle`, `SheetTrigger` from `@/components/ui/sheet` (added this task).

- [ ] **Step 1: Add the shadcn Sheet component**

Run, from the `leaderboard/` directory:

```bash
pnpm dlx shadcn@latest add sheet --yes
```

Expected: creates `leaderboard/components/ui/sheet.tsx` exporting `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`. It may report `button.tsx` as skipped/identical — that's expected, leave it untouched.

- [ ] **Step 2: Create `filter-controls.tsx`**

Create `leaderboard/app/_components/filter-controls.tsx`:

```tsx
import type { StudentFilters } from "@/app/_lib/filtering";
import { BATCH_ORDER } from "@/app/_lib/ranking";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { MultiSelectFilter } from "./multi-select-filter";

const ATTENDANCE_STATUS_OPTIONS = [
  "Very Sincere",
  "Sincere",
  "Poor",
  "Very Poor",
] as const;
const CODING_GRADE_OPTIONS = [
  "Beginner",
  "Novice",
  "Learner",
  "Proficient",
  "Expert",
] as const;

interface FilterControlsProps {
  filters: StudentFilters;
  onChange: (filters: StudentFilters) => void;
  branches: string[];
}

export function FilterControls({
  filters,
  onChange,
  branches,
}: FilterControlsProps) {
  const scoreRange: [number, number] = [
    filters.scoreMin ?? 0,
    filters.scoreMax ?? 100,
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <MultiSelectFilter
          label="Batch"
          options={[...BATCH_ORDER]}
          selected={filters.batches ?? []}
          onChange={(batches) =>
            onChange({
              ...filters,
              batches: batches as StudentFilters["batches"],
            })
          }
        />
        <MultiSelectFilter
          label="Branch"
          options={branches}
          selected={filters.branches ?? []}
          onChange={(branchSelection) =>
            onChange({ ...filters, branches: branchSelection })
          }
        />
        <MultiSelectFilter
          label="Attendance Status"
          options={[...ATTENDANCE_STATUS_OPTIONS]}
          selected={filters.attendanceStatuses ?? []}
          onChange={(value) =>
            onChange({
              ...filters,
              attendanceStatuses: value as StudentFilters["attendanceStatuses"],
            })
          }
        />
        <MultiSelectFilter
          label="Coding Grade"
          options={[...CODING_GRADE_OPTIONS]}
          selected={filters.codingGrades ?? []}
          onChange={(value) =>
            onChange({
              ...filters,
              codingGrades: value as StudentFilters["codingGrades"],
            })
          }
        />
      </div>

      <Separator />

      <div className="flex flex-wrap items-end gap-8">
        <div className="flex w-64 flex-col gap-2.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Score: {scoreRange[0]} - {scoreRange[1]}
          </Label>
          <Slider
            value={scoreRange}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => {
              const [scoreMin, scoreMax] = value as number[];
              onChange({ ...filters, scoreMin, scoreMax });
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Roll Number from
          </Label>
          <Input
            className="w-40 rounded-full"
            value={filters.rollNumberMin ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                rollNumberMin: event.target.value || undefined,
              })
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Roll Number to
          </Label>
          <Input
            className="w-40 rounded-full"
            value={filters.rollNumberMax ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                rollNumberMax: event.target.value || undefined,
              })
            }
          />
          <span className="text-xs text-muted-foreground">
            Alphanumeric range, not numeric
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Search
          </Label>
          <Input
            className="w-56 rounded-full"
            placeholder="Name or Roll Number"
            value={filters.search ?? ""}
            onChange={(event) =>
              onChange({ ...filters, search: event.target.value || undefined })
            }
          />
        </div>

        <Label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={filters.provisionalOnly ?? false}
            onCheckedChange={(checked) =>
              onChange({
                ...filters,
                provisionalOnly: checked === true || undefined,
              })
            }
          />
          Provisional only
        </Label>
      </div>
    </div>
  );
}
```

This has no `"use client"` directive — it uses no hooks itself, and each interactive child (`MultiSelectFilter`, `Slider`, `Checkbox`) already declares its own client boundary, so `FilterControls` doesn't need one per the repo's "push `use client` to the leaf" rule.

- [ ] **Step 3: Replace `filters-bar.tsx` with the responsive orchestrator**

Replace the full contents of `leaderboard/app/_components/filters-bar.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { FilterIcon, XIcon } from "lucide-react";
import {
  describeActiveFilters,
  removeFilterChip,
  type StudentFilters,
} from "@/app/_lib/filtering";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterControls } from "./filter-controls";

interface FiltersBarProps {
  filters: StudentFilters;
  onChange: (filters: StudentFilters) => void;
  branches: string[];
}

export function FiltersBar({ filters, onChange, branches }: FiltersBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const chips = describeActiveFilters(filters);

  const chipsRow = chips.length > 0 && (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="outline"
          className="gap-1 rounded-full pr-1.5"
        >
          {chip.label}
          <button
            type="button"
            aria-label={`Remove ${chip.label} filter`}
            className="rounded-full p-0.5 hover:bg-muted"
            onClick={() => onChange(removeFilterChip(filters, chip.key))}
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground"
        onClick={() => onChange({})}
      >
        Clear all
      </button>
    </div>
  );

  return (
    <>
      <div className="hidden flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/30 ring-1 ring-white/[0.03] lg:flex">
        {chipsRow}
        <FilterControls
          filters={filters}
          onChange={onChange}
          branches={branches}
        />
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {chipsRow}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" className="w-fit rounded-full px-4">
                <FilterIcon data-icon="inline-start" />
                Filters
                {chips.length > 0 && (
                  <Badge className="bg-primary/15 text-primary">
                    {chips.length}
                  </Badge>
                )}
              </Button>
            }
          />
          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
          >
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4">
              <FilterControls
                filters={filters}
                onChange={onChange}
                branches={branches}
              />
            </div>
            <SheetFooter className="flex-row justify-between">
              <Button
                variant="ghost"
                onClick={() => onChange({})}
                disabled={chips.length === 0}
              >
                Clear all
              </Button>
              <Button onClick={() => setSheetOpen(false)}>Done</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Verify in the browser at both breakpoints**

Run: `pnpm --dir leaderboard dev` (skip if already running).

Desktop (`shot http://localhost:3000 /tmp/.../desktop.png --w=1600`, then read the PNG back): confirm the filter panel renders inline exactly as in Task 3, with no "Filters" trigger button visible.

Mobile (`shot http://localhost:3000 /tmp/.../mobile.png --mobile`, then read the PNG back): confirm the inline panel is gone, replaced by an optional chip row plus a compact "Filters" button (showing a count badge once a filter is set), and that the Student table is visible without scrolling past it.

Manually click the "Filters" button in a real interaction check (or via `--sel` screenshots before/after) to confirm the sheet slides up from the bottom, contains the same controls as desktop, and "Done" closes it while keeping applied filters.

- [ ] **Step 5: Lint, test, and commit**

Run: `pnpm --dir leaderboard lint && pnpm --dir leaderboard test`
Expected: both pass — the Task 1 `_lib/filtering.test.ts` suite is untouched by this task's UI-only changes.

```bash
git add leaderboard/app/_components/filter-controls.tsx leaderboard/app/_components/filters-bar.tsx leaderboard/components/ui/sheet.tsx
git commit -m "feat(leaderboard): collapse filter panel into a mobile bottom sheet"
```

---
