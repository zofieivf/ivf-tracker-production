"use client"

import { useMemo } from "react"
import { format, parseISO, addDays } from "date-fns"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  source: "scheduled" | "day-specific"
  notes?: string
}

export function CycleMedicationOverview({ cycle }: CycleMedicationOverviewProps) {
  const { getMedicationScheduleByCycleId, getDailyMedicationStatus, getUnifiedMedicationsForDay, dailyMedicationStatuses, medicationSchedules } = useIVFStore()
  
  const { medicationData, groupedByDay } = useMemo(() => {
    const schedule = getMedicationScheduleByCycleId(cycle.id)
    const allMedications: MedicationEntry[] = []
    
    // Get all cycle days sorted by day number
    const sortedDays = cycle.days.sort((a, b) => a.cycleDay - b.cycleDay)
    
    sortedDays.forEach(day => {
      // Use unified medication system
      const unifiedMeds = getUnifiedMedicationsForDay(cycle.id, day.cycleDay)
      
      // Add scheduled medications for this day
      unifiedMeds.scheduled.forEach(item => {
        allMedications.push({
          day: day.cycleDay,
          date: day.date,
          name: item.medication.name,
          dosage: item.status.actualDosage || item.medication.dosage,
          time: `${item.medication.hour}:${item.medication.minute} ${item.medication.ampm}`,
          refrigerated: item.medication.refrigerated,
          taken: item.status.taken,
          skipped: item.status.skipped,
          source: "scheduled",
          notes: item.medication.notes || item.status.notes
        })
      })
      
      // Add day-specific medications
      unifiedMeds.daySpecific.forEach(dayMed => {
        allMedications.push({
          day: day.cycleDay,
          date: day.date,
          name: dayMed.name,
          dosage: dayMed.dosage,
          time: `${dayMed.hour}:${dayMed.minute} ${dayMed.ampm}`,
          refrigerated: dayMed.refrigerated,
          taken: dayMed.taken,
          skipped: dayMed.skipped,
          source: "day-specific",
          notes: dayMed.notes
        })
      })
    })
    
    const sortedMedications = allMedications.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day
      
      // Parse time strings for proper chronological sorting
      const parseTime = (timeStr: string) => {
        if (!timeStr) return 0
        const [time, ampm] = timeStr.split(' ')
        const [hour, minute] = time.split(':').map(Number)
        let hour24 = hour
        if (ampm === 'PM' && hour !== 12) hour24 += 12
        if (ampm === 'AM' && hour === 12) hour24 = 0
        return hour24 * 60 + minute // Convert to minutes for comparison
      }
      
      return parseTime(a.time) - parseTime(b.time)
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
  }, [cycle, getMedicationScheduleByCycleId, getDailyMedicationStatus, dailyMedicationStatuses, medicationSchedules])

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
        return <Badge variant="secondary" className="text-xs">Recurring</Badge>
      case "day-specific":
        return <Badge variant="outline" className="text-xs">Day-Specific</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Medication Overview</h2>
          <p className="text-muted-foreground">
            Complete medication timeline for {cycle.name}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/cycles/${cycle.id}/medication-schedule`}>
            <Pill className="h-4 w-4 mr-2" />
            Edit Medications
          </Link>
        </Button>
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
                    {Array.from(med.sources).map((source, index) => (
                      <div key={index}>{getSourceBadge(source)}</div>
                    ))}
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
            Compact view of all medications by day with status tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {medicationData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Day</th>
                    <th className="text-left py-2 font-medium">Date</th>
                    <th className="text-left py-2 font-medium">Medication</th>
                    <th className="text-left py-2 font-medium">Dosage</th>
                    <th className="text-left py-2 font-medium">Time</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {medicationData.map((med, index) => {
                    // Get clinic visit info for this day
                    const cycleDay = cycle.days.find(d => d.cycleDay === med.day)
                    const getClinicVisitStyling = () => {
                      if (!cycleDay?.clinicVisit) return { isClinicDay: false, rowClass: '' }
                      
                      switch (cycleDay.clinicVisit.type) {
                        case "retrieval":
                          return { isClinicDay: true, rowClass: 'bg-purple-50/50' }
                        case "transfer":
                          return { isClinicDay: true, rowClass: 'bg-pink-50/50' }
                        case "baseline":
                          return { isClinicDay: true, rowClass: 'bg-blue-50/50' }
                        case "monitoring":
                          return { isClinicDay: true, rowClass: 'bg-green-50/50' }
                        case "other":
                          return { isClinicDay: true, rowClass: 'bg-orange-50/50' }
                        default:
                          return { isClinicDay: true, rowClass: 'bg-gray-50/50' }
                      }
                    }
                    
                    const clinicVisitInfo = getClinicVisitStyling()
                    const prevMed = index > 0 ? medicationData[index - 1] : null
                    const isNewDay = !prevMed || prevMed.day !== med.day
                    
                    return (
                      <tr key={index} className={`border-b hover:bg-muted/30 ${clinicVisitInfo.rowClass} ${isNewDay ? 'border-t-2' : ''}`}>
                        <td className="py-2">
                          {isNewDay && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Day {med.day}</span>
                              {clinicVisitInfo.isClinicDay && (
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  {cycleDay?.clinicVisit?.type}
                                </Badge>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {isNewDay && format(parseISO(med.date), "MMM d")}
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{med.name}</span>
                            {med.refrigerated && <Snowflake className="h-3 w-3 text-blue-500" />}
                            {getSourceBadge(med.source)}
                          </div>
                        </td>
                        <td className="py-2 text-muted-foreground">{med.dosage}</td>
                        <td className="py-2 text-muted-foreground">
                          {med.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {med.time}
                            </div>
                          )}
                        </td>
                        <td className="py-2">
                          {getStatusIcon(med.taken, med.skipped)}
                        </td>
                        <td className="py-2 text-muted-foreground text-xs max-w-32 truncate" title={med.notes}>
                          {med.notes}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No medications recorded for this cycle</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}