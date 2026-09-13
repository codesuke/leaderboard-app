import type {
  CodingGradeMovementDirection,
  MovementDirection,
  StudentFilters,
} from "./filtering";
import type { AttendanceStatus, Batch, CodingGrade } from "./students";

const MOVEMENT_DIRECTIONS: readonly MovementDirection[] = [
  "up",
  "down",
  "stayed",
  "oneSided",
];
const CODING_GRADE_MOVEMENTS: readonly CodingGradeMovementDirection[] = [
  "improved",
  "regressed",
  "same",
];

function asOneOf<T extends string>(
  value: string | null,
  allowed: readonly T[]
): T | undefined {
  return value !== null && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

function asNumber(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function asBoolean(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function asList(value: string | null): string[] | undefined {
  if (value === null || value === "") return undefined;
  return value.split(",");
}

export function encodeFiltersToSearchParams(
  filters: StudentFilters
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.batches?.length) params.set("batches", filters.batches.join(","));
  if (filters.oldBatches?.length)
    params.set("oldBatches", filters.oldBatches.join(","));
  if (filters.branches?.length)
    params.set("branches", filters.branches.join(","));
  if (filters.attendanceStatuses?.length)
    params.set("attendanceStatuses", filters.attendanceStatuses.join(","));
  if (filters.codingGrades?.length)
    params.set("codingGrades", filters.codingGrades.join(","));
  if (filters.scoreMin !== undefined)
    params.set("scoreMin", String(filters.scoreMin));
  if (filters.scoreMax !== undefined)
    params.set("scoreMax", String(filters.scoreMax));
  if (filters.rollNumberMin !== undefined)
    params.set("rollNumberMin", filters.rollNumberMin);
  if (filters.rollNumberMax !== undefined)
    params.set("rollNumberMax", filters.rollNumberMax);
  if (filters.search) params.set("search", filters.search);
  if (filters.provisionalOnly) params.set("provisionalOnly", "true");
  if (filters.movementDirection !== undefined)
    params.set("movementDirection", filters.movementDirection);
  if (filters.codingGradeMovement !== undefined)
    params.set("codingGradeMovement", filters.codingGradeMovement);
  if (filters.flaggedOnly) params.set("flaggedOnly", "true");
  if (filters.ppeAttendanceMin !== undefined)
    params.set("ppeAttendanceMin", String(filters.ppeAttendanceMin));
  if (filters.ppeAttendanceMax !== undefined)
    params.set("ppeAttendanceMax", String(filters.ppeAttendanceMax));
  if (filters.offlineAttempted !== undefined)
    params.set("offlineAttempted", String(filters.offlineAttempted));
  if (filters.batchTierMin !== undefined)
    params.set("batchTierMin", filters.batchTierMin);
  if (filters.batchTierMax !== undefined)
    params.set("batchTierMax", filters.batchTierMax);
  if (filters.flaggedPreset) params.set("flaggedPreset", "true");

  return params;
}

export function decodeFiltersFromSearchParams(
  searchParams: URLSearchParams
): StudentFilters {
  const filters: StudentFilters = {};

  const batches = asList(searchParams.get("batches"));
  if (batches) filters.batches = batches as Batch[];

  const oldBatches = asList(searchParams.get("oldBatches"));
  if (oldBatches) filters.oldBatches = oldBatches as Batch[];

  const branches = asList(searchParams.get("branches"));
  if (branches) filters.branches = branches;

  const attendanceStatuses = asList(searchParams.get("attendanceStatuses"));
  if (attendanceStatuses)
    filters.attendanceStatuses = attendanceStatuses as AttendanceStatus[];

  const codingGrades = asList(searchParams.get("codingGrades"));
  if (codingGrades) filters.codingGrades = codingGrades as CodingGrade[];

  const scoreMin = asNumber(searchParams.get("scoreMin"));
  if (scoreMin !== undefined) filters.scoreMin = scoreMin;

  const scoreMax = asNumber(searchParams.get("scoreMax"));
  if (scoreMax !== undefined) filters.scoreMax = scoreMax;

  const rollNumberMin = searchParams.get("rollNumberMin");
  if (rollNumberMin !== null) filters.rollNumberMin = rollNumberMin;

  const rollNumberMax = searchParams.get("rollNumberMax");
  if (rollNumberMax !== null) filters.rollNumberMax = rollNumberMax;

  const search = searchParams.get("search");
  if (search) filters.search = search;

  if (asBoolean(searchParams.get("provisionalOnly")))
    filters.provisionalOnly = true;

  const movementDirection = asOneOf(
    searchParams.get("movementDirection"),
    MOVEMENT_DIRECTIONS
  );
  if (movementDirection !== undefined)
    filters.movementDirection = movementDirection;

  const codingGradeMovement = asOneOf(
    searchParams.get("codingGradeMovement"),
    CODING_GRADE_MOVEMENTS
  );
  if (codingGradeMovement !== undefined)
    filters.codingGradeMovement = codingGradeMovement;

  if (asBoolean(searchParams.get("flaggedOnly"))) filters.flaggedOnly = true;

  const ppeAttendanceMin = asNumber(searchParams.get("ppeAttendanceMin"));
  if (ppeAttendanceMin !== undefined)
    filters.ppeAttendanceMin = ppeAttendanceMin;

  const ppeAttendanceMax = asNumber(searchParams.get("ppeAttendanceMax"));
  if (ppeAttendanceMax !== undefined)
    filters.ppeAttendanceMax = ppeAttendanceMax;

  const offlineAttempted = asBoolean(searchParams.get("offlineAttempted"));
  if (offlineAttempted !== undefined)
    filters.offlineAttempted = offlineAttempted;

  const batchTierMin = searchParams.get("batchTierMin");
  if (batchTierMin !== null) filters.batchTierMin = batchTierMin as Batch;

  const batchTierMax = searchParams.get("batchTierMax");
  if (batchTierMax !== null) filters.batchTierMax = batchTierMax as Batch;

  if (asBoolean(searchParams.get("flaggedPreset")))
    filters.flaggedPreset = true;

  return filters;
}
