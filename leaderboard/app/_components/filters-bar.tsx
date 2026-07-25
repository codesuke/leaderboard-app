"use client";

import { RotateCcwIcon } from "lucide-react";
import type { StudentFilters } from "@/app/_lib/filtering";
import { BATCH_ORDER } from "@/app/_lib/ranking";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MultiSelectFilter } from "./multi-select-filter";

const ATTENDANCE_STATUS_OPTIONS = ["Very Sincere", "Sincere", "Poor", "Very Poor"] as const;
const CODING_GRADE_OPTIONS = ["Beginner", "Novice", "Learner", "Proficient", "Expert"] as const;

interface FiltersBarProps {
  filters: StudentFilters;
  onChange: (filters: StudentFilters) => void;
  branches: string[];
}

export function FiltersBar({ filters, onChange, branches }: FiltersBarProps) {
  const scoreRange: [number, number] = [filters.scoreMin ?? 0, filters.scoreMax ?? 100];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectFilter
          label="Batch"
          options={[...BATCH_ORDER]}
          selected={filters.batches ?? []}
          onChange={(batches) =>
            onChange({ ...filters, batches: batches as StudentFilters["batches"] })
          }
        />
        <MultiSelectFilter
          label="Branch"
          options={branches}
          selected={filters.branches ?? []}
          onChange={(branchSelection) => onChange({ ...filters, branches: branchSelection })}
        />

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Attendance Status</Label>
          <ToggleGroup
            multiple
            variant="outline"
            size="sm"
            value={filters.attendanceStatuses ?? []}
            onValueChange={(value) =>
              onChange({
                ...filters,
                attendanceStatuses: value as StudentFilters["attendanceStatuses"],
              })
            }
          >
            {ATTENDANCE_STATUS_OPTIONS.map((status) => (
              <ToggleGroupItem key={status} value={status}>
                {status}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Coding Grade</Label>
          <ToggleGroup
            multiple
            variant="outline"
            size="sm"
            value={filters.codingGrades ?? []}
            onValueChange={(value) =>
              onChange({ ...filters, codingGrades: value as StudentFilters["codingGrades"] })
            }
          >
            {CODING_GRADE_OPTIONS.map((grade) => (
              <ToggleGroupItem key={grade} value={grade}>
                {grade}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({})}
          disabled={Object.keys(filters).length === 0}
        >
          <RotateCcwIcon data-icon="inline-start" />
          Reset filters
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex w-56 flex-col gap-2">
          <Label className="text-xs text-muted-foreground">
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

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Roll Number from</Label>
          <Input
            className="w-40"
            value={filters.rollNumberMin ?? ""}
            onChange={(event) =>
              onChange({ ...filters, rollNumberMin: event.target.value || undefined })
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Roll Number to</Label>
          <Input
            className="w-40"
            value={filters.rollNumberMax ?? ""}
            onChange={(event) =>
              onChange({ ...filters, rollNumberMax: event.target.value || undefined })
            }
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <Input
            className="w-56"
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
              onChange({ ...filters, provisionalOnly: checked === true || undefined })
            }
          />
          Provisional only
        </Label>
      </div>
    </div>
  );
}
