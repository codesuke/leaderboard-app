import type {
  CodingGradeMovementDirection,
  MovementDirection,
  StudentFilters,
} from "@/app/_lib/filtering";
import { BATCH_ORDER } from "@/app/_lib/ranking";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { MultiSelectFilter } from "./multi-select-filter";

const ANY_VALUE = "__any__";

const MOVEMENT_DIRECTION_OPTIONS: {
  value: MovementDirection;
  label: string;
}[] = [
  { value: "up", label: "Moved Up" },
  { value: "down", label: "Moved Down" },
  { value: "stayed", label: "Stayed" },
  { value: "oneSided", label: "One-Sided" },
];

const CODING_GRADE_MOVEMENT_OPTIONS: {
  value: CodingGradeMovementDirection;
  label: string;
}[] = [
  { value: "improved", label: "Improved" },
  { value: "regressed", label: "Regressed" },
  { value: "same", label: "Same" },
];

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
  const ppeAttendanceRange: [number, number] = [
    filters.ppeAttendanceMin ?? 0,
    filters.ppeAttendanceMax ?? 100,
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
          label="Old Batch"
          options={[...BATCH_ORDER]}
          selected={filters.oldBatches ?? []}
          onChange={(oldBatches) =>
            onChange({
              ...filters,
              oldBatches: oldBatches as StudentFilters["oldBatches"],
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
        <Select
          value={filters.movementDirection ?? ANY_VALUE}
          onValueChange={(value) =>
            onChange({
              ...filters,
              movementDirection:
                value === ANY_VALUE
                  ? undefined
                  : (value as StudentFilters["movementDirection"]),
            })
          }
        >
          <SelectTrigger className="w-44 rounded-full" aria-label="Movement">
            <SelectValue placeholder="Movement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_VALUE}>Any Movement</SelectItem>
            {MOVEMENT_DIRECTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.codingGradeMovement ?? ANY_VALUE}
          onValueChange={(value) =>
            onChange({
              ...filters,
              codingGradeMovement:
                value === ANY_VALUE
                  ? undefined
                  : (value as StudentFilters["codingGradeMovement"]),
            })
          }
        >
          <SelectTrigger
            className="w-52 rounded-full"
            aria-label="Coding Grade Movement"
          >
            <SelectValue placeholder="Coding Grade Movement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_VALUE}>Any Coding Grade Movement</SelectItem>
            {CODING_GRADE_MOVEMENT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={
            filters.offlineAttempted === undefined
              ? ANY_VALUE
              : String(filters.offlineAttempted)
          }
          onValueChange={(value) =>
            onChange({
              ...filters,
              offlineAttempted:
                value === ANY_VALUE ? undefined : value === "true",
            })
          }
        >
          <SelectTrigger
            className="w-52 rounded-full"
            aria-label="Offline Round"
          >
            <SelectValue placeholder="Offline Round" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_VALUE}>Any Offline Round Status</SelectItem>
            <SelectItem value="true">Attempted</SelectItem>
            <SelectItem value="false">Not Attempted</SelectItem>
          </SelectContent>
        </Select>
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

        <div className="flex w-64 flex-col gap-2.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            PPE Attendance: {ppeAttendanceRange[0]} - {ppeAttendanceRange[1]}
          </Label>
          <Slider
            value={ppeAttendanceRange}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => {
              const [ppeAttendanceMin, ppeAttendanceMax] = value as number[];
              onChange({ ...filters, ppeAttendanceMin, ppeAttendanceMax });
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Batch Tier range
          </Label>
          <div className="flex items-center gap-2">
            <Select
              value={filters.batchTierMin ?? ANY_VALUE}
              onValueChange={(value) =>
                onChange({
                  ...filters,
                  batchTierMin:
                    value === ANY_VALUE
                      ? undefined
                      : (value as StudentFilters["batchTierMin"]),
                })
              }
            >
              <SelectTrigger
                className="w-24 rounded-full"
                aria-label="Batch Tier from"
              >
                <SelectValue placeholder="From" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_VALUE}>Any</SelectItem>
                {BATCH_ORDER.map((batch) => (
                  <SelectItem key={batch} value={batch}>
                    {batch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">–</span>
            <Select
              value={filters.batchTierMax ?? ANY_VALUE}
              onValueChange={(value) =>
                onChange({
                  ...filters,
                  batchTierMax:
                    value === ANY_VALUE
                      ? undefined
                      : (value as StudentFilters["batchTierMax"]),
                })
              }
            >
              <SelectTrigger
                className="w-24 rounded-full"
                aria-label="Batch Tier to"
              >
                <SelectValue placeholder="To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_VALUE}>Any</SelectItem>
                {BATCH_ORDER.map((batch) => (
                  <SelectItem key={batch} value={batch}>
                    {batch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Roll Number range
          </Label>
          <span className="text-xs text-muted-foreground">
            Alphanumeric range, not numeric
          </span>
          <div className="flex items-center gap-2">
            <Input
              aria-label="Roll Number from"
              placeholder="From"
              className="w-28 rounded-full"
              value={filters.rollNumberMin ?? ""}
              onChange={(event) =>
                onChange({
                  ...filters,
                  rollNumberMin: event.target.value || undefined,
                })
              }
            />
            <span className="text-muted-foreground">–</span>
            <Input
              aria-label="Roll Number to"
              placeholder="To"
              className="w-28 rounded-full"
              value={filters.rollNumberMax ?? ""}
              onChange={(event) =>
                onChange({
                  ...filters,
                  rollNumberMax: event.target.value || undefined,
                })
              }
            />
          </div>
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

        <Label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={filters.flaggedOnly ?? false}
            onCheckedChange={(checked) =>
              onChange({
                ...filters,
                flaggedOnly: checked === true || undefined,
              })
            }
          />
          Flagged only
        </Label>

        <Button
          type="button"
          variant={filters.flaggedPreset ? "default" : "outline"}
          className="rounded-full px-4"
          onClick={() =>
            onChange({
              ...filters,
              flaggedPreset: filters.flaggedPreset ? undefined : true,
            })
          }
        >
          Flagged Students
        </Button>
      </div>
    </div>
  );
}
