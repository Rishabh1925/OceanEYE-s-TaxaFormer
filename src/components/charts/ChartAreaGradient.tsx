"use client"

import { TrendingUp } from "lucide-react"
import type { CSSProperties } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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

interface ChartAreaGradientProps {
  data: Array<{ category: string; confidence: number; overlap: number }>;
  title: string;
  description: string;
  isDarkMode?: boolean;
}

const chartConfig = {
  confidence: {
    label: "Confidence",
    // Lighter violet for typically larger series
    color: "#C4B5FD",
  },
  overlap: {
    label: "Overlap",
    // Darker violet for typically smaller series
    color: "#A855F7",
  },
} satisfies ChartConfig

export function ChartAreaGradient({ data, title, description, isDarkMode }: ChartAreaGradientProps) {
  return (
    <Card className={isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-blue-200'}>
      <CardHeader>
        <CardTitle className={isDarkMode ? 'text-white' : 'text-slate-900'}>{title}</CardTitle>
        <CardDescription className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} stroke={isDarkMode ? '#475569' : '#E2E8F0'} />
            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              stroke={isDarkMode ? '#94A3B8' : '#64748B'}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="w-[220px]"
                  indicator="dot"
                  formatter={(value, name, item, index) => (
                    <>
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                        style={
                          {
                            "--color-bg": `var(--color-${name})`,
                          } as CSSProperties
                        }
                      />
                      {chartConfig[name as keyof typeof chartConfig]?.label || name}
                      <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                        {value}
                      </div>
                      {index === 1 && (
                        <div className="text-foreground mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium">
                          Total
                          <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                            {item.payload.confidence + item.payload.overlap}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                />
              }
            />
            <defs>
              <linearGradient id="fillConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#C4B5FD"
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="#C4B5FD"
                  stopOpacity={0.06}
                />
              </linearGradient>
              <linearGradient id="fillOverlap" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#A855F7"
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="#A855F7"
                  stopOpacity={0.06}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="overlap"
              type="natural"
              fill="url(#fillOverlap)"
              fillOpacity={0.35}
              stroke="#A855F7"
              stackId="a"
            />
            <Area
              dataKey="confidence"
              type="natural"
              fill="url(#fillConfidence)"
              fillOpacity={0.35}
              stroke="#C4B5FD"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className={`flex items-center gap-2 leading-none font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              High confidence matches <TrendingUp className="h-4 w-4" />
            </div>
            <div className={`flex items-center gap-2 leading-none ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Analysis confidence and reference overlap metrics
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
