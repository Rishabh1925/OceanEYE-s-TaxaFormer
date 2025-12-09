"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

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

interface ChartRadarDotsProps {
  data: Array<{ category: string; value: number }>;
  title: string;
  description: string;
  isDarkMode?: boolean;
}

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartRadarDots({ data, title, description, isDarkMode }: ChartRadarDotsProps) {
  return (
    <Card className={isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-blue-200'}>
      <CardHeader className="items-center">
        <CardTitle className={isDarkMode ? 'text-white' : 'text-slate-900'}>{title}</CardTitle>
        <CardDescription className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={data}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="category" stroke={isDarkMode ? '#94A3B8' : '#64748B'} />
            <PolarGrid stroke={isDarkMode ? '#475569' : '#CBD5E1'} />
            <Radar
              dataKey="value"
              stroke={isDarkMode ? '#A855F7' : '#7C3AED'}
              strokeWidth={2}
              fill={isDarkMode ? '#7C3AED' : '#6D28D9'}
              fillOpacity={0.75}
              dot={{
                r: 4,
                fill: isDarkMode ? '#C4B5FD' : '#F9FAFB',
                stroke: isDarkMode ? '#C4B5FD' : '#EEF2FF',
                strokeWidth: 1.5,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className={`flex items-center gap-2 leading-none font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Biodiversity Analysis <TrendingUp className="h-4 w-4" />
        </div>
        <div className={`flex items-center gap-2 leading-none ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Deep-sea eDNA Sample Analysis
        </div>
      </CardFooter>
    </Card>
  )
}
