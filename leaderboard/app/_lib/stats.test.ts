import { describe, expect, it } from "vitest";
import type { Student } from "./students";
import { computeBatchDistribution, computeOverviewStats } from "./stats";

function buildStudent(overrides: Partial<Student>): Student {
  return {
    rollNumber: "0000000000000",
    name: "Test Student",
    branch: "CS",
    batch: "T1",
    provisional: false,
    score: 50,
    attendanceStatus: "Sincere",
    assessmentAttendance: 5,
    codingGrade: "Learner",
    testScores: {
      practiceTest1: 50,
      practiceTest2: 50,
      practiceTest3: 50,
      practiceTest4: 50,
      mockTest: 50,
      onlineAssessment: 40,
      written: 10,
    },
    oldBatch: null,
    oldProvisional: null,
    oldScore: null,
    assessmentFlags: [],
    currentPpeAttendance: null,
    offlineProblem1Attempted: null,
    progress: null,
    ...overrides,
  };
}

describe("computeOverviewStats", () => {
  it("computes total count, average Score, Provisional count, and Batch count", () => {
    const students = [
      buildStudent({
        rollNumber: "1",
        batch: "S1",
        score: 90,
        provisional: false,
      }),
      buildStudent({
        rollNumber: "2",
        batch: "T1",
        score: 70,
        provisional: true,
      }),
      buildStudent({
        rollNumber: "3",
        batch: "T1",
        score: 50,
        provisional: false,
      }),
    ];

    expect(computeOverviewStats(students)).toEqual({
      totalCount: 3,
      averageScore: 70,
      provisionalCount: 1,
      batchCount: 2,
    });
  });

  it("returns zeroed stats for an empty list", () => {
    expect(computeOverviewStats([])).toEqual({
      totalCount: 0,
      averageScore: 0,
      provisionalCount: 0,
      batchCount: 0,
    });
  });
});

describe("computeBatchDistribution", () => {
  it("counts Students per Batch in canonical Batch order", () => {
    const students = [
      buildStudent({ rollNumber: "1", batch: "T2" }),
      buildStudent({ rollNumber: "2", batch: "S1" }),
      buildStudent({ rollNumber: "3", batch: "S1" }),
      buildStudent({ rollNumber: "4", batch: "T1" }),
    ];

    expect(computeBatchDistribution(students)).toEqual([
      { batch: "S1", count: 2 },
      { batch: "T1", count: 1 },
      { batch: "T2", count: 1 },
    ]);
  });

  it("omits Batches with zero Students rather than listing them at count 0", () => {
    const students = [buildStudent({ rollNumber: "1", batch: "T12" })];

    expect(computeBatchDistribution(students)).toEqual([
      { batch: "T12", count: 1 },
    ]);
  });
});
