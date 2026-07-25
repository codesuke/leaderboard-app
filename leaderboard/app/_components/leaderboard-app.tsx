"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { filterStudents, type StudentFilters } from "@/app/_lib/filtering";
import { paginate } from "@/app/_lib/pagination";
import type { RankedStudent } from "@/app/_lib/ranking";
import { sortByColumn, type SortableColumn, type SortDirection } from "@/app/_lib/sorting";
import { computeBatchDistribution, computeOverviewStats } from "@/app/_lib/stats";
import { Button } from "@/components/ui/button";
import { ComparisonDialog } from "./comparison-dialog";
import { FiltersBar } from "./filters-bar";
import { StatsOverview } from "./stats-overview";
import { StudentTable } from "./student-table";

const PAGE_SIZE = 50;
const MAX_COMPARISON = 5;

interface LeaderboardAppProps {
  students: RankedStudent[];
}

export function LeaderboardApp({ students }: LeaderboardAppProps) {
  const [filters, setFilters] = useState<StudentFilters>({});
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const branches = useMemo(
    () => Array.from(new Set(students.map((student) => student.branch))).sort(),
    [students]
  );

  const filtered = useMemo(() => filterStudents(students, filters), [students, filters]);
  const displayed = useMemo(
    () => (sortColumn ? sortByColumn(filtered, sortColumn, sortDirection) : filtered),
    [filtered, sortColumn, sortDirection]
  );

  const stats = useMemo(() => computeOverviewStats(filtered), [filtered]);
  const batchDistribution = useMemo(() => computeBatchDistribution(filtered), [filtered]);

  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const pageItems = paginate(displayed, page, PAGE_SIZE);

  const selectedStudents = useMemo(
    () => students.filter((student) => selected.includes(student.rollNumber)),
    [students, selected]
  );

  function updateFilters(next: StudentFilters) {
    setFilters(next);
    setPage(1);
  }

  function handleSort(column: SortableColumn) {
    if (sortColumn === column) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setPage(1);
  }

  function toggleSelect(rollNumber: string) {
    setSelected((current) => {
      if (current.includes(rollNumber)) {
        return current.filter((roll) => roll !== rollNumber);
      }
      if (current.length >= MAX_COMPARISON) {
        toast.error(`You can compare up to ${MAX_COMPARISON} Students at once.`);
        return current;
      }
      return [...current, rollNumber];
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <StatsOverview stats={stats} batchDistribution={batchDistribution} />
      <FiltersBar filters={filters} onChange={updateFilters} branches={branches} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {displayed.length.toLocaleString()} Students
        </p>
        <Button
          className="rounded-full px-5 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30"
          disabled={selected.length === 0}
          onClick={() => setComparisonOpen(true)}
        >
          Compare ({selected.length})
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xl shadow-black/30 ring-1 ring-white/[0.03]">
        <StudentTable
          students={pageItems}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          selected={selected}
          onToggleSelect={toggleSelect}
        />
      </div>

      <nav className="flex items-center justify-between text-sm">
        <Button
          variant="outline"
          className="rounded-full px-4"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
        >
          Previous
        </Button>
        <span className="text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          className="rounded-full px-4"
          disabled={page >= totalPages}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </Button>
      </nav>

      <ComparisonDialog
        students={selectedStudents}
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
        onRemove={(rollNumber) =>
          setSelected((current) => current.filter((roll) => roll !== rollNumber))
        }
      />
    </div>
  );
}
