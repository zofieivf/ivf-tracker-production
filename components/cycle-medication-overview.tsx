"use client"

import { useMemo } from "react"
import { format, parseISO, addDays } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pill, Calendar, Clock, Snowflake, CheckCircle, XCircle, Minus } from "lucide-react"
import { useIVFStore } from "@/lib/store"
import type { IVFCycle } from "@/lib/types"

interface CycleMedicationOverviewProps {
  cycle: IVFCycle
}

interface MedicationEntry {
  day: number
  date: string
  name: string
  dosage: string
  time: string
  refrigerated: boolean
  taken?: boolean
  skipped?: boolean
  source: "scheduled" | "day-specific" | "legacy"
  notes?: string
}

export function CycleMedicationOverview({ cycle }: CycleMedicationOverviewProps) {
  const { getMedicationScheduleByCycleId, getDailyMedicationStatus } = useIVFStore()
  
  const { medicationData, groupedByDay } = useMemo(() => {
    const schedule = getMedicationScheduleByCycleId(cycle.id)
    const allMedications: MedicationEntry[] = []
    
    // Get all cycle days sorted by day number
    const sortedDays = cycle.days.sort((a, b) => a.cycleDay - b.cycleDay)
    
    sortedDays.forEach(day => {
      const dailyStatus = getDailyMedicationStatus(cycle.id, day.cycleDay)
      
      // Add scheduled medications for this day
      if (schedule) {
        const todaysMedications = schedule.medications.filter(
          med => med.startDay <= day.cycleDay && med.endDay >= day.cycleDay
        )
        
        todaysMedications.forEach(scheduledMed => {
          const status = dailyStatus?.medications.find(m => m.scheduledMedicationId === scheduledMed.id)
          
          allMedications.push({
            day: day.cycleDay,
            date: day.date,
            name: scheduledMed.name,
            dosage: status?.actualDosage || scheduledMed.dosage,
            time: `${scheduledMed.hour}:${scheduledMed.minute} ${scheduledMed.ampm}`,
            refrigerated: scheduledMed.refrigerated,
            taken: status?.taken,
            skipped: status?.skipped,
            source: "scheduled",
            notes: scheduledMed.notes || status?.notes
          })
        })
        
        // Add day-specific medications
        if (dailyStatus?.daySpecificMedications) {
          dailyStatus.daySpecificMedications.forEach(dayMed => {
            allMedications.push({
              day: day.cycleDay,
              date: day.date,
              name: dayMed.name,
              dosage: dayMed.dosage,
              time: `${dayMed.hour}:${dayMed.minute} ${dayMed.ampm}`,
              refrigerated: dayMed.refrigerated,
              taken: dayMed.taken,
              skipped: dayMed.skipped,
              source: "day-specific"
            })
          })
        }
      } else {
        // Fallback to legacy medications if no schedule exists
        if (day.medications) {
          day.medications.forEach(med => {
            allMedications.push({
              day: day.cycleDay,
              date: day.date,
              name: med.name,
              dosage: med.dosage || "",
              time: med.hour && med.minute && med.ampm ? `${med.hour}:${med.minute} ${med.ampm}` : "",
              refrigerated: med.refrigerated || false,
              taken: med.taken,
              source: "legacy"
            })
          })
        }
      }
    })
    
    const sortedMedications = allMedications.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day
      return a.time.localeCompare(b.time)
    })

    // Group medications by day
    const grouped = sortedMedications.reduce((acc, med) => {
      const key = med.day
      if (!acc[key]) {
        acc[key] = {
          day: med.day,
          date: med.date,
          medications: []
        }
      }
      acc[key].medications.push(med)
      return acc
    }, {} as Record<number, { day: number, date: string, medications: MedicationEntry[] }>)
    
    return {
      medicationData: sortedMedications,
      groupedByDay: Object.values(grouped).sort((a, b) => a.day - b.day)
    }
  }, [cycle, getMedicationScheduleByCycleId, getDailyMedicationStatus])

  // Group medications by name for the summary
  const medicationSummary = useMemo(() => {
    const summary = new Map<string, {
      name: string
      totalDays: number
      firstDay: number
      lastDay: number
      dosages: Set<string>
      sources: Set<string>
    }>()

    medicationData.forEach(med => {
      const key = med.name.toLowerCase()
      if (!summary.has(key)) {
        summary.set(key, {
          name: med.name,
          totalDays: 0,
          firstDay: med.day,
          lastDay: med.day,
          dosages: new Set(),
          sources: new Set()
        })
      }
      
      const entry = summary.get(key)!
      entry.totalDays++
      entry.firstDay = Math.min(entry.firstDay, med.day)
      entry.lastDay = Math.max(entry.lastDay, med.day)
      entry.dosages.add(med.dosage)
      entry.sources.add(med.source)
    })

    return Array.from(summary.values()).sort((a, b) => a.firstDay - b.firstDay)
  }, [medicationData])

  const getStatusIcon = (taken?: boolean, skipped?: boolean) => {
    if (taken) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (skipped) return <XCircle className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "scheduled":
        return <Badge variant="secondary" className="text-xs">Medication Schedule</Badge>
      case "day-specific":
        return <Badge variant="outline" className="text-xs">Day-Specific</Badge>
      case "legacy":
        return <Badge variant="outline" className="text-xs">Manual Entry</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Medication Overview</h2>
        <p className="text-muted-foreground">
          Complete medication timeline for {cycle.name}
        </p>
      </div>

      {/* Medication Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medication Summary
          </CardTitle>
          <CardDescription>
            Overview of all medications used in this cycle
          </CardDescription>
        </CardHeader>
        <CardContent>
          {medicationSummary.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {medicationSummary.map((med, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{med.name}</h3>
                    {Array.from(med.sources).map(source => getSourceBadge(source))}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Day {med.firstDay} - Day {med.lastDay}
                    </div>
                    <div>{med.totalDays} day{med.totalDays !== 1 ? 's' : ''}</div>
                    {med.dosages.size > 1 ? (
                      <div className="text-xs">Multiple dosages</div>
                    ) : (
                      <div className="text-xs">{Array.from(med.dosages)[0]}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No medications recorded for this cycle</p>
          )}
        </CardContent>
      </Card>

      {/* Detailed Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Medication Timeline
          </CardTitle>
          <CardDescription>
            Day-by-day medication schedule with status tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {groupedByDay.length > 0 ? (
            <div className="space-y-4">
              {groupedByDay.map((dayGroup) => (
                <div key={dayGroup.day} className="p-4 border rounded-lg">
                  {/* Day Header */}
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                    <div className="font-medium text-lg">Day {dayGroup.day}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(parseISO(dayGroup.date), "EEEE, MMMM d")}
                    </div>
                  </div>
                  
                  {/* Medications for this day */}
                  <div className="space-y-2">
                    {dayGroup.medications.map((med, medIndex) => (
                      <div key={medIndex} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{med.name}</span>
                            {med.refrigerated && <Snowflake className="h-3 w-3 text-blue-500" />}
                            {getSourceBadge(med.source)}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {med.dosage}
                          </div>
                          
                          {med.time && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {med.time}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusIcon(med.taken, med.skipped)}
                          {med.notes && (
                            <div className="text-xs text-muted-foreground max-w-32 truncate" title={med.notes}>
                              {med.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No medications recorded for this cycle</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}