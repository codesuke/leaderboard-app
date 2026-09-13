import { describe, expect, it } from "vitest";
import type { Student } from "./students";
import { rankStudents } from "./ranking";

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

describe("rankStudents", () => {
  it("orders by Batch before Score, even when a later Batch has a higher Score", () => {
    const lowScoreS1 = buildStudent({
      rollNumber: "1",
      batch: "S1",
      score: 10,
    });
    const highScoreT1 = buildStudent({
      rollNumber: "2",
      batch: "T1",
      score: 99,
    });

    const ranked = rankStudents([highScoreT1, lowScoreS1]);

    expect(ranked.map((s) => s.rollNumber)).toEqual(["1", "2"]);
  });

  it("orders by Score descending within the same Batch", () => {
    const lowScore = buildStudent({ rollNumber: "1", batch: "T3", score: 40 });
    const highScore = buildStudent({ rollNumber: "2", batch: "T3", score: 95 });

    const ranked = rankStudents([lowScore, highScore]);

    expect(ranked.map((s) => s.rollNumber)).toEqual(["2", "1"]);
  });

  it("assigns rankOverall sequentially across the whole sorted list, ignoring Batch boundaries", () => {
    const s1 = buildStudent({ rollNumber: "1", batch: "S1", score: 90 });
    const s2 = buildStudent({ rollNumber: "2", batch: "T1", score: 80 });
    const s3 = buildStudent({ rollNumber: "3", batch: "T1", score: 70 });

    const ranked = rankStudents([s3, s1, s2]);

    expect(ranked.map((s) => s.rankOverall)).toEqual([1, 2, 3]);
  });

  it("resets rankInBatch to 1 at the start of each new Batch", () => {
    const s1 = buildStudent({ rollNumber: "1", batch: "S1", score: 90 });
    const t1a = buildStudent({ rollNumber: "2", batch: "T1", score: 80 });
    const t1b = buildStudent({ rollNumber: "3", batch: "T1", score: 70 });

    const ranked = rankStudents([t1b, s1, t1a]);

    expect(ranked.map((s) => s.rankInBatch)).toEqual([1, 1, 2]);
  });

  it("orders T1 before T10, T11, and T12 (guards against alphabetical sort)", () => {
    const t12 = buildStudent({ rollNumber: "1", batch: "T12", score: 50 });
    const t11 = buildStudent({ rollNumber: "2", batch: "T11", score: 50 });
    const t10 = buildStudent({ rollNumber: "3", batch: "T10", score: 50 });
    const t1 = buildStudent({ rollNumber: "4", batch: "T1", score: 50 });

    const ranked = rankStudents([t12, t11, t10, t1]);

    expect(ranked.map((s) => s.batch)).toEqual(["T1", "T10", "T11", "T12"]);
  });
});
