/**
 * Clean Medication Overview Component
 * 
 * Preserves the exact Medication Schedule structure you like
 * Uses new clean system but maintains familiar UI patterns
 */

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
import type { Medication } from "@/lib/medications"

interface CleanMedicationOverviewProps {
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
  source: "scheduled" | "one-time"
  notes?: string
}

export function CleanMedicationOverview({ cycle }: CleanMedicationOverviewProps) {
  const { getMedicationsForCycle } = useIVFStore()
  
  const { medicationData, groupedByDay } = useMemo(() => {
    // Get all medications for this cycle using new system
    const medications = getMedicationsForCycle(cycle.id)
    const allMedications: MedicationEntry[] = []
    
    // Convert new system medications to the display format you're used to
    medications.forEach(med => {
      allMedications.push({
        day: med.cycleDay,
        date: (() => {
          // Calculate date from cycle start + day
          const cycleStartDate = parseISO(cycle.startDate)
          return addDays(cycleStartDate, med.cycleDay - 1).toISOString()
        })(),
        name: med.name,
        dosage: med.dosage,
        time: med.time,
        refrigerated: med.refrigerated,
        taken: med.taken,
        skipped: med.skipped,
        source: med.type === 'scheduled' ? "scheduled" : "one-time",
        notes: med.notes
      })
    })
    
    // Sort exactly like original (by day, then by time)
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

    // Group medications by day (same as original)
    const grouped = sortedMedications.reduce((acc, med) => {
      const key = med.day
      if (!acc[key]) {
        acc[key] = {
          day: med.day,
          date: med.date,
          medications: [],
          completed: 0,
          total: 0
        }
      }
      acc[key].medications.push(med)
      acc[key].total++
      if (med.taken || med.skipped) {
        acc[key].completed++
      }
      return acc
    }, {} as Record<number, { day: number; date: string; medications: MedicationEntry[]; completed: number; total: number }>)

    return {
      medicationData: sortedMedications,
      groupedByDay: Object.values(grouped).sort((a, b) => a.day - b.day)
    }
  }, [cycle.id, getMedicationsForCycle])

  // Check if we have any medications at all (same logic as original)
  if (medicationData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Medication Schedule
            </CardTitle>
            <Button asChild>
              <Link href={`/cycles/${cycle.id}/medication-schedule`}>
                Set Up Schedule
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No medication schedule set up for this cycle. Click "Set Up Schedule" to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculate overall completion stats (same as original)
  const totalMedications = medicationData.length
  const completedMedications = medicationData.filter(m => m.taken || m.skipped).length
  const completionPercentage = totalMedications > 0 ? Math.round((completedMedications / totalMedications) * 100) : 0

  // Get unique medication names for quick stats (same as original)
  const uniqueMedicationNames = [...new Set(medicationData.map(m => m.name))]

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medication Schedule
          </CardTitle>
          <Button asChild>
            <Link href={`/cycles/${cycle.id}/medication-schedule`}>
              Medication Schedule
            </Link>
          </Button>
        </div>
        <CardDescription>
          {uniqueMedicationNames.length} medications • {completedMedications}/{totalMedications} completed ({completionPercentage}%)
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Quick Stats - Same as original */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedMedications}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{totalMedications - completedMedications}</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>

          {/* Daily breakdown - Same visual structure as original */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Daily Schedule</h3>
            
            <div className="space-y-3">
              {groupedByDay.map((dayGroup) => (
                <div key={dayGroup.day} className="border rounded-lg p-4 space-y-3">
                  {/* Day header - Same as original */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        Day {dayGroup.day}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(parseISO(dayGroup.date), "EEEE, MMM d")}
                      </span>
                      <div className="flex items-center gap-1">
                        {dayGroup.completed === dayGroup.total ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : dayGroup.completed > 0 ? (
                          <Minus className="h-4 w-4 text-orange-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {dayGroup.completed}/{dayGroup.total}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Medications list - Same format as original */}
                  <div className="grid gap-2">
                    {dayGroup.medications.map((med, index) => (
                      <div key={`${dayGroup.day}-${index}`} className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-mono">{med.time}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{med.name}</span>
                            <span className="text-sm text-muted-foreground">{med.dosage}</span>
                            
                            {med.refrigerated && (
                              <Snowflake className="h-3 w-3 text-blue-500" />
                            )}
                            
                            <Badge 
                              variant={med.source === "scheduled" ? "secondary" : "outline"} 
                              className={`text-xs ${
                                med.source === "scheduled" 
                                  ? "" 
                                  : "border-orange-200 text-orange-700"
                              }`}
                            >
                              {med.source === "scheduled" ? "Scheduled" : "One-time"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {med.taken && (
                            <Badge variant="default" className="bg-green-600">
                              Taken
                            </Badge>
                          )}
                          {med.skipped && (
                            <Badge variant="secondary">
                              Skipped
                            </Badge>
                          )}
                          {!med.taken && !med.skipped && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}