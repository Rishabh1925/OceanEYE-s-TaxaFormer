"use client"

import { Chart } from "react-google-charts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ChartTaxonomySankeyProps {
  data: Array<{ Predicted_Taxonomy: string }>
  isDarkMode?: boolean
}

export function ChartTaxonomySankey({ data, isDarkMode = false }: ChartTaxonomySankeyProps) {
  // Build Sankey links between successive taxonomy ranks
  // Taxonomy format example: "k__Bacteria; p__Proteobacteria; c__Gammaproteobacteria; o__Oceanospirillales; ..."
  const linkCounts = new Map<string, number>()

  data.forEach((item) => {
    const parts = item.Predicted_Taxonomy.split(";").map((p) => p.trim()).filter(Boolean)

    // Extract the clean label after the prefix (e.g., "p__"), keep up to first 25 chars
    const labels = parts.map((part) => {
      const withoutPrefix = part.split(" ").slice(1).join(" ").trim() || part
      return withoutPrefix.length > 40 ? `${withoutPrefix.substring(0, 40)}...` : withoutPrefix
    })

    // Create edges between consecutive ranks (k->p, p->c, c->o, ...)
    for (let i = 0; i < labels.length - 1; i++) {
      const from = labels[i]
      const to = labels[i + 1]
      if (!from || !to) continue
      const key = `${from}__TO__${to}`
      linkCounts.set(key, (linkCounts.get(key) || 0) + 1)
    }
  })

  const sankeyRows: Array<[string, string, number]> = []

  linkCounts.forEach((count, key) => {
    const [from, to] = key.split("__TO__")
    sankeyRows.push([from, to, count])
  })

  // Fallback if no data
  const chartData: Array<[string, string, number]> | any[] = sankeyRows.length
    ? [["From", "To", "Sequences"], ...sankeyRows]
    : [["From", "To", "Sequences"], ["No data", "No data", 1]]

  const options = {
    backgroundColor: "transparent",
    sankey: {
      node: {
        label: {
          color: isDarkMode ? "#E5E7EB" : "#111827",
          fontSize: 10,
        },
        nodePadding: 16,
      },
      link: {
        colorMode: "gradient" as const,
        color: {
          fill: isDarkMode ? "#6366F1" : "#4F46E5",
          fillOpacity: 0.5,
        },
      },
    },
  }

  return (
    <Card className={isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white/50 border-slate-200"}>
      <CardHeader>
        <CardTitle className={isDarkMode ? "text-white" : "text-slate-900"}>
          Taxonomy Classification Flow
        </CardTitle>
        <CardDescription className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
          Sankey-style flow of sequences across taxonomic ranks
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full h-[380px]">
          <Chart
            chartType="Sankey"
            width="100%"
            height="100%"
            data={chartData}
            options={options}
          />
        </div>
      </CardContent>
    </Card>
  )
}
