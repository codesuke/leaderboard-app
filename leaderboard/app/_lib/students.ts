import { readFile } from "node:fs/promises";
import path from "node:path";
import { RAW_BATCH_ORDER } from "./batch-order";

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
  | "T12"
  | "T13";

export const BATCH_ORDER = RAW_BATCH_ORDER as readonly Batch[];

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

export interface CodingScoreTrendPoint {
  date: string;
  score: number | null;
}

export interface BatchMovement {
  from: Batch;
  to: Batch;
  tiersMoved: number;
}

export interface CodingGradeMovement {
  from: CodingGrade;
  to: CodingGrade;
}

export interface StudentProgress {
  batchMovement: BatchMovement;
  codingGradeMovement: CodingGradeMovement;
  codingScoreTrend: CodingScoreTrendPoint[];
  rawScoreDelta: number;
}

export interface Student {
  rollNumber: string;
  name: string;
  branch: string;
  /** Current (September) Batch — the ranking/filtering source of truth. Null if the Student has no September-side data. */
  batch: Batch | null;
  /** Current (September) Provisional status. Null if the Student has no September-side data. */
  provisional: boolean | null;
  /** Current (September) Score — today's in-batch tiebreaker. Null if the Student has no September-side data. */
  score: number | null;
  attendanceStatus: AttendanceStatus | null;
  assessmentAttendance: number | null;
  /** Coding Grade as of the July snapshot. Null if the Student has no July-side data. */
  codingGrade: CodingGrade | null;
  testScores: TestScores | null;
  /** Old (July) Batch, display-only. Null if the Student has no July-side data. */
  oldBatch: Batch | null;
  /** Old (July) Provisional status, display-only. Null if the Student has no July-side data. */
  oldProvisional: boolean | null;
  /** Old (July) Score, on a different 0-100 scale than the current Score. Null if the Student has no July-side data. */
  oldScore: number | null;
  /** Improvement stats computed from both snapshots. Null unless the Student has both July- and September-side data. */
  progress: StudentProgress | null;
}

const CODING_ASSESSMENT_DATES = ["2026-08-17", "2026-08-18", "2026-09-03"];

export type RawStudentRow = Record<string, string | undefined>;

function parseNullableNumber(raw: string | undefined): number | null {
  if (raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
}

export function parseStudentRow(row: RawStudentRow): Student {
  const hasJuly = row.Training_Group !== undefined;
  const hasSeptember = row.Sep_Training_Group !== undefined;

  const july = hasJuly ? parseTrainingGroup(row.Training_Group!) : null;
  const september = hasSeptember
    ? parseTrainingGroup(row.Sep_Training_Group!)
    : null;

  const oldBatch = july?.batch ?? null;
  const oldProvisional = july?.provisional ?? null;
  const oldScore = hasJuly ? Number(row.Final_Score_100) : null;

  const batch = september?.batch ?? null;
  const provisional = september?.provisional ?? null;
  const score = hasSeptember ? Number(row.Sep_Final_Score_AS) : null;

  return {
    rollNumber: row.University_Roll_No!,
    name: row.Name!,
    branch: row.Branch!,
    batch,
    provisional,
    score,
    attendanceStatus: hasJuly ? (row.Status as AttendanceStatus) : null,
    assessmentAttendance: hasJuly ? Number(row.Attendance_in_Assessment) : null,
    codingGrade: hasJuly ? (row.Coding_Grade as CodingGrade) : null,
    testScores: hasJuly
      ? {
          practiceTest1: Number(row.P_Test_1),
          practiceTest2: Number(row.P_Test_2),
          practiceTest3: Number(row.P_Test_3),
          practiceTest4: Number(row.P_Test_4),
          mockTest: Number(row.M_Test_5),
          onlineAssessment: Number(row.Online_Assessment_Grade_80),
          written: Number(row.Written_Score_20),
        }
      : null,
    oldBatch,
    oldProvisional,
    oldScore,
    progress:
      hasJuly && hasSeptember
        ? computeProgress({
            oldBatch: oldBatch!,
            batch: batch!,
            oldCodingGrade: row.Coding_Grade as CodingGrade,
            newCodingGrade: row.Sep_Coding_Grade as CodingGrade,
            oldScore: oldScore!,
            score: score!,
            codingScores: [
              parseNullableNumber(row.Sep_Coding_17Aug),
              parseNullableNumber(row.Sep_Coding_18Aug),
              parseNullableNumber(row.Sep_Coding_3Sep),
            ],
          })
        : null,
  };
}

function computeProgress(input: {
  oldBatch: Batch;
  batch: Batch;
  oldCodingGrade: CodingGrade;
  newCodingGrade: CodingGrade;
  oldScore: number;
  score: number;
  codingScores: (number | null)[];
}): StudentProgress {
  return {
    batchMovement: computeBatchMovement(input.oldBatch, input.batch),
    codingGradeMovement: {
      from: input.oldCodingGrade,
      to: input.newCodingGrade,
    },
    codingScoreTrend: CODING_ASSESSMENT_DATES.map((date, index) => ({
      date,
      score: input.codingScores[index] ?? null,
    })),
    rawScoreDelta: input.score - input.oldScore,
  };
}

export function computeBatchMovement(from: Batch, to: Batch): BatchMovement {
  const tiersMoved = BATCH_ORDER.indexOf(from) - BATCH_ORDER.indexOf(to);
  return { from, to, tiersMoved };
}

// Splitting on "," is safe only because the source data has no quoted or
// comma-containing fields (verified against training_groups_July.csv).
function parseCsvRows(csvText: string): RawStudentRow[] {
  const [headerLine, ...dataLines] = csvText.trim().split(/\r\n|\n/);
  const headers = headerLine.split(",");

  return dataLines.map((line) => {
    const values = line.split(",");
    const row: RawStudentRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    return row;
  });
}

export function loadStudents(csvText: string): Student[] {
  return parseCsvRows(csvText).map(parseStudentRow);
}

export function parseStudentsJson(jsonText: string): Student[] {
  const rows: RawStudentRow[] = JSON.parse(jsonText);
  return rows.map(parseStudentRow);
}

const STUDENTS_JSON_PATH = path.join(process.cwd(), "data", "students.json");

export async function loadStudentsFromDisk(): Promise<Student[]> {
  const jsonText = await readFile(STUDENTS_JSON_PATH, "utf-8");
  return parseStudentsJson(jsonText);
}
