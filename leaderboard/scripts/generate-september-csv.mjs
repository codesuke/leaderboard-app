// One-off derivation of data/training_groups_September.csv from the richer
// data/student_progress.json export (parsed from the September re-assessment
// PDF in a separate conversation). Produces a September CSV in the same
// git-ignored, never-committed shape as training_groups_July.csv so
// csv-to-json.mjs can join the two by Roll Number. Re-run only if
// student_progress.json is replaced with a fresher export.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(import.meta.dirname, "..", "data");
const SOURCE_PATH = path.join(DATA_DIR, "student_progress.json");
const CSV_PATH = path.join(DATA_DIR, "training_groups_September.csv");

const source = JSON.parse(await readFile(SOURCE_PATH, "utf-8"));

const SEPTEMBER_DATE = "2026-09-14";
const CODING_ASSESSMENT_IDS = ["coding_17aug", "coding_18aug", "coding_3sep"];

const nameByRoll = new Map(source.students.map((s) => [s.rollNumber, s]));

const septemberBatchByRoll = new Map(
  source.batchHistory
    .filter((entry) => entry.effectiveDate === SEPTEMBER_DATE)
    .map((entry) => [entry.rollNumber, entry.batch])
);

const resultsByRoll = new Map();
for (const result of source.results) {
  if (!resultsByRoll.has(result.rollNumber)) {
    resultsByRoll.set(result.rollNumber, new Map());
  }
  resultsByRoll.get(result.rollNumber).set(result.assessmentId, result);
}

const HEADERS = [
  "University_Roll_No",
  "Name",
  "Branch",
  "Updated_Training_Group",
  "Coding_Grade",
  "Final_Score_AS",
  "Coding_17Aug",
  "Coding_18Aug",
  "Coding_3Sep",
  "Remark_17Aug",
  "Remark_18Aug",
  "Ppe_Attendance",
  "Offline_Problem1_Attempted",
];

function csvField(value) {
  return value === null || value === undefined ? "" : String(value);
}

// The offline_vscode result packs its fields into one free-text remark like
// "Attempted problem 1: Yes; Problems solved: 2; Coding Score (AQ): 83" —
// extract just the Yes/No/Unknown answer this CSV needs.
function extractProblem1Attempted(remark) {
  const match = remark?.match(/Attempted problem 1:\s*([A-Za-z]+)/);
  return match ? match[1] : "";
}

const rows = [];
for (const rollNumber of septemberBatchByRoll.keys()) {
  const student = nameByRoll.get(rollNumber);
  const results = resultsByRoll.get(rollNumber) ?? new Map();
  const finalScoreSep = results.get("final_score_sep");
  const [coding17Aug, coding18Aug, coding3Sep] = CODING_ASSESSMENT_IDS.map(
    (id) => results.get(id)?.score ?? null
  );
  const ppeAttendance = results.get("ppe_attendance_aug")?.score ?? null;

  rows.push(
    [
      rollNumber,
      student?.name ?? "",
      student?.branch ?? "",
      septemberBatchByRoll.get(rollNumber),
      finalScoreSep?.grade ?? "",
      finalScoreSep?.score ?? "",
      coding17Aug,
      coding18Aug,
      coding3Sep,
      results.get("coding_17aug")?.remark ?? "",
      results.get("coding_18aug")?.remark ?? "",
      ppeAttendance,
      extractProblem1Attempted(results.get("offline_vscode")?.remark),
    ]
      .map(csvField)
      .join(",")
  );
}

await writeFile(CSV_PATH, [HEADERS.join(","), ...rows].join("\n") + "\n");
console.log(`Wrote ${rows.length} rows to ${CSV_PATH}`);
