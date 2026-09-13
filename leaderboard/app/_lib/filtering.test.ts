import { describe, expect, it } from "vitest";
import type { Student } from "./students";
import {
  describeActiveFilters,
  filterStudents,
  removeFilterChip,
} from "./filtering";
import type { StudentFilters } from "./filtering";

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
    progress: null,
    ...overrides,
  };
}

describe("filterStudents", () => {
  it("returns every Student when no filters are active", () => {
    const students = [
      buildStudent({ rollNumber: "1" }),
      buildStudent({ rollNumber: "2" }),
    ];

    expect(filterStudents(students, {})).toEqual(students);
  });

  it("filters by a multi-select Batch set", () => {
    const s1 = buildStudent({ rollNumber: "1", batch: "S1" });
    const t1 = buildStudent({ rollNumber: "2", batch: "T1" });
    const t2 = buildStudent({ rollNumber: "3", batch: "T2" });

    expect(filterStudents([s1, t1, t2], { batches: ["S1", "T2"] })).toEqual([
      s1,
      t2,
    ]);
  });

  it("filters by a multi-select Branch set", () => {
    const cs = buildStudent({ rollNumber: "1", branch: "CS" });
    const ai = buildStudent({ rollNumber: "2", branch: "CSE-AI" });

    expect(filterStudents([cs, ai], { branches: ["CSE-AI"] })).toEqual([ai]);
  });

  it("filters by a multi-select Attendance Status set", () => {
    const poor = buildStudent({ rollNumber: "1", attendanceStatus: "Poor" });
    const sincere = buildStudent({
      rollNumber: "2",
      attendanceStatus: "Very Sincere",
    });

    expect(
      filterStudents([poor, sincere], {
        attendanceStatuses: ["Poor", "Very Poor"],
      })
    ).toEqual([poor]);
  });

  it("filters by a multi-select Coding Grade set", () => {
    const beginner = buildStudent({ rollNumber: "1", codingGrade: "Beginner" });
    const expert = buildStudent({ rollNumber: "2", codingGrade: "Expert" });

    expect(
      filterStudents([beginner, expert], { codingGrades: ["Expert"] })
    ).toEqual([expert]);
  });

  it("filters by an inclusive Score range", () => {
    const low = buildStudent({ rollNumber: "1", score: 40 });
    const mid = buildStudent({ rollNumber: "2", score: 60 });
    const high = buildStudent({ rollNumber: "3", score: 90 });

    expect(
      filterStudents([low, mid, high], { scoreMin: 60, scoreMax: 90 })
    ).toEqual([mid, high]);
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
    const vedant = buildStudent({
      rollNumber: "2401330120211",
      name: "VEDANT PANDEY",
    });
    const other = buildStudent({
      rollNumber: "9999999999999",
      name: "SOMEONE ELSE",
    });

    expect(filterStudents([vedant, other], { search: "vedant" })).toEqual([
      vedant,
    ]);
    expect(filterStudents([vedant, other], { search: "0120211" })).toEqual([
      vedant,
    ]);
  });

  it("filters to only Provisional Students", () => {
    const provisional = buildStudent({ rollNumber: "1", provisional: true });
    const regular = buildStudent({ rollNumber: "2", provisional: false });

    expect(
      filterStudents([provisional, regular], { provisionalOnly: true })
    ).toEqual([provisional]);
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

describe("describeActiveFilters", () => {
  it("returns no chips when no filters are active", () => {
    expect(describeActiveFilters({})).toEqual([]);
  });

  it("describes a Batch selection", () => {
    expect(describeActiveFilters({ batches: ["S1", "T2"] })).toEqual([
      { key: "batches", label: "Batch: S1, T2" },
    ]);
  });

  it("describes a Branch selection", () => {
    expect(describeActiveFilters({ branches: ["CS", "CSE-AI"] })).toEqual([
      { key: "branches", label: "Branch: CS, CSE-AI" },
    ]);
  });

  it("describes an Attendance Status selection", () => {
    expect(describeActiveFilters({ attendanceStatuses: ["Poor"] })).toEqual([
      { key: "attendanceStatuses", label: "Attendance Status: Poor" },
    ]);
  });

  it("describes a Coding Grade selection", () => {
    expect(
      describeActiveFilters({ codingGrades: ["Expert", "Proficient"] })
    ).toEqual([
      { key: "codingGrades", label: "Coding Grade: Expert, Proficient" },
    ]);
  });

  it("describes a full Score range", () => {
    expect(describeActiveFilters({ scoreMin: 40, scoreMax: 80 })).toEqual([
      { key: "score", label: "Score: 40–80" },
    ]);
  });

  it("describes a partial Score range using the slider's implicit bounds", () => {
    expect(describeActiveFilters({ scoreMin: 60 })).toEqual([
      { key: "score", label: "Score: 60–100" },
    ]);
  });

  it("describes a Roll Number range", () => {
    expect(
      describeActiveFilters({
        rollNumberMin: "2401330120100",
        rollNumberMax: "2401330120200",
      })
    ).toEqual([
      {
        key: "rollNumber",
        label: "Roll Number: 2401330120100 – 2401330120200",
      },
    ]);
  });

  it("describes a Search term", () => {
    expect(describeActiveFilters({ search: "vedant" })).toEqual([
      { key: "search", label: 'Search: "vedant"' },
    ]);
  });

  it("describes Provisional only", () => {
    expect(describeActiveFilters({ provisionalOnly: true })).toEqual([
      { key: "provisionalOnly", label: "Provisional only" },
    ]);
  });

  it("combines multiple active filters into multiple chips, in a stable order", () => {
    expect(
      describeActiveFilters({
        batches: ["S1"],
        search: "vedant",
        provisionalOnly: true,
      })
    ).toEqual([
      { key: "batches", label: "Batch: S1" },
      { key: "search", label: 'Search: "vedant"' },
      { key: "provisionalOnly", label: "Provisional only" },
    ]);
  });
});

describe("removeFilterChip", () => {
  it("clears a multi-select dimension without touching other filters", () => {
    const filters: StudentFilters = { batches: ["S1"], search: "vedant" };
    expect(removeFilterChip(filters, "batches")).toEqual({ search: "vedant" });
  });

  it("clears both bounds of the Score range together", () => {
    const filters: StudentFilters = {
      scoreMin: 40,
      scoreMax: 80,
      search: "vedant",
    };
    expect(removeFilterChip(filters, "score")).toEqual({ search: "vedant" });
  });

  it("clears both bounds of the Roll Number range together", () => {
    const filters: StudentFilters = {
      rollNumberMin: "1",
      rollNumberMax: "2",
      provisionalOnly: true,
    };
    expect(removeFilterChip(filters, "rollNumber")).toEqual({
      provisionalOnly: true,
    });
  });
});
