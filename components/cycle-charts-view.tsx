"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid } from "recharts"
import type { IVFCycle } from "@/lib/types"

interface CycleChartsViewProps {
  cycle: IVFCycle
}

export function CycleChartsView({ cycle }: CycleChartsViewProps) {
  // Process follicle data
  const follicleData = cycle.days
    .filter((day) => day.follicleSizes)
    .map((day) => ({
      day: day.cycleDay,
      date: day.date,
      leftCount: day.follicleSizes!.left.length,
      rightCount: day.follicleSizes!.right.length,
      totalCount: day.follicleSizes!.left.length + day.follicleSizes!.right.length,
      avgLeft:
        day.follicleSizes!.left.length > 0
          ? day.follicleSizes!.left.reduce((a, b) => a + b, 0) / day.follicleSizes!.left.length
          : 0,
      avgRight:
        day.follicleSizes!.right.length > 0
          ? day.follicleSizes!.right.reduce((a, b) => a + b, 0) / day.follicleSizes!.right.length
          : 0,
      maxLeft: day.follicleSizes!.left.length > 0 ? Math.max(...day.follicleSizes!.left) : 0,
      maxRight: day.follicleSizes!.right.length > 0 ? Math.max(...day.follicleSizes!.right) : 0,
      liningThickness: day.follicleSizes!.liningThickness || 0,
    }))

  // Process individual follicle data for scatter plot
  const individualFollicles = cycle.days
    .filter((day) => day.follicleSizes)
    .flatMap((day) => [
      ...day.follicleSizes!.left.map((size) => ({
        day: day.cycleDay,
        size,
        ovary: "Left",
      })),
      ...day.follicleSizes!.right.map((size) => ({
        day: day.cycleDay,
        size,
        ovary: "Right",
      })),
    ])

  // Process hormone data
  const hormoneData = cycle.days
    .filter((day) => day.bloodwork && day.bloodwork.length > 0)
    .map((day) => {
      const hormones: any = { day: day.cycleDay, date: day.date }
      day.bloodwork!.forEach((result) => {
        const value = Number.parseFloat(result.value)
        if (!isNaN(value)) {
          hormones[result.test] = value
        }
      })
      return hormones
    })

  // Get unique hormone types
  const hormoneTypes = Array.from(
    new Set(cycle.days.filter((day) => day.bloodwork).flatMap((day) => day.bloodwork!.map((result) => result.test))),
  )

  // Process outcome data for funnel chart
  const processOutcomeData = () => {
    if (!cycle.outcome) return []

    const stages = []
    if (cycle.outcome.eggsRetrieved) {
      stages.push({ stage: "Eggs Retrieved", count: cycle.outcome.eggsRetrieved, color: "#3b82f6" })
    }
    if (cycle.outcome.matureEggs) {
      stages.push({ stage: "Mature Eggs", count: cycle.outcome.matureEggs, color: "#10b981" })
    }
    if (cycle.outcome.fertilized) {
      stages.push({ stage: "Fertilized", count: cycle.outcome.fertilized, color: "#f59e0b" })
    }
    if (cycle.outcome.day3Embryos) {
      stages.push({ stage: "Day 3 Embryos", count: cycle.outcome.day3Embryos, color: "#8b5cf6" })
    }
    if (cycle.outcome.day5Blasts) {
      stages.push({ stage: "Day 5 Blastocysts", count: cycle.outcome.day5Blasts, color: "#ef4444" })
    }
    if (cycle.outcome.pgtNormal) {
      stages.push({ stage: "PGT Normal", count: cycle.outcome.pgtNormal, color: "#06b6d4" })
    }

    return stages
  }

  const outcomeData = processOutcomeData()

  // Calculate success rates
  const calculateSuccessRates = () => {
    if (!cycle.outcome || !cycle.outcome.eggsRetrieved) return []

    const initial = cycle.outcome.eggsRetrieved
    const stages = []

    if (cycle.outcome.matureEggs) {
      stages.push({
        stage: "Maturation Rate",
        percentage: Math.round((cycle.outcome.matureEggs / initial) * 100),
        color: "#10b981",
      })
    }
    if (cycle.outcome.fertilized) {
      stages.push({
        stage: "Fertilization Rate",
        percentage: Math.round((cycle.outcome.fertilized / initial) * 100),
        color: "#f59e0b",
      })
    }
    if (cycle.outcome.day5Blasts) {
      stages.push({
        stage: "Blastocyst Rate",
        percentage: Math.round((cycle.outcome.day5Blasts / initial) * 100),
        color: "#ef4444",
      })
    }
    if (cycle.outcome.pgtNormal) {
      stages.push({
        stage: "PGT Normal Rate",
        percentage: Math.round((cycle.outcome.pgtNormal / initial) * 100),
        color: "#06b6d4",
      })
    }

    return stages
  }

  const successRates = calculateSuccessRates()

  // Chart configurations
  const chartConfig = {
    leftCount: { label: "Left Ovary", color: "#3b82f6" },
    rightCount: { label: "Right Ovary", color: "#10b981" },
    totalCount: { label: "Total Follicles", color: "#8b5cf6" },
    avgSize: { label: "Average Size", color: "#f59e0b" },
    maxSize: { label: "Max Size", color: "#ef4444" },
    liningThickness: { label: "Lining Thickness", color: "#06b6d4" },
  }

  const hasFollicleData = follicleData.length > 0
  const hasHormoneData = hormoneData.length > 0
  const hasOutcomeData = outcomeData.length > 0
  const hasIndividualFollicles = individualFollicles.length > 0

  // Summary statistics
  const summaryStats = {
    peakFollicleCount: Math.max(...follicleData.map((d) => d.totalCount), 0),
    largestFollicle: Math.max(...individualFollicles.map((f) => f.size), 0),
    maxLining: Math.max(...follicleData.map((d) => d.liningThickness), 0),
  }

  if (!hasFollicleData && !hasHormoneData && !hasOutcomeData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No chart data available yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Add follicle measurements, bloodwork results, or cycle outcomes to see visualizations.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {(hasFollicleData || hasOutcomeData) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hasFollicleData && (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{summaryStats.peakFollicleCount}</div>
                  <p className="text-sm text-muted-foreground">Peak Follicle Count</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{summaryStats.largestFollicle.toFixed(1)} mm</div>
                  <p className="text-sm text-muted-foreground">Largest Follicle</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{summaryStats.maxLining.toFixed(1)} mm</div>
                  <p className="text-sm text-muted-foreground">Max Lining Thickness</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Outcome Charts */}
      {hasOutcomeData && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Outcome Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Cycle Outcome Funnel</CardTitle>
              <CardDescription>Progression through IVF stages</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={outcomeData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Success Rates */}
          {successRates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Success Rates by Stage</CardTitle>
                <CardDescription>Percentage success at each stage</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={successRates}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="percentage" fill="#10b981" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Stage-by-Stage Analysis */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Stage-by-Stage Analysis</CardTitle>
              <CardDescription>Detailed breakdown of losses at each stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {outcomeData.map((stage, index) => {
                  const prevStage = index > 0 ? outcomeData[index - 1] : null
                  const dropoff = prevStage ? prevStage.count - stage.count : 0
                  const retentionRate = prevStage ? Math.round((stage.count / prevStage.count) * 100) : 100

                  return (
                    <div key={stage.stage} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{stage.stage}</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Count:</span>
                          <span className="font-medium">{stage.count}</span>
                        </div>
                        {prevStage && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Retention:</span>
                              <Badge variant="outline" className="text-green-600">
                                {retentionRate}%
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Lost:</span>
                              <span className="text-sm text-red-600">-{dropoff}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Follicle Charts */}
      {hasFollicleData && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Follicle Count by Ovary */}
          <Card>
            <CardHeader>
              <CardTitle>Follicle Count by Ovary</CardTitle>
              <CardDescription>Number of follicles measured each day</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={follicleData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="leftCount" fill="#3b82f6" name="Left Ovary" />
                  <Bar dataKey="rightCount" fill="#10b981" name="Right Ovary" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Follicle Size Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Follicle Size Trends</CardTitle>
              <CardDescription>Average and maximum follicle sizes over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <LineChart data={follicleData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="avgLeft" stroke="#3b82f6" name="Avg Left" />
                  <Line type="monotone" dataKey="avgRight" stroke="#10b981" name="Avg Right" />
                  <Line type="monotone" dataKey="maxLeft" stroke="#f59e0b" name="Max Left" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="maxRight" stroke="#ef4444" name="Max Right" strokeDasharray="5 5" />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Individual Follicle Sizes */}
          {hasIndividualFollicles && (
            <Card>
              <CardHeader>
                <CardTitle>Individual Follicle Sizes</CardTitle>
                <CardDescription>Each follicle measurement by day</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ScatterChart data={individualFollicles}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis dataKey="size" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Scatter dataKey="size" fill="#3b82f6" />
                  </ScatterChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Endometrial Lining */}
          <Card>
            <CardHeader>
              <CardTitle>Endometrial Lining Thickness</CardTitle>
              <CardDescription>Lining thickness progression</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <LineChart data={follicleData.filter((d) => d.liningThickness > 0)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="liningThickness" stroke="#06b6d4" name="Lining Thickness" />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hormone Charts */}
      {hasHormoneData && (
        <Card>
          <CardHeader>
            <CardTitle>Hormone Levels</CardTitle>
            <CardDescription>Hormone trends throughout the cycle</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <LineChart data={hormoneData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                {hormoneTypes.map((hormone, index) => (
                  <Line
                    key={hormone}
                    type="monotone"
                    dataKey={hormone}
                    stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                    name={hormone}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
