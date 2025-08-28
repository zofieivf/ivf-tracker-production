"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check, TestTube, ArrowRight } from 'lucide-react'
import { useIVFStore } from '@/lib/store'
import { TEST_USER_CYCLES, addTestCycles } from '@/lib/test-data'
import Link from 'next/link'

export default function TestDataPage() {
  const [dataAdded, setDataAdded] = useState(false)
  const { cycles, addCycle } = useIVFStore()
  
  const handleAddTestData = () => {
    TEST_USER_CYCLES.forEach(cycle => {
      // Check if cycle already exists
      const exists = cycles.find(c => c.id === cycle.id)
      if (!exists) {
        addCycle(cycle)
      }
    })
    setDataAdded(true)
  }

  const hasTestData = cycles.some(c => c.id.startsWith('user-cycle-'))

  return (
    <div className="container max-w-4xl py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TestTube className="h-8 w-8" />
            Test Data Setup
          </h1>
          <p className="text-muted-foreground mt-1">
            Add your actual cycles to test the Best vs Best comparison feature
          </p>
        </div>

        {/* Test Data Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Your Actual Cycles to Add</CardTitle>
            <CardDescription>
              Your real IVF journey data for meaningful comparisons against Jessica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TEST_USER_CYCLES.filter(c => c.cycleGoal === 'retrieval').map((cycle, index) => (
                <div key={cycle.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{cycle.name}</h4>
                    <Badge variant="outline">{cycle.cycleType}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Mature Eggs:</span>
                      <span className="ml-2 font-medium">{cycle.outcome?.matureEggs}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Blastocysts:</span>
                      <span className="ml-2 font-medium">{cycle.outcome?.blastocysts}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Euploids:</span>
                      <span className="ml-2 font-medium">{cycle.outcome?.euploidBlastocysts}</span>
                    </div>
                  </div>
                  
                  {cycle.outcome?.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {cycle.outcome.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Your Best Cycles Summary */}
        <Card className="bg-blue-50/30 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Your Successful Cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>🎉 Live Birth Success:</span>
                <span className="font-medium">Transfer 2 (Modified Natural FET - 2024)</span>
              </div>
              <div className="flex justify-between">
                <span>🎯 Embryo Grade:</span>
                <span className="font-medium">4AB euploid blastocyst (day 5)</span>
              </div>
              <div className="flex justify-between">
                <span>🔬 Protocol:</span>
                <span className="font-medium">Natural LH surge detection + timing</span>
              </div>
              <div className="flex justify-between">
                <span>📈 Beta Success:</span>
                <span className="font-medium">2669.9 → 6529.1 mIU/mL (perfect doubling)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jessica's Best Results for Reference */}
        <Card className="bg-green-50/30 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Jessica's Best Results (for comparison)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>🟡 Best Mature Eggs:</span>
                <span className="font-medium">IVF #1 Long Lupron (12 mature eggs)</span>
              </div>
              <div className="flex justify-between">
                <span>🎯 Best Blastocysts:</span>
                <span className="font-medium">IVF #1 Long Lupron (4 blastocysts)</span>
              </div>
              <div className="flex justify-between">
                <span>🏆 Best Euploids:</span>
                <span className="font-medium">IVF #2 Antagonist (3 euploids)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Data Button */}
        <div className="flex flex-col items-center gap-4">
          {hasTestData || dataAdded ? (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your actual cycle data has been added to your account! You can now test the Best vs Best comparison with real data.
              </AlertDescription>
            </Alert>
          ) : (
            <Button onClick={handleAddTestData} size="lg" className="w-full max-w-md">
              <TestTube className="h-4 w-4 mr-2" />
              Add My Actual Cycles for Testing
            </Button>
          )}

          {(hasTestData || dataAdded) && (
            <div className="flex gap-3">
              <Button asChild variant="default">
                <Link href="/compare/best-vs-best?username=hopeful_mama">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Compare vs Jessica Now
                </Link>
              </Button>
              
              <Button asChild variant="outline">
                <Link href="/compare">
                  View All Comparisons
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Expected Results Preview */}
        {(hasTestData || dataAdded) && (
          <Card>
            <CardHeader>
              <CardTitle>What You'll See in Comparisons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="border-l-4 border-l-green-400 pl-3">
                  <strong>Success Story:</strong> Your Transfer 2 achieved live birth with modified natural FET
                </div>
                <div className="border-l-4 border-l-blue-400 pl-3">
                  <strong>Protocol Insight:</strong> Natural LH surge detection vs Jessica's medicated approaches
                </div>
                <div className="border-l-4 border-l-purple-400 pl-3">
                  <strong>Key Difference:</strong> Your natural timing (LH surge on CD 17) vs Jessica's controlled timing
                </div>
                <div className="border-l-4 border-l-orange-400 pl-3">
                  <strong>Beta Performance:</strong> Excellent doubling time and strong initial levels
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Strategy Analysis will show: Natural vs medicated FET protocols, LH surge timing, progesterone monitoring approaches, and what made your natural approach successful
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}