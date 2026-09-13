"use client";

import { useMemo, useState } from "react";
import {
  computeBatchSizeComparison,
  computeMovementMatrix,
  computeNetMovementSummary,
  filterByBranch,
  getStudentsForMove,
  type BatchSizeComparison,
  type MovementMatrix,
  type NetMovementSummary,
} from "@/app/_lib/batch-movement";
import type { Batch } from "@/app/_lib/students";
import type { RankedStudent } from "@/app/_lib/ranking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface SelectedMove {
  from: Batch;
  to: Batch;
}

export function BatchMovementApp({ students }: BatchMovementAppProps) {
  const [branch, setBranch] = useState<string | null>(null);
  const [selectedMove, setSelectedMove] = useState<SelectedMove | null>(null);

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
      <MovementMatrixTable matrix={matrix} onSelectMove={setSelectedMove} />
      <NetMovementSummaryCards summary={summary} />

      <Dialog
        open={selectedMove !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedMove(null);
        }}
      >
        <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMove && `${selectedMove.from} → ${selectedMove.to}`}
            </DialogTitle>
          </DialogHeader>
          {selectedMove && (
            <MoveDrillDownTable
              students={getStudentsForMove(
                scoped,
                selectedMove.from,
                selectedMove.to
              )}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MoveDrillDownTable({ students }: { students: RankedStudent[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Roll Number</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.rollNumber}>
              <TableCell>{student.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {student.rollNumber}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {student.branch}
              </TableCell>
              <TableCell>{student.score ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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

function MovementMatrixTable({
  matrix,
  onSelectMove,
}: {
  matrix: MovementMatrix;
  onSelectMove: (move: SelectedMove) => void;
}) {
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

                if (count === 0) {
                  return (
                    <TableCell
                      key={toBatch}
                      className={cn(
                        "text-center",
                        !isDiagonal && "text-muted-foreground/30"
                      )}
                    >
                      —
                    </TableCell>
                  );
                }

                return (
                  <TableCell key={toBatch} className="p-0 text-center">
                    <button
                      type="button"
                      className={cn(
                        "size-full px-4 py-2 hover:bg-primary/20",
                        isDiagonal && "bg-primary/10 font-semibold text-primary"
                      )}
                      onClick={() =>
                        onSelectMove({ from: fromBatch, to: toBatch })
                      }
                      aria-label={`View Students who moved from ${fromBatch} to ${toBatch}`}
                    >
                      {count}
                    </button>
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
