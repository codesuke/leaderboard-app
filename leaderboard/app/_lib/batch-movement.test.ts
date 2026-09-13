import { describe, expect, it } from "vitest";
import {
  computeBatchSizeComparison,
  computeMovementMatrix,
  computeNetMovementSummary,
  filterByBranch,
  getStudentsForMove,
} from "./batch-movement";
import { BATCH_ORDER } from "./ranking";
import type { Batch, CodingGrade, Student, StudentProgress } from "./students";

function buildProgress(
  overrides: Partial<StudentProgress> = {}
): StudentProgress {
  return {
    batchMovement: { from: "T3", to: "T3", tiersMoved: 0 },
    codingGradeMovement: { from: "Learner", to: "Learner" },
    codingScoreTrend: [
      { date: "2026-08-17", score: 100 },
      { date: "2026-08-18", score: 100 },
      { date: "2026-09-03", score: 100 },
    ],
    rawScoreDelta: 0,
    ...overrides,
  };
}

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
    oldBatch: "T1",
    oldProvisional: false,
    oldScore: 50,
    assessmentFlags: [],
    currentPpeAttendance: null,
    offlineProblem1Attempted: null,
    progress: buildProgress(),
    ...overrides,
  };
}

function movedStudent(
  rollNumber: string,
  from: Batch,
  to: Batch,
  codingGrade: CodingGrade = "Learner"
): Student {
  const tiersMoved = BATCH_ORDER.indexOf(from) - BATCH_ORDER.indexOf(to);

  return buildStudent({
    rollNumber,
    oldBatch: from,
    batch: to,
    codingGrade,
    progress: buildProgress({ batchMovement: { from, to, tiersMoved } }),
  });
}

describe("computeBatchSizeComparison", () => {
  it("reports oldCount, currentCount, and delta for a Batch present in both snapshots", () => {
    const students = [
      movedStudent("1", "T1", "T1"),
      movedStudent("2", "T1", "T1"),
      movedStudent("3", "S1", "T1"),
    ];

    const comparison = computeBatchSizeComparison(students);
    const t1 = comparison.find((entry) => entry.batch === "T1")!;

    expect(t1).toEqual({
      batch: "T1",
      oldCount: 2,
      currentCount: 3,
      delta: 1,
      oldUnavailable: false,
      currentUnavailable: false,
    });
  });

  it("flags T13 as unavailable on the July side, not just zero, since it's September-only", () => {
    const students = [movedStudent("1", "T12", "T13")];

    const comparison = computeBatchSizeComparison(students);
    const t13 = comparison.find((entry) => entry.batch === "T13")!;

    expect(t13).toEqual({
      batch: "T13",
      oldCount: 0,
      currentCount: 1,
      delta: 1,
      oldUnavailable: true,
      currentUnavailable: false,
    });
  });

  it("still includes a Batch with zero Students on both sides", () => {
    const comparison = computeBatchSizeComparison([]);
    const s2 = comparison.find((entry) => entry.batch === "S2")!;

    expect(s2).toEqual({
      batch: "S2",
      oldCount: 0,
      currentCount: 0,
      delta: 0,
      oldUnavailable: false,
      currentUnavailable: false,
    });
  });

  it("covers every Batch in BATCH_ORDER, including T13", () => {
    const comparison = computeBatchSizeComparison([]);
    expect(comparison.map((entry) => entry.batch)).toEqual([
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
      "T13",
    ]);
  });
});

describe("computeMovementMatrix", () => {
  it("counts a Student who stayed as a diagonal entry", () => {
    const students = [movedStudent("1", "T3", "T3")];

    const matrix = computeMovementMatrix(students);

    expect(matrix.entries).toContainEqual({ from: "T3", to: "T3", count: 1 });
  });

  it("counts a Student who moved up and a Student who moved down as separate off-diagonal entries", () => {
    const students = [
      movedStudent("1", "T3", "S1"),
      movedStudent("2", "S1", "T3"),
    ];

    const matrix = computeMovementMatrix(students);

    expect(matrix.entries).toContainEqual({ from: "T3", to: "S1", count: 1 });
    expect(matrix.entries).toContainEqual({ from: "S1", to: "T3", count: 1 });
  });

  it("aggregates multiple Students making the same move into one entry", () => {
    const students = [
      movedStudent("1", "T3", "S1"),
      movedStudent("2", "T3", "S1"),
    ];

    const matrix = computeMovementMatrix(students);

    expect(matrix.entries).toEqual([{ from: "T3", to: "S1", count: 2 }]);
  });

  it("omits pairs with no Students from entries, exposing the full Batch axis separately", () => {
    const students = [movedStudent("1", "T3", "T3")];

    const matrix = computeMovementMatrix(students);

    expect(matrix.entries).toHaveLength(1);
    expect(matrix.batches).toContain("T13");
    expect(matrix.batches).toHaveLength(15);
  });

  it("excludes one-sided Students, who have no Old Batch x Current Batch pair", () => {
    const students = [
      buildStudent({
        rollNumber: "1",
        oldBatch: null,
        batch: "T3",
        progress: null,
      }),
      buildStudent({
        rollNumber: "2",
        oldBatch: "T3",
        batch: null,
        progress: null,
      }),
    ];

    const matrix = computeMovementMatrix(students);

    expect(matrix.entries).toEqual([]);
  });
});

describe("computeNetMovementSummary", () => {
  it("buckets Students into movedUp, movedDown, stayed, and oneSided", () => {
    const students = [
      movedStudent("1", "T3", "S1"), // moved up
      movedStudent("2", "S1", "T3"), // moved down
      movedStudent("3", "T3", "T3"), // stayed
      buildStudent({
        rollNumber: "4",
        oldBatch: null,
        batch: "T3",
        progress: null,
      }), // one-sided
    ];

    expect(computeNetMovementSummary(students)).toEqual({
      movedUp: 1,
      movedDown: 1,
      stayed: 1,
      oneSided: 1,
    });
  });

  it("counts a one-sided Student separately, never folding it into movedUp/movedDown/stayed", () => {
    const students = [
      buildStudent({
        rollNumber: "1",
        oldBatch: "T3",
        batch: null,
        progress: null,
      }),
    ];

    expect(computeNetMovementSummary(students)).toEqual({
      movedUp: 0,
      movedDown: 0,
      stayed: 0,
      oneSided: 1,
    });
  });
});

describe("getStudentsForMove", () => {
  it("returns the Students who made a real move from one Batch to another", () => {
    const students = [
      movedStudent("1", "T3", "S1"),
      movedStudent("2", "T3", "S1"),
      movedStudent("3", "T3", "S2"),
    ];

    expect(getStudentsForMove(students, "T3", "S1")).toEqual([
      students[0],
      students[1],
    ]);
  });

  it("returns the Students who stayed, for a diagonal cell", () => {
    const stayed = movedStudent("1", "T3", "T3");
    const moved = movedStudent("2", "T3", "S1");

    expect(getStudentsForMove([stayed, moved], "T3", "T3")).toEqual([stayed]);
  });

  it("returns an empty list for a move nobody made", () => {
    const students = [movedStudent("1", "T3", "S1")];

    expect(getStudentsForMove(students, "S2", "T5")).toEqual([]);
  });
});

describe("filterByBranch", () => {
  it("returns every Student when no Branch is selected", () => {
    const students = [
      buildStudent({ rollNumber: "1", branch: "CS" }),
      buildStudent({ rollNumber: "2", branch: "CSE-DS" }),
    ];

    expect(filterByBranch(students, null)).toEqual(students);
  });

  it("scopes the Student list down to one Branch", () => {
    const students = [
      buildStudent({ rollNumber: "1", branch: "CS" }),
      buildStudent({ rollNumber: "2", branch: "CSE-DS" }),
    ];

    expect(filterByBranch(students, "CS")).toEqual([students[0]]);
  });

  it("produces different, correctly-scoped aggregation results per Branch", () => {
    const students = [
      movedStudent("1", "T3", "S1"),
      { ...movedStudent("2", "T3", "S1"), branch: "CSE-DS" },
    ];

    const csOnly = filterByBranch(students, "CS");

    expect(computeNetMovementSummary(csOnly).movedUp).toBe(1);
    expect(computeNetMovementSummary(students).movedUp).toBe(2);
  });
});
