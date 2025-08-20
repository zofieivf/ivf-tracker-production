/**
 * Demo page for the new clean medication system
 * 
 * This page allows testing the new medication system before replacing legacy components.
 * Remove this file once migration is complete.
 */

"use client"

import { useState } from "react"
import { CleanDailyMedications } from "@/components/clean-daily-medications"
import { CleanMedicationOverview } from "@/components/clean-medication-overview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIVFStore } from "@/lib/store"
import { COMMON_MEDICATIONS, MEDICATION_TEMPLATES } from "@/lib/medications"

export default function MedicationDemoPage() {
  const { 
    cycles, 
    addMedication, 
    getMedicationsForCycle,
    migrateToNewMedicationSystem,
    medications 
  } = useIVFStore()
  
  const [selectedCycleId, setSelectedCycleId] = useState<string>("")
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [demoMedication, setDemoMedication] = useState({
    name: "",
    dosage: "",
    time: "08:00 AM",
    type: "one-time" as "scheduled" | "one-time"
  })

  const selectedCycle = cycles.find(c => c.id === selectedCycleId)
  const cycleMedications = selectedCycleId ? getMedicationsForCycle(selectedCycleId) : []

  const addDemoMedication = () => {
    if (!selectedCycleId || !demoMedication.name || !demoMedication.dosage) return

    addMedication({
      cycleId: selectedCycleId,
      cycleDay: selectedDay,
      name: demoMedication.name,
      dosage: demoMedication.dosage,
      time: demoMedication.time,
      refrigerated: false,
      type: demoMedication.type,
      taken: false,
      skipped: false
    })

    // Reset form
    setDemoMedication({
      name: "",
      dosage: "",
      time: "08:00 AM", 
      type: "one-time"
    })
  }

  const loadTemplate = (templateKey: keyof typeof MEDICATION_TEMPLATES) => {
    if (!selectedCycleId) return

    const template = MEDICATION_TEMPLATES[templateKey]
    template.forEach(med => {
      if (med.endDay && med.startDay) {
        // Add scheduled medication for each day
        for (let day = med.startDay; day <= med.endDay; day++) {
          addMedication({
            cycleId: selectedCycleId,
            cycleDay: day,
            name: med.name,
            dosage: med.dosage,
            time: med.time,
            refrigerated: med.refrigerated,
            type: "scheduled",
            startDay: med.startDay,
            endDay: med.endDay,
            taken: false,
            skipped: false
          })
        }
      }
    })
  }

  const migrateCycle = () => {
    if (!selectedCycleId) return
    
    const result = migrateToNewMedicationSystem(selectedCycleId)
    alert(result.message)
  }

  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">New Medication System Demo</h1>
        <p className="text-muted-foreground">
          Test the new clean medication system. This page will be removed after migration is complete.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controls */}
        <div className="space-y-6">
          {/* Cycle Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Cycle</CardTitle>
              <CardDescription>Choose a cycle to test medications</CardDescription>
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
                  <p>New medications: {cycleMedications.length}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Migration */}
          {selectedCycleId && (
            <Card>
              <CardHeader>
                <CardTitle>Migration</CardTitle>
                <CardDescription>Migrate legacy medication data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={migrateCycle} className="w-full">
                  Migrate Legacy Data to New System
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Add Demo Medication */}
          {selectedCycleId && (
            <Card>
              <CardHeader>
                <CardTitle>Add Demo Medication</CardTitle>
                <CardDescription>Test adding medications manually</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Day</label>
                    <Input
                      type="number"
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select 
                      value={demoMedication.type} 
                      onValueChange={(value: "scheduled" | "one-time") => 
                        setDemoMedication(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-time">One-time</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Medication</label>
                  <Select 
                    value={demoMedication.name} 
                    onValueChange={(value) => 
                      setDemoMedication(prev => ({ ...prev, name: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select medication" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_MEDICATIONS.map(med => (
                        <SelectItem key={med} value={med}>{med}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Dosage</label>
                    <Input
                      value={demoMedication.dosage}
                      onChange={(e) => setDemoMedication(prev => ({ ...prev, dosage: e.target.value }))}
                      placeholder="e.g., 225 IU"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Time</label>
                    <Input
                      value={demoMedication.time}
                      onChange={(e) => setDemoMedication(prev => ({ ...prev, time: e.target.value }))}
                      placeholder="e.g., 08:00 AM"
                    />
                  </div>
                </div>

                <Button onClick={addDemoMedication} className="w-full">
                  Add Medication
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Templates */}
          {selectedCycleId && (
            <Card>
              <CardHeader>
                <CardTitle>Load Template</CardTitle>
                <CardDescription>Quick setup with common protocols</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  onClick={() => loadTemplate("antagonist-protocol")}
                  className="w-full"
                >
                  Antagonist Protocol
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => loadTemplate("lupron-protocol")}
                  className="w-full"
                >
                  Lupron Protocol
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => loadTemplate("transfer-protocol")}
                  className="w-full"
                >
                  Transfer Protocol
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Daily Medications Display */}
        <div className="space-y-6">
          {selectedCycleId && selectedCycle ? (
            <>
              {/* Medication Overview - Same style as your current Medication Schedule */}
              <CleanMedicationOverview cycle={selectedCycle} />
              
              {/* Daily Medications - Same style as your current daily view */}
              <CleanDailyMedications 
                cycleId={selectedCycleId}
                cycleDay={selectedDay}
                date={new Date().toISOString()}
              />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Medication Components</CardTitle>
                <CardDescription>Select a cycle to view the familiar-looking medication components</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Choose a cycle from the dropdown to see the components that match your current UI style.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Total Cycles:</strong> {cycles.length}
            </div>
            <div>
              <strong>Total New Medications:</strong> {medications.length}
            </div>
            {selectedCycleId && (
              <>
                <div>
                  <strong>Selected Cycle Medications:</strong> {cycleMedications.length}
                </div>
                <div>
                  <strong>Day {selectedDay} Medications:</strong> {
                    cycleMedications.filter(m => m.cycleDay === selectedDay).length
                  }
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}