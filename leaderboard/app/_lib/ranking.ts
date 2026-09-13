import { RAW_BATCH_ORDER } from "./batch-order";
import type { Batch, Student } from "./students";

export const BATCH_ORDER = RAW_BATCH_ORDER as readonly Batch[];

export interface RankedStudent extends Student {
  rankInBatch: number;
  rankOverall: number;
}

// A Student with no current (September) Batch/Score — a one-sided Student
// present only in the July snapshot — has nothing to rank by, so it sorts
// after every Student that does.
const UNRANKED = BATCH_ORDER.length;

export function rankStudents(students: Student[]): RankedStudent[] {
  const batchRank = new Map(BATCH_ORDER.map((batch, index) => [batch, index]));

  const sorted = [...students].sort((a, b) => {
    const aBatchRank = a.batch === null ? UNRANKED : batchRank.get(a.batch)!;
    const bBatchRank = b.batch === null ? UNRANKED : batchRank.get(b.batch)!;
    const batchDiff = aBatchRank - bBatchRank;
    if (batchDiff !== 0) return batchDiff;
    return (b.score ?? -Infinity) - (a.score ?? -Infinity);
  });

  const rankInBatchByBatch = new Map<Batch, number>();

  return sorted.map((student, index) => {
    const rankInBatch =
      student.batch === null
        ? 0
        : (rankInBatchByBatch.get(student.batch) ?? 0) + 1;
    if (student.batch !== null) {
      rankInBatchByBatch.set(student.batch, rankInBatch);
    }

    return { ...student, rankInBatch, rankOverall: index + 1 };
  });
}
