"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Clock, Pill, CheckCircle2, Circle, Edit3, Snowflake, Plus, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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
    updateDailyMedicationStatus 
  } = useIVFStore()
  
  const [editingMed, setEditingMed] = useState<string | null>(null)
  const [tempDosage, setTempDosage] = useState("")
  const [tempNotes, setTempNotes] = useState("")
  
  // Day adjustment dialog state
  const [showAdjustDialog, setShowAdjustDialog] = useState(false)
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    hour: "8",
    minute: "00",
    ampm: "PM" as "AM" | "PM",
    refrigerated: false,
    notes: ""
  })
  
  const schedule = getMedicationScheduleByCycleId(cycleId)
  const dailyStatus = getDailyMedicationStatus(cycleId, cycleDay)
  
  // Filter medications that should be active on this day
  const todaysMedications = schedule?.medications.filter(
    med => med.startDay <= cycleDay && med.endDay >= cycleDay
  ) || []

  // Initialize daily status if it doesn't exist
  useEffect(() => {
    if (todaysMedications.length > 0 && !dailyStatus) {
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
        createdAt: new Date().toISOString(),
      }
      addDailyMedicationStatus(initialStatus)
    }
  }, [todaysMedications, dailyStatus, cycleId, cycleDay, date, addDailyMedicationStatus])

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

  if (todaysMedications.length === 0) {
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

  const openEdit = (medication: ScheduledMedication) => {
    const status = dailyStatus?.medications.find(m => m.scheduledMedicationId === medication.id)
    setTempDosage(status?.actualDosage || medication.dosage)
    setTempNotes(status?.notes || "")
    setEditingMed(medication.id)
  }

  const saveEdit = () => {
    if (!editingMed) return
    
    updateMedicationStatus(editingMed, {
      actualDosage: tempDosage,
      notes: tempNotes,
    })
    
    setEditingMed(null)
    setTempDosage("")
    setTempNotes("")
  }

  const getMedicationStatus = (scheduledMedicationId: string): MedicationStatus | undefined => {
    return dailyStatus?.medications.find(m => m.scheduledMedicationId === scheduledMedicationId)
  }

  const addDaySpecificMedication = () => {
    if (!dailyStatus) return

    const newDayMed = {
      id: crypto.randomUUID(),
      name: newMedication.name,
      dosage: newMedication.dosage,
      hour: newMedication.hour,
      minute: newMedication.minute,
      ampm: newMedication.ampm,
      refrigerated: newMedication.refrigerated,
      taken: false,
      skipped: false,
      notes: newMedication.notes
    }

    const currentDayMeds = dailyStatus.daySpecificMedications || []
    
    updateDailyMedicationStatus(dailyStatus.id, {
      daySpecificMedications: [...currentDayMeds, newDayMed],
      updatedAt: new Date().toISOString(),
    })

    // Reset form
    setNewMedication({
      name: "",
      dosage: "",
      hour: "8",
      minute: "00",
      ampm: "PM",
      refrigerated: false,
      notes: ""
    })
    setShowAdjustDialog(false)
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

  // Get day-specific medications
  const daySpecificMeds = dailyStatus?.daySpecificMedications || []

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
                          <span className="text-green-600">
                            ✓ Taken at {format(parseISO(status.takenAt), "h:mm a")}
                          </span>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(medication)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    
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
          <CardDescription className="flex items-center justify-between">
            <span>Cycle Day {cycleDay} - {format(parseISO(date), "MMMM d, yyyy")}</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAdjustDialog(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Adjust for This Day
            </Button>
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
                              <Badge variant="secondary" className="text-xs">Scheduled</Badge>
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
                                <span className="text-green-600">
                                  ✓ Taken at {format(parseISO(status.takenAt), "h:mm a")}
                                </span>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(medication)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          
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
                              <span className="text-green-600">
                                ✓ Taken at {format(parseISO(medication.takenAt), "h:mm a")}
                              </span>
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
                        {!medication.taken && !medication.skipped && (
                          <>
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateDaySpecificMedication(medication.id, {
                                skipped: true,
                                taken: false,
                                takenAt: undefined
                              })}
                            >
                              Skip Today
                            </Button>
                          </>
                        )}
                        
                        {(medication.taken || medication.skipped) && (
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
                              <Badge variant="secondary" className="text-xs">Scheduled</Badge>
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
                                <span className="text-green-600">
                                  ✓ Taken at {format(parseISO(status.takenAt), "h:mm a")}
                                </span>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(medication)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          
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
                              <span className="text-green-600">
                                ✓ Taken at {format(parseISO(medication.takenAt), "h:mm a")}
                              </span>
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
                        {!medication.taken && !medication.skipped && (
                          <>
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateDaySpecificMedication(medication.id, {
                                skipped: true,
                                taken: false,
                                takenAt: undefined
                              })}
                            >
                              Skip Today
                            </Button>
                          </>
                        )}
                        
                        {(medication.taken || medication.skipped) && (
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

      {/* Edit Medication Dialog */}
      <Dialog open={!!editingMed} onOpenChange={() => setEditingMed(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Medication</DialogTitle>
            <DialogDescription>
              Adjust dosage or add notes for today's medication
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Dosage</label>
              <Input
                value={tempDosage}
                onChange={(e) => setTempDosage(e.target.value)}
                placeholder="Enter dosage"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="Any notes about this medication..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMed(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust for This Day Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={() => setShowAdjustDialog(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Medication for This Day</DialogTitle>
            <DialogDescription>
              Add a one-time medication for cycle day {cycleDay} only
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Medication Name</label>
              <Input
                value={newMedication.name}
                onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Extra Estrace"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Dosage</label>
              <Input
                value={newMedication.dosage}
                onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g., 2mg"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Time</label>
              <div className="flex gap-2">
                <Select 
                  value={newMedication.hour} 
                  onValueChange={(value) => setNewMedication(prev => ({ ...prev, hour: value }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="self-center">:</span>
                <Select 
                  value={newMedication.minute} 
                  onValueChange={(value) => setNewMedication(prev => ({ ...prev, minute: value }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="00">00</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="45">45</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={newMedication.ampm} 
                  onValueChange={(value) => setNewMedication(prev => ({ ...prev, ampm: value as "AM" | "PM" }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="day-specific-refrigerated"
                checked={newMedication.refrigerated}
                onCheckedChange={(checked) => setNewMedication(prev => ({ ...prev, refrigerated: !!checked }))}
              />
              <label htmlFor="day-specific-refrigerated" className="text-sm font-medium">
                Requires refrigeration
              </label>
            </div>
            
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                value={newMedication.notes}
                onChange={(e) => setNewMedication(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any notes about this medication..."
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={addDaySpecificMedication}
              disabled={!newMedication.name || !newMedication.dosage}
            >
              Add Medication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}