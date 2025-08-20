/**
 * Clean Cycle Medication Overview
 * 
 * Uses the new clean medication system while preserving the EXACT same UI
 * as the existing CycleMedicationOverview component
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

interface CleanCycleMedicationOverviewProps {
  cycle: IVFCycle
}

export function CleanCycleMedicationOverview({ cycle }: CleanCycleMedicationOverviewProps) {
  const { getCleanMedicationScheduleOverview } = useIVFStore()
  
  const scheduleOverview = useMemo(() => {
    return getCleanMedicationScheduleOverview(cycle.id)
  }, [cycle.id, getCleanMedicationScheduleOverview])

  // If no schedule or no medications, show the setup card (same as original)
  if (!scheduleOverview || scheduleOverview.totalMedications === 0) {
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

  // Calculate completion stats (same logic as original)
  const totalMedications = scheduleOverview.totalMedications
  const completedMedications = scheduleOverview.completedMedications
  const completionPercentage = totalMedications > 0 ? Math.round((completedMedications / totalMedications) * 100) : 0

  // Get unique medication names from both recurring and day-specific
  const allMedicationNames = [
    ...scheduleOverview.schedule.medications.map(m => m.name),
    ...scheduleOverview.dailyBreakdown.flatMap(day => 
      day.medications.filter(m => m.type === 'day-specific').map(m => m.name)
    )
  ]
  const uniqueMedicationNames = [...new Set(allMedicationNames)]

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
          {uniqueMedicationNames.length} medications • {totalMedications} total scheduled doses
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Daily breakdown - Same visual structure as original */}
          <div className="space-y-4">
            
            <div className="space-y-3">
              {scheduleOverview.dailyBreakdown.map((dayGroup) => (
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
                      <span className="text-sm text-muted-foreground">
                        {dayGroup.total} medication{dayGroup.total !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  {/* Medications list - Same format as original */}
                  <div className="grid gap-2">
                    {dayGroup.medications.map((med, index) => (
                      <div key={`${dayGroup.day}-${index}`} className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-mono">{med.hour}:{med.minute} {med.ampm}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{med.name}</span>
                            <span className="text-sm text-muted-foreground">{med.dosage}</span>
                            
                            {med.refrigerated && (
                              <Snowflake className="h-3 w-3 text-blue-500" />
                            )}
                            
                            <Badge 
                              variant={med.type === 'recurring' ? 'secondary' : 'outline'}
                              className={`text-xs ${
                                med.type === 'day-specific' 
                                  ? 'border-orange-200 text-orange-700' 
                                  : ''
                              }`}
                            >
                              {med.type === 'recurring' ? 'Recurring' : 'Day-specific'}
                            </Badge>
                          </div>
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