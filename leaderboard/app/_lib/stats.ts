import { BATCH_ORDER } from "./ranking";
import type { Batch, Student } from "./students";

export interface OverviewStats {
  totalCount: number;
  averageScore: number;
  provisionalCount: number;
  batchCount: number;
}

export function computeOverviewStats(students: Student[]): OverviewStats {
  if (students.length === 0) {
    return {
      totalCount: 0,
      averageScore: 0,
      provisionalCount: 0,
      batchCount: 0,
    };
  }

  const scoredStudents = students.filter(
    (student): student is Student & { score: number } => student.score !== null
  );
  const totalScore = scoredStudents.reduce(
    (sum, student) => sum + student.score,
    0
  );
  const provisionalCount = students.filter(
    (student) => student.provisional
  ).length;
  const batchCount = new Set(
    students.map((student) => student.batch).filter((batch) => batch !== null)
  ).size;

  return {
    totalCount: students.length,
    averageScore:
      scoredStudents.length === 0 ? 0 : totalScore / scoredStudents.length,
    provisionalCount,
    batchCount,
  };
}

export interface BatchDistributionEntry {
  batch: Batch;
  count: number;
}

export function computeBatchDistribution(
  students: Student[]
): BatchDistributionEntry[] {
  const counts = new Map<Batch, number>();
  for (const student of students) {
    if (student.batch === null) continue;
    counts.set(student.batch, (counts.get(student.batch) ?? 0) + 1);
  }

  return BATCH_ORDER.filter((batch) => counts.has(batch)).map((batch) => ({
    batch,
    count: counts.get(batch)!,
  }));
}
