"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { BatchDistributionEntry } from "@/app/_lib/stats";
import type { OverviewStats } from "@/app/_lib/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  count: {
    label: "Students",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

interface StatsOverviewProps {
  stats: OverviewStats;
  batchDistribution: BatchDistributionEntry[];
}

export function StatsOverview({ stats, batchDistribution }: StatsOverviewProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Students" value={stats.totalCount.toLocaleString()} />
        <StatCard label="Average Score" value={stats.averageScore.toFixed(1)} />
        <StatCard label="Provisional" value={stats.provisionalCount.toLocaleString()} />
        <StatCard label="Batches" value={stats.batchCount.toLocaleString()} />
      </div>

      <Card className="md:w-96">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Students per Batch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-40 w-full">
            <BarChart data={batchDistribution} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="batch"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fontSize: 10 }}
              />
              <YAxis hide domain={[0, "dataMax"]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="#5e6ad2" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
