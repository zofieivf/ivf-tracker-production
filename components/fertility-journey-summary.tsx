"use client"

import { useMemo } from "react"
import { format, parseISO, differenceInMonths, differenceInDays } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, TrendingUp, DollarSign, Activity, Target, Clock, Baby, TestTube, Stethoscope } from "lucide-react"
import { useIVFStore } from "@/lib/store"

export function FertilityJourneySummary() {
  const { cycles, procedures, naturalPregnancies } = useIVFStore()

  const journeyStats = useMemo(() => {
    const retrievalCycles = cycles.filter(c => c.cycleGoal === "retrieval")
    const transferCycles = cycles.filter(c => c.cycleGoal === "transfer")
    
    // Protocol summary - separated by retrieval vs transfer
    const retrievalProtocols = retrievalCycles.reduce((acc, cycle) => {
      const protocol = cycle.cycleType
      acc[protocol] = (acc[protocol] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const transferProtocols = transferCycles.reduce((acc, cycle) => {
      const protocol = cycle.cycleType
      acc[protocol] = (acc[protocol] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Timeline calculation
    const allDates = [
      ...cycles.map(c => parseISO(c.startDate)),
      ...procedures.map(p => parseISO(p.procedureDate)),
      ...naturalPregnancies.map(p => parseISO(p.dateOfConception))
    ].sort((a, b) => a.getTime() - b.getTime())
    
    const startDate = allDates[0]
    const mostRecentDate = allDates[allDates.length - 1] || new Date()
    const journeyDuration = startDate ? differenceInMonths(mostRecentDate, startDate) : 0

    // Egg retrieval aggregation
    const retrievalResults = retrievalCycles.reduce((acc, cycle) => {
      const outcome = cycle.outcome
      if (outcome) {
        acc.totalEggs += outcome.eggsRetrieved || 0
        acc.totalMatureEggs += outcome.matureEggs || 0
        acc.totalFertilized += outcome.fertilized || 0
        acc.totalEmbryos += outcome.day3Embryos || 0
        acc.totalBlastocysts += outcome.blastocysts || 0
        acc.totalFrozenEmbryos += outcome.frozen || 0
        acc.totalTested += outcome.embryosTested || 0
        acc.totalNormal += outcome.euploidBlastocysts || 0
      }
      return acc
    }, {
      totalEggs: 0,
      totalMatureEggs: 0,
      totalFertilized: 0,
      totalEmbryos: 0,
      totalBlastocysts: 0,
      totalFrozenEmbryos: 0,
      totalTested: 0,
      totalNormal: 0
    })

    // Transfer outcomes
    const transferOutcomes = transferCycles.reduce((acc, cycle) => {
      if (cycle.outcome?.transferStatus === "successful") {
        acc.pregnancies++
        if (cycle.outcome.liveBirth === "yes") {
          acc.liveBirths++
        }
      }
      return acc
    }, { pregnancies: 0, liveBirths: 0 })

    // Cost calculation
    const totalCosts = cycles.reduce((acc, cycle) => {
      const costs = cycle.costs
      if (costs) {
        acc.totalSpent += (costs.cycleCost || 0) + (costs.pgtCost || 0) + 
                         (costs.medicationsCost || 0) + (costs.storageCost || 0)
        acc.totalInsurance += costs.insuranceCoverage || 0
      }
      return acc
    }, { totalSpent: 0, totalInsurance: 0 })

    // Add procedure costs
    const procedureCosts = procedures.reduce((acc, proc) => {
      acc.totalSpent += proc.cost || 0
      acc.totalInsurance += proc.insuranceCoverage || 0
      return acc
    }, { totalSpent: 0, totalInsurance: 0 })

    totalCosts.totalSpent += procedureCosts.totalSpent
    totalCosts.totalInsurance += procedureCosts.totalInsurance

    // Procedure summary
    const procedureSummary = procedures.reduce((acc, proc) => {
      const type = proc.procedureType
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      timeline: {
        startDate,
        mostRecentDate,
        journeyDuration,
        totalActivities: cycles.length + procedures.length + naturalPregnancies.length
      },
      cycles: {
        total: cycles.length,
        retrievals: retrievalCycles.length,
        transfers: transferCycles.length,
        completed: cycles.filter(c => c.status === "completed").length,
        active: cycles.filter(c => c.status === "active").length
      },
      retrievals: retrievalResults,
      transfers: {
        ...transferOutcomes,
        total: transferCycles.length
      },
      procedures: {
        total: procedures.length,
        byType: procedureSummary
      },
      costs: {
        totalSpent: totalCosts.totalSpent,
        totalInsurance: totalCosts.totalInsurance,
        netCost: totalCosts.totalSpent - totalCosts.totalInsurance
      },
      retrievalProtocols: retrievalProtocols,
      transferProtocols: transferProtocols,
      naturalPregnancies: naturalPregnancies.length
    }
  }, [cycles, procedures, naturalPregnancies])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getSuccessRates = () => {
    if (journeyStats.retrievals.totalEggs === 0) return null
    
    const matureRate = journeyStats.retrievals.totalMatureEggs / journeyStats.retrievals.totalEggs * 100
    const fertilizationRate = journeyStats.retrievals.totalFertilized / journeyStats.retrievals.totalMatureEggs * 100
    const blastocystRate = journeyStats.retrievals.totalBlastocysts / journeyStats.retrievals.totalFertilized * 100
    
    return { matureRate, fertilizationRate, blastocystRate }
  }

  const successRates = getSuccessRates()

  if (journeyStats.timeline.totalActivities === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Fertility Journey Summary
          </CardTitle>
          <CardDescription>Complete overview of your fertility journey</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your journey summary will appear here once you start tracking cycles and procedures.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Fertility Journey Summary
        </h2>
        <p className="text-muted-foreground">
          Complete overview of your fertility journey and progress
        </p>
      </div>

      {/* Timeline & Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Journey Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {journeyStats.timeline.journeyDuration} months
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Since {journeyStats.timeline.startDate ? format(journeyStats.timeline.startDate, "MMM yyyy") : "N/A"}
            </p>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              IVF Cycles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{journeyStats.cycles.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {journeyStats.cycles.retrievals} retrievals, {journeyStats.cycles.transfers} transfers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Investment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(journeyStats.costs.netCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              After {formatCurrency(journeyStats.costs.totalInsurance)} insurance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Egg Retrieval Summary */}
      {journeyStats.cycles.retrievals > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Egg Retrieval Summary
            </CardTitle>
            <CardDescription>
              Aggregated results across {journeyStats.cycles.retrievals} retrieval cycle{journeyStats.cycles.retrievals !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Total Eggs Retrieved</div>
                <div className="text-3xl font-bold">{journeyStats.retrievals.totalEggs}</div>
                <div className="text-xs text-muted-foreground">
                  Avg: {journeyStats.cycles.retrievals > 0 ? Math.round(journeyStats.retrievals.totalEggs / journeyStats.cycles.retrievals) : 0} per cycle
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Mature Eggs</div>
                <div className="text-3xl font-bold">{journeyStats.retrievals.totalMatureEggs}</div>
                {successRates && (
                  <div className="text-xs text-muted-foreground">
                    {successRates.matureRate.toFixed(1)}% maturity rate
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Fertilized</div>
                <div className="text-3xl font-bold">{journeyStats.retrievals.totalFertilized}</div>
                {successRates && (
                  <div className="text-xs text-muted-foreground">
                    {successRates.fertilizationRate.toFixed(1)}% fertilization rate
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Blastocysts</div>
                <div className="text-3xl font-bold">{journeyStats.retrievals.totalBlastocysts}</div>
                {successRates && (
                  <div className="text-xs text-muted-foreground">
                    {successRates.blastocystRate.toFixed(1)}% blast rate
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Euploids</div>
                <div className="text-3xl font-bold text-green-600">{journeyStats.retrievals.totalNormal}</div>
                {journeyStats.retrievals.totalTested > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {((journeyStats.retrievals.totalNormal / journeyStats.retrievals.totalTested) * 100).toFixed(1)}% euploid rate
                  </div>
                )}
              </div>
            </div>

            {journeyStats.retrievals.totalTested > 0 && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">PGT Tested</div>
                  <div className="text-2xl font-bold">{journeyStats.retrievals.totalTested}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Frozen Embryos</div>
                  <div className="text-2xl font-bold">{journeyStats.retrievals.totalFrozenEmbryos}</div>
                </div>
              </div>
            )}

            {/* Success Rate Visualization */}
            {successRates && (
              <div className="mt-6 space-y-4">
                <h4 className="font-medium">Success Rate Funnel</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Mature Eggs ({successRates.matureRate.toFixed(1)}%)</span>
                      <span>{journeyStats.retrievals.totalMatureEggs} / {journeyStats.retrievals.totalEggs}</span>
                    </div>
                    <Progress value={successRates.matureRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fertilization ({successRates.fertilizationRate.toFixed(1)}%)</span>
                      <span>{journeyStats.retrievals.totalFertilized} / {journeyStats.retrievals.totalMatureEggs}</span>
                    </div>
                    <Progress value={successRates.fertilizationRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Blastocyst Development ({successRates.blastocystRate.toFixed(1)}%)</span>
                      <span>{journeyStats.retrievals.totalBlastocysts} / {journeyStats.retrievals.totalFertilized}</span>
                    </div>
                    <Progress value={successRates.blastocystRate} className="h-2" />
                  </div>
                </div>
              </div>
            )}

            {/* Retrieval Protocols */}
            {Object.keys(journeyStats.retrievalProtocols).length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Protocols Used</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {Object.entries(journeyStats.retrievalProtocols)
                    .sort(([,a], [,b]) => b - a)
                    .map(([protocol, count]) => (
                    <div key={protocol} className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm font-medium">{(() => {
                        switch (protocol) {
                          case "antagonist": return "Antagonist Protocol"
                          case "long-lupron": return "Long Lupron Protocol"
                          case "microdose-flare": return "Microdose Flare Protocol"
                          case "mini-ivf": return "Mini-IVF Protocol"
                          case "other": return "Other Protocol"
                          default: return protocol
                        }
                      })()}</span>
                      <Badge variant="outline" className="text-xs">{count} cycle{count !== 1 ? 's' : ''}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transfer & Pregnancy Summary */}
      {journeyStats.cycles.transfers > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5" />
              Transfer & Pregnancy Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Total Transfers</div>
                <div className="text-3xl font-bold">{journeyStats.transfers.total}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Pregnancies Achieved</div>
                <div className="text-3xl font-bold text-green-600">{journeyStats.transfers.pregnancies}</div>
                <div className="text-xs text-muted-foreground">
                  {journeyStats.transfers.total > 0 ? ((journeyStats.transfers.pregnancies / journeyStats.transfers.total) * 100).toFixed(1) : 0}% success rate
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Live Births</div>
                <div className="text-3xl font-bold text-green-600">{journeyStats.transfers.liveBirths}</div>
              </div>
            </div>

            {/* Transfer Protocols */}
            {Object.keys(journeyStats.transferProtocols).length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Protocols Used</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {Object.entries(journeyStats.transferProtocols)
                    .sort(([,a], [,b]) => b - a)
                    .map(([protocol, count]) => (
                    <div key={protocol} className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm font-medium">{(() => {
                        switch (protocol) {
                          case "fresh": return "Fresh Transfer"
                          case "frozen-medicated": return "Frozen Transfer (Medicated)"
                          case "frozen-modified-natural": return "Frozen Transfer (Modified Natural)"
                          case "frozen-natural": return "Frozen Transfer (Natural)"
                          case "other": return "Other Protocol"
                          default: return protocol
                        }
                      })()}</span>
                      <Badge variant="outline" className="text-xs">{count} cycle{count !== 1 ? 's' : ''}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Activities */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Procedures Summary */}
        {journeyStats.procedures.total > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Procedures Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold">{journeyStats.procedures.total} procedures</div>
                <div className="space-y-2">
                  {Object.entries(journeyStats.procedures.byType)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span>{type === "Other" ? "Other procedures" : type}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Costs</span>
                  <span className="font-medium">{formatCurrency(journeyStats.costs.totalSpent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Insurance Coverage</span>
                  <span className="font-medium text-green-600">-{formatCurrency(journeyStats.costs.totalInsurance)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Net Investment</span>
                    <span className="font-bold text-lg">{formatCurrency(journeyStats.costs.netCost)}</span>
                  </div>
                </div>
              </div>
              
              {journeyStats.timeline.journeyDuration > 0 && (
                <div className="text-xs text-muted-foreground">
                  Average: {formatCurrency(journeyStats.costs.netCost / journeyStats.timeline.journeyDuration)} per month
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Natural Pregnancies */}
      {journeyStats.naturalPregnancies > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5" />
              Natural Pregnancies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{journeyStats.naturalPregnancies}</div>
            <p className="text-sm text-muted-foreground">
              Natural pregnancies during your fertility journey
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}