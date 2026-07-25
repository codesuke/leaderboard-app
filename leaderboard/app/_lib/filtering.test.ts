import { describe, expect, it } from "vitest";
import type { Student } from "./students";
import { filterStudents } from "./filtering";

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
    ...overrides,
  };
}

describe("filterStudents", () => {
  it("returns every Student when no filters are active", () => {
    const students = [buildStudent({ rollNumber: "1" }), buildStudent({ rollNumber: "2" })];

    expect(filterStudents(students, {})).toEqual(students);
  });

  it("filters by a multi-select Batch set", () => {
    const s1 = buildStudent({ rollNumber: "1", batch: "S1" });
    const t1 = buildStudent({ rollNumber: "2", batch: "T1" });
    const t2 = buildStudent({ rollNumber: "3", batch: "T2" });

    expect(filterStudents([s1, t1, t2], { batches: ["S1", "T2"] })).toEqual([s1, t2]);
  });

  it("filters by a multi-select Branch set", () => {
    const cs = buildStudent({ rollNumber: "1", branch: "CS" });
    const ai = buildStudent({ rollNumber: "2", branch: "CSE-AI" });

    expect(filterStudents([cs, ai], { branches: ["CSE-AI"] })).toEqual([ai]);
  });

  it("filters by a multi-select Attendance Status set", () => {
    const poor = buildStudent({ rollNumber: "1", attendanceStatus: "Poor" });
    const sincere = buildStudent({ rollNumber: "2", attendanceStatus: "Very Sincere" });

    expect(
      filterStudents([poor, sincere], { attendanceStatuses: ["Poor", "Very Poor"] })
    ).toEqual([poor]);
  });

  it("filters by a multi-select Coding Grade set", () => {
    const beginner = buildStudent({ rollNumber: "1", codingGrade: "Beginner" });
    const expert = buildStudent({ rollNumber: "2", codingGrade: "Expert" });

    expect(filterStudents([beginner, expert], { codingGrades: ["Expert"] })).toEqual([expert]);
  });

  it("filters by an inclusive Score range", () => {
    const low = buildStudent({ rollNumber: "1", score: 40 });
    const mid = buildStudent({ rollNumber: "2", score: 60 });
    const high = buildStudent({ rollNumber: "3", score: 90 });

    expect(filterStudents([low, mid, high], { scoreMin: 60, scoreMax: 90 })).toEqual([mid, high]);
  });

  it("filters by an inclusive Roll Number range (string comparison)", () => {
    const a = buildStudent({ rollNumber: "2401330120100" });
    const b = buildStudent({ rollNumber: "2401330120200" });
    const c = buildStudent({ rollNumber: "2401330120300" });

    expect(
      filterStudents([a, b, c], {
        rollNumberMin: "2401330120150",
        rollNumberMax: "2401330120250",
      })
    ).toEqual([b]);
  });

  it("filters by a case-insensitive Name/Roll Number search substring", () => {
    const vedant = buildStudent({ rollNumber: "2401330120211", name: "VEDANT PANDEY" });
    const other = buildStudent({ rollNumber: "9999999999999", name: "SOMEONE ELSE" });

    expect(filterStudents([vedant, other], { search: "vedant" })).toEqual([vedant]);
    expect(filterStudents([vedant, other], { search: "0120211" })).toEqual([vedant]);
  });

  it("filters to only Provisional Students", () => {
    const provisional = buildStudent({ rollNumber: "1", provisional: true });
    const regular = buildStudent({ rollNumber: "2", provisional: false });

    expect(filterStudents([provisional, regular], { provisionalOnly: true })).toEqual([
      provisional,
    ]);
  });

  it("combines multiple active filters with AND semantics", () => {
    const match = buildStudent({
      rollNumber: "1",
      batch: "T1",
      branch: "CS",
      score: 70,
    });
    const wrongBatch = buildStudent({
      rollNumber: "2",
      batch: "T2",
      branch: "CS",
      score: 70,
    });
    const wrongScore = buildStudent({
      rollNumber: "3",
      batch: "T1",
      branch: "CS",
      score: 10,
    });

    expect(
      filterStudents([match, wrongBatch, wrongScore], {
        batches: ["T1"],
        branches: ["CS"],
        scoreMin: 50,
        scoreMax: 100,
      })
    ).toEqual([match]);
  });

  it("returns an empty list when filters match nothing", () => {
    const student = buildStudent({ rollNumber: "1", batch: "T1" });

    expect(filterStudents([student], { batches: ["S1"] })).toEqual([]);
  });
});
