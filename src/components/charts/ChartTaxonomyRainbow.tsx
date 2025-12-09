"use client"

import { TrendingUp } from "lucide-react"
import { PolarGrid, RadialBar, RadialBarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartTaxonomyRainbowProps {
  data: Array<{ label: string; value: number }>
  title: string
  description: string
  isDarkMode?: boolean
}

const rainbowColors = [
  "#6366F1", // indigo
  "#EC4899", // pink
  "#F97316", // orange
  "#22C55E", // green
  "#06B6D4", // cyan
  "#A855F7", // violet
]

const chartConfig: ChartConfig = {
  value: {
    label: "Sequences",
    color: "var(--chart-1)",
  },
}

export function ChartTaxonomyRainbow({
  data,
  title,
  description,
  isDarkMode,
}: ChartTaxonomyRainbowProps) {
  const chartData = (data.length ? data : [{ label: "No data", value: 1 }]).map(
    (item, index) => ({
      segment: item.label,
      value: item.value,
      fill: rainbowColors[index % rainbowColors.length],
    })
  )

  return (
    <Card className={isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white/50 border-blue-200"}>
      <CardHeader className="items-center pb-0">
        <CardTitle className={isDarkMode ? "text-white" : "text-slate-900"}>{title}</CardTitle>
        <CardDescription className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[260px]"
        >
          <RadialBarChart data={chartData} innerRadius={30} outerRadius={110}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="segment" />}
            />
            <PolarGrid gridType="circle" stroke={isDarkMode ? "#475569" : "#E5E7EB"} />
            <RadialBar dataKey="value" background />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div
          className={`flex items-center gap-2 leading-none font-medium ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Rainbow taxonomy composition <TrendingUp className="h-4 w-4" />
        </div>
        <div
          className={
            isDarkMode ? "text-slate-400 leading-none" : "text-slate-600 leading-none"
          }
        >
          Each arc shows relative abundance of a top group
        </div>
      </CardFooter>
    </Card>
  )
}
