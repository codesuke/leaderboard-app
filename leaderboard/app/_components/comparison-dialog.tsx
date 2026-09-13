"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts";
import type { RankedStudent } from "@/app/_lib/ranking";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { XIcon } from "lucide-react";

const CHART_COLORS = ["#5e6ad2", "#828fff", "#7a7fad", "#27a644", "#8a8f98"];

const NOT_AVAILABLE = "Not available";

const TEST_DIMENSIONS: {
  key: keyof NonNullable<RankedStudent["testScores"]>;
  label: string;
}[] = [
  { key: "practiceTest1", label: "Practice 1" },
  { key: "practiceTest2", label: "Practice 2" },
  { key: "practiceTest3", label: "Practice 3" },
  { key: "practiceTest4", label: "Practice 4" },
  { key: "mockTest", label: "Mock" },
  { key: "onlineAssessment", label: "Online Assessment" },
  { key: "written", label: "Written" },
];

const CODING_TREND_LABELS = ["17 Aug", "18 Aug", "3 Sep"];

interface ComparisonDialogProps {
  students: RankedStudent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (rollNumber: string) => void;
}

export function ComparisonDialog({
  students,
  open,
  onOpenChange,
  onRemove,
}: ComparisonDialogProps) {
  const chartData = TEST_DIMENSIONS.map(({ key, label }) => {
    const row: Record<string, string | number | null> = { metric: label };
    students.forEach((student) => {
      row[student.name] = student.testScores?.[key] ?? null;
    });
    return row;
  });

  const codingTrendData = CODING_TREND_LABELS.map((label, index) => {
    const row: Record<string, string | number | null> = { date: label };
    students.forEach((student) => {
      row[student.name] =
        student.progress?.codingScoreTrend[index]?.score ?? null;
    });
    return row;
  });

  const chartConfig = Object.fromEntries(
    students.map((student, index) => [
      student.name,
      { label: student.name, color: CHART_COLORS[index % CHART_COLORS.length] },
    ])
  ) satisfies ChartConfig;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[95vw] sm:max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Students</DialogTitle>
        </DialogHeader>

        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Select up to 5 Students from the table to compare them here.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              {students.map((student) => (
                <Badge key={student.rollNumber} variant="secondary">
                  {student.name}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="ml-1 size-3.5"
                    onClick={() => onRemove(student.rollNumber)}
                    aria-label={`Remove ${student.name} from comparison`}
                  >
                    <XIcon />
                  </Button>
                </Badge>
              ))}
            </div>

            <ChartContainer
              config={chartConfig}
              className="mx-auto h-80 w-full max-w-xl"
            >
              <RadarChart data={chartData}>
                <ChartTooltip content={<ChartTooltipContent />} />
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                {students.map((student, index) => (
                  <Radar
                    key={student.rollNumber}
                    dataKey={student.name}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    fillOpacity={0.15}
                  />
                ))}
                <ChartLegend content={<ChartLegendContent />} />
              </RadarChart>
            </ChartContainer>

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">
                Coding Score Trend (17 Aug / 18 Aug / 3 Sep)
              </h3>
              <ChartContainer
                config={chartConfig}
                className="mx-auto h-56 w-full max-w-xl"
              >
                <LineChart data={codingTrendData}>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={30} />
                  {students.map((student, index) => (
                    <Line
                      key={student.rollNumber}
                      dataKey={student.name}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      connectNulls={false}
                      dot
                    />
                  ))}
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    {students.map((student) => (
                      <TableHead key={student.rollNumber}>
                        {student.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <ComparisonRow
                    label="Roll Number"
                    students={students}
                    value={(s) => s.rollNumber}
                  />
                  <ComparisonRow
                    label="Old Batch"
                    students={students}
                    value={(s) => s.oldBatch}
                  />
                  <ComparisonRow
                    label="Current Batch"
                    students={students}
                    value={(s) => s.batch}
                  />
                  <ComparisonRow
                    label="Batch Movement"
                    students={students}
                    value={(s) =>
                      s.progress
                        ? `${s.progress.batchMovement.from} → ${s.progress.batchMovement.to} (${formatTiersMoved(s.progress.batchMovement.tiersMoved)})`
                        : null
                    }
                  />
                  <ComparisonRow
                    label="Branch"
                    students={students}
                    value={(s) => s.branch}
                  />
                  <ComparisonRow
                    label="Score"
                    students={students}
                    value={(s) => s.score}
                  />
                  <ComparisonRow
                    label="Raw Score Delta"
                    caption="Old Score and Score are on different scales — this delta is not a like-for-like improvement percentage."
                    students={students}
                    value={(s) =>
                      s.progress ? formatSigned(s.progress.rawScoreDelta) : null
                    }
                  />
                  <ComparisonRow
                    label="Overall Rank"
                    students={students}
                    value={(s) => s.rankOverall}
                  />
                  <ComparisonRow
                    label="Rank in Batch"
                    students={students}
                    value={(s) => s.rankInBatch}
                  />
                  <ComparisonRow
                    label="Attendance Status"
                    students={students}
                    value={(s) => s.attendanceStatus}
                  />
                  <ComparisonRow
                    label="Assessment Attendance"
                    students={students}
                    value={(s) => s.assessmentAttendance}
                  />
                  <ComparisonRow
                    label="Coding Grade"
                    students={students}
                    value={(s) => s.codingGrade}
                  />
                  <ComparisonRow
                    label="Coding Grade Movement"
                    students={students}
                    value={(s) =>
                      s.progress
                        ? `${s.progress.codingGradeMovement.from} → ${s.progress.codingGradeMovement.to}`
                        : null
                    }
                  />
                  {TEST_DIMENSIONS.map(({ key, label }) => (
                    <ComparisonRow
                      key={key}
                      label={label}
                      students={students}
                      value={(s) => s.testScores?.[key] ?? null}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function formatTiersMoved(tiersMoved: number): string {
  if (tiersMoved === 0) return "no change";
  return tiersMoved > 0 ? `up ${tiersMoved}` : `down ${Math.abs(tiersMoved)}`;
}

function formatSigned(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

function ComparisonRow({
  label,
  caption,
  students,
  value,
}: {
  label: string;
  caption?: string;
  students: RankedStudent[];
  value: (student: RankedStudent) => string | number | null;
}) {
  return (
    <TableRow>
      <TableCell className="text-muted-foreground">
        {label}
        {caption && (
          <p className="mt-1 text-xs font-normal text-muted-foreground/70">
            {caption}
          </p>
        )}
      </TableCell>
      {students.map((student) => {
        const cellValue = value(student);
        return (
          <TableCell key={student.rollNumber}>
            {cellValue === null ? (
              <span className="text-muted-foreground/60 italic">
                {NOT_AVAILABLE}
              </span>
            ) : (
              cellValue
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );
}
