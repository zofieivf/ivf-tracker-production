/**
 * Clean Unified Daily Medication Checklist
 * 
 * Uses the new clean medication system while preserving the EXACT same UI
 * as the existing UnifiedDailyMedicationChecklist component
 */

"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Clock, Pill, CheckCircle2, Circle, Edit3, Snowflake } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useIVFStore } from "@/lib/store"
import { groupMedicationsByTime } from "@/lib/clean-medication-system"

interface CleanUnifiedDailyMedicationChecklistProps {
  cycleId: string
  cycleDay: number
  date: string
}

export function CleanUnifiedDailyMedicationChecklist({ 
  cycleId, 
  cycleDay, 
  date 
}: CleanUnifiedDailyMedicationChecklistProps) {
  const { 
    getDayMedications,
    markCleanMedicationTaken,
    markCleanMedicationSkipped,
    resetCleanMedicationStatus,
    getCycleById
  } = useIVFStore()
  
  const [editingTakenTime, setEditingTakenTime] = useState<string | null>(null)
  const [tempTakenAt, setTempTakenAt] = useState("")
  
  // Get medications for this day using clean system
  const dayMeds = getDayMedications(cycleId, cycleDay, date)
  const cycle = getCycleById(cycleId)
  
  // Group medications by time (morning/evening like original)
  const { morning, evening } = groupMedicationsByTime(dayMeds.medications)
  
  // Determine if this cycle is in the past (same logic as original)
  const isCycleInPast = () => {
    if (!cycle) return false
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (cycle.endDate) {
      const endDate = new Date(cycle.endDate)
      endDate.setHours(0, 0, 0, 0)
      return endDate < today
    }
    
    if (cycle.status === 'completed' || cycle.status === 'cancelled') {
      return true
    }
    
    return false
  }

  const isPastCycle = isCycleInPast()

  // Early return if no medications (matching original style)
  if (dayMeds.totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Daily Medications
          </CardTitle>
          <CardDescription>
            No medications scheduled for cycle day {cycleDay}. Set up your medication schedule first.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const openEditTakenTime = (medicationId: string) => {
    const medication = dayMeds.medications.find(m => m.scheduledMedicationId === medicationId)
    const currentTakenAt = medication?.takenAt || new Date().toISOString()
    
    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const formattedDateTime = currentTakenAt.slice(0, 16)
    setTempTakenAt(formattedDateTime)
    setEditingTakenTime(medicationId)
  }

  const saveEditTakenTime = () => {
    if (!editingTakenTime) return
    
    const newTakenAt = new Date(tempTakenAt).toISOString()
    markCleanMedicationTaken(editingTakenTime, cycleId, cycleDay, newTakenAt)
    
    setEditingTakenTime(null)
    setTempTakenAt("")
  }

  const markAsTaken = (medicationId: string) => {
    markCleanMedicationTaken(medicationId, cycleId, cycleDay)
  }

  const markAsSkipped = (medicationId: string) => {
    markCleanMedicationSkipped(medicationId, cycleId, cycleDay)
  }

  const undoStatus = (medicationId: string) => {
    resetCleanMedicationStatus(medicationId, cycleId, cycleDay)
  }

  // Render time section (same pattern as original)
  const renderTimeSection = (timeLabel: string, timeMedications: any[]) => {
    if (timeMedications.length === 0) return null

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">{timeLabel}</h3>
        <div className="space-y-2">
          {timeMedications.map((medication) => {
            return (
              <div
                key={medication.scheduledMedicationId}
                className={`p-4 border rounded-lg transition-colors ${
                  medication.taken 
                    ? "bg-green-50 border-green-200" 
                    : medication.skipped 
                    ? "bg-gray-50 border-gray-200" 
                    : "bg-white border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {medication.taken ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{medication.name}</span>
                        <Badge 
                          variant={medication.type === 'recurring' ? 'secondary' : 'outline'}
                          className={`text-xs ${
                            medication.type === 'day-specific' 
                              ? 'border-orange-200 text-orange-700' 
                              : ''
                          }`}
                        >
                          {medication.type === 'recurring' ? 'Recurring' : 'Day-specific'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{medication.dosage}</span>
                        {medication.refrigerated && (
                          <Snowflake className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {medication.hour}:{medication.minute} {medication.ampm}
                        </div>
                        
                        {medication.taken && medication.takenAt && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">
                              ✓ Taken at {format(parseISO(medication.takenAt), "MMM d, h:mm a")}
                            </span>
                            {!isPastCycle && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditTakenTime(medication.scheduledMedicationId)}
                                className="h-6 w-6 p-0 ml-1 hover:bg-gray-100"
                                title="Edit taken time"
                              >
                                <Edit3 className="h-3 w-3 text-gray-500" />
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {medication.skipped && (
                          <Badge variant="secondary">Skipped</Badge>
                        )}
                      </div>
                      
                      {medication.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {medication.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    {!medication.taken && !medication.skipped && !isPastCycle && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => markAsTaken(medication.scheduledMedicationId)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark as Taken
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsSkipped(medication.scheduledMedicationId)}
                        >
                          Skip Today
                        </Button>
                      </>
                    )}
                    
                    {(medication.taken || medication.skipped) && !isPastCycle && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => undoStatus(medication.scheduledMedicationId)}
                      >
                        Undo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Daily Medications
            <Badge variant="outline">
              {dayMeds.completedCount}/{dayMeds.totalCount}
            </Badge>
          </CardTitle>
          <CardDescription>
            Cycle Day {cycleDay} - {format(parseISO(date), "MMMM d, yyyy")}
            {isPastCycle && (
              <span className="block text-sm text-muted-foreground mt-1">
                📅 This cycle has ended - viewing historical data
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(morning.length > 0) && renderTimeSection("Morning Medications", morning)}
          {(evening.length > 0) && renderTimeSection("Evening Medications", evening)}
        </CardContent>
      </Card>

      {/* Edit Taken Time Dialog - Same as original */}
      <Dialog open={!!editingTakenTime} onOpenChange={() => setEditingTakenTime(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Taken Time</DialogTitle>
            <DialogDescription>
              Adjust when this medication was actually taken
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">When did you take this medication?</label>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Date</label>
                <Input
                  type="date"
                  value={tempTakenAt.slice(0, 10)}
                  onChange={(e) => setTempTakenAt(e.target.value + 'T' + (tempTakenAt.slice(11) || '08:00'))}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Time</label>
                <Input
                  type="time"
                  value={tempTakenAt.slice(11, 16)}
                  onChange={(e) => setTempTakenAt(tempTakenAt.slice(0, 10) + 'T' + e.target.value)}
                  className="w-full"
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                💡 Adjust to when you actually took the medication
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTakenTime(null)}>
              Cancel
            </Button>
            <Button onClick={saveEditTakenTime}>
              Save Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}