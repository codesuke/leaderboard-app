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
  value: number,
  min: number | undefined,
  max: number | undefined
): boolean {
  return (min === undefined || value >= min) && (max === undefined || value <= max);
}

function matchesStringRange(
  value: string,
  min: string | undefined,
  max: string | undefined
): boolean {
  return (min === undefined || value >= min) && (max === undefined || value <= max);
}

function matchesSearch(student: Student, search: string | undefined): boolean {
  if (!search) return true;
  const needle = search.toLowerCase();
  return (
    student.name.toLowerCase().includes(needle) ||
    student.rollNumber.toLowerCase().includes(needle)
  );
}

export function filterStudents<T extends Student>(students: T[], filters: StudentFilters): T[] {
  return students.filter((student) => {
    if (!matchesSet(student.batch, filters.batches)) return false;
    if (!matchesSet(student.branch, filters.branches)) return false;
    if (!matchesSet(student.attendanceStatus, filters.attendanceStatuses)) return false;
    if (!matchesSet(student.codingGrade, filters.codingGrades)) return false;
    if (!matchesRange(student.score, filters.scoreMin, filters.scoreMax)) return false;
    if (!matchesStringRange(student.rollNumber, filters.rollNumberMin, filters.rollNumberMax))
      return false;
    if (!matchesSearch(student, filters.search)) return false;
    if (filters.provisionalOnly && !student.provisional) return false;
    return true;
  });
}
