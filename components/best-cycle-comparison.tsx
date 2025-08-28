"use client"

import { useState, useMemo } from 'react'
import { Target, Trophy, TrendingUp, Info, Zap, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BestCycleStrategyAnalysis } from './best-cycle-strategy-analysis'
import { CycleSelectionDialog } from './cycle-selection-dialog'
import type { IVFCycle, PublicCycle, BestCycleComparison, CycleMetricOption } from '@/lib/types'
import { 
  CYCLE_METRICS, 
  getAvailableMetrics, 
  getAvailableMetricsForComparison,
  findBestCycles,
  compareBestCycles,
  getCycleMetricValue 
} from '@/lib/cycle-ranking'

interface BestCycleComparisonProps {
  yourCycles: IVFCycle[]
  theirCycles: PublicCycle[]
  theirUsername: string
  theirDisplayName?: string
}

export function BestCycleComparison({ 
  yourCycles, 
  theirCycles, 
  theirUsername,
  theirDisplayName 
}: BestCycleComparisonProps) {
  const [selectedMetric, setSelectedMetric] = useState<CycleMetricOption['key'] | null>(null)
  const [showCycleSelection, setShowCycleSelection] = useState(false)
  const [cycleSelectionData, setCycleSelectionData] = useState<{
    cycles: any[]
    username: string
    displayName?: string
    metric: string
    metricLabel: string
  } | null>(null)
  const [selectedTheirCycle, setSelectedTheirCycle] = useState<any | null>(null)
  
  // Get available metrics for comparison - only metrics where both users have compatible cycles
  const availableMetrics = useMemo(() => {
    return getAvailableMetricsForComparison(yourCycles, theirCycles)
  }, [yourCycles, theirCycles])
  
  // Check for ties when metric is selected
  const handleMetricSelection = (metric: CycleMetricOption['key']) => {
    setSelectedMetric(metric)
    setSelectedTheirCycle(null) // Reset selection
    
    // Check if their best cycles have ties
    const theirBestResult = findBestCycles(theirCycles, metric)
    if (theirBestResult?.hasTies) {
      setCycleSelectionData({
        cycles: theirBestResult.cycles,
        username: theirUsername,
        displayName: theirDisplayName,
        metric,
        metricLabel: CYCLE_METRICS.find(m => m.key === metric)?.label || metric
      })
      setShowCycleSelection(true)
    }
  }
  
  // Generate comparison when metric is selected and cycle is chosen (if needed)
  const comparison = useMemo(() => {
    if (!selectedMetric) return null
    
    // If there are ties and no specific cycle selected, wait
    const theirBestResult = findBestCycles(theirCycles, selectedMetric)
    if (theirBestResult?.hasTies && !selectedTheirCycle) {
      return null
    }
    
    // Use selected cycle or first available
    if (selectedTheirCycle) {
      const yourBestResult = findBestCycles(yourCycles, selectedMetric)
      if (!yourBestResult) return null
      
      const yourBest = yourBestResult.cycles[0]
      
      // Manual comparison with selected cycle
      const difference = yourBest.value - selectedTheirCycle.value
      const percentageDifference = selectedTheirCycle.value === 0 ? 
        (yourBest.value > 0 ? 100 : 0) : 
        Math.round((difference / selectedTheirCycle.value) * 100)
      
      let winner: 'you' | 'them' | 'tie' = 'tie'
      if (yourBest.value > selectedTheirCycle.value) winner = 'you'
      else if (selectedTheirCycle.value > yourBest.value) winner = 'them'
      
      return {
        metric: selectedMetric,
        yourBestCycle: {
          cycle: yourBest.cycle as PublicCycle,
          value: yourBest.value,
          rank: yourBest.rank
        },
        theirBestCycle: {
          cycle: selectedTheirCycle.cycle as PublicCycle,
          value: selectedTheirCycle.value,
          rank: selectedTheirCycle.rank
        },
        comparison: {
          winner,
          difference: Math.abs(difference),
          percentageDifference: Math.abs(percentageDifference)
        }
      }
    }
    
    return compareBestCycles(yourCycles, theirCycles, selectedMetric)
  }, [selectedMetric, selectedTheirCycle, yourCycles, theirCycles])

  const getMetricIcon = (metricKey: string) => {
    switch (metricKey) {
      case 'mature-eggs':
        return <Zap className="h-4 w-4" />
      case 'blastocysts':
        return <Target className="h-4 w-4" />
      case 'euploids':
        return <Trophy className="h-4 w-4" />
      default:
        return <TrendingUp className="h-4 w-4" />
    }
  }

  const getWinnerColor = (winner: string) => {
    switch (winner) {
      case 'you':
        return 'text-green-600 bg-green-50'
      case 'them':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
Compare vs Other Members
          </CardTitle>
          <CardDescription>
            Compare your best performing cycle with{' '}
            <span className="font-medium">
              {theirDisplayName || `@${theirUsername}`}
            </span>
            's best cycle based on your chosen metric
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Metric Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Comparison Metric</CardTitle>
          <CardDescription>
            Select what defines a "best" cycle. Different metrics work better for different situations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableMetrics.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No comparable metrics available. Both users need retrieval cycles with outcome data 
                to enable best cycle comparisons.
              </AlertDescription>
            </Alert>
          ) : (
            <RadioGroup value={selectedMetric || ''} onValueChange={handleMetricSelection}>
              <div className="grid gap-4 md:grid-cols-2">
                {availableMetrics.map((metric) => (
                  <div key={metric.key} className="flex items-start space-x-3">
                    <RadioGroupItem value={metric.key} id={metric.key} className="mt-1" />
                    <Label htmlFor={metric.key} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        {getMetricIcon(metric.key)}
                        <span className="font-medium">{metric.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {metric.description}
                      </p>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-4">
          {/* Winner Summary */}
          <Card className={`border-2 ${
            comparison.comparison.winner === 'you' ? 'border-green-200 bg-green-50/30' :
            comparison.comparison.winner === 'them' ? 'border-blue-200 bg-blue-50/30' :
            'border-gray-200 bg-gray-50/30'
          }`}>
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Trophy className={`h-6 w-6 ${
                    comparison.comparison.winner === 'you' ? 'text-green-600' :
                    comparison.comparison.winner === 'them' ? 'text-blue-600' :
                    'text-gray-600'
                  }`} />
                  <h3 className="text-2xl font-bold">
                    {comparison.comparison.winner === 'you' ? 'You win!' :
                     comparison.comparison.winner === 'them' ? `${theirDisplayName || theirUsername} wins!` :
                     "It's a tie!"}
                  </h3>
                </div>
                
                <div className="flex items-center justify-center gap-6 text-lg">
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      You: {comparison.yourBestCycle.value}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cycle #{comparison.yourBestCycle.rank}
                    </p>
                  </div>
                  
                  <div className="text-2xl font-bold text-muted-foreground">VS</div>
                  
                  <div className="text-center">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      Them: {comparison.theirBestCycle.value}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cycle #{comparison.theirBestCycle.rank}
                    </p>
                  </div>
                </div>

                {comparison.comparison.difference > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Difference: {comparison.comparison.difference} ({comparison.comparison.percentageDifference}%)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Cycle Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Your Best Cycle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Your Best Cycle</CardTitle>
                <CardDescription>
                  Your highest {CYCLE_METRICS.find(m => m.key === comparison.metric)?.label.toLowerCase()} result
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {CYCLE_METRICS.find(m => m.key === comparison.metric)?.label}:
                    </span>
                    <Badge variant="default" className="bg-green-600">
                      {comparison.yourBestCycle.value}
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Cycle Name:</span>
                      <span className="font-medium">{comparison.yourBestCycle.cycle.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cycle Number:</span>
                      <span>#{comparison.yourBestCycle.rank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protocol:</span>
                      <span>{comparison.yourBestCycle.cycle.cycleType}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Their Best Cycle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">
                  {theirDisplayName || theirUsername}'s Best Cycle
                </CardTitle>
                <CardDescription>
                  Their highest {CYCLE_METRICS.find(m => m.key === comparison.metric)?.label.toLowerCase()} result
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {CYCLE_METRICS.find(m => m.key === comparison.metric)?.label}:
                    </span>
                    <Badge variant="outline" className="border-blue-600 text-blue-600">
                      {comparison.theirBestCycle.value}
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Cycle Name:</span>
                      <span className="font-medium">{comparison.theirBestCycle.cycle.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cycle Number:</span>
                      <span>#{comparison.theirBestCycle.rank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protocol:</span>
                      <span>{comparison.theirBestCycle.cycle.cycleType}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {comparison.comparison.winner === 'you' && (
                  <p className="text-green-600">
                    🎉 Your best cycle outperformed theirs by {comparison.comparison.difference} {CYCLE_METRICS.find(m => m.key === comparison.metric)?.label.toLowerCase()}
                    ({comparison.comparison.percentageDifference}% better).
                  </p>
                )}
                {comparison.comparison.winner === 'them' && (
                  <p className="text-blue-600">
                    Their best cycle achieved {comparison.comparison.difference} more {CYCLE_METRICS.find(m => m.key === comparison.metric)?.label.toLowerCase()} than yours
                    ({comparison.comparison.percentageDifference}% higher).
                  </p>
                )}
                {comparison.comparison.winner === 'tie' && (
                  <p className="text-gray-600">
                    You both achieved the same result in your best cycles! Great minds think alike.
                  </p>
                )}
                
                <p className="text-muted-foreground">
                  This was your cycle #{comparison.yourBestCycle.rank} and their cycle #{comparison.theirBestCycle.rank}.
                  {comparison.yourBestCycle.rank !== comparison.theirBestCycle.rank && (
                    comparison.yourBestCycle.rank < comparison.theirBestCycle.rank ? 
                    " You achieved your best result earlier in your journey." :
                    " They achieved your best result earlier in their journey."
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Strategy Analysis */}
          <BestCycleStrategyAnalysis
            yourBestCycle={comparison.yourBestCycle.cycle}
            theirBestCycle={comparison.theirBestCycle.cycle}
            theirUsername={theirUsername}
            theirDisplayName={theirDisplayName}
            metric={comparison.metric}
          />
        </div>
      )}

      {/* Cycle Selection Dialog */}
      {cycleSelectionData && (
        <CycleSelectionDialog
          isOpen={showCycleSelection}
          onClose={() => setShowCycleSelection(false)}
          onSelect={(cycleOption) => {
            setSelectedTheirCycle(cycleOption)
            setShowCycleSelection(false)
          }}
          cycles={cycleSelectionData.cycles}
          username={cycleSelectionData.username}
          displayName={cycleSelectionData.displayName}
          metric={cycleSelectionData.metric}
          metricLabel={cycleSelectionData.metricLabel}
        />
      )}
    </div>
  )
}