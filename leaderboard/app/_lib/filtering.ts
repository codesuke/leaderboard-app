import type { AttendanceStatus, Batch, CodingGrade, Student } from "./students";

export interface StudentFilters {
  batches?: Batch[];
  branches?: string[];
  attendanceStatuses?: AttendanceStatus[];
  codingGrades?: CodingGrade[];
  scoreMin?: number;
  scoreMax?: number;
  rollNumberMin?: string;
  rollNumberMax?: string;
  search?: string;
  provisionalOnly?: boolean;
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
    return true;
  });
}

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
