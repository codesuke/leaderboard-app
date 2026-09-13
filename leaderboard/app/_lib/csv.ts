import type { RankedStudent } from "./ranking";

const COLUMNS: {
  header: string;
  value: (student: RankedStudent) => string | number | null;
}[] = [
  { header: "Overall Rank", value: (s) => s.rankOverall },
  { header: "Rank in Batch", value: (s) => s.rankInBatch },
  { header: "Name", value: (s) => s.name },
  { header: "Roll Number", value: (s) => s.rollNumber },
  { header: "Old Batch", value: (s) => s.oldBatch },
  { header: "Current Batch", value: (s) => s.batch },
  { header: "Branch", value: (s) => s.branch },
  { header: "Score", value: (s) => s.score },
  { header: "Assessment Flags", value: (s) => s.assessmentFlags.join("; ") },
  { header: "PPE Attendance", value: (s) => s.currentPpeAttendance },
  {
    header: "Offline Problem 1 Attempted",
    value: (s) =>
      s.offlineProblem1Attempted === null
        ? null
        : s.offlineProblem1Attempted
          ? "Yes"
          : "No",
  },
];

// RFC 4180: a field containing a comma, quote, or newline is wrapped in
// quotes, with any quote inside it doubled.
function csvField(value: string | number | null): string {
  if (value === null) return "";
  const raw = String(value);
  return /[",\n]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
}

export function studentsToCsv(students: RankedStudent[]): string {
  const headerRow = COLUMNS.map((column) => csvField(column.header)).join(",");
  const dataRows = students.map((student) =>
    COLUMNS.map((column) => csvField(column.value(student))).join(",")
  );
  return [headerRow, ...dataRows].join("\n");
}
