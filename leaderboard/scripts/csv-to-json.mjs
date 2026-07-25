// Converts data/training_groups_July.csv (git-ignored, never committed) into
// data/students.json (committed) so the app has a data file in the deployed
// repo without putting the raw CSV export into git. Re-run this whenever the
// source CSV changes: `node scripts/csv-to-json.mjs`.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(import.meta.dirname, "..", "data");
const CSV_PATH = path.join(DATA_DIR, "training_groups_July.csv");
const JSON_PATH = path.join(DATA_DIR, "students.json");

const csvText = await readFile(CSV_PATH, "utf-8");
const [headerLine, ...dataLines] = csvText.trim().split(/\r\n|\n/);
const headers = headerLine.split(",");

const rows = dataLines.map((line) => {
  const values = line.split(",");
  return Object.fromEntries(
    headers.map((header, index) => [header, values[index]])
  );
});

await writeFile(JSON_PATH, JSON.stringify(rows));
console.log(`Wrote ${rows.length} rows to ${JSON_PATH}`);
