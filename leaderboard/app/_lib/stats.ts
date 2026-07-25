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
    return { totalCount: 0, averageScore: 0, provisionalCount: 0, batchCount: 0 };
  }

  const totalScore = students.reduce((sum, student) => sum + student.score, 0);
  const provisionalCount = students.filter((student) => student.provisional).length;
  const batchCount = new Set(students.map((student) => student.batch)).size;

  return {
    totalCount: students.length,
    averageScore: totalScore / students.length,
    provisionalCount,
    batchCount,
  };
}

export interface BatchDistributionEntry {
  batch: Batch;
  count: number;
}

export function computeBatchDistribution(students: Student[]): BatchDistributionEntry[] {
  const counts = new Map<Batch, number>();
  for (const student of students) {
    counts.set(student.batch, (counts.get(student.batch) ?? 0) + 1);
  }

  return BATCH_ORDER.filter((batch) => counts.has(batch)).map((batch) => ({
    batch,
    count: counts.get(batch)!,
  }));
}
