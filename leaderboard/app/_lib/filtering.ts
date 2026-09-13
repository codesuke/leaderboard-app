import { BATCH_ORDER } from "./ranking";
import type { AttendanceStatus, Batch, CodingGrade, Student } from "./students";

export type MovementDirection = "up" | "down" | "stayed" | "oneSided";
export type CodingGradeMovementDirection = "improved" | "regressed" | "same";

const CODING_GRADE_ORDER: readonly CodingGrade[] = [
  "Beginner",
  "Novice",
  "Learner",
  "Proficient",
  "Expert",
];

export interface StudentFilters {
  batches?: Batch[];
  oldBatches?: Batch[];
  branches?: string[];
  attendanceStatuses?: AttendanceStatus[];
  codingGrades?: CodingGrade[];
  scoreMin?: number;
  scoreMax?: number;
  rollNumberMin?: string;
  rollNumberMax?: string;
  search?: string;
  provisionalOnly?: boolean;
  movementDirection?: MovementDirection;
  codingGradeMovement?: CodingGradeMovementDirection;
  flaggedOnly?: boolean;
  ppeAttendanceMin?: number;
  ppeAttendanceMax?: number;
  offlineAttempted?: boolean;
  batchTierMin?: Batch;
  batchTierMax?: Batch;
  /** "Flagged Students" quick filter: matches a flagged assessment OR a regressed Coding Grade (an OR, unlike every other filter field, which AND-combine). */
  flaggedPreset?: boolean;
}

function matchesSet<T>(value: T, set: T[] | undefined): boolean {
  return !set || set.length === 0 || set.includes(value);
}

function matchesRange(
  value: number | null,
  min: number | undefined,
  max: number | undefined
): boolean {
  if (value === null) return min === undefined && max === undefined;
  return (
    (min === undefined || value >= min) && (max === undefined || value <= max)
  );
}

function matchesStringRange(
  value: string,
  min: string | undefined,
  max: string | undefined
): boolean {
  return (
    (min === undefined || value >= min) && (max === undefined || value <= max)
  );
}

function matchesBatchTierRange(
  batch: Batch | null,
  min: Batch | undefined,
  max: Batch | undefined
): boolean {
  if (min === undefined && max === undefined) return true;
  if (batch === null) return false;
  const index = BATCH_ORDER.indexOf(batch);
  const minIndex = min === undefined ? 0 : BATCH_ORDER.indexOf(min);
  const maxIndex =
    max === undefined ? BATCH_ORDER.length - 1 : BATCH_ORDER.indexOf(max);
  return index >= minIndex && index <= maxIndex;
}

export function getMovementDirection(student: Student): MovementDirection {
  if (!student.progress) return "oneSided";
  const { tiersMoved } = student.progress.batchMovement;
  if (tiersMoved > 0) return "up";
  if (tiersMoved < 0) return "down";
  return "stayed";
}

export function getCodingGradeMovementDirection(
  student: Student
): CodingGradeMovementDirection | null {
  if (!student.progress) return null;
  const { from, to } = student.progress.codingGradeMovement;
  const fromRank = CODING_GRADE_ORDER.indexOf(from);
  const toRank = CODING_GRADE_ORDER.indexOf(to);
  if (toRank > fromRank) return "improved";
  if (toRank < fromRank) return "regressed";
  return "same";
}

function matchesSearch(student: Student, search: string | undefined): boolean {
  if (!search) return true;
  const needle = search.toLowerCase();
  return (
    student.name.toLowerCase().includes(needle) ||
    student.rollNumber.toLowerCase().includes(needle)
  );
}

export function filterStudents<T extends Student>(
  students: T[],
  filters: StudentFilters
): T[] {
  return students.filter((student) => {
    if (!matchesSet(student.batch, filters.batches)) return false;
    if (!matchesSet(student.oldBatch, filters.oldBatches)) return false;
    if (!matchesSet(student.branch, filters.branches)) return false;
    if (!matchesSet(student.attendanceStatus, filters.attendanceStatuses))
      return false;
    if (!matchesSet(student.codingGrade, filters.codingGrades)) return false;
    if (!matchesRange(student.score, filters.scoreMin, filters.scoreMax))
      return false;
    if (
      !matchesStringRange(
        student.rollNumber,
        filters.rollNumberMin,
        filters.rollNumberMax
      )
    )
      return false;
    if (!matchesSearch(student, filters.search)) return false;
    if (filters.provisionalOnly && !student.provisional) return false;
    if (
      filters.movementDirection !== undefined &&
      getMovementDirection(student) !== filters.movementDirection
    )
      return false;
    if (
      filters.codingGradeMovement !== undefined &&
      getCodingGradeMovementDirection(student) !== filters.codingGradeMovement
    )
      return false;
    if (filters.flaggedOnly && student.assessmentFlags.length === 0)
      return false;
    if (
      !matchesRange(
        student.currentPpeAttendance,
        filters.ppeAttendanceMin,
        filters.ppeAttendanceMax
      )
    )
      return false;
    if (
      filters.offlineAttempted !== undefined &&
      student.offlineProblem1Attempted !== filters.offlineAttempted
    )
      return false;
    if (
      !matchesBatchTierRange(
        student.batch,
        filters.batchTierMin,
        filters.batchTierMax
      )
    )
      return false;
    if (
      filters.flaggedPreset &&
      student.assessmentFlags.length === 0 &&
      getCodingGradeMovementDirection(student) !== "regressed"
    )
      return false;
    return true;
  });
}

export type FilterChipKey =
  | "batches"
  | "oldBatches"
  | "branches"
  | "attendanceStatuses"
  | "codingGrades"
  | "score"
  | "rollNumber"
  | "search"
  | "provisionalOnly"
  | "movementDirection"
  | "codingGradeMovement"
  | "flaggedOnly"
  | "ppeAttendance"
  | "offlineAttempted"
  | "batchTier"
  | "flaggedPreset";

const MOVEMENT_DIRECTION_LABELS: Record<MovementDirection, string> = {
  up: "Moved Up",
  down: "Moved Down",
  stayed: "Stayed",
  oneSided: "One-Sided",
};

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
  if (filters.oldBatches && filters.oldBatches.length > 0) {
    chips.push({
      key: "oldBatches",
      label: `Old Batch: ${filters.oldBatches.join(", ")}`,
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
  if (filters.movementDirection !== undefined) {
    chips.push({
      key: "movementDirection",
      label: `Movement: ${MOVEMENT_DIRECTION_LABELS[filters.movementDirection]}`,
    });
  }
  if (filters.codingGradeMovement !== undefined) {
    chips.push({
      key: "codingGradeMovement",
      label: `Coding Grade Movement: ${filters.codingGradeMovement}`,
    });
  }
  if (filters.flaggedOnly) {
    chips.push({ key: "flaggedOnly", label: "Flagged only" });
  }
  if (
    filters.ppeAttendanceMin !== undefined ||
    filters.ppeAttendanceMax !== undefined
  ) {
    chips.push({
      key: "ppeAttendance",
      label: `PPE Attendance: ${filters.ppeAttendanceMin ?? 0}–${filters.ppeAttendanceMax ?? 100}`,
    });
  }
  if (filters.offlineAttempted !== undefined) {
    chips.push({
      key: "offlineAttempted",
      label: `Offline Round: ${filters.offlineAttempted ? "Attempted" : "Not Attempted"}`,
    });
  }
  if (
    filters.batchTierMin !== undefined ||
    filters.batchTierMax !== undefined
  ) {
    chips.push({
      key: "batchTier",
      label: `Batch Tier: ${filters.batchTierMin ?? BATCH_ORDER[0]} – ${filters.batchTierMax ?? BATCH_ORDER[BATCH_ORDER.length - 1]}`,
    });
  }
  if (filters.flaggedPreset) {
    chips.push({ key: "flaggedPreset", label: "Flagged Students" });
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
    case "oldBatches":
      delete next.oldBatches;
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
    case "movementDirection":
      delete next.movementDirection;
      break;
    case "codingGradeMovement":
      delete next.codingGradeMovement;
      break;
    case "flaggedOnly":
      delete next.flaggedOnly;
      break;
    case "ppeAttendance":
      delete next.ppeAttendanceMin;
      delete next.ppeAttendanceMax;
      break;
    case "offlineAttempted":
      delete next.offlineAttempted;
      break;
    case "batchTier":
      delete next.batchTierMin;
      delete next.batchTierMax;
      break;
    case "flaggedPreset":
      delete next.flaggedPreset;
      break;
  }
  return next;
}
