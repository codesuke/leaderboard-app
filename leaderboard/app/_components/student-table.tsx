"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Fragment } from "react";
import type { RankedStudent } from "@/app/_lib/ranking";
import type { SortableColumn, SortDirection } from "@/app/_lib/sorting";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentSparkline } from "./student-sparkline";

interface Column {
  key: SortableColumn;
  label: string;
}

const COLUMNS: Column[] = [
  { key: "rankOverall", label: "Overall Rank" },
  { key: "rankInBatch", label: "Rank in Batch" },
  { key: "name", label: "Name" },
  { key: "rollNumber", label: "Roll Number" },
  { key: "batch", label: "Current Batch" },
  { key: "branch", label: "Branch" },
  { key: "score", label: "Score" },
];

interface StudentTableProps {
  students: RankedStudent[];
  sortColumn: SortableColumn | null;
  sortDirection: SortDirection;
  onSort: (column: SortableColumn) => void;
  selected: string[];
  onToggleSelect: (rollNumber: string) => void;
}

export function StudentTable({
  students,
  sortColumn,
  sortDirection,
  onSort,
  selected,
  onToggleSelect,
}: StudentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8" />
          {COLUMNS.map((column) => (
            <Fragment key={column.key}>
              {column.key === "batch" && (
                <TableHead className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Old Batch
                </TableHead>
              )}
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-7 gap-1 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase"
                  onClick={() => onSort(column.key)}
                >
                  {column.label}
                  <SortIcon
                    active={sortColumn === column.key}
                    direction={sortDirection}
                  />
                </Button>
              </TableHead>
            </Fragment>
          ))}
          <TableHead className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Trend
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.rollNumber}>
            <TableCell>
              <Checkbox
                checked={selected.includes(student.rollNumber)}
                onCheckedChange={() => onToggleSelect(student.rollNumber)}
                aria-label={`Select ${student.name} for comparison`}
              />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {student.rankOverall}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {student.rankInBatch}
            </TableCell>
            <TableCell>
              <span className="flex items-center gap-2">
                {student.name}
                {student.provisional && (
                  <Badge variant="secondary">Provisional</Badge>
                )}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {student.rollNumber}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {student.oldBatch ?? "—"}
            </TableCell>
            <TableCell>
              <span className="flex items-center gap-1.5">
                {student.batch ?? "—"}
                <BatchMovementIndicator student={student} />
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {student.branch}
            </TableCell>
            <TableCell>{student.score ?? "—"}</TableCell>
            <TableCell>
              <StudentSparkline
                trend={student.progress?.codingScoreTrend ?? []}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function BatchMovementIndicator({ student }: { student: RankedStudent }) {
  const tiersMoved = student.progress?.batchMovement.tiersMoved;
  if (!tiersMoved) return null;

  return tiersMoved > 0 ? (
    <TrendingUpIcon
      className="size-3.5 text-emerald-400"
      aria-label={`Moved up ${tiersMoved} Batch tier${tiersMoved === 1 ? "" : "s"} since July`}
    />
  ) : (
    <TrendingDownIcon
      className="size-3.5 text-red-400"
      aria-label={`Moved down ${Math.abs(tiersMoved)} Batch tier${Math.abs(tiersMoved) === 1 ? "" : "s"} since July`}
    />
  );
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) return <ChevronsUpDownIcon className="size-3.5 opacity-50" />;
  return direction === "asc" ? (
    <ArrowUpIcon className="size-3.5" />
  ) : (
    <ArrowDownIcon className="size-3.5" />
  );
}
