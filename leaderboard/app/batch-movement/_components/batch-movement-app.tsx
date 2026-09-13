"use client";

import { useMemo, useState } from "react";
import {
  computeBatchSizeComparison,
  computeMovementMatrix,
  computeNetMovementSummary,
  filterByBranch,
  type BatchSizeComparison,
  type MovementMatrix,
  type NetMovementSummary,
} from "@/app/_lib/batch-movement";
import type { RankedStudent } from "@/app/_lib/ranking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const ALL_BRANCHES = "__all__";

interface BatchMovementAppProps {
  students: RankedStudent[];
}

export function BatchMovementApp({ students }: BatchMovementAppProps) {
  const [branch, setBranch] = useState<string | null>(null);

  const branches = useMemo(
    () => Array.from(new Set(students.map((student) => student.branch))).sort(),
    [students]
  );

  const scoped = useMemo(
    () => filterByBranch(students, branch),
    [students, branch]
  );
  const sizeComparison = useMemo(
    () => computeBatchSizeComparison(scoped),
    [scoped]
  );
  const matrix = useMemo(() => computeMovementMatrix(scoped), [scoped]);
  const summary = useMemo(() => computeNetMovementSummary(scoped), [scoped]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Branch</span>
        <Select
          value={branch ?? ALL_BRANCHES}
          onValueChange={(value) =>
            setBranch(value === ALL_BRANCHES ? null : value)
          }
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_BRANCHES}>All Branches</SelectItem>
            {branches.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <BatchSizeCards comparison={sizeComparison} />
      <MovementMatrixTable matrix={matrix} />
      <NetMovementSummaryCards summary={summary} />
    </div>
  );
}

function NetMovementSummaryCards({ summary }: { summary: NetMovementSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SummaryCard label="Moved Up" value={summary.movedUp} />
      <SummaryCard label="Moved Down" value={summary.movedDown} />
      <SummaryCard label="Stayed" value={summary.stayed} />
      <SummaryCard label="One-Sided" value={summary.oneSided} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="shadow-xl shadow-black/30 ring-1 ring-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

function BatchSizeCards({ comparison }: { comparison: BatchSizeComparison[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {comparison.map((entry) => (
        <Card
          key={entry.batch}
          className="shadow-xl shadow-black/30 ring-1 ring-white/[0.03]"
        >
          <CardHeader>
            <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {entry.batch}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p className="text-muted-foreground">
              July:{" "}
              {entry.oldUnavailable ? "N/A" : entry.oldCount.toLocaleString()}
            </p>
            <p className="text-muted-foreground">
              September:{" "}
              {entry.currentUnavailable
                ? "N/A"
                : entry.currentCount.toLocaleString()}
            </p>
            <p
              className={cn(
                "text-lg font-semibold",
                entry.delta > 0 && "text-emerald-400",
                entry.delta < 0 && "text-red-400"
              )}
            >
              {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MovementMatrixTable({ matrix }: { matrix: MovementMatrix }) {
  const countByPair = new Map(
    matrix.entries.map((entry) => [`${entry.from} ${entry.to}`, entry.count])
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xl shadow-black/30 ring-1 ring-white/[0.03]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Old \ Current
            </TableHead>
            {matrix.batches.map((batch) => (
              <TableHead
                key={batch}
                className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase"
              >
                {batch}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {matrix.batches.map((fromBatch) => (
            <TableRow key={fromBatch}>
              <TableHead className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {fromBatch}
              </TableHead>
              {matrix.batches.map((toBatch) => {
                const count = countByPair.get(`${fromBatch} ${toBatch}`) ?? 0;
                const isDiagonal = fromBatch === toBatch;

                return (
                  <TableCell
                    key={toBatch}
                    className={cn(
                      "text-center",
                      isDiagonal && "bg-primary/10 font-semibold text-primary",
                      count === 0 && !isDiagonal && "text-muted-foreground/30"
                    )}
                  >
                    {count === 0 ? "—" : count}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
