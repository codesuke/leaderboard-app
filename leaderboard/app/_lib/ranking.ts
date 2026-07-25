import type { Batch, Student } from "./students";

export const BATCH_ORDER: Batch[] = [
  "S1",
  "S2",
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];

export interface RankedStudent extends Student {
  rankInBatch: number;
  rankOverall: number;
}

export function rankStudents(students: Student[]): RankedStudent[] {
  const batchRank = new Map(BATCH_ORDER.map((batch, index) => [batch, index]));

  const sorted = [...students].sort((a, b) => {
    const batchDiff = batchRank.get(a.batch)! - batchRank.get(b.batch)!;
    return batchDiff !== 0 ? batchDiff : b.score - a.score;
  });

  const rankInBatchByBatch = new Map<Batch, number>();

  return sorted.map((student, index) => {
    const rankInBatch = (rankInBatchByBatch.get(student.batch) ?? 0) + 1;
    rankInBatchByBatch.set(student.batch, rankInBatch);

    return { ...student, rankInBatch, rankOverall: index + 1 };
  });
}
