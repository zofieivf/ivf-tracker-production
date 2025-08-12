"use client"

import { useMemo } from "react"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltip } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Cell,
  ResponsiveContainer,
} from "recharts"
import type { IVFCycle } from "@/lib/types"
import { TrendingUp, Activity, Droplet, TestTube, Target } from "lucide-react"

interface CycleChartsViewProps {
  cycle: IVFCycle
}

export function CycleChartsView({ cycle }: CycleChartsViewProps) {
  const isTransferCycle = cycle.cycleGoal === "transfer"
  
  // Helper to get cycle date range for better context
  const getCycleDateRange = () => {
    if (cycle.days.length === 0) return ""
    const sortedDays = [...cycle.days].sort((a, b) => a.cycleDay - b.cycleDay)
    const startDate = format(parseISO(sortedDays[0].date), "MMM d, yyyy")
    const endDate = format(parseISO(sortedDays[sortedDays.length - 1].date), "MMM d, yyyy")
    return startDate === endDate ? startDate : `${startDate} - ${endDate}`
  }
  
  const dateRange = getCycleDateRange()
  
  // For transfer cycles, show different content
  if (isTransferCycle) {
    // Process hormone data for transfer cycles (same logic as retrieval cycles)
    const transferHormoneData = useMemo(() => {
      const hormoneMap = new Map<number, any>()

      cycle.days
        .filter((day) => day.bloodwork && day.bloodwork.length > 0)
        .forEach((day) => {
          const dayData = {
            day: day.cycleDay,
            date: format(parseISO(day.date), "MMM d, yyyy"),
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

    // Process lining thickness data for transfer cycles
    const transferLiningData = useMemo(() => {
      return cycle.days
        .filter((day) => day.follicleSizes?.liningThickness)
        .map((day) => ({
          day: day.cycleDay,
          date: format(parseISO(day.date), "MMM d, yyyy"),
          liningThickness: day.follicleSizes?.liningThickness || 0,
        }))
        .sort((a, b) => a.day - b.day)
    }, [cycle.days])

    const chartConfig = {
      estradiol: {
        label: "Estradiol",
        color: "#3b82f6",
      },
      lh: {
        label: "LH",
        color: "#10b981",
      },
      fsh: {
        label: "FSH",
        color: "#f59e0b",
      },
      progesterone: {
        label: "Progesterone",
        color: "#ef4444",
      },
      hcg: {
        label: "Beta HCG",
        color: "#8b5cf6",
      },
      liningThickness: {
        label: "Lining Thickness",
        color: "#8b5cf6",
      },
    }

    return (
      <div className="space-y-6">
        {/* Hormone Level Charts for Transfer Cycles */}
        {transferHormoneData.some((d) => d.estradiol !== undefined) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Estradiol (E2) Levels</CardTitle>
                  <CardDescription>Estradiol hormone levels during transfer cycle ({dateRange})</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={transferHormoneData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "pg/mL", angle: -90, position: "insideLeft" }}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3">
                              <p className="font-medium">Day {data.day} ({label})</p>
                              <p className="text-sm text-muted-foreground">
                                Estradiol: {data.estradiol} pg/mL
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="estradiol"
                      stroke={chartConfig.estradiol.color}
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      name="Estradiol"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {transferHormoneData.some((d) => d.progesterone !== undefined) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Progesterone Levels</CardTitle>
                  <CardDescription>Progesterone hormone levels during transfer cycle ({dateRange})</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={transferHormoneData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "ng/mL", angle: -90, position: "insideLeft" }}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3">
                              <p className="font-medium">Day {data.day} ({label})</p>
                              <p className="text-sm text-muted-foreground">
                                Progesterone: {data.progesterone} ng/mL
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="progesterone"
                      stroke={chartConfig.progesterone.color}
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      name="Progesterone"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {transferHormoneData.some((d) => d.lh !== undefined) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>LH (Luteinizing Hormone) Levels</CardTitle>
                  <CardDescription>LH hormone levels during transfer cycle ({dateRange})</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={transferHormoneData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "mIU/mL", angle: -90, position: "insideLeft" }}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3">
                              <p className="font-medium">Day {data.day} ({label})</p>
                              <p className="text-sm text-muted-foreground">
                                LH: {data.lh} mIU/mL
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="lh"
                      stroke={chartConfig.lh.color}
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      name="LH"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {transferHormoneData.some((d) => d.fsh !== undefined) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>FSH (Follicle Stimulating Hormone) Levels</CardTitle>
                  <CardDescription>FSH hormone levels during transfer cycle ({dateRange})</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={transferHormoneData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "mIU/mL", angle: -90, position: "insideLeft" }}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3">
                              <p className="font-medium">Day {data.day} ({label})</p>
                              <p className="text-sm text-muted-foreground">
                                FSH: {data.fsh} mIU/mL
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="fsh"
                      stroke={chartConfig.fsh.color}
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      name="FSH"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {transferHormoneData.some((d) => d.hcg !== undefined) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Beta HCG Levels Over Time</CardTitle>
                  <CardDescription>Beta HCG hormone levels from bloodwork during transfer cycle ({dateRange})</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={transferHormoneData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "mIU/mL", angle: -90, position: "insideLeft" }}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3">
                              <p className="font-medium">Day {data.day} ({label})</p>
                              <p className="text-sm text-muted-foreground">
                                Beta HCG: {data.hcg} mIU/mL
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hcg"
                      stroke={chartConfig.hcg.color}
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      name="Beta HCG"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Endometrial Lining Thickness for Transfer Cycles */}
        {transferLiningData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Endometrial Lining Thickness</CardTitle>
                  <CardDescription>Endometrial lining measurements during transfer cycle ({dateRange})</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={transferLiningData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, "dataMax + 2"]}
                      label={{ value: "mm", angle: -90, position: "insideLeft" }}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3">
                              <p className="font-medium">Day {data.day} ({label})</p>
                              <p className="text-sm text-muted-foreground">
                                Lining Thickness: {data.liningThickness}mm
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="liningThickness"
                      stroke={chartConfig.liningThickness.color}
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      name="Lining Thickness"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Beta HCG Results and Transfer Outcomes */}
        {cycle.outcome?.betaHcg1 !== undefined || cycle.outcome?.betaHcg2 !== undefined || cycle.outcome?.transferStatus || cycle.outcome?.liveBirth ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Beta HCG Results
              </CardTitle>
              <CardDescription>
                Beta HCG levels following embryo transfer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cycle.outcome.betaHcg1 !== undefined && (
                  <div className="text-center p-6 border rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{cycle.outcome.betaHcg1}</div>
                    <p className="text-sm text-muted-foreground">
                      Beta HCG 1 {cycle.outcome.betaHcg1Day && `(Day ${cycle.outcome.betaHcg1Day})`} (mIU/mL)
                    </p>
                  </div>
                )}
                {cycle.outcome.betaHcg2 !== undefined && (
                  <div className="text-center p-6 border rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{cycle.outcome.betaHcg2}</div>
                    <p className="text-sm text-muted-foreground">
                      Beta HCG 2 {cycle.outcome.betaHcg2Day && `(Day ${cycle.outcome.betaHcg2Day})`} (mIU/mL)
                    </p>
                  </div>
                )}
              </div>
              
              {/* Show progression if both values are available */}
              {cycle.outcome.betaHcg1 !== undefined && cycle.outcome.betaHcg2 !== undefined && (
                <div className="mt-6 text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold">
                    Progression Analysis
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {cycle.outcome.betaHcg2 > cycle.outcome.betaHcg1 ? 
                      `Increase from Beta HCG 1 to Beta HCG 2: ${((cycle.outcome.betaHcg2 - cycle.outcome.betaHcg1) / cycle.outcome.betaHcg1 * 100).toFixed(1)}%` :
                      "Levels decreased from Beta HCG 1 to Beta HCG 2"
                    }
                  </p>
                </div>
              )}

              {/* Transfer Status and Live Birth */}
              {(cycle.outcome.transferStatus || cycle.outcome.liveBirth) && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cycle.outcome.transferStatus && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${cycle.outcome.transferStatus === "successful" ? "text-green-600" : "text-red-600"}`}>
                        {cycle.outcome.transferStatus === "not-successful" ? "Not Successful" : "Successful"}
                      </div>
                      <p className="text-sm text-muted-foreground">Transfer Status</p>
                    </div>
                  )}

                  {cycle.outcome.liveBirth && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${cycle.outcome.liveBirth === "yes" ? "text-green-600" : "text-gray-600"}`}>
                        {cycle.outcome.liveBirth === "yes" ? "Yes" : "No"}
                      </div>
                      <p className="text-sm text-muted-foreground">Live Birth</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          // Show empty state when no data is available
          transferHormoneData.length === 0 && transferLiningData.length === 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Monitoring Data Yet</h3>
                  <p className="text-muted-foreground">
                    Add daily tracking data to see hormone levels and lining thickness charts.
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    )
  }
  
  // Process follicle growth data (for retrieval cycles)
  const follicleGrowthData = useMemo(() => {
    return cycle.days
      .filter((day) => day.follicleSizes)
      .map((day) => {
        const leftFollicles = day.follicleSizes?.left || []
        const rightFollicles = day.follicleSizes?.right || []
        const allFollicles = [...leftFollicles, ...rightFollicles]

        return {
          day: day.cycleDay,
          date: format(parseISO(day.date), "MMM d, yyyy"),
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
          date: format(parseISO(day.date), "MMM d, yyyy"),
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
        const date = format(parseISO(day.date), "MMM d, yyyy")

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

  // Process outcome funnel data
  const outcomeData = useMemo(() => {
    if (!cycle.outcome) return []

    const stages = [
      { name: "Eggs Retrieved", value: cycle.outcome.eggsRetrieved || 0, fill: "#3b82f6" },
      { name: "Mature Eggs", value: cycle.outcome.matureEggs || 0, fill: "#10b981" },
      { name: "Fertilized", value: cycle.outcome.fertilized || 0, fill: "#f59e0b" },
      { name: "Day 3 Embryos", value: cycle.outcome.day3Embryos || 0, fill: "#ef4444" },
      { name: "Day 5/6/7 Blastocysts", value: cycle.outcome.blastocysts || 0, fill: "#8b5cf6" },
      { name: "Euploid Blastocysts", value: cycle.outcome.euploidBlastocysts || 0, fill: "#06b6d4" },
    ]

    // Only include stages with values > 0
    return stages.filter((stage) => stage.value > 0)
  }, [cycle.outcome])

  // Process outcome bar chart data with percentages
  const outcomeBarData = useMemo(() => {
    if (!cycle.outcome) return []

    const outcome = cycle.outcome
    const eggsRetrieved = outcome.eggsRetrieved || 0

    if (eggsRetrieved === 0) return []

    const data = []

    if (outcome.matureEggs !== undefined) {
      data.push({
        stage: "Mature Eggs",
        count: outcome.matureEggs,
        percentage: Math.round((outcome.matureEggs / eggsRetrieved) * 100),
        fill: "#10b981",
      })
    }

    if (outcome.fertilized !== undefined) {
      data.push({
        stage: "Fertilized",
        count: outcome.fertilized,
        percentage: Math.round((outcome.fertilized / eggsRetrieved) * 100),
        fill: "#f59e0b",
      })
    }

    if (outcome.day3Embryos !== undefined) {
      data.push({
        stage: "Day 3 Embryos",
        count: outcome.day3Embryos,
        percentage: Math.round((outcome.day3Embryos / eggsRetrieved) * 100),
        fill: "#ef4444",
      })
    }

    if (outcome.blastocysts !== undefined) {
      data.push({
        stage: "Day 5/6/7 Blastocysts",
        count: outcome.blastocysts,
        percentage: Math.round((outcome.blastocysts / eggsRetrieved) * 100),
        fill: "#8b5cf6",
      })
    }

    if (outcome.euploidBlastocysts !== undefined) {
      data.push({
        stage: "Euploid Blastocysts",
        count: outcome.euploidBlastocysts,
        percentage: Math.round((outcome.euploidBlastocysts / eggsRetrieved) * 100),
        fill: "#06b6d4",
      })
    }

    return data
  }, [cycle.outcome])

  // Calculate dropoff data
  const dropoffData = useMemo(() => {
    if (!cycle.outcome) return []

    const outcome = cycle.outcome
    const stages = [
      { name: "Eggs Retrieved", value: outcome.eggsRetrieved || 0 },
      { name: "Mature Eggs", value: outcome.matureEggs || 0 },
      { name: "Fertilized", value: outcome.fertilized || 0 },
      { name: "Day 3 Embryos", value: outcome.day3Embryos || 0 },
      { name: "Day 5/6/7 Blastocysts", value: outcome.blastocysts || 0 },
      { name: "Euploid Blastocysts", value: outcome.euploidBlastocysts || 0 },
    ]

    const validStages = stages.filter((stage) => stage.value > 0)

    return validStages.map((stage, index) => {
      const previousValue = index > 0 ? validStages[index - 1].value : stage.value
      const dropoff = index > 0 ? previousValue - stage.value : 0
      const dropoffPercentage = index > 0 ? Math.round((dropoff / previousValue) * 100) : 0

      return {
        ...stage,
        dropoff,
        dropoffPercentage,
        retentionPercentage: 100 - dropoffPercentage,
      }
    })
  }, [cycle.outcome])

  const chartConfig = {
    leftCount: {
      label: "Left Ovary",
      color: "#3b82f6",
    },
    rightCount: {
      label: "Right Ovary",
      color: "#10b981",
    },
    averageSize: {
      label: "Average Size",
      color: "#f59e0b",
    },
    maxSize: {
      label: "Largest Follicle",
      color: "#ef4444",
    },
    liningThickness: {
      label: "Lining Thickness",
      color: "#8b5cf6",
    },
    estradiol: {
      label: "Estradiol",
      color: "#3b82f6",
    },
    lh: {
      label: "LH",
      color: "#10b981",
    },
    fsh: {
      label: "FSH",
      color: "#f59e0b",
    },
    progesterone: {
      label: "Progesterone",
      color: "#ef4444",
    },
    hcg: {
      label: "hCG",
      color: "#8b5cf6",
    },
  }

  if (follicleGrowthData.length === 0 && hormoneData.length === 0 && outcomeData.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">No chart data available</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add follicle measurements, bloodwork results, and cycle outcomes to see charts
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Individual Hormone Charts */}
      {hormoneData.some((d) => d.estradiol !== undefined) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Estradiol Levels</CardTitle>
                <CardDescription>Estradiol (E2) hormone trends throughout the cycle ({dateRange}) ({dateRange})</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hormoneData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "pg/mL", angle: -90, position: "insideLeft" }}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-medium">Day {data.day} ({label})</p>
                            <p className="text-sm text-muted-foreground">Estradiol: {data.estradiol} pg/mL</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="estradiol"
                    stroke={chartConfig.estradiol.color}
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="Estradiol"
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {hormoneData.some((d) => d.lh !== undefined) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>LH Levels</CardTitle>
                <CardDescription>Luteinizing Hormone trends throughout the cycle ({dateRange})</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hormoneData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "mIU/mL", angle: -90, position: "insideLeft" }}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-medium">Day {data.day} ({label})</p>
                            <p className="text-sm text-muted-foreground">LH: {data.lh} mIU/mL</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lh"
                    stroke={chartConfig.lh.color}
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="LH"
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {hormoneData.some((d) => d.fsh !== undefined) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>FSH Levels</CardTitle>
                <CardDescription>Follicle Stimulating Hormone trends throughout the cycle ({dateRange})</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hormoneData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "mIU/mL", angle: -90, position: "insideLeft" }}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-medium">Day {data.day} ({label})</p>
                            <p className="text-sm text-muted-foreground">FSH: {data.fsh} mIU/mL</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fsh"
                    stroke={chartConfig.fsh.color}
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="FSH"
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {hormoneData.some((d) => d.progesterone !== undefined) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Progesterone Levels</CardTitle>
                <CardDescription>Progesterone hormone trends throughout the cycle ({dateRange})</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hormoneData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "ng/mL", angle: -90, position: "insideLeft" }}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-medium">Day {data.day} ({label})</p>
                            <p className="text-sm text-muted-foreground">Progesterone: {data.progesterone} ng/mL</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="progesterone"
                    stroke={chartConfig.progesterone.color}
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="Progesterone"
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {hormoneData.some((d) => d.hcg !== undefined) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>hCG Levels</CardTitle>
                <CardDescription>Beta hCG hormone trends throughout the cycle ({dateRange})</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hormoneData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "mIU/mL", angle: -90, position: "insideLeft" }}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-medium">Day {data.day} ({label})</p>
                            <p className="text-sm text-muted-foreground">hCG: {data.hcg} mIU/mL</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hcg"
                    stroke={chartConfig.hcg.color}
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="hCG"
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Follicle Growth Trends */}
      {follicleGrowthData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Follicle Growth Trends</CardTitle>
                <CardDescription>Average and maximum follicle sizes over time ({dateRange})</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
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
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-medium">Day {data.day} ({label})</p>
                            {payload.map((entry: any, index: number) => (
                              <p key={index} className="text-sm" style={{ color: entry.stroke }}>
                                {entry.name}: {entry.value}mm
                              </p>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="averageSize"
                    stroke={chartConfig.averageSize.color}
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="Average Size"
                  />
                  <Line
                    type="monotone"
                    dataKey="maxSize"
                    stroke={chartConfig.maxSize.color}
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="Largest Follicle"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follicle Count by Ovary */}
      {follicleGrowthData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Follicle Count by Ovary</CardTitle>
                <CardDescription>Number of follicles measured each day ({dateRange})</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={follicleGrowthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-medium">Day {data.day} ({label})</p>
                            {payload.map((entry: any, index: number) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: {entry.value}
                              </p>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="leftCount" fill={chartConfig.leftCount.color} name="Left Ovary" />
                  <Bar dataKey="rightCount" fill={chartConfig.rightCount.color} name="Right Ovary" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Endometrial Lining Thickness */}
      {follicleGrowthData.some((d) => d.liningThickness > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Endometrial Lining Thickness</CardTitle>
                <CardDescription>Lining thickness measurements over time ({dateRange})</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
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
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-medium">Day {data.day} ({label})</p>
                            <p className="text-sm text-muted-foreground">
                              Lining Thickness: {data.liningThickness}mm
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="liningThickness"
                    stroke={chartConfig.liningThickness.color}
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="Lining Thickness"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outcome Visualizations */}
      {outcomeData.length > 0 && (
        <>
          {/* Outcome Funnel Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Cycle Outcome Funnel</CardTitle>
                  <CardDescription>Progression through each stage of the IVF process</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={outcomeData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }} 
                      tickLine={false} 
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      tickLine={false} 
                      axisLine={false}
                      label={{ value: "Count", angle: -90, position: "insideLeft" }}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm text-muted-foreground">Count: {data.value}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {outcomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>


          {/* Dropoff Analysis */}
          {dropoffData.length > 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Stage-by-Stage Analysis</CardTitle>
                    <CardDescription>Detailed breakdown of progression and dropoff at each stage</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dropoffData.map((stage, index) => (
                    <div key={stage.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{stage.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {stage.value} {stage.name.toLowerCase()}
                          {index > 0 && (
                            <span className="ml-2">({stage.retentionPercentage}% retention from previous stage)</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{stage.value}</div>
                        {index > 0 && stage.dropoff > 0 && (
                          <div className="text-sm text-red-600">
                            -{stage.dropoff} ({stage.dropoffPercentage}% loss)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}


          {/* PGT-A Testing Results */}
          {cycle.outcome?.euploidBlastocysts !== undefined && cycle.outcome?.blastocysts !== undefined && cycle.outcome.blastocysts > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>PGT-A Testing Results</CardTitle>
                    <CardDescription>Genetic testing outcomes for blastocysts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Total Blastocysts",
                          count: cycle.outcome.blastocysts,
                          fill: "#8b5cf6"
                        },
                        {
                          name: "Euploid (Normal)",
                          count: cycle.outcome.euploidBlastocysts,
                          fill: "#10b981"
                        }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            const percentage = cycle.outcome?.blastocysts ? Math.round((data.count / cycle.outcome.blastocysts) * 100) : 0
                            return (
                              <div className="bg-background border rounded-lg shadow-lg p-3">
                                <p className="font-medium">{data.name}</p>
                                <p className="text-sm text-muted-foreground">Count: {data.count}</p>
                                {data.name !== "Total Blastocysts" && (
                                  <p className="text-sm text-muted-foreground">Success Rate: {percentage}%</p>
                                )}
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transfer Readiness Summary */}
          {cycle.outcome?.embryosAvailableForTransfer !== undefined && cycle.outcome.embryosAvailableForTransfer > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Transfer Readiness</CardTitle>
                    <CardDescription>Embryos ready for transfer procedures</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{cycle.outcome.embryosAvailableForTransfer}</div>
                    <p className="text-sm text-muted-foreground">Available for Transfer</p>
                  </div>
                  {cycle.outcome.frozen !== undefined && cycle.outcome.frozen > 0 && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{cycle.outcome.frozen}</div>
                      <p className="text-sm text-muted-foreground">Frozen for Future Use</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Frozen Embryos Summary */}
          {cycle.outcome?.frozen && cycle.outcome.frozen > 0 && !cycle.outcome?.embryosAvailableForTransfer && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Frozen Embryos</CardTitle>
                    <CardDescription>Embryos stored for future use</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{cycle.outcome.frozen}</div>
                  <p className="text-sm text-muted-foreground">Embryos Frozen</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}


    </div>
  )
}
