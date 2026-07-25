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
