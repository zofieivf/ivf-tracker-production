"use client"

import { useMemo } from "react"
import { format, parseISO, differenceInDays } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Pill, 
  Target, 
  TrendingUp, 
  Clock,
  TestTube,
  Activity
} from "lucide-react"
import { useIVFStore } from "@/lib/store"
import type { IVFCycle } from "@/lib/types"

interface CycleComparisonViewProps {
  cycles: IVFCycle[]
}

interface MedicationSummary {
  name: string
  totalUnits: number
  daysUsed: number
  firstDay: number
  lastDay: number
  dailyDosages: { day: number; dosage: number }[]
  averageDailyDose: number
  maxDailyDose: number
}

interface CycleAnalysis {
  cycle: IVFCycle
  medications: MedicationSummary[]
  stimDuration: number
  totalDays: number
  protocolDisplay: string
}

export function CycleComparisonView({ cycles }: CycleComparisonViewProps) {
  const { getMedicationScheduleByCycleId, getDailyMedicationStatus } = useIVFStore()
  
  const cycleAnalyses = useMemo(() => {
    return cycles.map(cycle => {
      // Analyze medications for this cycle
      const medicationMap = new Map<string, MedicationSummary>()
      const schedule = getMedicationScheduleByCycleId(cycle.id)
      
      // Process all days in the cycle
      cycle.days.forEach(day => {
        const dailyStatus = getDailyMedicationStatus(cycle.id, day.cycleDay)
        
        // Process scheduled medications
        if (schedule) {
          const todaysMedications = schedule.medications.filter(
            med => med.startDay <= day.cycleDay && med.endDay >= day.cycleDay
          )
          
          todaysMedications.forEach(scheduledMed => {
            const status = dailyStatus?.medications.find(m => m.scheduledMedicationId === scheduledMed.id)
            const actualDosage = status?.actualDosage || scheduledMed.dosage
            const dosageNumber = parseFloat(actualDosage.replace(/[^\d.]/g, '')) || 0
            
            if (!medicationMap.has(scheduledMed.name)) {
              medicationMap.set(scheduledMed.name, {
                name: scheduledMed.name,
                totalUnits: 0,
                daysUsed: 0,
                firstDay: day.cycleDay,
                lastDay: day.cycleDay,
                dailyDosages: [],
                averageDailyDose: 0,
                maxDailyDose: 0
              })
            }
            
            const medSummary = medicationMap.get(scheduledMed.name)!
            medSummary.totalUnits += dosageNumber
            medSummary.daysUsed++
            medSummary.firstDay = Math.min(medSummary.firstDay, day.cycleDay)
            medSummary.lastDay = Math.max(medSummary.lastDay, day.cycleDay)
            medSummary.dailyDosages.push({ day: day.cycleDay, dosage: dosageNumber })
            medSummary.maxDailyDose = Math.max(medSummary.maxDailyDose, dosageNumber)
          })
        }
        
        // Process day-specific medications
        if (dailyStatus?.daySpecificMedications) {
          dailyStatus.daySpecificMedications.forEach(dayMed => {
            const dosageNumber = parseFloat(dayMed.dosage.replace(/[^\d.]/g, '')) || 0
            
            if (!medicationMap.has(dayMed.name)) {
              medicationMap.set(dayMed.name, {
                name: dayMed.name,
                totalUnits: 0,
                daysUsed: 0,
                firstDay: day.cycleDay,
                lastDay: day.cycleDay,
                dailyDosages: [],
                averageDailyDose: 0,
                maxDailyDose: 0
              })
            }
            
            const medSummary = medicationMap.get(dayMed.name)!
            medSummary.totalUnits += dosageNumber
            medSummary.daysUsed++
            medSummary.firstDay = Math.min(medSummary.firstDay, day.cycleDay)
            medSummary.lastDay = Math.max(medSummary.lastDay, day.cycleDay)
            medSummary.dailyDosages.push({ day: day.cycleDay, dosage: dosageNumber })
            medSummary.maxDailyDose = Math.max(medSummary.maxDailyDose, dosageNumber)
          })
        }
        
      })
      
      // Calculate averages and finalize medication summaries
      const medications = Array.from(medicationMap.values()).map(med => ({
        ...med,
        averageDailyDose: med.daysUsed > 0 ? med.totalUnits / med.daysUsed : 0
      }))
      
      // Calculate stim duration (from first to last medication day)
      const stimDuration = medications.length > 0 
        ? Math.max(...medications.map(m => m.lastDay)) - Math.min(...medications.map(m => m.firstDay)) + 1
        : 0
      
      // Get protocol display name
      const getProtocolDisplay = (type: string) => {
        switch (type) {
          case "antagonist": return "Antagonist Protocol"
          case "long-lupron": return "Long Lupron Protocol"
          case "microdose-flare": return "Microdose Flare Protocol"
          case "mini-ivf": return "Mini-IVF Protocol"
          case "fresh": return "Fresh Transfer"
          case "frozen-medicated": return "Frozen Transfer (Medicated)"
          case "frozen-modified-natural": return "Frozen Transfer (Modified Natural)"
          case "frozen-natural": return "Frozen Transfer (Natural)"
          case "other": return "Other Protocol"
          default: return type
        }
      }
      
      return {
        cycle,
        medications: medications.sort((a, b) => a.firstDay - b.firstDay),
        stimDuration,
        totalDays: cycle.days.length,
        protocolDisplay: getProtocolDisplay(cycle.cycleType)
      } as CycleAnalysis
    })
  }, [cycles, getMedicationScheduleByCycleId, getDailyMedicationStatus])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Cycle Overview Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Metric</th>
                      {cycleAnalyses.map((analysis) => (
                        <th key={analysis.cycle.id} className="text-left py-2 px-4">
                          <div>
                            <div className="font-medium">{analysis.cycle.name}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {analysis.cycle.cycleGoal === "retrieval" ? "Retrieval" : "Transfer"}
                            </Badge>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4 font-medium">Protocol</td>
                      {cycleAnalyses.map((analysis) => (
                        <td key={analysis.cycle.id} className="py-3 px-4">
                          {analysis.protocolDisplay}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 font-medium">Start Date</td>
                      {cycleAnalyses.map((analysis) => (
                        <td key={analysis.cycle.id} className="py-3 px-4">
                          {format(parseISO(analysis.cycle.startDate), "MMM d, yyyy")}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 font-medium">Age at Start</td>
                      {cycleAnalyses.map((analysis) => (
                        <td key={analysis.cycle.id} className="py-3 px-4">
                          {analysis.cycle.ageAtStart || "N/A"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 font-medium">Total Days Tracked</td>
                      {cycleAnalyses.map((analysis) => (
                        <td key={analysis.cycle.id} className="py-3 px-4">
                          {analysis.totalDays}
                        </td>
                      ))}
                    </tr>
                    {/* Only show Stim Duration for retrieval cycles */}
                    {cycleAnalyses.length > 0 && cycleAnalyses[0].cycle.cycleGoal === "retrieval" && (
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Stim Duration</td>
                        {cycleAnalyses.map((analysis) => (
                          <td key={analysis.cycle.id} className="py-3 px-4">
                            {analysis.stimDuration > 0 ? `${analysis.stimDuration} days` : "N/A"}
                          </td>
                        ))}
                      </tr>
                    )}
                    <tr>
                      <td className="py-3 px-4 font-medium">Status</td>
                      {cycleAnalyses.map((analysis) => (
                        <td key={analysis.cycle.id} className="py-3 px-4">
                          <Badge variant={analysis.cycle.status === "completed" ? "default" : "secondary"}>
                            {analysis.cycle.status}
                          </Badge>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Medication Comparison
              </CardTitle>
              <CardDescription>
                Compare medication dosages, duration, and total usage across cycles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Get all unique medications across cycles */}
              {(() => {
                const allMedications = new Set<string>()
                cycleAnalyses.forEach(analysis => {
                  analysis.medications.forEach(med => allMedications.add(med.name))
                })

                return Array.from(allMedications).map(medName => (
                  <div key={medName} className="mb-6 p-4 border rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      {medName}
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Cycle</th>
                            <th className="text-left py-2">Total Units</th>
                            <th className="text-left py-2">Days Used</th>
                            <th className="text-left py-2">Duration</th>
                            <th className="text-left py-2">Avg Daily Dose</th>
                            <th className="text-left py-2">Max Daily Dose</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cycleAnalyses.map(analysis => {
                            const medication = analysis.medications.find(m => m.name === medName)
                            return (
                              <tr key={analysis.cycle.id} className="border-b">
                                <td className="py-2 font-medium">{analysis.cycle.name}</td>
                                <td className="py-2">
                                  {medication ? `${medication.totalUnits.toLocaleString()} units` : "Not used"}
                                </td>
                                <td className="py-2">
                                  {medication ? `${medication.daysUsed} days` : "—"}
                                </td>
                                <td className="py-2">
                                  {medication ? `Day ${medication.firstDay} - ${medication.lastDay}` : "—"}
                                </td>
                                <td className="py-2">
                                  {medication ? `${medication.averageDailyDose.toFixed(0)} units` : "—"}
                                </td>
                                <td className="py-2">
                                  {medication ? `${medication.maxDailyDose.toFixed(0)} units` : "—"}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Timeline Metric</th>
                      {cycleAnalyses.map((analysis) => (
                        <th key={analysis.cycle.id} className="text-left py-2 px-4">
                          {analysis.cycle.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4 font-medium">Cycle Start</td>
                      {cycleAnalyses.map((analysis) => (
                        <td key={analysis.cycle.id} className="py-3 px-4">
                          {format(parseISO(analysis.cycle.startDate), "MMM d, yyyy")}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 font-medium">Cycle End</td>
                      {cycleAnalyses.map((analysis) => (
                        <td key={analysis.cycle.id} className="py-3 px-4">
                          {analysis.cycle.endDate 
                            ? format(parseISO(analysis.cycle.endDate), "MMM d, yyyy")
                            : "Ongoing"
                          }
                        </td>
                      ))}
                    </tr>
                    {/* Only show stim-related metrics for retrieval cycles */}
                    {cycleAnalyses.length > 0 && cycleAnalyses[0].cycle.cycleGoal === "retrieval" && (
                      <>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-medium">First Stim Day</td>
                          {cycleAnalyses.map((analysis) => (
                            <td key={analysis.cycle.id} className="py-3 px-4">
                              {analysis.medications.length > 0 
                                ? `Day ${Math.min(...analysis.medications.map(m => m.firstDay))}`
                                : "N/A"
                              }
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-medium">Last Stim Day</td>
                          {cycleAnalyses.map((analysis) => (
                            <td key={analysis.cycle.id} className="py-3 px-4">
                              {analysis.medications.length > 0 
                                ? `Day ${Math.max(...analysis.medications.map(m => m.lastDay))}`
                                : "N/A"
                              }
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-medium">Stim Duration</td>
                          {cycleAnalyses.map((analysis) => (
                            <td key={analysis.cycle.id} className="py-3 px-4">
                              <Badge variant="outline">
                                {analysis.stimDuration > 0 ? `${analysis.stimDuration} days` : "N/A"}
                              </Badge>
                            </td>
                          ))}
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Outcome Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Outcome</th>
                      {cycleAnalyses.map((analysis) => (
                        <th key={analysis.cycle.id} className="text-left py-2 px-4">
                          {analysis.cycle.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cycleAnalyses.some(a => a.cycle.outcome?.eggsRetrieved) && (
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Eggs Retrieved</td>
                        {cycleAnalyses.map((analysis) => (
                          <td key={analysis.cycle.id} className="py-3 px-4">
                            {analysis.cycle.outcome?.eggsRetrieved || "N/A"}
                          </td>
                        ))}
                      </tr>
                    )}
                    {cycleAnalyses.some(a => a.cycle.outcome?.matureEggs) && (
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Mature Eggs</td>
                        {cycleAnalyses.map((analysis) => (
                          <td key={analysis.cycle.id} className="py-3 px-4">
                            {analysis.cycle.outcome?.matureEggs || "N/A"}
                          </td>
                        ))}
                      </tr>
                    )}
                    {cycleAnalyses.some(a => a.cycle.outcome?.fertilized) && (
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Fertilized</td>
                        {cycleAnalyses.map((analysis) => (
                          <td key={analysis.cycle.id} className="py-3 px-4">
                            {analysis.cycle.outcome?.fertilized || "N/A"}
                          </td>
                        ))}
                      </tr>
                    )}
                    {cycleAnalyses.some(a => a.cycle.outcome?.blastocysts) && (
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Blastocysts</td>
                        {cycleAnalyses.map((analysis) => (
                          <td key={analysis.cycle.id} className="py-3 px-4">
                            {analysis.cycle.outcome?.blastocysts || "N/A"}
                          </td>
                        ))}
                      </tr>
                    )}
                    {cycleAnalyses.some(a => a.cycle.outcome?.euploidBlastocysts) && (
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Euploid Blastocysts</td>
                        {cycleAnalyses.map((analysis) => (
                          <td key={analysis.cycle.id} className="py-3 px-4 text-green-600 font-medium">
                            {analysis.cycle.outcome?.euploidBlastocysts || "N/A"}
                          </td>
                        ))}
                      </tr>
                    )}
                    {cycleAnalyses.some(a => a.cycle.outcome?.transferStatus) && (
                      <tr>
                        <td className="py-3 px-4 font-medium">Transfer Result</td>
                        {cycleAnalyses.map((analysis) => (
                          <td key={analysis.cycle.id} className="py-3 px-4">
                            {analysis.cycle.outcome?.transferStatus ? (
                              <Badge 
                                variant={analysis.cycle.outcome.transferStatus === "successful" ? "default" : "destructive"}
                              >
                                {analysis.cycle.outcome.transferStatus}
                              </Badge>
                            ) : "N/A"}
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}