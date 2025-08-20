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
  } = useIVFStore()
  
  const cycle = getCycleById(cycleId)
  const day = cycle?.days.find(d => d.id === dayId)
  const [mounted, setMounted] = useState(false)

  // Form state - no medications
  const [clinicVisit, setClinicVisit] = useState<ClinicVisit | undefined>()
  const [follicleMeasurements, setFollicleMeasurements] = useState<FollicleMeasurement[]>([])
  const [bloodworkResults, setBloodworkResults] = useState<BloodworkResult[]>([])
  const [notes, setNotes] = useState("")

  useEffect(() => {
    setMounted(true)
    if (day) {
      // Load existing data
      setClinicVisit(day.clinicVisit)
      setFollicleMeasurements(day.follicleMeasurements || [])
      setBloodworkResults(day.bloodwork || [])
      setNotes(day.notes || "")
    }
  }, [day])

  if (!mounted || !cycle || !day) {
    return <div>Loading...</div>
  }

  const handleSubmit = () => {
    // Update day data (no medications)
    const updatedDay: CycleDay = {
      ...day,
      clinicVisit: clinicVisit,
      follicleMeasurements: follicleMeasurements.length > 0 ? follicleMeasurements : undefined,
      bloodwork: bloodworkResults.length > 0 ? bloodworkResults : undefined,
      notes: notes.trim() || undefined,
    }

    updateDay(cycleId, dayId, updatedDay)
    onSave()
  }

  const addFollicleMeasurement = () => {
    setFollicleMeasurements([...follicleMeasurements, {
      id: crypto.randomUUID(),
      ovary: "left",
      size: 0
    }])
  }

  const updateFollicleMeasurement = (index: number, field: keyof FollicleMeasurement, value: any) => {
    const updated = [...follicleMeasurements]
    updated[index] = { ...updated[index], [field]: value }
    setFollicleMeasurements(updated)
  }

  const removeFollicleMeasurement = (index: number) => {
    setFollicleMeasurements(follicleMeasurements.filter((_, i) => i !== index))
  }

  const addBloodworkResult = () => {
    setBloodworkResults([...bloodworkResults, {
      id: crypto.randomUUID(),
      test: "",
      value: "",
      unit: ""
    }])
  }

  const updateBloodworkResult = (index: number, field: keyof BloodworkResult, value: any) => {
    const updated = [...bloodworkResults]
    updated[index] = { ...updated[index], [field]: value }
    setBloodworkResults(updated)
  }

  const removeBloodworkResult = (index: number) => {
    setBloodworkResults(bloodworkResults.filter((_, i) => i !== index))
  }

  const commonBloodworkTests = [
    "Estradiol (E2)", "LH", "FSH", "Progesterone", "hCG",
    "Testosterone", "Prolactin", "Thyroid (TSH)", "AMH"
  ]

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={onCancel} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Day
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Day {day.cycleDay}</h1>
        <p className="text-muted-foreground">
          {format(parseISO(day.date), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="flex justify-end gap-2 mb-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          Save Changes
        </Button>
      </div>

      {/* Clinic Visit */}
      <Card>
        <CardHeader>
          <CardTitle>Clinic Visit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              checked={!!clinicVisit}
              onCheckedChange={(checked) => {
                if (checked) {
                  setClinicVisit({ type: "monitoring", notes: "" })
                } else {
                  setClinicVisit(undefined)
                }
              }}
            />
            <Label>I had a clinic visit this day</Label>
          </div>

          {clinicVisit && (
            <div className="space-y-4 pl-6 border-l-2 border-gray-200">
              <div>
                <Label>Visit Type</Label>
                <Select 
                  value={clinicVisit.type} 
                  onValueChange={(value: any) => setClinicVisit({...clinicVisit, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baseline">Baseline</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="retrieval">Egg Retrieval</SelectItem>
                    <SelectItem value="transfer">Embryo Transfer</SelectItem>
                    <SelectItem value="beta">Beta hCG Test</SelectItem>
                    <SelectItem value="iui">IUI</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {clinicVisit.type === "beta" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Beta hCG Value</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={clinicVisit.betaHcgValue || ""}
                      onChange={(e) => setClinicVisit({
                        ...clinicVisit, 
                        betaHcgValue: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      placeholder="e.g., 150.5"
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select 
                      value={clinicVisit.betaHcgUnit || ""} 
                      onValueChange={(value) => setClinicVisit({...clinicVisit, betaHcgUnit: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mIU/mL">mIU/mL</SelectItem>
                        <SelectItem value="IU/L">IU/L</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div>
                <Label>Visit Notes</Label>
                <Textarea
                  value={clinicVisit.notes || ""}
                  onChange={(e) => setClinicVisit({...clinicVisit, notes: e.target.value})}
                  placeholder="Any notes about the visit..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Follicle Measurements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Follicle Measurements</CardTitle>
            <Button variant="outline" size="sm" onClick={addFollicleMeasurement}>
              <Plus className="h-4 w-4 mr-1" />
              Add Measurement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {follicleMeasurements.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No follicle measurements recorded
            </p>
          ) : (
            <div className="space-y-3">
              {follicleMeasurements.map((measurement, index) => (
                <div key={measurement.id} className="flex items-center gap-4 p-3 border rounded">
                  <Select
                    value={measurement.ovary}
                    onValueChange={(value: "left" | "right") => updateFollicleMeasurement(index, "ovary", value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.1"
                    value={measurement.size}
                    onChange={(e) => updateFollicleMeasurement(index, "size", parseFloat(e.target.value) || 0)}
                    placeholder="Size (mm)"
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">mm</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFollicleMeasurement(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bloodwork Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bloodwork Results</CardTitle>
            <Button variant="outline" size="sm" onClick={addBloodworkResult}>
              <Plus className="h-4 w-4 mr-1" />
              Add Test
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bloodworkResults.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No bloodwork results recorded
            </p>
          ) : (
            <div className="space-y-3">
              {bloodworkResults.map((result, index) => (
                <div key={result.id} className="grid grid-cols-4 gap-4 p-3 border rounded">
                  <Select
                    value={result.test}
                    onValueChange={(value) => updateBloodworkResult(index, "test", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Test" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonBloodworkTests.map(test => (
                        <SelectItem key={test} value={test}>{test}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={result.value}
                    onChange={(e) => updateBloodworkResult(index, "value", e.target.value)}
                    placeholder="Value"
                  />
                  <Input
                    value={result.unit || ""}
                    onChange={(e) => updateBloodworkResult(index, "unit", e.target.value)}
                    placeholder="Unit"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBloodworkResult(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about this day..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>
    </div>
  )
}