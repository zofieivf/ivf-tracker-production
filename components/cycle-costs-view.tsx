"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DollarSign, Calculator, Receipt } from "lucide-react"
import { useIVFStore } from "@/lib/store"
import type { IVFCycle, CycleCosts } from "@/lib/types"

interface CycleCostsViewProps {
  cycle: IVFCycle
}

export function CycleCostsView({ cycle }: CycleCostsViewProps) {
  const { updateCycle } = useIVFStore()
  
  const [costs, setCosts] = useState<CycleCosts>({
    cycleCost: cycle.costs?.cycleCost || undefined,
    pgtCost: cycle.costs?.pgtCost || undefined,
    medicationsCost: cycle.costs?.medicationsCost || undefined,
    storageCost: cycle.costs?.storageCost || undefined,
    insuranceCoverage: cycle.costs?.insuranceCoverage || undefined,
  })
  
  const [isEditing, setIsEditing] = useState(false)

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return "$0"
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const totalCost = (costs.cycleCost || 0) + 
                   (costs.pgtCost || 0) + 
                   (costs.medicationsCost || 0) + 
                   (costs.storageCost || 0)

  const netCost = totalCost - (costs.insuranceCoverage || 0)

  const handleSave = () => {
    updateCycle(cycle.id, { costs })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setCosts({
      cycleCost: cycle.costs?.cycleCost || undefined,
      pgtCost: cycle.costs?.pgtCost || undefined,
      medicationsCost: cycle.costs?.medicationsCost || undefined,
      storageCost: cycle.costs?.storageCost || undefined,
      insuranceCoverage: cycle.costs?.insuranceCoverage || undefined,
    })
    setIsEditing(false)
  }

  const updateCost = (field: keyof CycleCosts, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value) || 0
    setCosts(prev => ({ ...prev, [field]: numValue }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cycle Costs</h2>
          <p className="text-muted-foreground">
            Track the financial costs associated with this {cycle.cycleGoal === "retrieval" ? "retrieval" : "transfer"} cycle
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Receipt className="h-4 w-4 mr-2" />
              Edit Costs
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Breakdown
            </CardTitle>
            <CardDescription>
              Enter the costs for different components of your cycle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cycle-cost">
                {cycle.cycleGoal === "retrieval" ? "Egg Retrieval Cycle Cost" : "Embryo Transfer Cycle Cost"}
              </Label>
              {isEditing ? (
                <Input
                  id="cycle-cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={costs.cycleCost || ""}
                  onChange={(e) => updateCost("cycleCost", e.target.value)}
                />
              ) : (
                <p className="text-lg font-medium">{formatCurrency(costs.cycleCost)}</p>
              )}
            </div>

            {cycle.cycleGoal === "retrieval" && (
              <div>
                <Label htmlFor="pgt-cost">PGT Testing Cost</Label>
                {isEditing ? (
                  <Input
                    id="pgt-cost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={costs.pgtCost || ""}
                    onChange={(e) => updateCost("pgtCost", e.target.value)}
                  />
                ) : (
                  <p className="text-lg font-medium">{formatCurrency(costs.pgtCost)}</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="medications-cost">Medications Cost</Label>
              {isEditing ? (
                <Input
                  id="medications-cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={costs.medicationsCost || ""}
                  onChange={(e) => updateCost("medicationsCost", e.target.value)}
                />
              ) : (
                <p className="text-lg font-medium">{formatCurrency(costs.medicationsCost)}</p>
              )}
            </div>

            <div>
              <Label htmlFor="storage-cost">Storage Cost</Label>
              {isEditing ? (
                <Input
                  id="storage-cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={costs.storageCost || ""}
                  onChange={(e) => updateCost("storageCost", e.target.value)}
                />
              ) : (
                <p className="text-lg font-medium">{formatCurrency(costs.storageCost)}</p>
              )}
            </div>

            <div>
              <Label htmlFor="insurance-coverage">Insurance Coverage</Label>
              {isEditing ? (
                <Input
                  id="insurance-coverage"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={costs.insuranceCoverage || ""}
                  onChange={(e) => updateCost("insuranceCoverage", e.target.value)}
                />
              ) : (
                <p className="text-lg font-medium text-green-600">{formatCurrency(costs.insuranceCoverage)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cost Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cost Summary
            </CardTitle>
            <CardDescription>
              Summary of all costs for this cycle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{cycle.cycleGoal === "retrieval" ? "Retrieval Cycle" : "Transfer Cycle"}</span>
                <span>{formatCurrency(costs.cycleCost)}</span>
              </div>
              
              {cycle.cycleGoal === "retrieval" && (
                <div className="flex justify-between text-sm">
                  <span>PGT Testing</span>
                  <span>{formatCurrency(costs.pgtCost)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span>Medications</span>
                <span>{formatCurrency(costs.medicationsCost)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Storage</span>
                <span>{formatCurrency(costs.storageCost)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-medium">
                <span>Total Cost</span>
                <span>{formatCurrency(totalCost)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-green-600">
                <span>Insurance Coverage</span>
                <span>-{formatCurrency(costs.insuranceCoverage)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Net Cost</span>
                <span className={netCost < 0 ? "text-green-600" : ""}>{formatCurrency(netCost)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Cycle Cost:</strong> Base cost for the {cycle.cycleGoal === "retrieval" ? "egg retrieval procedure, monitoring visits, and lab work" : "embryo transfer procedure and monitoring"}</p>
            {cycle.cycleGoal === "retrieval" && (
              <p><strong>PGT Cost:</strong> Genetic testing of embryos (if applicable)</p>
            )}
            <p><strong>Medications:</strong> All fertility medications for this cycle</p>
            <p><strong>Storage:</strong> Embryo or gamete storage fees</p>
            <p><strong>Insurance Coverage:</strong> Amount covered by your insurance plan</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}