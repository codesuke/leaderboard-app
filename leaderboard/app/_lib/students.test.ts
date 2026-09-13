import { describe, expect, it } from "vitest";
import {
  computeBatchMovement,
  loadStudents,
  parseStudentRow,
  parseStudentsJson,
  parseTrainingGroup,
  type RawStudentRow,
} from "./students";

describe("parseTrainingGroup", () => {
  it("normalizes a plain training group into its Batch, not provisional", () => {
    expect(parseTrainingGroup("EM-T12")).toEqual({
      batch: "T12",
      provisional: false,
    });
  });

  it("marks a _Temp-suffixed training group as provisional, stripping the suffix from the Batch", () => {
    expect(parseTrainingGroup("EM-T12_Temp")).toEqual({
      batch: "T12",
      provisional: true,
    });
  });

  it("still parses a training group missing the EM- prefix", () => {
    expect(parseTrainingGroup("T5_Temp")).toEqual({
      batch: "T5",
      provisional: true,
    });
  });
});

const FULL_ROW: RawStudentRow = {
  S_No: "1",
  University_Roll_No: "2401330120211",
  Name: "VEDANT PANDEY",
  Branch: "CS",
  Status: "Very Sincere",
  P_Test_1: "98.1",
  P_Test_2: "96.67",
  P_Test_3: "92.14",
  P_Test_4: "86.43",
  M_Test_5: "99.05",
  Attendance_in_Assessment: "5",
  Online_Assessment_Grade_80: "79.3",
  Written_Grade: "A",
  Written_Score_20: "20",
  Final_Score_100: "99.3",
  Coding_Grade: "Proficient",
  Training_Group: "EM-S1",
  Sep_Training_Group: "EM-S1",
  Sep_Coding_Grade: "Expert",
  Sep_Final_Score_AS: "210.8",
  Sep_Coding_17Aug: "120",
  Sep_Coding_18Aug: "115",
  Sep_Coding_3Sep: "118",
  Sep_Remark_17Aug: "",
  Sep_Remark_18Aug: "",
  Sep_Ppe_Attendance: "60",
  Sep_Offline_Problem1_Attempted: "Yes",
};

describe("parseStudentRow", () => {
  it("parses a row present in both snapshots into a typed Student with old and current fields", () => {
    expect(parseStudentRow(FULL_ROW)).toEqual({
      rollNumber: "2401330120211",
      name: "VEDANT PANDEY",
      branch: "CS",
      batch: "S1",
      provisional: false,
      score: 210.8,
      attendanceStatus: "Very Sincere",
      assessmentAttendance: 5,
      codingGrade: "Proficient",
      testScores: {
        practiceTest1: 98.1,
        practiceTest2: 96.67,
        practiceTest3: 92.14,
        practiceTest4: 86.43,
        mockTest: 99.05,
        onlineAssessment: 79.3,
        written: 20,
      },
      oldBatch: "S1",
      oldProvisional: false,
      oldScore: 99.3,
      assessmentFlags: [],
      currentPpeAttendance: 60,
      offlineProblem1Attempted: true,
      progress: {
        batchMovement: { from: "S1", to: "S1", tiersMoved: 0 },
        codingGradeMovement: { from: "Proficient", to: "Expert" },
        codingScoreTrend: [
          { date: "2026-08-17", score: 120 },
          { date: "2026-08-18", score: 115 },
          { date: "2026-09-03", score: 118 },
        ],
        rawScoreDelta: 210.8 - 99.3,
      },
    });
  });

  it("parses combined and single-remark assessment flags into a flat, de-duplicated list", () => {
    const combined = parseStudentRow({
      ...FULL_ROW,
      Sep_Remark_17Aug: "Suspicious",
      Sep_Remark_18Aug: "Suspicious+Mobile Phone",
    });
    expect(combined.assessmentFlags).toEqual(["Suspicious", "Mobile Phone"]);

    const single = parseStudentRow({
      ...FULL_ROW,
      Sep_Remark_17Aug: "",
      Sep_Remark_18Aug: "Mobile Phone",
    });
    expect(single.assessmentFlags).toEqual(["Mobile Phone"]);
  });

  it("has no assessment flags when both remark columns are blank", () => {
    expect(parseStudentRow(FULL_ROW).assessmentFlags).toEqual([]);
  });

  it("parses offlineProblem1Attempted as null for Unknown or missing values", () => {
    expect(
      parseStudentRow({
        ...FULL_ROW,
        Sep_Offline_Problem1_Attempted: "Unknown",
      }).offlineProblem1Attempted
    ).toBeNull();
    expect(
      parseStudentRow({ ...FULL_ROW, Sep_Offline_Problem1_Attempted: "" })
        .offlineProblem1Attempted
    ).toBeNull();
  });

  it("parses offlineProblem1Attempted as false for a No/NO value", () => {
    expect(
      parseStudentRow({ ...FULL_ROW, Sep_Offline_Problem1_Attempted: "NO" })
        .offlineProblem1Attempted
    ).toBe(false);
  });

  it("marks a _Temp-suffixed September Batch as currently provisional", () => {
    const row = { ...FULL_ROW, Sep_Training_Group: "EM-T3_Temp" };

    const student = parseStudentRow(row);

    expect(student.batch).toBe("T3");
    expect(student.provisional).toBe(true);
  });

  it("computes tiersMoved toward S1 as a positive move up", () => {
    const row = {
      ...FULL_ROW,
      Training_Group: "EM-T3",
      Sep_Training_Group: "EM-S1",
    };

    expect(parseStudentRow(row).progress?.batchMovement).toEqual({
      from: "T3",
      to: "S1",
      tiersMoved: 4,
    });
  });

  it("computes tiersMoved away from S1 as a negative move down", () => {
    const row = {
      ...FULL_ROW,
      Training_Group: "EM-S1",
      Sep_Training_Group: "EM-T3",
    };

    expect(parseStudentRow(row).progress?.batchMovement).toEqual({
      from: "S1",
      to: "T3",
      tiersMoved: -4,
    });
  });

  it("places a Student in the new T13 tier introduced by the September cohort", () => {
    const row = { ...FULL_ROW, Sep_Training_Group: "EM-T13" };

    expect(parseStudentRow(row).batch).toBe("T13");
  });

  it("records null, not 0, for a coding assessment date with no score", () => {
    const row = { ...FULL_ROW, Sep_Coding_3Sep: "" };

    expect(parseStudentRow(row).progress?.codingScoreTrend).toEqual([
      { date: "2026-08-17", score: 120 },
      { date: "2026-08-18", score: 115 },
      { date: "2026-09-03", score: null },
    ]);
  });

  it("produces a Student with null current fields and no progress when only present in the July snapshot", () => {
    const row: RawStudentRow = {
      University_Roll_No: "2401330120211",
      Name: "VEDANT PANDEY",
      Branch: "CS",
      Status: "Very Sincere",
      P_Test_1: "98.1",
      P_Test_2: "96.67",
      P_Test_3: "92.14",
      P_Test_4: "86.43",
      M_Test_5: "99.05",
      Attendance_in_Assessment: "5",
      Online_Assessment_Grade_80: "79.3",
      Written_Grade: "A",
      Written_Score_20: "20",
      Final_Score_100: "99.3",
      Coding_Grade: "Proficient",
      Training_Group: "EM-S1",
    };

    expect(parseStudentRow(row)).toEqual({
      rollNumber: "2401330120211",
      name: "VEDANT PANDEY",
      branch: "CS",
      batch: null,
      provisional: null,
      score: null,
      attendanceStatus: "Very Sincere",
      assessmentAttendance: 5,
      codingGrade: "Proficient",
      testScores: {
        practiceTest1: 98.1,
        practiceTest2: 96.67,
        practiceTest3: 92.14,
        practiceTest4: 86.43,
        mockTest: 99.05,
        onlineAssessment: 79.3,
        written: 20,
      },
      oldBatch: "S1",
      oldProvisional: false,
      oldScore: 99.3,
      assessmentFlags: [],
      currentPpeAttendance: null,
      offlineProblem1Attempted: null,
      progress: null,
    });
  });

  it("produces a Student with null old fields and no progress when only present in the September snapshot", () => {
    const row: RawStudentRow = {
      University_Roll_No: "2501331539015",
      Name: "SHIVAM",
      Branch: "CS",
      Sep_Training_Group: "EM-T5",
      Sep_Coding_Grade: "Learner",
      Sep_Final_Score_AS: "150",
      Sep_Coding_17Aug: "90",
      Sep_Coding_18Aug: "95",
      Sep_Coding_3Sep: "100",
    };

    expect(parseStudentRow(row)).toEqual({
      rollNumber: "2501331539015",
      name: "SHIVAM",
      branch: "CS",
      batch: "T5",
      provisional: false,
      score: 150,
      attendanceStatus: null,
      assessmentAttendance: null,
      codingGrade: null,
      testScores: null,
      oldBatch: null,
      oldProvisional: null,
      oldScore: null,
      assessmentFlags: [],
      currentPpeAttendance: null,
      offlineProblem1Attempted: null,
      progress: null,
    });
  });
});

describe("computeBatchMovement", () => {
  it("reports tiersMoved: 0 for a Student who stayed in the same Batch", () => {
    expect(computeBatchMovement("T5", "T5")).toEqual({
      from: "T5",
      to: "T5",
      tiersMoved: 0,
    });
  });
});

describe("loadStudents", () => {
  it("parses full CSV text (header + rows) into Students, in row order", () => {
    const headers = Object.keys(FULL_ROW).join(",");
    const values = Object.values(FULL_ROW).join(",");
    const csvText = [headers, values].join("\n");

    const students = loadStudents(csvText);

    expect(students).toHaveLength(1);
    expect(students[0].rollNumber).toBe("2401330120211");
    expect(students[0].batch).toBe("S1");
    expect(students[0].oldBatch).toBe("S1");
  });

  it("parses CSV text using CRLF line endings, as the real source file does", () => {
    const headers = Object.keys(FULL_ROW).join(",");
    const values = Object.values(FULL_ROW).join(",");
    const csvText = [headers, values].join("\r\n");

    expect(loadStudents(csvText)).toHaveLength(1);
  });
});

describe("parseStudentsJson", () => {
  it("parses a JSON array of merged raw rows into Students, in array order", () => {
    const jsonText = JSON.stringify([FULL_ROW]);

    const students = parseStudentsJson(jsonText);

    expect(students).toHaveLength(1);
    expect(students[0].rollNumber).toBe("2401330120211");
    expect(students[0].progress?.rawScoreDelta).toBeCloseTo(111.5);
  });
});
