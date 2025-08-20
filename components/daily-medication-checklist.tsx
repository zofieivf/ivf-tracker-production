"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Clock, Pill, CheckCircle2, Circle, Snowflake, Edit3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useIVFStore } from "@/lib/store"
import type { ScheduledMedication, DailyMedicationStatus } from "@/lib/types"

interface DailyMedicationChecklistProps {
  cycleId: string
  cycleDay: number
  date: string
}

interface MedicationStatus {
  scheduledMedicationId: string
  taken: boolean
  actualDosage?: string
  takenAt?: string
  skipped: boolean
  notes?: string
}

export function DailyMedicationChecklist({ cycleId, cycleDay, date }: DailyMedicationChecklistProps) {
  
  const { 
    getMedicationScheduleByCycleId, 
    getDailyMedicationStatus, 
    addDailyMedicationStatus, 
    updateDailyMedicationStatus,
    getCycleById,
    getUnifiedMedicationsForDay,
    dailyMedicationStatuses,
    medicationSchedules
  } = useIVFStore()
  
  const [editingTakenTime, setEditingTakenTime] = useState<{medicationId: string, type: 'scheduled' | 'daySpecific'} | null>(null)
  const [tempTakenAt, setTempTakenAt] = useState("")
  
  
  const schedule = getMedicationScheduleByCycleId(cycleId)
  const dailyStatus = getDailyMedicationStatus(cycleId, cycleDay)
  const cycle = getCycleById(cycleId)
  const unifiedMeds = getUnifiedMedicationsForDay(cycleId, cycleDay)
  
  // Determine if this cycle is in the past
  const isCycleInPast = () => {
    if (!cycle) return false
    
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset to start of day for comparison
    
    // If cycle has an end date, check if end date is before today
    if (cycle.endDate) {
      const endDate = new Date(cycle.endDate)
      endDate.setHours(0, 0, 0, 0)
      return endDate < today
    }
    
    // If no end date but cycle status is completed or cancelled, consider it past
    if (cycle.status === 'completed' || cycle.status === 'cancelled') {
      return true
    }
    
    return false
  }
  
  const isPastCycle = isCycleInPast()
  
  
  // Filter medications that should be active on this day
  const todaysMedications = schedule?.medications.filter(
    med => med.startDay <= cycleDay && med.endDay >= cycleDay
  ) || []
  
  // Get day-specific medications from unified system
  const daySpecificMeds = unifiedMeds.daySpecific || []

  // Initialize daily status if it doesn't exist
  useEffect(() => {
    if ((todaysMedications.length > 0 || daySpecificMeds.length > 0) && !dailyStatus) {
      const initialStatus: DailyMedicationStatus = {
        id: crypto.randomUUID(),
        cycleId,
        cycleDay,
        date,
        medications: todaysMedications.map(med => ({
          scheduledMedicationId: med.id,
          taken: false,
          skipped: false,
        })),
        daySpecificMedications: [], // Will be populated by unified system
        createdAt: new Date().toISOString(),
      }
      addDailyMedicationStatus(initialStatus)
    }
  }, [todaysMedications, daySpecificMeds, dailyStatus, cycleId, cycleDay, date, addDailyMedicationStatus])

  if (!schedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Daily Medications
          </CardTitle>
          <CardDescription>No medication schedule found for this cycle. Please set up your medication schedule first.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (todaysMedications.length === 0 && daySpecificMeds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Daily Medications
          </CardTitle>
          <CardDescription>
            No medications scheduled for cycle day {cycleDay}. 
            {schedule.medications.length > 0 && (
              <span> Total medications in schedule: {schedule.medications.length}</span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const updateMedicationStatus = (scheduledMedicationId: string, updates: Partial<MedicationStatus>) => {
    if (!dailyStatus) return

    const updatedMedications = dailyStatus.medications.map(med =>
      med.scheduledMedicationId === scheduledMedicationId ? { ...med, ...updates } : med
    )

    updateDailyMedicationStatus(dailyStatus.id, {
      medications: updatedMedications,
      updatedAt: new Date().toISOString(),
    })
  }

  const markAsTaken = (scheduledMedicationId: string) => {
    updateMedicationStatus(scheduledMedicationId, {
      taken: true,
      takenAt: new Date().toISOString(),
      skipped: false,
    })
  }

  const markAsSkipped = (scheduledMedicationId: string) => {
    updateMedicationStatus(scheduledMedicationId, {
      taken: false,
      skipped: true,
      takenAt: undefined,
    })
  }


  const undoStatus = (scheduledMedicationId: string) => {
    updateMedicationStatus(scheduledMedicationId, {
      taken: false,
      skipped: false,
      takenAt: undefined,
    })
  }

  const openEditTakenTime = (medicationId: string, type: 'scheduled' | 'daySpecific') => {
    let currentTakenAt = ""
    
    if (type === 'scheduled') {
      const status = getMedicationStatus(medicationId)
      currentTakenAt = status?.takenAt || new Date().toISOString()
    } else {
      const dayMed = daySpecificMeds.find(med => med.id === medicationId)
      currentTakenAt = dayMed?.takenAt || new Date().toISOString()
    }
    
    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const formattedDateTime = currentTakenAt.slice(0, 16)
    setTempTakenAt(formattedDateTime)
    setEditingTakenTime({ medicationId, type })
  }

  const saveEditTakenTime = () => {
    if (!editingTakenTime) return
    
    const newTakenAt = new Date(tempTakenAt).toISOString()
    
    if (editingTakenTime.type === 'scheduled') {
      updateMedicationStatus(editingTakenTime.medicationId, {
        takenAt: newTakenAt,
      })
    } else {
      updateDaySpecificMedication(editingTakenTime.medicationId, {
        takenAt: newTakenAt,
      })
    }
    
    setEditingTakenTime(null)
    setTempTakenAt("")
  }


  const getMedicationStatus = (scheduledMedicationId: string): MedicationStatus | undefined => {
    return dailyStatus?.medications.find(m => m.scheduledMedicationId === scheduledMedicationId)
  }


  const updateDaySpecificMedication = (medId: string, updates: any) => {
    if (!dailyStatus) return

    const updatedDayMeds = (dailyStatus.daySpecificMedications || []).map(med =>
      med.id === medId ? { ...med, ...updates } : med
    )

    updateDailyMedicationStatus(dailyStatus.id, {
      daySpecificMedications: updatedDayMeds,
      updatedAt: new Date().toISOString(),
    })
  }


  // Group scheduled medications by time period
  const morningScheduledMeds = todaysMedications.filter(med => med.ampm === "AM")
  const eveningScheduledMeds = todaysMedications.filter(med => med.ampm === "PM")
  
  // Group day-specific medications by time period
  const morningDayMeds = daySpecificMeds.filter(med => med.ampm === "AM")
  const eveningDayMeds = daySpecificMeds.filter(med => med.ampm === "PM")

  const totalMedications = todaysMedications.length + daySpecificMeds.length

  const renderMedicationGroup = (medications: ScheduledMedication[], title: string) => {
    if (medications.length === 0) return null

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="space-y-2">
          {medications.map((medication) => {
            const status = getMedicationStatus(medication.id)
            const taken = status?.taken || false
            const skipped = status?.skipped || false
            const actualDosage = status?.actualDosage || medication.dosage

            return (
              <div
                key={medication.id}
                className={`p-4 border rounded-lg transition-colors ${
                  taken 
                    ? "bg-green-50 border-green-200" 
                    : skipped 
                    ? "bg-gray-50 border-gray-200" 
                    : "bg-white border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {taken ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{medication.name}</span>
                        <span className="text-sm text-muted-foreground">{actualDosage}</span>
                        {medication.refrigerated && (
                          <Snowflake className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {medication.hour}:{medication.minute} {medication.ampm}
                        </div>
                        
                        {taken && status?.takenAt && (
                            <div className="flex items-center gap-2">
                              <span className="text-green-600">
                                ✓ Taken at {format(parseISO(status.takenAt), "MMM d, h:mm a")}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditTakenTime(medication.id, 'scheduled')}
                                className="h-8 w-8 p-0 ml-2 bg-red-100 border-red-500"
                                title="Edit taken time"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                        )}
                        
                        {skipped && (
                          <Badge variant="secondary">Skipped</Badge>
                        )}
                      </div>
                      
                      {status?.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {status.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    {!taken && !skipped && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => markAsTaken(medication.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark as Taken
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsSkipped(medication.id)}
                        >
                          Skip Today
                        </Button>
                      </>
                    )}
                    
                    {(taken || skipped) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => undoStatus(medication.id)}
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

  const completedCount = todaysMedications.filter(med => {
    const status = getMedicationStatus(med.id)
    return status?.taken || status?.skipped
  }).length + daySpecificMeds.filter(med => med.taken || med.skipped).length

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Daily Medications
            <Badge variant="outline">
              {completedCount}/{totalMedications}
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
          {(morningScheduledMeds.length > 0 || morningDayMeds.length > 0) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Morning Medications</h3>
              <div className="space-y-2">
                {/* Scheduled morning medications */}
                {morningScheduledMeds.map((medication) => {
                  const status = getMedicationStatus(medication.id)
                  const taken = status?.taken || false
                  const skipped = status?.skipped || false
                  const actualDosage = status?.actualDosage || medication.dosage
                  

                  return (
                    <div
                      key={medication.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        taken 
                          ? "bg-green-50 border-green-200" 
                          : skipped 
                          ? "bg-gray-50 border-gray-200" 
                          : "bg-white border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {taken ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{medication.name}</span>
                              <Badge variant="secondary" className="text-xs">Medication Schedule</Badge>
                              <span className="text-sm text-muted-foreground">{actualDosage}</span>
                              {medication.refrigerated && (
                                <Snowflake className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {medication.hour}:{medication.minute} {medication.ampm}
                              </div>
                              
                              {taken && status?.takenAt && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-green-600">
                                      ✓ Taken at {format(parseISO(status.takenAt), "MMM d, h:mm a")}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditTakenTime(medication.id, 'scheduled')}
                                      className="h-6 w-6 p-0 ml-1 hover:bg-gray-100"
                                      title="Edit taken time"
                                    >
                                      <Edit3 className="h-3 w-3 text-gray-500" />
                                    </Button>
                                  </div>
                              )}
                              
                              {skipped && (
                                <Badge variant="secondary">Skipped</Badge>
                              )}
                            </div>
                            
                            {status?.notes && (
                              <p className="text-sm text-muted-foreground mt-2 italic">
                                {status.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4">
                          {!taken && !skipped && !isPastCycle && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => markAsTaken(medication.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Mark as Taken
                            </Button>
                          )}
                          
                          {(taken || skipped) && !isPastCycle && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => undoStatus(medication.id)}
                            >
                              Undo
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {/* Day-specific morning medications */}
                {morningDayMeds.map((medication) => (
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
                            <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">Day-specific</Badge>
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
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditTakenTime(medication.id, 'daySpecific')}
                                    className="h-8 w-8 p-0 ml-2"
                                    title="Edit taken time"
                                  >
                                    <Edit3 className="h-4 w-4" />
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
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateDaySpecificMedication(medication.id, {
                              taken: true,
                              takenAt: new Date().toISOString(),
                              skipped: false
                            })}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark as Taken
                          </Button>
                        )}
                        
                        {(medication.taken || medication.skipped) && !isPastCycle && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateDaySpecificMedication(medication.id, {
                              taken: false,
                              skipped: false,
                              takenAt: undefined
                            })}
                          >
                            Undo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {(eveningScheduledMeds.length > 0 || eveningDayMeds.length > 0) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Evening Medications</h3>
              <div className="space-y-2">
                {/* Scheduled evening medications */}
                {eveningScheduledMeds.map((medication) => {
                  const status = getMedicationStatus(medication.id)
                  const taken = status?.taken || false
                  const skipped = status?.skipped || false
                  const actualDosage = status?.actualDosage || medication.dosage
                  

                  return (
                    <div
                      key={medication.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        taken 
                          ? "bg-green-50 border-green-200" 
                          : skipped 
                          ? "bg-gray-50 border-gray-200" 
                          : "bg-white border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {taken ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{medication.name}</span>
                              <Badge variant="secondary" className="text-xs">Medication Schedule</Badge>
                              <span className="text-sm text-muted-foreground">{actualDosage}</span>
                              {medication.refrigerated && (
                                <Snowflake className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {medication.hour}:{medication.minute} {medication.ampm}
                              </div>
                              
                              {taken && status?.takenAt && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-green-600">
                                      ✓ Taken at {format(parseISO(status.takenAt), "MMM d, h:mm a")}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditTakenTime(medication.id, 'scheduled')}
                                      className="h-6 w-6 p-0 ml-1 hover:bg-gray-100"
                                      title="Edit taken time"
                                    >
                                      <Edit3 className="h-3 w-3 text-gray-500" />
                                    </Button>
                                  </div>
                              )}
                              
                              {skipped && (
                                <Badge variant="secondary">Skipped</Badge>
                              )}
                            </div>
                            
                            {status?.notes && (
                              <p className="text-sm text-muted-foreground mt-2 italic">
                                {status.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4">
                          {!taken && !skipped && !isPastCycle && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => markAsTaken(medication.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Mark as Taken
                            </Button>
                          )}
                          
                          {(taken || skipped) && !isPastCycle && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => undoStatus(medication.id)}
                            >
                              Undo
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {/* Day-specific evening medications */}
                {eveningDayMeds.map((medication) => (
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
                            <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">Day-specific</Badge>
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
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditTakenTime(medication.id, 'daySpecific')}
                                    className="h-8 w-8 p-0 ml-2"
                                    title="Edit taken time"
                                  >
                                    <Edit3 className="h-4 w-4" />
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
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateDaySpecificMedication(medication.id, {
                              taken: true,
                              takenAt: new Date().toISOString(),
                              skipped: false
                            })}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark as Taken
                          </Button>
                        )}
                        
                        {(medication.taken || medication.skipped) && !isPastCycle && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateDaySpecificMedication(medication.id, {
                              taken: false,
                              skipped: false,
                              takenAt: undefined
                            })}
                          >
                            Undo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Taken Time Dialog */}
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