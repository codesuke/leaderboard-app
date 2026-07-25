"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
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

const TEST_DIMENSIONS: { key: keyof RankedStudent["testScores"]; label: string }[] = [
  { key: "practiceTest1", label: "Practice 1" },
  { key: "practiceTest2", label: "Practice 2" },
  { key: "practiceTest3", label: "Practice 3" },
  { key: "practiceTest4", label: "Practice 4" },
  { key: "mockTest", label: "Mock" },
  { key: "onlineAssessment", label: "Online Assessment" },
  { key: "written", label: "Written" },
];

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
    const row: Record<string, string | number> = { metric: label };
    students.forEach((student) => {
      row[student.name] = student.testScores[key];
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
      <DialogContent className="max-w-4xl">
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

            <ChartContainer config={chartConfig} className="mx-auto h-72 w-full max-w-md">
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

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    {students.map((student) => (
                      <TableHead key={student.rollNumber}>{student.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <ComparisonRow label="Roll Number" students={students} value={(s) => s.rollNumber} />
                  <ComparisonRow label="Batch" students={students} value={(s) => s.batch} />
                  <ComparisonRow label="Branch" students={students} value={(s) => s.branch} />
                  <ComparisonRow label="Score" students={students} value={(s) => s.score} />
                  <ComparisonRow label="Overall Rank" students={students} value={(s) => s.rankOverall} />
                  <ComparisonRow label="Rank in Batch" students={students} value={(s) => s.rankInBatch} />
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
                  <ComparisonRow label="Coding Grade" students={students} value={(s) => s.codingGrade} />
                  {TEST_DIMENSIONS.map(({ key, label }) => (
                    <ComparisonRow
                      key={key}
                      label={label}
                      students={students}
                      value={(s) => s.testScores[key]}
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

function ComparisonRow({
  label,
  students,
  value,
}: {
  label: string;
  students: RankedStudent[];
  value: (student: RankedStudent) => string | number;
}) {
  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{label}</TableCell>
      {students.map((student) => (
        <TableCell key={student.rollNumber}>{value(student)}</TableCell>
      ))}
    </TableRow>
  );
}
