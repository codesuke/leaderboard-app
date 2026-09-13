import { describe, expect, it } from "vitest";
import type { Student, StudentProgress } from "./students";
import {
  describeActiveFilters,
  filterStudents,
  getCodingGradeMovementDirection,
  getMovementDirection,
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
    assessmentFlags: [],
    currentPpeAttendance: null,
    offlineProblem1Attempted: null,
    progress: null,
    ...overrides,
  };
}

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

  it("filters by a multi-select Old Batch set, symmetric to the Batch filter", () => {
    const oldT3 = buildStudent({ rollNumber: "1", oldBatch: "T3" });
    const oldS1 = buildStudent({ rollNumber: "2", oldBatch: "S1" });

    expect(filterStudents([oldT3, oldS1], { oldBatches: ["T3"] })).toEqual([
      oldT3,
    ]);
  });

  it("combines Old Batch and current Batch filters with AND semantics", () => {
    const match = buildStudent({
      rollNumber: "1",
      oldBatch: "T3",
      batch: "S1",
    });
    const wrongCurrent = buildStudent({
      rollNumber: "2",
      oldBatch: "T3",
      batch: "S2",
    });

    expect(
      filterStudents([match, wrongCurrent], {
        oldBatches: ["T3"],
        batches: ["S1"],
      })
    ).toEqual([match]);
  });

  it("filters by movementDirection", () => {
    const movedUp = buildStudent({
      rollNumber: "1",
      progress: buildProgress({
        batchMovement: { from: "T3", to: "S1", tiersMoved: 2 },
      }),
    });
    const movedDown = buildStudent({
      rollNumber: "2",
      progress: buildProgress({
        batchMovement: { from: "S1", to: "T3", tiersMoved: -2 },
      }),
    });
    const stayed = buildStudent({
      rollNumber: "3",
      progress: buildProgress({
        batchMovement: { from: "T3", to: "T3", tiersMoved: 0 },
      }),
    });
    const oneSided = buildStudent({ rollNumber: "4", progress: null });

    const students = [movedUp, movedDown, stayed, oneSided];
    expect(filterStudents(students, { movementDirection: "up" })).toEqual([
      movedUp,
    ]);
    expect(filterStudents(students, { movementDirection: "down" })).toEqual([
      movedDown,
    ]);
    expect(filterStudents(students, { movementDirection: "stayed" })).toEqual([
      stayed,
    ]);
    expect(filterStudents(students, { movementDirection: "oneSided" })).toEqual(
      [oneSided]
    );
  });

  it("filters by codingGradeMovement, excluding one-sided Students from every bucket", () => {
    const improved = buildStudent({
      rollNumber: "1",
      progress: buildProgress({
        codingGradeMovement: { from: "Beginner", to: "Expert" },
      }),
    });
    const regressed = buildStudent({
      rollNumber: "2",
      progress: buildProgress({
        codingGradeMovement: { from: "Expert", to: "Beginner" },
      }),
    });
    const same = buildStudent({
      rollNumber: "3",
      progress: buildProgress({
        codingGradeMovement: { from: "Learner", to: "Learner" },
      }),
    });
    const oneSided = buildStudent({ rollNumber: "4", progress: null });

    const students = [improved, regressed, same, oneSided];
    expect(
      filterStudents(students, { codingGradeMovement: "improved" })
    ).toEqual([improved]);
    expect(
      filterStudents(students, { codingGradeMovement: "regressed" })
    ).toEqual([regressed]);
    expect(filterStudents(students, { codingGradeMovement: "same" })).toEqual([
      same,
    ]);
  });

  it("filters to only Students with an assessment flag", () => {
    const flagged = buildStudent({
      rollNumber: "1",
      assessmentFlags: ["Suspicious"],
    });
    const clean = buildStudent({ rollNumber: "2", assessmentFlags: [] });

    expect(filterStudents([flagged, clean], { flaggedOnly: true })).toEqual([
      flagged,
    ]);
  });

  it("filters by an inclusive PPE Attendance range", () => {
    const low = buildStudent({ rollNumber: "1", currentPpeAttendance: 40 });
    const high = buildStudent({ rollNumber: "2", currentPpeAttendance: 90 });

    expect(
      filterStudents([low, high], {
        ppeAttendanceMin: 80,
        ppeAttendanceMax: 100,
      })
    ).toEqual([high]);
  });

  it("filters by whether the offline round was attempted", () => {
    const attempted = buildStudent({
      rollNumber: "1",
      offlineProblem1Attempted: true,
    });
    const skipped = buildStudent({
      rollNumber: "2",
      offlineProblem1Attempted: false,
    });
    const unknown = buildStudent({
      rollNumber: "3",
      offlineProblem1Attempted: null,
    });

    expect(
      filterStudents([attempted, skipped, unknown], {
        offlineAttempted: false,
      })
    ).toEqual([skipped]);
  });

  it("filters by a Batch tier range", () => {
    const s1 = buildStudent({ rollNumber: "1", batch: "S1" });
    const t2 = buildStudent({ rollNumber: "2", batch: "T2" });
    const t5 = buildStudent({ rollNumber: "3", batch: "T5" });

    expect(
      filterStudents([s1, t2, t5], { batchTierMin: "S2", batchTierMax: "T3" })
    ).toEqual([t2]);
  });

  it("excludes a Student with no current Batch from any Batch tier range", () => {
    const noBatch = buildStudent({ rollNumber: "1", batch: null });

    expect(
      filterStudents([noBatch], { batchTierMin: "S1", batchTierMax: "T13" })
    ).toEqual([]);
  });

  it("applies the Flagged Students preset as an OR of flagged and regressed, not an AND", () => {
    const flaggedOnly = buildStudent({
      rollNumber: "1",
      assessmentFlags: ["Mobile Phone"],
      progress: buildProgress({
        codingGradeMovement: { from: "Learner", to: "Learner" },
      }),
    });
    const regressedOnly = buildStudent({
      rollNumber: "2",
      assessmentFlags: [],
      progress: buildProgress({
        codingGradeMovement: { from: "Expert", to: "Beginner" },
      }),
    });
    const neither = buildStudent({
      rollNumber: "3",
      assessmentFlags: [],
      progress: buildProgress({
        codingGradeMovement: { from: "Learner", to: "Learner" },
      }),
    });

    expect(
      filterStudents([flaggedOnly, regressedOnly, neither], {
        flaggedPreset: true,
      })
    ).toEqual([flaggedOnly, regressedOnly]);
  });
});

describe("getMovementDirection", () => {
  it("returns oneSided for a Student with no progress", () => {
    expect(getMovementDirection(buildStudent({ progress: null }))).toBe(
      "oneSided"
    );
  });
});

describe("getCodingGradeMovementDirection", () => {
  it("returns null for a Student with no progress", () => {
    expect(
      getCodingGradeMovementDirection(buildStudent({ progress: null }))
    ).toBeNull();
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

  it("describes an Old Batch selection", () => {
    expect(describeActiveFilters({ oldBatches: ["T3"] })).toEqual([
      { key: "oldBatches", label: "Old Batch: T3" },
    ]);
  });

  it("describes a movement direction", () => {
    expect(describeActiveFilters({ movementDirection: "up" })).toEqual([
      { key: "movementDirection", label: "Movement: Moved Up" },
    ]);
  });

  it("describes a Coding Grade movement", () => {
    expect(describeActiveFilters({ codingGradeMovement: "regressed" })).toEqual(
      [
        {
          key: "codingGradeMovement",
          label: "Coding Grade Movement: regressed",
        },
      ]
    );
  });

  it("describes Flagged only", () => {
    expect(describeActiveFilters({ flaggedOnly: true })).toEqual([
      { key: "flaggedOnly", label: "Flagged only" },
    ]);
  });

  it("describes a PPE Attendance range", () => {
    expect(
      describeActiveFilters({ ppeAttendanceMin: 40, ppeAttendanceMax: 80 })
    ).toEqual([{ key: "ppeAttendance", label: "PPE Attendance: 40–80" }]);
  });

  it("describes an offline attempted filter", () => {
    expect(describeActiveFilters({ offlineAttempted: false })).toEqual([
      { key: "offlineAttempted", label: "Offline Round: Not Attempted" },
    ]);
  });

  it("describes a Batch tier range", () => {
    expect(
      describeActiveFilters({ batchTierMin: "S1", batchTierMax: "S2" })
    ).toEqual([{ key: "batchTier", label: "Batch Tier: S1 – S2" }]);
  });

  it("describes the Flagged Students preset", () => {
    expect(describeActiveFilters({ flaggedPreset: true })).toEqual([
      { key: "flaggedPreset", label: "Flagged Students" },
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

  it("clears both bounds of the PPE Attendance range together", () => {
    const filters: StudentFilters = {
      ppeAttendanceMin: 40,
      ppeAttendanceMax: 80,
      search: "vedant",
    };
    expect(removeFilterChip(filters, "ppeAttendance")).toEqual({
      search: "vedant",
    });
  });

  it("clears both bounds of the Batch Tier range together", () => {
    const filters: StudentFilters = {
      batchTierMin: "S1",
      batchTierMax: "S2",
      search: "vedant",
    };
    expect(removeFilterChip(filters, "batchTier")).toEqual({
      search: "vedant",
    });
  });
});
