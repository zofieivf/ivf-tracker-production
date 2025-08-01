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
import type { CycleDay, Medication, ClinicVisit, FollicleMeasurement, BloodworkResult } from "@/lib/types"

export default function EditDayPage({ params }: { params: { id: string; dayId: string } }) {
  const router = useRouter()
  const { getCycleById, updateCycleDay } = useIVFStore()
  const [cycle, setCycle] = useState(getCycleById(params.id))
  const [day, setDay] = useState<CycleDay | undefined>(cycle?.days.find((d) => d.id === params.dayId))
  const [mounted, setMounted] = useState(false)

  // Form state
  const [medications, setMedications] = useState<Medication[]>([])
  const [clinicVisit, setClinicVisit] = useState<ClinicVisit | undefined>()
  const [follicleSizes, setFollicleSizes] = useState<FollicleMeasurement | undefined>()
  const [bloodwork, setBloodwork] = useState<BloodworkResult[]>([])
  const [notes, setNotes] = useState("")

  useEffect(() => {
    setMounted(true)
    const currentCycle = getCycleById(params.id)
    setCycle(currentCycle)
    const currentDay = currentCycle?.days.find((d) => d.id === params.dayId)
    setDay(currentDay)

    if (currentDay) {
      setMedications(currentDay.medications || [])
      setClinicVisit(currentDay.clinicVisit)
      setFollicleSizes(currentDay.follicleSizes)
      setBloodwork(currentDay.bloodwork || [])
      setNotes(currentDay.notes || "")
    }
  }, [params.id, params.dayId, getCycleById])

  if (!mounted) return null

  if (!cycle || !day) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-bold mb-2">Day not found</h2>
          <p className="text-muted-foreground mb-6">The day you're looking for doesn't exist</p>
          <Button asChild>
            <Link href={`/cycles/${params.id}`}>Go back to cycle</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleSubmit = () => {
    const updatedDay: CycleDay = {
      ...day,
      medications,
      clinicVisit,
      follicleSizes,
      bloodwork,
      notes: notes || undefined,
    }

    updateCycleDay(params.id, updatedDay)
    router.push(`/cycles/${params.id}/days/${params.dayId}`)
  }

  const addMedication = () => {
    setMedications([...medications, { name: "", taken: false }])
  }

  const updateMedication = (index: number, field: keyof Medication, value: any) => {
    const updated = medications.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    setMedications(updated)
  }

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index))
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

  return (
    <div className="container max-w-4xl py-10">
      <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0">
        <Link href={`/cycles/${params.id}/days/${params.dayId}`} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to day
        </Link>
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
          <Button variant="outline" asChild>
            <Link href={`/cycles/${params.id}/days/${params.dayId}`}>Cancel</Link>
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Medications */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Medications</CardTitle>
              <Button size="sm" onClick={addMedication}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {medications.map((med, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor={`med-name-${index}`}>Medication Name</Label>
                      <Input
                        id={`med-name-${index}`}
                        value={med.name}
                        onChange={(e) => updateMedication(index, "name", e.target.value)}
                        placeholder="e.g., Gonal-F"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`med-dosage-${index}`}>Dosage</Label>
                      <Input
                        id={`med-dosage-${index}`}
                        value={med.dosage || ""}
                        onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                        placeholder="e.g., 225 IU"
                      />
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`med-taken-${index}`}
                          checked={med.taken}
                          onCheckedChange={(checked) => updateMedication(index, "taken", checked)}
                        />
                        <Label htmlFor={`med-taken-${index}`}>Taken</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`med-refrigerated-${index}`}
                          checked={med.refrigerated || false}
                          onCheckedChange={(checked) => updateMedication(index, "refrigerated", checked)}
                        />
                        <Label htmlFor={`med-refrigerated-${index}`}>Refrigerated</Label>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMedication(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {medications.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No medications added yet</p>
            )}
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
                    onValueChange={(value: any) => setClinicVisit({ ...clinicVisit, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baseline">Baseline</SelectItem>
                      <SelectItem value="monitoring">Monitoring</SelectItem>
                      <SelectItem value="consult">Consult</SelectItem>
                      <SelectItem value="retrieval">Retrieval</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Follicle Measurements */}
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
            <div>
              <Label htmlFor="lining-thickness">Endometrial Lining Thickness (mm)</Label>
              <Input
                id="lining-thickness"
                type="number"
                value={follicleSizes?.liningThickness || ""}
                onChange={(e) => updateLiningThickness(e.target.value)}
                placeholder="e.g., 8.5"
              />
            </div>
          </CardContent>
        </Card>

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
