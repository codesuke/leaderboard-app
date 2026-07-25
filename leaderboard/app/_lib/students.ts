import { readFile } from "node:fs/promises";
import path from "node:path";

export type Batch =
  | "S1"
  | "S2"
  | "T1"
  | "T2"
  | "T3"
  | "T4"
  | "T5"
  | "T6"
  | "T7"
  | "T8"
  | "T9"
  | "T10"
  | "T11"
  | "T12";

const TEMP_SUFFIX = "_Temp";
const PROGRAM_PREFIX = "EM-";

export function parseTrainingGroup(raw: string): {
  batch: Batch;
  provisional: boolean;
} {
  const withoutPrefix = raw.startsWith(PROGRAM_PREFIX)
    ? raw.slice(PROGRAM_PREFIX.length)
    : raw;
  const provisional = withoutPrefix.endsWith(TEMP_SUFFIX);
  const batch = provisional
    ? withoutPrefix.slice(0, -TEMP_SUFFIX.length)
    : withoutPrefix;

  return { batch: batch as Batch, provisional };
}

export type AttendanceStatus =
  "Very Sincere" | "Sincere" | "Poor" | "Very Poor";

export type CodingGrade =
  "Beginner" | "Novice" | "Learner" | "Proficient" | "Expert";

export interface TestScores {
  practiceTest1: number;
  practiceTest2: number;
  practiceTest3: number;
  practiceTest4: number;
  mockTest: number;
  onlineAssessment: number;
  written: number;
}

export interface Student {
  rollNumber: string;
  name: string;
  branch: string;
  batch: Batch;
  provisional: boolean;
  score: number;
  attendanceStatus: AttendanceStatus;
  assessmentAttendance: number;
  codingGrade: CodingGrade;
  testScores: TestScores;
}

export type RawCsvRow = Record<string, string>;

export function parseStudentRow(row: RawCsvRow): Student {
  const { batch, provisional } = parseTrainingGroup(row.Training_Group);

  return {
    rollNumber: row.University_Roll_No,
    name: row.Name,
    branch: row.Branch,
    batch,
    provisional,
    score: Number(row.Final_Score_100),
    attendanceStatus: row.Status as AttendanceStatus,
    assessmentAttendance: Number(row.Attendance_in_Assessment),
    codingGrade: row.Coding_Grade as CodingGrade,
    testScores: {
      practiceTest1: Number(row.P_Test_1),
      practiceTest2: Number(row.P_Test_2),
      practiceTest3: Number(row.P_Test_3),
      practiceTest4: Number(row.P_Test_4),
      mockTest: Number(row.M_Test_5),
      onlineAssessment: Number(row.Online_Assessment_Grade_80),
      written: Number(row.Written_Score_20),
    },
  };
}

// Splitting on "," is safe only because the source data has no quoted or
// comma-containing fields (verified against training_groups_July.csv).
export function loadStudents(csvText: string): Student[] {
  const [headerLine, ...dataLines] = csvText.trim().split(/\r\n|\n/);
  const headers = headerLine.split(",");

  return dataLines.map((line) => {
    const values = line.split(",");
    const row: RawCsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    return parseStudentRow(row);
  });
}

export function parseStudentsJson(jsonText: string): Student[] {
  const rows: RawCsvRow[] = JSON.parse(jsonText);
  return rows.map(parseStudentRow);
}

const STUDENTS_JSON_PATH = path.join(process.cwd(), "data", "students.json");

export async function loadStudentsFromDisk(): Promise<Student[]> {
  const jsonText = await readFile(STUDENTS_JSON_PATH, "utf-8");
  return parseStudentsJson(jsonText);
}
