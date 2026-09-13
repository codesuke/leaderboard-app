import { describe, expect, it } from "vitest";
import { studentsToCsv } from "./csv";
import type { RankedStudent } from "./ranking";

function buildStudent(overrides: Partial<RankedStudent>): RankedStudent {
  return {
    rollNumber: "2401330120211",
    name: "VEDANT PANDEY",
    branch: "CS",
    batch: "S1",
    provisional: false,
    score: 90,
    attendanceStatus: "Sincere",
    assessmentAttendance: 5,
    codingGrade: "Expert",
    testScores: null,
    oldBatch: "T1",
    oldProvisional: false,
    oldScore: 80,
    assessmentFlags: [],
    currentPpeAttendance: 60,
    offlineProblem1Attempted: true,
    progress: null,
    rankInBatch: 1,
    rankOverall: 1,
    ...overrides,
  };
}

describe("studentsToCsv", () => {
  it("renders the header row and one data row per Student, in order", () => {
    const students = [
      buildStudent({ rollNumber: "1", name: "A" }),
      buildStudent({ rollNumber: "2", name: "B" }),
    ];

    const csv = studentsToCsv(students);
    const lines = csv.split("\n");

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(
      "Overall Rank,Rank in Batch,Name,Roll Number,Old Batch,Current Batch,Branch,Score,Assessment Flags,PPE Attendance,Offline Problem 1 Attempted"
    );
    expect(lines[1]).toBe("1,1,A,1,T1,S1,CS,90,,60,Yes");
    expect(lines[2]).toBe("1,1,B,2,T1,S1,CS,90,,60,Yes");
  });

  it("quotes a field containing a comma, doubling any embedded quote", () => {
    const students = [
      buildStudent({
        rollNumber: "1",
        name: 'Anisha "AJ", Kumar',
      }),
    ];

    const csv = studentsToCsv(students);
    const dataRow = csv.split("\n")[1];

    expect(dataRow).toBe('1,1,"Anisha ""AJ"", Kumar",1,T1,S1,CS,90,,60,Yes');
  });

  it("renders null fields as empty and multiple flags joined by semicolons", () => {
    const students = [
      buildStudent({
        rollNumber: "1",
        score: null,
        assessmentFlags: ["Suspicious", "Mobile Phone"],
        currentPpeAttendance: null,
        offlineProblem1Attempted: null,
      }),
    ];

    const dataRow = studentsToCsv(students).split("\n")[1];

    expect(dataRow).toBe(
      "1,1,VEDANT PANDEY,1,T1,S1,CS,,Suspicious; Mobile Phone,,"
    );
  });

  it("renders just a header row for an empty list", () => {
    expect(studentsToCsv([]).split("\n")).toHaveLength(1);
  });
});
