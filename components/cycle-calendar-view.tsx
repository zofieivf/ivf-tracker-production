"use client"

import { useState } from "react"
import { format, parseISO, addDays, startOfWeek, getDay } from "date-fns"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Pill, Droplet, Stethoscope, FileText, Plus, Trash2 } from "lucide-react"
import { useIVFStore } from "@/lib/store"
import type { IVFCycle, CycleDay } from "@/lib/types"

interface CycleCalendarViewProps {
  cycle: IVFCycle
  isDeleteMode: boolean
  selectedDays: Set<string>
  onToggleDay: (dayId: string) => void
}

export function CycleCalendarView({ 
  cycle, 
  isDeleteMode, 
  selectedDays, 
  onToggleDay 
}: CycleCalendarViewProps) {
  const { getMedicationScheduleByCycleId, getDailyMedicationStatus } = useIVFStore()

  // Get existing days sorted by cycle day number
  const existingDays = cycle.days.sort((a, b) => a.cycleDay - b.cycleDay)
  const maxDay = existingDays.length > 0 ? Math.max(...existingDays.map(d => d.cycleDay)) : 0
  
  // Create array of all days from 1 to maxDay
  const allDays = []
  for (let dayNum = 1; dayNum <= maxDay; dayNum++) {
    const existingDay = existingDays.find(d => d.cycleDay === dayNum)
    if (existingDay) {
      allDays.push({ type: 'existing', day: existingDay })
    } else {
      // Create placeholder day
      const startDate = new Date(cycle.startDate)
      const dayDate = new Date(startDate)
      dayDate.setDate(startDate.getDate() + (dayNum - 1))
      
      const placeholderDay = {
        id: `placeholder-${dayNum}`,
        date: dayDate.toISOString(),
        cycleDay: dayNum,
        notes: ''
      }
      allDays.push({ type: 'placeholder', day: placeholderDay })
    }
  }

  const getDayInfo = (day: CycleDay, type: 'existing' | 'placeholder') => {
    // Check medication system
    const schedule = getMedicationScheduleByCycleId(cycle.id)
    const dailyStatus = getDailyMedicationStatus(cycle.id, day.cycleDay)
    const scheduledMedications = schedule?.medications.filter(
      med => med.startDay <= day.cycleDay && med.endDay >= day.cycleDay
    ) || []
    const daySpecificMedications = dailyStatus?.daySpecificMedications || []
    
    const totalMedicationCount = scheduledMedications.length + daySpecificMedications.length
    
    const hasMedications = totalMedicationCount > 0
    const hasClinicVisit = !!day.clinicVisit
    const hasFollicleSizes = !!day.follicleSizes
    const hasBloodwork = !!day.bloodwork && day.bloodwork.length > 0
    const hasNotes = !!day.notes
    const hasData = hasMedications || hasClinicVisit || hasFollicleSizes || hasBloodwork || hasNotes

    // Check if this is a clinic visit day and get styling
    const getClinicVisitStyling = () => {
      if (!day.clinicVisit) return { isClinicDay: false, styling: '', badgeColor: '', displayName: '' }
      
      switch (day.clinicVisit.type) {
        case "retrieval":
          return { 
            isClinicDay: true, 
            styling: 'ring-2 ring-purple-500 bg-purple-50/50', 
            badgeColor: 'bg-purple-600 text-white',
            displayName: 'ER'
          }
        case "transfer":
          return { 
            isClinicDay: true, 
            styling: 'ring-2 ring-pink-500 bg-pink-50/50', 
            badgeColor: 'bg-pink-600 text-white',
            displayName: 'ET'
          }
        case "baseline":
          return { 
            isClinicDay: true, 
            styling: 'ring-2 ring-blue-500 bg-blue-50/50', 
            badgeColor: 'bg-blue-600 text-white',
            displayName: 'BL'
          }
        case "monitoring":
          return { 
            isClinicDay: true, 
            styling: 'ring-2 ring-green-500 bg-green-50/50', 
            badgeColor: 'bg-green-600 text-white',
            displayName: 'MON'
          }
        case "beta":
          return { 
            isClinicDay: true, 
            styling: 'ring-2 ring-indigo-500 bg-indigo-50/50', 
            badgeColor: 'bg-indigo-600 text-white',
            displayName: 'BET'
          }
        case "iui":
          return { 
            isClinicDay: true, 
            styling: 'ring-2 ring-purple-500 bg-purple-50/50', 
            badgeColor: 'bg-purple-600 text-white',
            displayName: 'IUI'
          }
        case "other":
          return { 
            isClinicDay: true, 
            styling: 'ring-2 ring-orange-500 bg-orange-50/50', 
            badgeColor: 'bg-orange-600 text-white',
            displayName: 'VIS'
          }
        default:
          return { 
            isClinicDay: true, 
            styling: 'ring-2 ring-gray-500 bg-gray-50/50', 
            badgeColor: 'bg-gray-600 text-white',
            displayName: 'VIS'
          }
      }
    }
    
    const clinicVisitInfo = getClinicVisitStyling()

    return {
      hasMedications,
      hasClinicVisit,
      hasFollicleSizes, 
      hasBloodwork,
      hasNotes,
      hasData,
      clinicVisitInfo,
      totalMedicationCount
    }
  }

  // Create calendar weeks arranged by actual days of the week
  const createCalendarWeeks = () => {
    if (allDays.length === 0) return []
    
    const weeks = []
    const firstDate = parseISO(allDays[0].day.date)
    const startOfFirstWeek = startOfWeek(firstDate, { weekStartsOn: 0 }) // Sunday = 0
    
    let currentWeek = []
    let currentDate = startOfFirstWeek
    
    // Map days by their date for quick lookup
    const daysByDate = new Map()
    allDays.forEach(({ type, day }) => {
      const dateKey = format(parseISO(day.date), 'yyyy-MM-dd')
      daysByDate.set(dateKey, { type, day })
    })
    
    // Generate weeks until we've covered all cycle days
    const lastCycleDate = parseISO(allDays[allDays.length - 1].day.date)
    
    while (currentDate <= addDays(lastCycleDate, 6)) { // Add some buffer
      const dateKey = format(currentDate, 'yyyy-MM-dd')
      const dayData = daysByDate.get(dateKey)
      
      if (dayData) {
        // This date has cycle data
        currentWeek.push(dayData)
      } else {
        // This date is not part of the cycle
        currentWeek.push(null)
      }
      
      currentDate = addDays(currentDate, 1)
      
      // If we've completed a week (Sunday to Saturday)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    
    // Add any remaining days in an incomplete week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      weeks.push(currentWeek)
    }
    
    return weeks
  }
  
  const calendarWeeks = createCalendarWeeks()
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-6">
      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Cycle Calendar View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-3">
              {daysOfWeek.map((dayName) => (
                <div key={dayName} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {dayName}
                </div>
              ))}
            </div>
            
            {/* Calendar Weeks */}
            {calendarWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-3">
                {week.map((dayData, dayIndex) => {
                  if (!dayData) {
                    // Empty calendar cell (not part of cycle)
                    return (
                      <div key={`empty-${weekIndex}-${dayIndex}`} className="min-h-[120px]" />
                    )
                  }
                  
                  const { type, day } = dayData
                  const dayInfo = getDayInfo(day, type)
                  
                  return (
                    <div 
                      key={day.id} 
                      className={`relative min-h-[120px] ${isDeleteMode ? 'ring-2 ring-muted rounded-lg p-1' : ''}`}
                    >
                      {isDeleteMode && type === 'existing' && (
                        <div className="absolute top-1 left-1 z-10">
                          <Checkbox
                            checked={selectedDays.has(day.id)}
                            onCheckedChange={() => onToggleDay(day.id)}
                            className="bg-white"
                          />
                        </div>
                      )}
                      
                      <Card 
                        className={`h-full transition-all hover:shadow-md ${
                          type === 'placeholder' ? 'border-dashed bg-muted/20' : ''
                        } ${dayInfo.clinicVisitInfo.styling}`}
                      >
                        <CardContent className="p-2">
                          {/* Day Header */}
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="rounded-full px-2 py-0 h-5 text-xs">
                              Day {day.cycleDay}
                            </Badge>
                            {dayInfo.clinicVisitInfo.isClinicDay && (
                              <Badge variant="default" className={`${dayInfo.clinicVisitInfo.badgeColor} text-xs px-1 py-0`}>
                                {dayInfo.clinicVisitInfo.displayName}
                              </Badge>
                            )}
                          </div>

                          {/* Date */}
                          <div className="text-xs text-muted-foreground mb-2">
                            {format(parseISO(day.date), "MMM d")}
                          </div>

                          {/* Data Indicators */}
                          <div className="space-y-1">
                            {dayInfo.hasMedications && (
                              <div className="flex items-center gap-1 text-xs">
                                <Pill className="h-3 w-3 text-primary" />
                                <span>{dayInfo.totalMedicationCount}</span>
                              </div>
                            )}

                            {dayInfo.hasClinicVisit && (
                              <div className="flex items-center gap-1 text-xs">
                                <Stethoscope className="h-3 w-3 text-primary" />
                                <span>{day.clinicVisit?.type}</span>
                              </div>
                            )}

                            {dayInfo.hasFollicleSizes && (
                              <div className="flex items-center gap-1 text-xs">
                                <Droplet className="h-3 w-3 text-primary" />
                                <span>Follicles</span>
                              </div>
                            )}

                            {dayInfo.hasBloodwork && (
                              <div className="flex items-center gap-1 text-xs">
                                <Droplet className="h-3 w-3 text-red-600" />
                                <span>Blood</span>
                              </div>
                            )}

                            {dayInfo.hasNotes && (
                              <div className="flex items-center gap-1 text-xs">
                                <FileText className="h-3 w-3 text-primary" />
                                <span>Notes</span>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <div className="mt-2">
                            {type === 'placeholder' ? (
                              <Button variant="ghost" size="sm" className="w-full h-6 text-xs" asChild>
                                <Link href={`/cycles/${cycle.id}/days/new?day=${day.cycleDay}&date=${day.date}`}>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Link>
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" className="w-full h-6 text-xs" asChild>
                                <Link href={`/cycles/${cycle.id}/days/${day.id}`}>
                                  View
                                </Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* General Icons Legend */}
            <div>
              <h4 className="font-medium text-sm mb-2">Day Types</h4>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary" />
                  <span>Medications</span>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  <span>Clinic Visit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-primary" />
                  <span>Follicle Measurements</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-red-600" />
                  <span>Bloodwork</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-dashed rounded" />
                  <span>No data</span>
                </div>
              </div>
            </div>

            {/* Clinic Visit Types Legend */}
            <div>
              <h4 className="font-medium text-sm mb-2">Clinic Visit Types</h4>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white text-xs">BL</Badge>
                  <span>Baseline</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600 text-white text-xs">MON</Badge>
                  <span>Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600 text-white text-xs">ER</Badge>
                  <span>Egg Retrieval</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-pink-600 text-white text-xs">ET</Badge>
                  <span>Embryo Transfer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 text-white text-xs">BET</Badge>
                  <span>Beta HCG Test</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600 text-white text-xs">IUI</Badge>
                  <span>Intrauterine Insemination</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-600 text-white text-xs">VIS</Badge>
                  <span>Other Visit</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}