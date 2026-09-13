import type { RankedStudent } from "./ranking";

export type SortableColumn =
  | "rankOverall"
  | "rankInBatch"
  | "name"
  | "rollNumber"
  | "batch"
  | "branch"
  | "score";

export type SortDirection = "asc" | "desc";

export function sortByColumn(
  students: RankedStudent[],
  column: SortableColumn,
  direction: SortDirection
): RankedStudent[] {
  const factor = direction === "asc" ? 1 : -1;

  return [...students].sort((a, b) => {
    const aValue = a[column];
    const bValue = b[column];

    // Students with no current-side value for this column (one-sided
    // Students missing the September snapshot) always sort last.
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;

    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * factor;
    }

    return (
      String(aValue).localeCompare(String(bValue), undefined, {
        sensitivity: "base",
      }) * factor
    );
  });
}
