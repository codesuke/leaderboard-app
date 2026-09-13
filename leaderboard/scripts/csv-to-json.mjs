// Converts data/training_groups_July.csv and data/training_groups_September.csv
// (both git-ignored, never committed) into data/students.json (committed) so
// the app has a data file in the deployed repo without putting either raw CSV
// export into git. Re-run this whenever a source CSV changes:
// `node scripts/csv-to-json.mjs`.
//
// This only joins the two snapshots by Roll Number into one row per Student —
// it does not compute Batch movement, Coding Grade movement, or any other
// progress figure. That parsing/computation lives in app/_lib/students.ts.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(import.meta.dirname, "..", "data");
const JULY_CSV_PATH = path.join(DATA_DIR, "training_groups_July.csv");
const SEPTEMBER_CSV_PATH = path.join(DATA_DIR, "training_groups_September.csv");
const JSON_PATH = path.join(DATA_DIR, "students.json");

// The July source has a truncated PDF cell ("SE-Cyber Securi"); the September
// source uses the short code ("SE-CYS"). Both name the same Branch, so both
// are canonicalized to the fuller label already shown in the July-only view.
const BRANCH_CANONICALIZATIONS = {
  "SE-Cyber Securi": "SE-Cyber Security",
  "SE-CYS": "SE-Cyber Security",
};

function canonicalizeBranch(branch) {
  return BRANCH_CANONICALIZATIONS[branch] ?? branch;
}

function parseCsv(csvText) {
  const [headerLine, ...dataLines] = csvText.trim().split(/\r\n|\n/);
  const headers = headerLine.split(",");

  return dataLines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index]])
    );
  });
}

const [julyCsvText, septemberCsvText] = await Promise.all([
  readFile(JULY_CSV_PATH, "utf-8"),
  readFile(SEPTEMBER_CSV_PATH, "utf-8"),
]);

const julyRows = parseCsv(julyCsvText);
const septemberRows = parseCsv(septemberCsvText);

const julyByRoll = new Map(
  julyRows.map((row) => [row.University_Roll_No, row])
);
const septemberByRoll = new Map(
  septemberRows.map((row) => [row.University_Roll_No, row])
);

const rollNumbers = new Set([...julyByRoll.keys(), ...septemberByRoll.keys()]);

const rows = [...rollNumbers].map((rollNumber) => {
  const july = julyByRoll.get(rollNumber);
  const september = septemberByRoll.get(rollNumber);

  const row = { University_Roll_No: rollNumber };

  if (july) {
    Object.assign(row, july, { Branch: canonicalizeBranch(july.Branch) });
  }
  if (september) {
    row.Name ??= september.Name;
    row.Branch ??= canonicalizeBranch(september.Branch);
    row.Sep_Training_Group = september.Updated_Training_Group;
    row.Sep_Coding_Grade = september.Coding_Grade;
    row.Sep_Final_Score_AS = september.Final_Score_AS;
    row.Sep_Coding_17Aug = september.Coding_17Aug;
    row.Sep_Coding_18Aug = september.Coding_18Aug;
    row.Sep_Coding_3Sep = september.Coding_3Sep;
    row.Sep_Remark_17Aug = september.Remark_17Aug;
    row.Sep_Remark_18Aug = september.Remark_18Aug;
    row.Sep_Ppe_Attendance = september.Ppe_Attendance;
    row.Sep_Offline_Problem1_Attempted = september.Offline_Problem1_Attempted;
  }

  return row;
});

await writeFile(JSON_PATH, JSON.stringify(rows));
console.log(`Wrote ${rows.length} rows to ${JSON_PATH}`);
