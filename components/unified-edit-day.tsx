"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useIVFStore } from "@/lib/store"
import type { CycleDay, ClinicVisit, FollicleMeasurement, BloodworkResult } from "@/lib/types"

interface DaySpecificMedication {
  id?: string
  name: string
  dosage: string
  hour: string
  minute: string
  ampm: string
  refrigerated: boolean
  taken: boolean
  notes?: string
}

interface UnifiedEditDayProps {
  cycleId: string
  dayId: string
  onSave: () => void
  onCancel: () => void
}

export function UnifiedEditDay({ cycleId, dayId, onSave, onCancel }: UnifiedEditDayProps) {
  const {
    getCycleById,
    updateDay,
    getUnifiedMedicationsForDay,
    ensureDailyMedicationStatus,
    updateDailyMedicationStatus,
    dailyMedicationStatuses
  } = useIVFStore()

  const [cycle, setCycle] = useState(getCycleById(cycleId))
  const [day, setDay] = useState<CycleDay | undefined>(cycle?.days.find((d) => d.id === dayId))
  const [mounted, setMounted] = useState(false)

  // Form state - only handle day-specific medications (scheduled ones are readonly)
  const [daySpecificMedications, setDaySpecificMedications] = useState<DaySpecificMedication[]>([])
  const [clinicVisit, setClinicVisit] = useState<ClinicVisit | undefined>()
  const [follicleSizes, setFollicleSizes] = useState<FollicleMeasurement | undefined>()
  const [bloodwork, setBloodwork] = useState<BloodworkResult[]>([])
  const [notes, setNotes] = useState("")
  const [liningCheck, setLiningCheck] = useState(false)

  useEffect(() => {
    setMounted(true)
    const currentCycle = getCycleById(cycleId)
    setCycle(currentCycle)
    const currentDay = currentCycle?.days.find((d) => d.id === dayId)
    setDay(currentDay)

    if (currentDay) {
      // Load existing day-specific medications from unified system
      const unifiedMeds = getUnifiedMedicationsForDay(cycleId, currentDay.cycleDay)
      const daySpecific = unifiedMeds.daySpecific.map(med => ({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        hour: med.hour,
        minute: med.minute,
        ampm: med.ampm,
        refrigerated: med.refrigerated,
        taken: med.taken,
        notes: med.notes
      }))
      
      setDaySpecificMedications(daySpecific)
      setClinicVisit(currentDay.clinicVisit)
      setFollicleSizes(currentDay.follicleSizes)
      setBloodwork(currentDay.bloodwork || [])
      setNotes(currentDay.notes || "")
      setLiningCheck(!!currentDay.follicleSizes?.liningThickness)
    }
  }, [cycleId, dayId, getCycleById, getUnifiedMedicationsForDay, dailyMedicationStatuses])

  if (!mounted || !cycle || !day) {
    return null
  }

  const handleSubmit = () => {
    // Get current daily status and update day-specific medications
    const dailyStatus = ensureDailyMedicationStatus(cycleId, day.cycleDay, day.date)
    
    // Convert form medications to the right format
    const updatedDaySpecificMeds = daySpecificMedications.map(med => ({
      id: med.id || crypto.randomUUID(),
      name: med.name,
      dosage: med.dosage,
      hour: med.hour,
      minute: med.minute,
      ampm: med.ampm,
      refrigerated: med.refrigerated,
      taken: med.taken,
      skipped: false,
      takenAt: med.taken ? new Date().toISOString() : undefined,
      notes: med.notes
    }))

    // Update daily medication status with new day-specific medications
    updateDailyMedicationStatus(dailyStatus.id, {
      daySpecificMedications: updatedDaySpecificMeds,
      updatedAt: new Date().toISOString(),
    })

    // Update day data (everything except medications)
    const updatedDay: CycleDay = {
      ...day,
      clinicVisit,
      follicleSizes,
      bloodwork,
      notes: notes || undefined,
    }
    updateDay(cycleId, dayId, updatedDay)

    // Add a small delay to ensure store state is fully updated before navigation
    setTimeout(() => {
      onSave()
    }, 100)
  }

  const addDaySpecificMedication = () => {
    setDaySpecificMedications([
      ...daySpecificMedications,
      {
        name: "",
        dosage: "",
        hour: "",
        minute: "",
        ampm: "",
        refrigerated: false,
        taken: false
      }
    ])
  }

  const updateDaySpecificMedication = (index: number, field: keyof DaySpecificMedication, value: string | boolean) => {
    const updated = daySpecificMedications.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    )
    setDaySpecificMedications(updated)
  }

  const removeDaySpecificMedication = (index: number) => {
    setDaySpecificMedications(daySpecificMedications.filter((_, i) => i !== index))
  }

  const addBloodwork = () => {
    setBloodwork([...bloodwork, { test: "", value: "" }])
  }

  const updateBloodwork = (index: number, field: keyof BloodworkResult, value: string) => {
    const updated = bloodwork.map((result, i) => (i === index ? { ...result, [field]: value } : result))
    setBloodwork(updated)
  }

  const removeBloodwork = (index: number) => {
    setBloodwork(bloodwork.filter((_, i) => i !== index))
  }

  const updateFollicleSizes = (side: "left" | "right", value: string) => {
    const sizes = value
      .split(",")
      .map((s) => Number.parseFloat(s.trim()))
      .filter((n) => !isNaN(n))
    setFollicleSizes((prev) => ({
      left: side === "left" ? sizes : prev?.left || [],
      right: side === "right" ? sizes : prev?.right || [],
      liningThickness: prev?.liningThickness,
    }))
  }

  const updateLiningThickness = (value: string) => {
    const thickness = Number.parseFloat(value)
    setFollicleSizes((prev) => ({
      left: prev?.left || [],
      right: prev?.right || [],
      liningThickness: !isNaN(thickness) ? thickness : undefined,
    }))
  }

  // Get unified medications to show readonly scheduled ones
  const unifiedMeds = getUnifiedMedicationsForDay(cycleId, day.cycleDay)

  return (
    <div className="container max-w-4xl py-10">
      <Button variant="ghost" onClick={onCancel} className="mb-4 pl-0 hover:pl-0">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to day
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Edit Day {day.cycleDay}</h1>
            <Badge variant="outline" className="text-base">
              {format(parseISO(day.date), "EEEE, MMMM d, yyyy")}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{cycle.name}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Medications */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Medications</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Scheduled medications are managed via Medication Schedule. You can add day-specific medications here.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show scheduled medications (readonly) */}
            {unifiedMeds.scheduled.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Scheduled Medications</h4>
                {unifiedMeds.scheduled.map((item) => (
                  <div key={item.medication.id} className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.medication.name}</span>
                      <Badge variant="secondary" className="text-xs">Medication Schedule</Badge>
                      <span className="text-sm text-muted-foreground">
                        {item.status.actualDosage || item.medication.dosage}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.medication.hour}:{item.medication.minute} {item.medication.ampm} • Use Daily Medications to track/edit
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Day-specific medications (editable) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Day-Specific Medications</h4>
                <Button size="sm" onClick={addDaySpecificMedication}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {daySpecificMedications.map((med, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Label htmlFor={`day-med-name-${index}`}>Medication Name</Label>
                          <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">Day-specific</Badge>
                        </div>
                        <Input
                          id={`day-med-name-${index}`}
                          value={med.name}
                          onChange={(e) => updateDaySpecificMedication(index, "name", e.target.value)}
                          placeholder="e.g., Gonal-F"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`day-med-dosage-${index}`}>Dosage</Label>
                        <Input
                          id={`day-med-dosage-${index}`}
                          value={med.dosage}
                          onChange={(e) => updateDaySpecificMedication(index, "dosage", e.target.value)}
                          placeholder="e.g., 225 IU"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`day-med-time-${index}`}>Time to Take</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            value={med.hour}
                            onValueChange={(value) => updateDaySpecificMedication(index, "hour", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Hour" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="6">6</SelectItem>
                              <SelectItem value="7">7</SelectItem>
                              <SelectItem value="8">8</SelectItem>
                              <SelectItem value="9">9</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="11">11</SelectItem>
                              <SelectItem value="12">12</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={med.minute}
                            onValueChange={(value) => updateDaySpecificMedication(index, "minute", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="00">00</SelectItem>
                              <SelectItem value="15">15</SelectItem>
                              <SelectItem value="30">30</SelectItem>
                              <SelectItem value="45">45</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={med.ampm}
                            onValueChange={(value) => updateDaySpecificMedication(index, "ampm", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="AM/PM" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AM">AM</SelectItem>
                              <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-med-taken-${index}`}
                            checked={med.taken}
                            onCheckedChange={(checked) => updateDaySpecificMedication(index, "taken", checked)}
                          />
                          <Label htmlFor={`day-med-taken-${index}`}>Taken</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-med-refrigerated-${index}`}
                            checked={med.refrigerated}
                            onCheckedChange={(checked) => updateDaySpecificMedication(index, "refrigerated", checked)}
                          />
                          <Label htmlFor={`day-med-refrigerated-${index}`}>Refrigerated</Label>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDaySpecificMedication(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {daySpecificMedications.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No day-specific medications added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clinic Visit */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Clinic Visit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-clinic-visit"
                checked={!!clinicVisit}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setClinicVisit({ type: "monitoring" })
                  } else {
                    setClinicVisit(undefined)
                  }
                }}
              />
              <Label htmlFor="has-clinic-visit">Had a clinic visit today</Label>
            </div>

            {clinicVisit && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="visit-type">Visit Type</Label>
                  <Select
                    value={clinicVisit.type}
                    onValueChange={(value: "baseline" | "monitoring" | "retrieval" | "transfer" | "beta" | "iui" | "other") => setClinicVisit({ ...clinicVisit, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baseline">Baseline</SelectItem>
                      <SelectItem value="monitoring">Monitoring</SelectItem>
                      <SelectItem value="retrieval">Retrieval</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                      <SelectItem value="iui">IUI</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="visit-notes">Visit Notes</Label>
                  <Textarea
                    id="visit-notes"
                    value={clinicVisit.notes || ""}
                    onChange={(e) => setClinicVisit({ ...clinicVisit, notes: e.target.value })}
                    placeholder="Notes from your visit..."
                  />
                </div>

                {/* Beta HCG fields when clinic visit type is "beta" */}
                {clinicVisit.type === "beta" && (
                  <div className="space-y-3 border rounded-md p-4 bg-blue-50">
                    <h4 className="text-sm font-medium text-blue-900">Beta HCG Results</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="beta-hcg-value">Beta HCG Value</Label>
                        <Input
                          id="beta-hcg-value"
                          type="number"
                          step="0.1"
                          value={clinicVisit.betaHcgValue || ""}
                          onChange={(e) => setClinicVisit({ 
                            ...clinicVisit, 
                            betaHcgValue: e.target.value === "" ? undefined : parseFloat(e.target.value) 
                          })}
                          placeholder="e.g., 125.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="beta-hcg-unit">Unit</Label>
                        <Select
                          value={clinicVisit.betaHcgUnit || ""}
                          onValueChange={(value) => setClinicVisit({ ...clinicVisit, betaHcgUnit: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mIU/mL">mIU/mL</SelectItem>
                            <SelectItem value="IU/L">IU/L</SelectItem>
                            <SelectItem value="ng/mL">ng/mL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Follicle Measurements */}
        {cycle.cycleGoal !== "transfer" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Follicle Measurements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="left-follicles">Left Ovary (mm, comma-separated)</Label>
                <Input
                  id="left-follicles"
                  value={follicleSizes?.left.join(", ") || ""}
                  onChange={(e) => updateFollicleSizes("left", e.target.value)}
                  placeholder="e.g., 12, 14, 16"
                />
              </div>
              <div>
                <Label htmlFor="right-follicles">Right Ovary (mm, comma-separated)</Label>
                <Input
                  id="right-follicles"
                  value={follicleSizes?.right.join(", ") || ""}
                  onChange={(e) => updateFollicleSizes("right", e.target.value)}
                  placeholder="e.g., 10, 13, 15"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lining Check */}
        {cycle.cycleGoal !== "retrieval" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Lining Check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lining-check"
                  checked={liningCheck}
                  onCheckedChange={(checked) => {
                    setLiningCheck(!!checked)
                    if (!checked) {
                      // Clear lining thickness when unchecked
                      setFollicleSizes((prev) => ({
                        left: prev?.left || [],
                        right: prev?.right || [],
                        liningThickness: undefined,
                      }))
                    }
                  }}
                />
                <Label htmlFor="lining-check">Lining was measured today</Label>
              </div>
              {liningCheck && (
                <div>
                  <Label htmlFor="lining-thickness">Endometrial Lining (mm)</Label>
                  <Input
                    id="lining-thickness"
                    type="number"
                    step="0.1"
                    value={follicleSizes?.liningThickness || ""}
                    onChange={(e) => updateLiningThickness(e.target.value)}
                    placeholder="e.g., 8.5"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bloodwork */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Bloodwork Results</CardTitle>
              <Button size="sm" onClick={addBloodwork}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {bloodwork.map((result, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor={`test-name-${index}`}>Test Name</Label>
                      <Input
                        id={`test-name-${index}`}
                        value={result.test}
                        onChange={(e) => updateBloodwork(index, "test", e.target.value)}
                        placeholder="e.g., Estradiol"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`test-value-${index}`}>Value</Label>
                        <Input
                          id={`test-value-${index}`}
                          value={result.value}
                          onChange={(e) => updateBloodwork(index, "value", e.target.value)}
                          placeholder="e.g., 250"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`test-unit-${index}`}>Unit</Label>
                        <Input
                          id={`test-unit-${index}`}
                          value={result.unit || ""}
                          onChange={(e) => updateBloodwork(index, "unit", e.target.value)}
                          placeholder="e.g., pg/mL"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`test-reference-${index}`}>Reference Range</Label>
                      <Input
                        id={`test-reference-${index}`}
                        value={result.reference || ""}
                        onChange={(e) => updateBloodwork(index, "reference", e.target.value)}
                        placeholder="e.g., 30-400"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBloodwork(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {bloodwork.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No bloodwork results added yet</p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this day..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}