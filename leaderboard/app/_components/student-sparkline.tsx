"use client";

import { Line, LineChart } from "recharts";
import type { CodingScoreTrendPoint } from "@/app/_lib/students";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  score: { label: "Coding Score", color: "#828fff" },
} satisfies ChartConfig;

interface StudentSparklineProps {
  trend: CodingScoreTrendPoint[];
}

export function StudentSparkline({ trend }: StudentSparklineProps) {
  const hasData = trend.some((point) => point.score !== null);
  if (!hasData) {
    return <span className="text-muted-foreground/50">—</span>;
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-6 w-16">
      <LineChart data={trend} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          dataKey="score"
          stroke="var(--color-score)"
          strokeWidth={1.5}
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
