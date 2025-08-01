"use client"

import { useMemo } from "react"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ScatterChart, Scatter, Cell } from "recharts"
import type { IVFCycle } from "@/lib/types"
import { TrendingUp, Activity, Droplet, TestTube } from "lucide-react"

interface CycleChartsViewProps {
  cycle: IVFCycle
}

export function CycleChartsView({ cycle }: CycleChartsViewProps) {
  // Process follicle growth data
  const follicleGrowthData = useMemo(() => {
    return cycle.days
      .filter((day) => day.follicleSizes)
      .map((day) => {
        const leftFollicles = day.follicleSizes?.left || []
        const rightFollicles = day.follicleSizes?.right || []
        const allFollicles = [...leftFollicles, ...rightFollicles]

        return {
          day: day.cycleDay,
          date: format(parseISO(day.date), "MMM d"),
          leftCount: leftFollicles.length,
          rightCount: rightFollicles.length,
          totalCount: allFollicles.length,
          averageSize:
            allFollicles.length > 0
              ? Math.round((allFollicles.reduce((sum, size) => sum + size, 0) / allFollicles.length) * 10) / 10
              : 0,
          maxSize: allFollicles.length > 0 ? Math.max(...allFollicles) : 0,
          liningThickness: day.follicleSizes?.liningThickness || 0,
          leftSizes: leftFollicles,
          rightSizes: rightFollicles,
        }
      })
      .sort((a, b) => a.day - b.day)
  }, [cycle.days])

  // Process hormone data
  const hormoneData = useMemo(() => {
    const hormoneMap = new Map<number, any>()

    cycle.days
      .filter((day) => day.bloodwork && day.bloodwork.length > 0)
      .forEach((day) => {
        const dayData = {
          day: day.cycleDay,
          date: format(parseISO(day.date), "MMM d"),
        }

        day.bloodwork?.forEach((result) => {
          const value = Number.parseFloat(result.value)
          if (!isNaN(value)) {
            const testName = result.test.toLowerCase()
            if (testName.includes("estradiol") || testName.includes("e2")) {
              dayData.estradiol = value
            } else if (testName.includes("lh")) {
              dayData.lh = value
            } else if (testName.includes("fsh")) {
              dayData.fsh = value
            } else if (testName.includes("progesterone")) {
              dayData.progesterone = value
            } else if (testName.includes("hcg") || testName.includes("beta")) {
              dayData.hcg = value
            }
          }
        })

        hormoneMap.set(day.cycleDay, { ...hormoneMap.get(day.cycleDay), ...dayData })
      })

    return Array.from(hormoneMap.values()).sort((a, b) => a.day - b.day)
  }, [cycle.days])

  // Process individual follicle scatter data
  const follicleScatterData = useMemo(() => {
    const scatterData: Array<{ day: number; size: number; ovary: string; date: string }> = []

    cycle.days
      .filter((day) => day.follicleSizes)
      .forEach((day) => {
        const date = format(parseISO(day.date), "MMM d")

        day.follicleSizes?.left.forEach((size) => {
          scatterData.push({
            day: day.cycleDay,
            size,
            ovary: "Left",
            date,
          })
        })

        day.follicleSizes?.right.forEach((size) => {
          scatterData.push({
            day: day.cycleDay,
            size,
            ovary: "Right",
            date,
          })
        })
      })

    return scatterData.sort((a, b) => a.day - b.day)
  }, [cycle.days])

  const chartConfig = {
    leftCount: {
      label: "Left Ovary",
      color: "hsl(var(--chart-1))",
    },
    rightCount: {
      label: "Right Ovary",
      color: "hsl(var(--chart-2))",
    },
    averageSize: {
      label: "Average Size",
      color: "hsl(var(--chart-3))",
    },
    maxSize: {
      label: "Largest Follicle",
      color: "hsl(var(--chart-4))",
    },
    liningThickness: {
      label: "Lining Thickness",
      color: "hsl(var(--chart-5))",
    },
    estradiol: {
      label: "Estradiol",
      color: "hsl(var(--chart-1))",
    },
    lh: {
      label: "LH",
      color: "hsl(var(--chart-2))",
    },
    fsh: {
      label: "FSH",
      color: "hsl(var(--chart-3))",
    },
    progesterone: {
      label: "Progesterone",
      color: "hsl(var(--chart-4))",
    },
    hcg: {
      label: "hCG",
      color: "hsl(var(--chart-5))",
    },
  }

  if (follicleGrowthData.length === 0 && hormoneData.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">No chart data available</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add follicle measurements and bloodwork results to see charts
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {follicleGrowthData.length > 0 && (
        <>
          {/* Follicle Count Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Follicle Count by Ovary</CardTitle>
                  <CardDescription>Number of follicles measured each day</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <BarChart data={follicleGrowthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    labelFormatter={(value, payload) => {
                      if (payload && payload[0]) {
                        return `Day ${payload[0].payload.day} (${value})`
                      }
                      return value
                    }}
                  />
                  <Bar dataKey="leftCount" fill="var(--color-leftCount)" name="Left Ovary" />
                  <Bar dataKey="rightCount" fill="var(--color-rightCount)" name="Right Ovary" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Follicle Size Trends */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Follicle Size Trends</CardTitle>
                  <CardDescription>Average and maximum follicle sizes over time</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <LineChart data={follicleGrowthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "Size (mm)", angle: -90, position: "insideLeft" }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    labelFormatter={(value, payload) => {
                      if (payload && payload[0]) {
                        return `Day ${payload[0].payload.day} (${value})`
                      }
                      return value
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="averageSize"
                    stroke="var(--color-averageSize)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Average Size"
                  />
                  <Line
                    type="monotone"
                    dataKey="maxSize"
                    stroke="var(--color-maxSize)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Largest Follicle"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Individual Follicle Scatter Plot */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Individual Follicle Sizes</CardTitle>
                  <CardDescription>Size of each measured follicle by ovary</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <ScatterChart data={follicleScatterData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "Cycle Day", position: "insideBottom", offset: -10 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "Size (mm)", angle: -90, position: "insideLeft" }}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-medium">{`Day ${data.day} (${data.date})`}</p>
                            <p className="text-sm text-muted-foreground">{`${data.ovary} Ovary: ${data.size}mm`}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Scatter dataKey="size" name="Follicle Size">
                    {follicleScatterData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.ovary === "Left" ? "var(--color-leftCount)" : "var(--color-rightCount)"}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Endometrial Lining Thickness */}
          {follicleGrowthData.some((d) => d.liningThickness > 0) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Endometrial Lining Thickness</CardTitle>
                    <CardDescription>Lining thickness measurements over time</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <LineChart
                    data={follicleGrowthData.filter((d) => d.liningThickness > 0)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "Thickness (mm)", angle: -90, position: "insideLeft" }}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      labelFormatter={(value, payload) => {
                        if (payload && payload[0]) {
                          return `Day ${payload[0].payload.day} (${value})`
                        }
                        return value
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="liningThickness"
                      stroke="var(--color-liningThickness)"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      name="Lining Thickness"
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Hormone Level Charts */}
      {hormoneData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Hormone Levels</CardTitle>
                <CardDescription>Hormone level trends throughout the cycle</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <LineChart data={hormoneData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Level", angle: -90, position: "insideLeft" }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]) {
                      return `Day ${payload[0].payload.day} (${value})`
                    }
                    return value
                  }}
                />
                {hormoneData.some((d) => d.estradiol !== undefined) && (
                  <Line
                    type="monotone"
                    dataKey="estradiol"
                    stroke="var(--color-estradiol)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Estradiol"
                    connectNulls={false}
                  />
                )}
                {hormoneData.some((d) => d.lh !== undefined) && (
                  <Line
                    type="monotone"
                    dataKey="lh"
                    stroke="var(--color-lh)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="LH"
                    connectNulls={false}
                  />
                )}
                {hormoneData.some((d) => d.fsh !== undefined) && (
                  <Line
                    type="monotone"
                    dataKey="fsh"
                    stroke="var(--color-fsh)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="FSH"
                    connectNulls={false}
                  />
                )}
                {hormoneData.some((d) => d.progesterone !== undefined) && (
                  <Line
                    type="monotone"
                    dataKey="progesterone"
                    stroke="var(--color-progesterone)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Progesterone"
                    connectNulls={false}
                  />
                )}
                {hormoneData.some((d) => d.hcg !== undefined) && (
                  <Line
                    type="monotone"
                    dataKey="hcg"
                    stroke="var(--color-hcg)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="hCG"
                    connectNulls={false}
                  />
                )}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      {follicleGrowthData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Peak Follicle Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.max(...follicleGrowthData.map((d) => d.totalCount))}</div>
              <p className="text-xs text-muted-foreground">Maximum follicles measured in one day</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Largest Follicle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.max(...follicleGrowthData.map((d) => d.maxSize))} mm</div>
              <p className="text-xs text-muted-foreground">Largest follicle size recorded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Peak Lining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.max(...follicleGrowthData.map((d) => d.liningThickness))} mm
              </div>
              <p className="text-xs text-muted-foreground">Maximum lining thickness</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
