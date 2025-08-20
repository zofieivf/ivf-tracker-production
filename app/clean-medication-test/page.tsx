/**
 * Clean Medication System Test Page
 * 
 * This page tests the new clean medication system with the existing UI
 * It preserves the familiar look while using the clean backend
 */

"use client"

import { useState } from "react"
import { CleanCycleMedicationOverview } from "@/components/clean-cycle-medication-overview"
import { CleanUnifiedDailyMedicationChecklist } from "@/components/clean-unified-daily-medication-checklist"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useIVFStore } from "@/lib/store"

const commonMedications = [
  "Gonal-F", "Menopur", "Cetrotide", "Lupron", "Estrace", "Progesterone",
  "Follistim", "Ganirelix", "Ovidrel", "Pregnyl", "Crinone", "Endometrin", "Medrol",
  "Estradiol", "Prometrium Inserts", "Progesterone in Oil (PIO)"
]

export default function CleanMedicationTestPage() {
  const { cycles, addCleanDaySpecificMedication } = useIVFStore()
  const [selectedCycleId, setSelectedCycleId] = useState<string>("")
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    hour: "8",
    minute: "00",
    ampm: "PM" as "AM" | "PM",
    refrigerated: false,
    taken: false,
    notes: ""
  })

  const selectedCycle = cycles.find(c => c.id === selectedCycleId)

  const addDaySpecificMedication = () => {
    if (!selectedCycleId || !newMedication.name || !newMedication.dosage) {
      alert("Please fill in cycle, medication name, and dosage")
      return
    }

    // Calculate date for this day
    const cycleStartDate = new Date(selectedCycle!.startDate)
    const dayDate = new Date(cycleStartDate)
    dayDate.setDate(cycleStartDate.getDate() + (selectedDay - 1))

    addCleanDaySpecificMedication(
      selectedCycleId,
      selectedDay,
      dayDate.toISOString(),
      {
        name: newMedication.name,
        dosage: newMedication.dosage,
        hour: newMedication.hour,
        minute: newMedication.minute,
        ampm: newMedication.ampm,
        refrigerated: newMedication.refrigerated,
        taken: newMedication.taken,
        notes: newMedication.notes
      }
    )

    // Reset form
    setNewMedication({
      name: "",
      dosage: "",
      hour: "8",
      minute: "00",
      ampm: "PM",
      refrigerated: false,
      taken: false,
      notes: ""
    })
  }

  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Clean Medication System Test</h1>
        <p className="text-muted-foreground">
          Testing the new clean medication system with existing UI components. 
          This preserves the familiar look while using a clean backend.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controls */}
        <div className="space-y-6">
          {/* Cycle Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Cycle</CardTitle>
              <CardDescription>Choose a cycle to test the clean system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map(cycle => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name} ({cycle.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCycle && (
                <div className="text-sm text-muted-foreground">
                  <p>Selected: {selectedCycle.name}</p>
                  <p>Days: {selectedCycle.days.length}</p>
                  <p>Start: {selectedCycle.startDate}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Day Selection */}
          {selectedCycle && (
            <Card>
              <CardHeader>
                <CardTitle>Select Day</CardTitle>
                <CardDescription>Choose a day to view medications</CardDescription>
              </CardHeader>
              <CardContent>
                <Select 
                  value={selectedDay.toString()} 
                  onValueChange={(value) => setSelectedDay(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: Math.max(1, selectedCycle.days.length) }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        Day {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Add Day-Specific Medication */}
          {selectedCycle && (
            <Card>
              <CardHeader>
                <CardTitle>Add Day-Specific Medication</CardTitle>
                <CardDescription>Add a medication for Day {selectedDay} only</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Medication Name */}
                <div>
                  <Label htmlFor="medication-name">Medication</Label>
                  <Select 
                    value={newMedication.name} 
                    onValueChange={(value) => setNewMedication(prev => ({ ...prev, name: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select medication" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonMedications.map(med => (
                        <SelectItem key={med} value={med}>{med}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dosage and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input
                      id="dosage"
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                      placeholder="e.g., 225 IU"
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <div className="flex gap-1">
                      <Select 
                        value={newMedication.hour} 
                        onValueChange={(value) => setNewMedication(prev => ({ ...prev, hour: value }))}
                      >
                        <SelectTrigger className="w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                            <SelectItem key={hour} value={hour.toString()}>{hour}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="self-center">:</span>
                      <Select 
                        value={newMedication.minute} 
                        onValueChange={(value) => setNewMedication(prev => ({ ...prev, minute: value }))}
                      >
                        <SelectTrigger className="w-16">
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
                        onValueChange={(value: "AM" | "PM") => setNewMedication(prev => ({ ...prev, ampm: value }))}
                      >
                        <SelectTrigger className="w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Refrigerated checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="refrigerated"
                    checked={newMedication.refrigerated}
                    onCheckedChange={(checked) => setNewMedication(prev => ({ ...prev, refrigerated: !!checked }))}
                  />
                  <Label htmlFor="refrigerated">Requires refrigeration</Label>
                </div>

                <Button onClick={addDaySpecificMedication} className="w-full">
                  Add Day-Specific Medication
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>About This Test</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>✅ Unified system for both recurring and day-specific medications</p>
              <p>✅ Preserves familiar UI components and styling</p>
              <p>✅ Clean backend with proper separation of concerns</p>
              <p>✅ No breaking changes to existing medication data</p>
              <p>🔧 Try adding a day-specific medication to see both types together</p>
            </CardContent>
          </Card>
        </div>

        {/* Display Components */}
        <div className="space-y-6">
          {selectedCycle ? (
            <>
              {/* Medication Overview - Same style as your current Medication Schedule */}
              <CleanCycleMedicationOverview cycle={selectedCycle} />
              
              {/* Daily Medications - Same style as your current daily view */}
              <CleanUnifiedDailyMedicationChecklist 
                cycleId={selectedCycleId}
                cycleDay={selectedDay}
                date={new Date().toISOString()}
              />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Clean Medication Components</CardTitle>
                <CardDescription>Select a cycle to view the clean system in action</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Choose a cycle from the dropdown to see the clean medication system components 
                  that preserve your familiar UI style.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex gap-4">
        <Button asChild variant="outline">
          <a href="/">← Back to Home</a>
        </Button>
        {selectedCycle && (
          <Button asChild>
            <a href={`/cycles/${selectedCycle.id}/medication-schedule`}>
              Set Up Medication Schedule →
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}