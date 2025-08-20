/**
 * DailyMedications Component - New Clean System
 * 
 * Replaces: DailyMedicationChecklist, UnifiedDailyMedicationChecklist
 * Simple, clean daily medication tracking using the new medication system.
 */

"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Clock, Pill, CheckCircle2, Circle, Edit3, Snowflake, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useIVFStore } from "@/lib/store"
import { groupMedicationsByTime } from "@/lib/medications"
import type { Medication } from "@/lib/medications"

interface DailyMedicationsProps {
  cycleId: string
  cycleDay: number
  date: string
}

export function DailyMedications({ cycleId, cycleDay, date }: DailyMedicationsProps) {
  const { 
    getDayMedications,
    markMedicationTaken,
    markMedicationSkipped,
    resetMedicationStatus,
    updateMedication,
    getCycleById
  } = useIVFStore()
  
  const [editingTime, setEditingTime] = useState<string | null>(null)
  const [tempTakenAt, setTempTakenAt] = useState("")
  
  // Get medications for this day
  const dayMeds = getDayMedications(cycleId, cycleDay, date)
  const cycle = getCycleById(cycleId)
  
  // Group medications by time of day
  const { morning, afternoon, evening } = groupMedicationsByTime(dayMeds.medications)
  
  // Check if cycle is completed
  const isCycleCompleted = cycle?.status === 'completed' || cycle?.status === 'cancelled'
  
  // No medications case
  if (dayMeds.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Daily Medications
          </CardTitle>
          <CardDescription>
            No medications scheduled for cycle day {cycleDay}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add medications through the Medication Schedule or use Edit Day for one-time medications.
          </p>
        </CardContent>
      </Card>
    )
  }

  const openEditTime = (medication: Medication) => {
    const currentTakenAt = medication.takenAt || new Date().toISOString()
    setTempTakenAt(currentTakenAt.slice(0, 16)) // Format for datetime-local
    setEditingTime(medication.id)
  }

  const saveEditTime = () => {
    if (!editingTime) return
    
    const newTakenAt = new Date(tempTakenAt).toISOString()
    updateMedication(editingTime, { takenAt: newTakenAt })
    
    setEditingTime(null)
    setTempTakenAt("")
  }

  const renderMedication = (medication: Medication) => {
    const isScheduled = medication.type === 'scheduled'
    
    return (
      <div
        key={medication.id}
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
            {/* Status Icon */}
            <div className="mt-1">
              {medication.taken ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            
            {/* Medication Details */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{medication.name}</span>
                <Badge 
                  variant={isScheduled ? "secondary" : "outline"} 
                  className={`text-xs ${
                    isScheduled 
                      ? "" 
                      : "border-orange-200 text-orange-700"
                  }`}
                >
                  {isScheduled ? "Scheduled" : "One-time"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {medication.dosage}
                </span>
                {medication.refrigerated && (
                  <Snowflake className="h-4 w-4 text-blue-500" title="Refrigerated" />
                )}
              </div>
              
              {/* Time and Status */}
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{medication.time}</span>
                  
                  {medication.taken && medication.takenAt && (
                    <div className="flex items-center gap-2 ml-2 text-green-600">
                      <span>• Taken at {format(new Date(medication.takenAt), "h:mm a")}</span>
                      {!isCycleCompleted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditTime(medication)}
                          className="h-6 w-6 p-0 hover:bg-gray-100"
                          title="Edit taken time"
                        >
                          <Edit3 className="h-3 w-3 text-gray-500" />
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {medication.skipped && (
                    <Badge variant="secondary" className="ml-2">Skipped</Badge>
                  )}
                </div>
              </div>
              
              {/* Notes */}
              {medication.notes && (
                <div className="text-sm text-muted-foreground mt-2 italic">
                  {medication.notes}
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          {!isCycleCompleted && (
            <div className="flex items-center gap-2 ml-4">
              {!medication.taken && !medication.skipped && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => markMedicationTaken(medication.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Mark as Taken
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markMedicationSkipped(medication.id)}
                  >
                    Skip
                  </Button>
                </>
              )}
              
              {(medication.taken || medication.skipped) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetMedicationStatus(medication.id)}
                >
                  Undo
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderTimeSection = (title: string, medications: Medication[]) => {
    if (medications.length === 0) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {medications.filter(m => m.taken || m.skipped).length}/{medications.length}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {medications.map(renderMedication)}
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
              {dayMeds.completed}/{dayMeds.total}
            </Badge>
          </CardTitle>
          <CardDescription>
            {format(parseISO(date), "EEEE, MMMM d, yyyy")} • Cycle Day {cycleDay}
            {isCycleCompleted && (
              <span className="block text-sm text-muted-foreground mt-1">
                📅 This cycle has ended - viewing historical data
              </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderTimeSection("Morning", morning)}
          {renderTimeSection("Afternoon", afternoon)}
          {renderTimeSection("Evening", evening)}
        </CardContent>
      </Card>

      {/* Edit Taken Time Dialog */}
      <Dialog open={!!editingTime} onOpenChange={() => setEditingTime(null)}>
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
                <label className="text-xs font-medium text-muted-foreground">Date & Time</label>
                <Input
                  type="datetime-local"
                  value={tempTakenAt}
                  onChange={(e) => setTempTakenAt(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                💡 Adjust to when you actually took the medication
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTime(null)}>
              Cancel
            </Button>
            <Button onClick={saveEditTime}>
              Save Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}