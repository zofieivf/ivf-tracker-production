"use client"

import { useMemo } from "react"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Snowflake, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIVFStore } from "@/lib/store"
import type { IVFCycle } from "@/lib/types"

interface CompactMedicationTimelineProps {
  cycle: IVFCycle
}

interface MedicationEntry {
  day: number
  date: string
  name: string
  dosage: string
  time: string
  refrigerated: boolean
  source: "scheduled" | "day-specific"
  daySpecificId?: string
}

export function CompactMedicationTimeline({ cycle }: CompactMedicationTimelineProps) {
  const { getUnifiedMedicationsForDay, deleteCleanDaySpecificMedication, dailyMedicationStatuses } = useIVFStore()
  
  const medicationData = useMemo(() => {
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
          source: "scheduled"
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
          source: "day-specific",
          daySpecificId: dayMed.id
        })
      })
    })
    
    return allMedications.sort((a, b) => {
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
  }, [cycle, getUnifiedMedicationsForDay, dailyMedicationStatuses])

  const handleDeleteDaySpecific = (cycleDay: number, medicationId: string) => {
    if (confirm('Are you sure you want to delete this day-specific medication?')) {
      deleteCleanDaySpecificMedication(cycle.id, cycleDay, medicationId)
    }
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Current Medication Timeline
        </CardTitle>
        <CardDescription>
          Reference for editing - showing all scheduled medications
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
                  <th className="text-left py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicationData.map((med, index) => {
                  const prevMed = index > 0 ? medicationData[index - 1] : null
                  const isNewDay = !prevMed || prevMed.day !== med.day
                  
                  return (
                    <tr key={index} className={`border-b hover:bg-muted/30 ${isNewDay ? 'border-t-2' : ''}`}>
                      <td className="py-2">
                        {isNewDay && (
                          <span className="font-medium">Day {med.day}</span>
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
                        {med.source === "day-specific" && med.daySpecificId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-red-100"
                            onClick={() => handleDeleteDaySpecific(med.day, med.daySpecificId!)}
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground">No medications scheduled for this cycle</p>
        )}
      </CardContent>
    </Card>
  )
}