"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, BarChart3, Pill, Target, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useIVFStore } from "@/lib/store"
import { CycleComparisonView } from "@/components/cycle-comparison-view"

export default function ComparePage() {
  const { cycles } = useIVFStore()
  const [selectedCycles, setSelectedCycles] = useState<string[]>([])

  const availableCycles = cycles.filter(cycle => cycle.days && cycle.days.length > 0)
  
  // Group cycles by type for summary display
  const cyclesByType = {
    retrieval: availableCycles.filter(c => c.cycleGoal === "retrieval"),
    transfer: availableCycles.filter(c => c.cycleGoal === "transfer")
  }
  
  // Determine the required cycle type based on selected cycles
  const getRequiredCycleType = () => {
    const selectedCycleObjects = selectedCycles
      .filter(id => id)
      .map(id => cycles.find(c => c.id === id))
      .filter(Boolean)
    
    if (selectedCycleObjects.length === 0) return null
    return selectedCycleObjects[0].cycleGoal
  }

  const requiredCycleType = getRequiredCycleType()

  const handleCycleSelection = (cycleId: string, position: number) => {
    const newSelection = [...selectedCycles]
    newSelection[position] = cycleId
    setSelectedCycles(newSelection)
  }

  const selectedCycleObjects = selectedCycles
    .filter(id => id)
    .map(id => cycles.find(c => c.id === id))
    .filter(Boolean)
  
  // Validate that all selected cycles are of the same type
  const areAllCyclesSameType = selectedCycleObjects.length <= 1 || 
    selectedCycleObjects.every(cycle => cycle.cycleGoal === selectedCycleObjects[0].cycleGoal)

  return (
    <div className="container max-w-7xl py-10">
      <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0">
        <Link href="/" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Cycle Comparison
          </h1>
          <p className="text-muted-foreground mt-1">
            Compare medications, protocols, timelines, and outcomes across IVF cycles of the same treatment type
          </p>
        </div>

        {/* Cycle Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Cycles to Compare</CardTitle>
            <CardDescription>
              Choose up to 3 cycles of the same type to compare side-by-side. 
              Only Egg Retrieval cycles can be compared with other Egg Retrievals, and Transfer cycles with other Transfers.
              {availableCycles.length > 0 && (
                <span className="block mt-2 text-xs text-muted-foreground">
                  Available: {cyclesByType.retrieval.length} Retrieval cycle{cyclesByType.retrieval.length !== 1 ? 's' : ''}, {cyclesByType.transfer.length} Transfer cycle{cyclesByType.transfer.length !== 1 ? 's' : ''}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((position) => (
                <div key={position} className="space-y-2">
                  <label className="text-sm font-medium">
                    Cycle {position + 1}
                  </label>
                  <Select 
                    value={selectedCycles[position] || ""} 
                    onValueChange={(value) => handleCycleSelection(value, position)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const filteredCycles = availableCycles.filter(cycle => {
                          // If no cycles selected yet, show all
                          if (!requiredCycleType) return true
                          // Otherwise, only show cycles of the same type
                          return cycle.cycleGoal === requiredCycleType
                        })

                        if (filteredCycles.length === 0) {
                          return (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No more {requiredCycleType === "retrieval" ? "Egg Retrieval" : "Transfer"} cycles available
                            </div>
                          )
                        }

                        return filteredCycles.map((cycle) => (
                          <SelectItem 
                            key={cycle.id} 
                            value={cycle.id}
                            disabled={selectedCycles.includes(cycle.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span>{cycle.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {cycle.cycleGoal === "retrieval" ? "Retrieval" : "Transfer"}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      })()}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Cycle type filtering message */}
            {requiredCycleType && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Comparing {requiredCycleType === "retrieval" ? "Egg Retrieval" : "Transfer"} cycles only.</strong>{" "}
                  Only cycles of the same treatment type can be meaningfully compared. 
                  Clear your selection to compare different cycle types.
                </p>
              </div>
            )}

            {/* Warning for mixed cycle types (shouldn't happen with our filtering, but safeguard) */}
            {selectedCycleObjects.length > 1 && !areAllCyclesSameType && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> You have selected cycles of different treatment types. 
                  Please clear your selection and choose only Egg Retrieval cycles or only Transfer cycles.
                </p>
              </div>
            )}

            {selectedCycleObjects.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                {selectedCycleObjects.map((cycle) => (
                  <Badge key={cycle.id} variant="secondary">
                    {cycle.name}
                  </Badge>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedCycles([])}
                  className="ml-2"
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {selectedCycleObjects.length < 2 || !areAllCyclesSameType ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <Target className="h-12 w-12" />
                <Pill className="h-12 w-12" />
                <Calendar className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Select cycles to compare</h3>
              <p className="text-muted-foreground text-center">
                Choose at least 2 cycles of the same treatment type to see detailed side-by-side comparisons of medications, 
                protocols, timelines, and outcomes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Comparison type indicator */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-blue-600">
                      {requiredCycleType === "retrieval" ? "Egg Retrieval" : "Transfer"} Comparison
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Comparing {selectedCycleObjects.length} cycle{selectedCycleObjects.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedCycles([])}
                  >
                    Change Cycles
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <CycleComparisonView cycles={selectedCycleObjects} />
          </div>
        )}
      </div>
    </div>
  )
}