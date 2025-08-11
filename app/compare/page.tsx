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

  const handleCycleSelection = (cycleId: string, position: number) => {
    const newSelection = [...selectedCycles]
    newSelection[position] = cycleId
    setSelectedCycles(newSelection)
  }

  const selectedCycleObjects = selectedCycles
    .filter(id => id)
    .map(id => cycles.find(c => c.id === id))
    .filter(Boolean)

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
            Compare medications, protocols, timelines, and outcomes across your IVF cycles
          </p>
        </div>

        {/* Cycle Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Cycles to Compare</CardTitle>
            <CardDescription>
              Choose up to 3 cycles to compare side-by-side
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
                      {availableCycles.map((cycle) => (
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
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {selectedCycleObjects.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                {selectedCycleObjects.map((cycle) => (
                  <Badge key={cycle.id} variant="secondary">
                    {cycle.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {selectedCycleObjects.length < 2 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <Target className="h-12 w-12" />
                <Pill className="h-12 w-12" />
                <Calendar className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Select cycles to compare</h3>
              <p className="text-muted-foreground text-center">
                Choose at least 2 cycles to see detailed side-by-side comparisons of medications, 
                protocols, timelines, and outcomes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <CycleComparisonView cycles={selectedCycleObjects} />
        )}
      </div>
    </div>
  )
}