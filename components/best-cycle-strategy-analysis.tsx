"use client"

import { useState } from 'react'
import { 
  Calendar, 
  Pill, 
  Clock, 
  Target, 
  TrendingUp, 
  Lightbulb, 
  ArrowRight,
  Info,
  Zap,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { PublicCycle } from '@/lib/types'
import { extractProtocolDetails, formatProtocolSummary, type ExtractedProtocolDetails } from '@/lib/protocol-extraction'

interface BestCycleStrategyAnalysisProps {
  yourBestCycle: PublicCycle & { outcome?: any; days?: any[] }
  theirBestCycle: PublicCycle & { outcome?: any; days?: any[] }
  theirUsername: string
  theirDisplayName?: string
  metric: string
}

export function BestCycleStrategyAnalysis({
  yourBestCycle,
  theirBestCycle,
  theirUsername,
  theirDisplayName,
  metric
}: BestCycleStrategyAnalysisProps) {
  
  const [activeTab, setActiveTab] = useState('protocol')
  
  const displayName = theirDisplayName || theirUsername
  
  // Debug: Log the full cycle structure to see what we're working with
  console.log('🔍 Full cycle object:', yourBestCycle)
  
  // Extract protocol details from actual cycle data
  const yourProtocol = extractProtocolDetails(yourBestCycle)
  const theirProtocol = extractProtocolDetails(theirBestCycle)
  
  // Calculate key differences
  const getProtocolComparison = () => {
    if (yourBestCycle.cycleGoal === 'transfer') {
      return {
        fetType: {
          yours: yourProtocol.fetType,
          theirs: theirProtocol.fetType,
          different: yourProtocol.fetType !== theirProtocol.fetType
        },
        transferDay: {
          yours: yourProtocol.transferDay,
          theirs: theirProtocol.transferDay,
          difference: (theirProtocol.transferDay || 0) - (yourProtocol.transferDay || 0)
        },
        lhMonitoring: {
          yours: yourProtocol.lhMonitoring,
          theirs: theirProtocol.lhMonitoring,
          different: yourProtocol.lhMonitoring !== theirProtocol.lhMonitoring
        }
      }
    } else {
      return {
        stimDuration: {
          yours: yourProtocol.stimDuration,
          theirs: theirProtocol.stimDuration,
          difference: (theirProtocol.stimDuration || 0) - (yourProtocol.stimDuration || 0)
        },
        totalMeds: {
          yours: yourProtocol.medications?.reduce((sum, med) => sum + (med.totalUnits || 0), 0) || 0,
          theirs: theirProtocol.medications?.reduce((sum, med) => sum + (med.totalUnits || 0), 0) || 0
        },
        triggerDifference: yourProtocol.triggerType !== theirProtocol.triggerType
      }
    }
  }
  
  const comparison = getProtocolComparison()
  
  const getActionableInsights = () => {
    if (!comparison) return []
    
    const insights = []
    
    if (yourBestCycle.cycleGoal === 'transfer') {
      // Transfer-specific insights
      if (comparison.fetType?.different) {
        insights.push({
          icon: <Target className="h-4 w-4" />,
          title: "Different FET Approach",
          description: `${displayName} used ${comparison.fetType.theirs} FET vs your ${comparison.fetType.yours} FET`,
          actionable: "Modified natural FETs may work better if you have regular ovulation patterns"
        })
      }
      
      if (comparison.transferDay?.difference > 0) {
        insights.push({
          icon: <Calendar className="h-4 w-4" />,
          title: "Later Transfer Timing",
          description: `${displayName} transferred on cycle day ${comparison.transferDay.theirs} vs your day ${comparison.transferDay.yours}`,
          actionable: "Transfer timing depends on ovulation patterns - later may indicate better endometrial preparation"
        })
      }
      
      if (comparison.lhMonitoring?.different) {
        insights.push({
          icon: <Activity className="h-4 w-4" />,
          title: "Different LH Monitoring",
          description: `${displayName} ${comparison.lhMonitoring.theirs ? 'used' : 'didn\'t use'} LH monitoring vs your approach`,
          actionable: "LH monitoring in natural FETs helps optimize transfer timing with your body's natural rhythm"
        })
      }
    } else {
      // Retrieval-specific insights
      if (comparison.stimDuration && comparison.stimDuration.difference > 0) {
        insights.push({
          icon: <Clock className="h-4 w-4" />,
          title: "Longer Stimulation",
          description: `${displayName} stimmed for ${comparison.stimDuration.difference} more days (${comparison.stimDuration.theirs} vs ${comparison.stimDuration.yours})`,
          actionable: "Consider discussing a longer stimulation protocol with your RE if you tend to be a slow responder"
        })
      } else if (comparison.stimDuration && comparison.stimDuration.difference < 0) {
        insights.push({
          icon: <Zap className="h-4 w-4" />,
          title: "Shorter Stimulation",
          description: `${displayName} stimmed for ${Math.abs(comparison.stimDuration.difference)} fewer days (${comparison.stimDuration.theirs} vs ${comparison.stimDuration.yours})`,
          actionable: "They may be a fast responder or used a more intensive protocol"
        })
      }
      
      // Medication insights
      const medDifference = comparison.totalMeds.theirs - comparison.totalMeds.yours
      if (medDifference > 500) {
        insights.push({
          icon: <Pill className="h-4 w-4" />,
          title: "Higher Medication Dose",
          description: `${displayName} used ~${Math.round(medDifference)} more units total`,
          actionable: "Higher doses might be needed for better response, but discuss OHSS risk with your doctor"
        })
      }
      
      // Trigger insights
      if (comparison.triggerDifference) {
        insights.push({
          icon: <Target className="h-4 w-4" />,
          title: "Different Trigger Strategy",
          description: `${displayName} used ${theirProtocol.triggerType} vs your ${yourProtocol.triggerType}`,
          actionable: "Trigger choice affects egg maturity - dual triggers often improve mature egg rates"
        })
      }
    }
    
    return insights
  }
  
  const insights = getActionableInsights()
  
  return (
    <div className="space-y-6">
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="protocol">Protocol Details</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
        </TabsList>
        
        
        <TabsContent value="protocol" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Your Best Cycle</CardTitle>
                <CardDescription>{yourBestCycle.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Protocol:</span>
                    <span className="font-medium">{yourBestCycle.cycleType}</span>
                  </div>
                  {yourBestCycle.cycleGoal === 'retrieval' ? (
                    <>
                      <div className="flex justify-between">
                        <span>Stim Days:</span>
                        <span className="font-medium">{yourProtocol.stimDuration || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trigger:</span>
                        <span className="font-medium">{yourProtocol.triggerType || 'N/A'}</span>
                      </div>
                    </>
                  ) : yourBestCycle.cycleGoal === 'transfer' ? (
                    <>
                      <div className="flex justify-between">
                        <span>FET Type:</span>
                        <span className="font-medium">{yourProtocol.fetType || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LH Monitoring:</span>
                        <span className="font-medium">{yourProtocol.lhMonitoring ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transfer Day:</span>
                        <span className="font-medium">Day {yourProtocol.transferDay || 'N/A'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Stim Days:</span>
                        <span className="font-medium">{yourProtocol.stimDuration || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trigger:</span>
                        <span className="font-medium">{yourProtocol.triggerType || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">{displayName}'s Best Cycle</CardTitle>
                <CardDescription>{theirBestCycle.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Protocol:</span>
                    <span className="font-medium">{theirBestCycle.cycleType}</span>
                  </div>
                  {theirBestCycle.cycleGoal === 'retrieval' ? (
                    <>
                      <div className="flex justify-between">
                        <span>Stim Days:</span>
                        <span className="font-medium">{theirProtocol.stimDuration || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trigger:</span>
                        <span className="font-medium">{theirProtocol.triggerType || 'N/A'}</span>
                      </div>
                    </>
                  ) : theirBestCycle.cycleGoal === 'transfer' ? (
                    <>
                      <div className="flex justify-between">
                        <span>FET Type:</span>
                        <span className="font-medium">{theirProtocol.fetType || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LH Monitoring:</span>
                        <span className="font-medium">{theirProtocol.lhMonitoring ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transfer Day:</span>
                        <span className="font-medium">Day {theirProtocol.transferDay || 'N/A'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Stim Days:</span>
                        <span className="font-medium">{theirProtocol.stimDuration || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trigger:</span>
                        <span className="font-medium">{theirProtocol.triggerType || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="medications" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Your medications */}
            <Card>
              <CardHeader>
                <CardTitle>Your Medication Protocol</CardTitle>
              </CardHeader>
              <CardContent>
                {(yourBestCycle.days && yourBestCycle.days.some((day: any) => day.medications && day.medications.length > 0)) ? (
                  <div className="space-y-3">
                    {/* Transfer Day Marker */}
                    {yourProtocol.transferDay && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Transfer occurred on cycle day {yourProtocol.transferDay}
                        </span>
                      </div>
                    )}
                    
                    {/* Medication Timeline */}
                    <div className="space-y-1">
                      {yourBestCycle.days
                        .filter((day: any) => day.medications && day.medications.length > 0)
                        .map((day: any) => (
                          <div key={day.id} className="border-l-2 border-gray-200 pl-3 pb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                Day {day.cycleDay}
                              </Badge>
                              {day.clinicVisit?.type === 'transfer' && (
                                <Badge variant="default" className="text-xs bg-blue-600">
                                  Transfer Day
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1">
                              {day.medications.map((med: any, index: number) => (
                                <div key={index} className="text-sm text-gray-700 flex items-center gap-2">
                                  <span className={`font-medium ${med.trigger ? 'text-amber-700' : ''}`}>
                                    {med.name}
                                  </span>
                                  {med.trigger && <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />}
                                  <span className="text-gray-500">
                                    {med.dosage}{med.unit} {med.timing && `(${med.timing})`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ) : yourProtocol.medications && yourProtocol.medications.length > 0 ? (
                  <div className="space-y-3">
                    {/* Transfer Day Marker */}
                    {yourProtocol.transferDay && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Transfer occurred on cycle day {yourProtocol.transferDay}
                        </span>
                      </div>
                    )}
                    
                    {/* Fallback: Medication Summary */}
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground mb-2">Medication summary (daily timeline not available):</p>
                      {yourProtocol.medications.map((med, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{med.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {med.days || 0} days
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {med.dailyDose || 'N/A'} daily
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No medication data available for this cycle</p>
                )}
              </CardContent>
            </Card>
            
            {/* Their medications */}
            <Card>
              <CardHeader>
                <CardTitle>{displayName}'s Medication Protocol</CardTitle>
              </CardHeader>
              <CardContent>
                {theirBestCycle.days && theirBestCycle.days.length > 0 ? (
                  <div className="space-y-3">
                    {/* Transfer Day Marker */}
                    {theirProtocol.transferDay && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Transfer occurred on cycle day {theirProtocol.transferDay}
                        </span>
                      </div>
                    )}
                    
                    {/* Medication Timeline */}
                    <div className="space-y-1">
                      {theirBestCycle.days
                        .filter((day: any) => day.medications && day.medications.length > 0)
                        .map((day: any) => (
                          <div key={day.id} className="border-l-2 border-gray-200 pl-3 pb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                Day {day.cycleDay}
                              </Badge>
                              {day.clinicVisit?.type === 'transfer' && (
                                <Badge variant="default" className="text-xs bg-green-600">
                                  Transfer Day
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1">
                              {day.medications.map((med: any, index: number) => (
                                <div key={index} className="text-sm text-gray-700 flex items-center gap-2">
                                  <span className={`font-medium ${med.trigger ? 'text-amber-700' : ''}`}>
                                    {med.name}
                                  </span>
                                  {med.trigger && <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />}
                                  <span className="text-gray-500">
                                    {med.dosage}{med.unit} {med.timing && `(${med.timing})`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No detailed medication timeline available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}