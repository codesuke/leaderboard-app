import { describe, expect, it } from "vitest";
import { loadStudents, parseStudentRow, parseTrainingGroup } from "./students";

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

describe("parseStudentRow", () => {
  it("parses a normal row into a typed Student", () => {
    const row = {
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
      Coding_Grade: "Expert",
      Training_Group: "EM-S1",
    };

    expect(parseStudentRow(row)).toEqual({
      rollNumber: "2401330120211",
      name: "VEDANT PANDEY",
      branch: "CS",
      batch: "S1",
      provisional: false,
      score: 99.3,
      attendanceStatus: "Very Sincere",
      assessmentAttendance: 5,
      codingGrade: "Expert",
      testScores: {
        practiceTest1: 98.1,
        practiceTest2: 96.67,
        practiceTest3: 92.14,
        practiceTest4: 86.43,
        mockTest: 99.05,
        onlineAssessment: 79.3,
        written: 20,
      },
    });
  });

  it("parses a provisional (_Temp) row, folding it into its parent Batch", () => {
    const row = {
      S_No: "88",
      University_Roll_No: "2401331540043",
      Name: "AMAN KUMAR SINGH",
      Branch: "CSE-DS",
      Status: "Very Sincere",
      P_Test_1: "97.14",
      P_Test_2: "97.14",
      P_Test_3: "78.33",
      P_Test_4: "86.43",
      M_Test_5: "97.14",
      Attendance_in_Assessment: "5",
      Online_Assessment_Grade_80: "77.9",
      Written_Grade: "0",
      Written_Score_20: "0",
      Final_Score_100: "77.9",
      Coding_Grade: "Proficient",
      Training_Group: "EM-S1_Temp",
    };

    expect(parseStudentRow(row)).toEqual({
      rollNumber: "2401331540043",
      name: "AMAN KUMAR SINGH",
      branch: "CSE-DS",
      batch: "S1",
      provisional: true,
      score: 77.9,
      attendanceStatus: "Very Sincere",
      assessmentAttendance: 5,
      codingGrade: "Proficient",
      testScores: {
        practiceTest1: 97.14,
        practiceTest2: 97.14,
        practiceTest3: 78.33,
        practiceTest4: 86.43,
        mockTest: 97.14,
        onlineAssessment: 77.9,
        written: 0,
      },
    });
  });
});

describe("loadStudents", () => {
  it("parses full CSV text (header + rows) into Students, in row order", () => {
    const csvText = [
      "S_No,University_Roll_No,Name,Branch,Status,P_Test_1,P_Test_2,P_Test_3,P_Test_4,M_Test_5,Attendance_in_Assessment,Online_Assessment_Grade_80,Written_Grade,Written_Score_20,Final_Score_100,Coding_Grade,Training_Group",
      "1,2401330120211,VEDANT PANDEY,CS,Very Sincere,98.1,96.67,92.14,86.43,99.05,5,79.3,A,20,99.3,Expert,EM-S1",
      "88,2401331540043,AMAN KUMAR SINGH,CSE-DS,Very Sincere,97.14,97.14,78.33,86.43,97.14,5,77.9,0,0,77.9,Proficient,EM-S1_Temp",
    ].join("\n");

    expect(loadStudents(csvText)).toEqual([
      {
        rollNumber: "2401330120211",
        name: "VEDANT PANDEY",
        branch: "CS",
        batch: "S1",
        provisional: false,
        score: 99.3,
        attendanceStatus: "Very Sincere",
        assessmentAttendance: 5,
        codingGrade: "Expert",
        testScores: {
          practiceTest1: 98.1,
          practiceTest2: 96.67,
          practiceTest3: 92.14,
          practiceTest4: 86.43,
          mockTest: 99.05,
          onlineAssessment: 79.3,
          written: 20,
        },
      },
      {
        rollNumber: "2401331540043",
        name: "AMAN KUMAR SINGH",
        branch: "CSE-DS",
        batch: "S1",
        provisional: true,
        score: 77.9,
        attendanceStatus: "Very Sincere",
        assessmentAttendance: 5,
        codingGrade: "Proficient",
        testScores: {
          practiceTest1: 97.14,
          practiceTest2: 97.14,
          practiceTest3: 78.33,
          practiceTest4: 86.43,
          mockTest: 97.14,
          onlineAssessment: 77.9,
          written: 0,
        },
      },
    ]);
  });

  it("parses CSV text using CRLF line endings, as the real source file does", () => {
    const csvText = [
      "S_No,University_Roll_No,Name,Branch,Status,P_Test_1,P_Test_2,P_Test_3,P_Test_4,M_Test_5,Attendance_in_Assessment,Online_Assessment_Grade_80,Written_Grade,Written_Score_20,Final_Score_100,Coding_Grade,Training_Group",
      "1,2401330120211,VEDANT PANDEY,CS,Very Sincere,98.1,96.67,92.14,86.43,99.05,5,79.3,A,20,99.3,Expert,EM-S1",
    ].join("\r\n");

    expect(loadStudents(csvText)).toEqual([
      {
        rollNumber: "2401330120211",
        name: "VEDANT PANDEY",
        branch: "CS",
        batch: "S1",
        provisional: false,
        score: 99.3,
        attendanceStatus: "Very Sincere",
        assessmentAttendance: 5,
        codingGrade: "Expert",
        testScores: {
          practiceTest1: 98.1,
          practiceTest2: 96.67,
          practiceTest3: 92.14,
          practiceTest4: 86.43,
          mockTest: 99.05,
          onlineAssessment: 79.3,
          written: 20,
        },
      },
    ]);
  });
});
