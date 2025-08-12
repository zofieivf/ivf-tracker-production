"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Clock, Pill, CheckCircle2, Circle, Edit3, Snowflake, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useIVFStore } from "@/lib/store"
import { groupMedicationsByTime } from "@/lib/medication-utils"

interface UnifiedDailyMedicationChecklistProps {
  cycleId: string
  cycleDay: number
  date: string
}

export function UnifiedDailyMedicationChecklist({ cycleId, cycleDay, date }: UnifiedDailyMedicationChecklistProps) {
  const { 
    getUnifiedMedicationsForDay,
    ensureDailyMedicationStatus,
    updateDailyMedicationStatus,
    getDailyMedicationStatus
  } = useIVFStore()
  
  const [editingMed, setEditingMed] = useState<string | null>(null)
  const [tempDosage, setTempDosage] = useState("")
  const [tempNotes, setTempNotes] = useState("")
  
  // Use unified medication system
  const medications = getUnifiedMedicationsForDay(cycleId, cycleDay)
  const { morning, evening } = groupMedicationsByTime(medications)
  
  if (medications.totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Daily Medications
          </CardTitle>
          <CardDescription>
            No medications for cycle day {cycleDay}. Set up a medication schedule or add day-specific medications via "Edit Day".
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const updateScheduledMedicationStatus = (scheduledMedicationId: string, updates: any) => {
    const dailyStatus = ensureDailyMedicationStatus(cycleId, cycleDay, date)
    
    const existingMedIndex = dailyStatus.medications.findIndex(m => m.scheduledMedicationId === scheduledMedicationId)
    
    if (existingMedIndex >= 0) {
      // Update existing status
      const updatedMedications = [...dailyStatus.medications]
      updatedMedications[existingMedIndex] = { ...updatedMedications[existingMedIndex], ...updates }
      
      updateDailyMedicationStatus(dailyStatus.id, {
        medications: updatedMedications,
        updatedAt: new Date().toISOString(),
      })
    } else {
      // Create new status
      const newMedication = {
        scheduledMedicationId,
        taken: false,
        skipped: false,
        ...updates
      }
      
      updateDailyMedicationStatus(dailyStatus.id, {
        medications: [...dailyStatus.medications, newMedication],
        updatedAt: new Date().toISOString(),
      })
    }
  }

  const updateDaySpecificMedicationStatus = (medicationId: string, updates: any) => {
    const dailyStatus = ensureDailyMedicationStatus(cycleId, cycleDay, date)
    
    const updatedDaySpecific = dailyStatus.daySpecificMedications?.map(med =>
      med.id === medicationId ? { ...med, ...updates } : med
    ) || []
    
    updateDailyMedicationStatus(dailyStatus.id, {
      daySpecificMedications: updatedDaySpecific,
      updatedAt: new Date().toISOString(),
    })
  }

  const toggleScheduledMedication = (scheduledMedicationId: string, currentTaken: boolean) => {
    updateScheduledMedicationStatus(scheduledMedicationId, {
      taken: !currentTaken,
      takenAt: !currentTaken ? new Date().toISOString() : undefined,
      skipped: false,
    })
  }

  const toggleDaySpecificMedication = (medicationId: string, currentTaken: boolean) => {
    updateDaySpecificMedicationStatus(medicationId, {
      taken: !currentTaken,
      takenAt: !currentTaken ? new Date().toISOString() : undefined,
      skipped: false,
    })
  }

  const getCompletedCount = () => {
    const scheduledTaken = medications.scheduled.filter(item => item.status.taken).length
    const daySpecificTaken = medications.daySpecific.filter(med => med.taken).length
    return scheduledTaken + daySpecificTaken
  }

  const renderTimeSection = (timeLabel: string, timeMedications: any[]) => {
    if (timeMedications.length === 0) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg">{timeLabel}</h3>
        </div>
        
        <div className="space-y-3">
          {timeMedications.map((item) => {
            // Check if it's a scheduled medication or day-specific
            const isScheduled = 'medication' in item
            const medication = isScheduled ? item.medication : item
            const status = isScheduled ? item.status : { taken: item.taken, skipped: item.skipped }
            const medicationId = isScheduled ? item.medication.id : item.id
            
            return (
              <div
                key={medicationId}
                className={`p-4 border rounded-lg transition-colors ${
                  status.taken 
                    ? "bg-green-50 border-green-200" 
                    : status.skipped 
                    ? "bg-gray-50 border-gray-200" 
                    : "bg-white border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      <Checkbox
                        checked={status.taken}
                        onCheckedChange={() => {
                          if (isScheduled) {
                            toggleScheduledMedication(medicationId, status.taken)
                          } else {
                            toggleDaySpecificMedication(medicationId, status.taken)
                          }
                        }}
                        className="h-5 w-5"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{medication.name}</span>
                        {isScheduled ? (
                          <Badge variant="secondary" className="text-xs">Medication Schedule</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">Day-specific</Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {isScheduled ? (status.actualDosage || medication.dosage) : medication.dosage}
                        </span>
                        {medication.refrigerated && (
                          <Snowflake className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {medication.hour}:{medication.minute} {medication.ampm}
                        {status.takenAt && (
                          <span className="ml-2 text-green-600">
                            • Taken at {format(new Date(status.takenAt), "h:mm a")}
                          </span>
                        )}
                      </div>
                      
                      {status.notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Notes: {status.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    {isScheduled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingMed(medicationId)
                          setTempDosage(status.actualDosage || medication.dosage)
                          setTempNotes(status.notes || "")
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
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

  const completedCount = getCompletedCount()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Daily Medications
        </CardTitle>
        <CardDescription>
          {format(parseISO(date), "EEEE, MMMM d, yyyy")} • Progress: {" "}
          <span className="font-medium">
            {completedCount}/{medications.totalCount}
          </span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {renderTimeSection("Morning Medications", morning)}
        {renderTimeSection("Evening Medications", evening)}
      </CardContent>

      {/* Edit Dosage Dialog */}
      <Dialog open={editingMed !== null} onOpenChange={(open) => !open && setEditingMed(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Medication</DialogTitle>
            <DialogDescription>
              Adjust the dosage or add notes for this medication.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Dosage</label>
              <Input
                value={tempDosage}
                onChange={(e) => setTempDosage(e.target.value)}
                placeholder="e.g., 150 IU"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMed(null)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingMed) {
                updateScheduledMedicationStatus(editingMed, {
                  actualDosage: tempDosage,
                  notes: tempNotes,
                })
                setEditingMed(null)
                setTempDosage("")
                setTempNotes("")
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}