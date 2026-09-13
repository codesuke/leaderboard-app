import { describe, expect, it } from "vitest";
import type { RankedStudent } from "./ranking";
import { sortByColumn } from "./sorting";

function buildRankedStudent(overrides: Partial<RankedStudent>): RankedStudent {
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
    rankInBatch: 1,
    rankOverall: 1,
    ...overrides,
  };
}

describe("sortByColumn", () => {
  it("sorts ascending by a numeric column (score)", () => {
    const high = buildRankedStudent({ rollNumber: "1", score: 90 });
    const low = buildRankedStudent({ rollNumber: "2", score: 10 });

    expect(
      sortByColumn([high, low], "score", "asc").map((s) => s.rollNumber)
    ).toEqual(["2", "1"]);
  });

  it("sorts descending by a numeric column (score)", () => {
    const high = buildRankedStudent({ rollNumber: "1", score: 90 });
    const low = buildRankedStudent({ rollNumber: "2", score: 10 });

    expect(
      sortByColumn([low, high], "score", "desc").map((s) => s.rollNumber)
    ).toEqual(["1", "2"]);
  });

  it("sorts by a string column (name) case-insensitively", () => {
    const zed = buildRankedStudent({ rollNumber: "1", name: "zed" });
    const amy = buildRankedStudent({ rollNumber: "2", name: "Amy" });

    expect(
      sortByColumn([zed, amy], "name", "asc").map((s) => s.rollNumber)
    ).toEqual(["2", "1"]);
  });

  it("sorts by rankOverall", () => {
    const rank2 = buildRankedStudent({ rollNumber: "1", rankOverall: 2 });
    const rank1 = buildRankedStudent({ rollNumber: "2", rankOverall: 1 });

    expect(
      sortByColumn([rank2, rank1], "rankOverall", "asc").map(
        (s) => s.rollNumber
      )
    ).toEqual(["2", "1"]);
  });
});
