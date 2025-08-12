"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ArrowLeft, Calendar, Edit, Plus, User, Target, Trash2, Pill } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useIVFStore } from "@/lib/store"
import { DayCard } from "@/components/day-card"
import { CycleOutcomeCard } from "@/components/cycle-outcome-card"
import { CycleChartsView } from "@/components/cycle-charts-view"
import { CycleCostsView } from "@/components/cycle-costs-view"
import { CycleMedicationOverview } from "@/components/cycle-medication-overview"

export default function CyclePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { getCycleById, cycles, deleteDay, dailyMedicationStatuses, ensureScheduledDaysExist } = useIVFStore()
  const [cycle, setCycle] = useState(getCycleById(params.id))
  const [mounted, setMounted] = useState(false)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)
    // Ensure all days covered by medication schedule exist
    ensureScheduledDaysExist(params.id)
    setCycle(getCycleById(params.id))
  }, [params.id, getCycleById, cycles, dailyMedicationStatuses, ensureScheduledDaysExist]) // Add dailyMedicationStatuses to dependency array

  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode)
    setSelectedDays(new Set()) // Clear selection when toggling
  }

  const handleDaySelection = (dayId: string, isSelected: boolean) => {
    const newSelection = new Set(selectedDays)
    if (isSelected) {
      newSelection.add(dayId)
    } else {
      newSelection.delete(dayId)
    }
    setSelectedDays(newSelection)
  }

  const handleBatchDelete = () => {
    if (!cycle) return
    
    selectedDays.forEach(dayId => {
      // Skip placeholder days - they don't exist in the actual data
      if (!dayId.startsWith('placeholder-')) {
        deleteDay(cycle.id, dayId)
      }
    })
    
    setIsDeleteMode(false)
    setSelectedDays(new Set())
  }

  if (!mounted) return null

  if (!cycle) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-bold mb-2">Cycle not found</h2>
          <p className="text-muted-foreground mb-6">The cycle you're looking for doesn't exist</p>
          <Button asChild>
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCycleGoalDisplay = (goal: string) => {
    switch (goal) {
      case "retrieval":
        return "Egg Retrieval"
      case "transfer":
        return "Embryo Transfer"
      default:
        return goal
    }
  }

  const getCycleTypeDisplay = (type: string) => {
    switch (type) {
      case "antagonist":
        return "Antagonist Protocol"
      case "long-lupron":
        return "Long Lupron Protocol"
      case "microdose-flare":
        return "Microdose Flare Protocol"
      case "mini-ivf":
        return "Mini-IVF Protocol"
      case "fresh":
        return "Fresh Transfer"
      case "frozen-medicated":
        return "Frozen Transfer (Medicated)"
      case "frozen-modified-natural":
        return "Frozen Transfer (Modified Natural)"
      case "frozen-natural":
        return "Frozen Transfer (Natural)"
      case "other":
        return "Other Protocol"
      default:
        return type
    }
  }


  return (
    <div className="container max-w-6xl py-10">
      <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0">
        <Link href="/" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{cycle.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(parseISO(cycle.startDate), "PPP")}
                {cycle.endDate && ` - ${format(parseISO(cycle.endDate), "PPP")}`}
              </div>
              {cycle.ageAtStart && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Age: {cycle.ageAtStart} years
                </div>
              )}
              {cycle.cycleGoal && (
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {getCycleGoalDisplay(cycle.cycleGoal)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(cycle.status)}>{cycle.status}</Badge>
            <Button asChild variant="outline">
              <Link href={`/cycles/${cycle.id}/medication-schedule`}>
                <Pill className="h-4 w-4 mr-2" />
                Medication Schedule
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/cycles/${cycle.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Cycle
              </Link>
            </Button>
          </div>
        </div>

        {/* Cycle Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cycle Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{getCycleTypeDisplay(cycle.cycleType)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cycle Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{getCycleGoalDisplay(cycle.cycleGoal || "retrieval")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Days Tracked</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{cycle.days?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="days" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="days">Daily Tracking</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="outcome">Cycle Outcome</TabsTrigger>
            <TabsTrigger value="charts">Charts & Analysis</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
          </TabsList>

          <TabsContent value="days" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Daily Tracking</h2>
              <div className="flex gap-2">
                {isDeleteMode ? (
                  <>
                    <Button variant="outline" onClick={handleToggleDeleteMode}>
                      Cancel
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          disabled={selectedDays.size === 0}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected ({selectedDays.size})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Selected Days</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {selectedDays.size} selected day{selectedDays.size !== 1 ? 's' : ''}? This action cannot be undone and will permanently remove all data for these days including medications, clinic visits, measurements, and notes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-700">
                            Delete Days
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleToggleDeleteMode}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Days
                    </Button>
                    <Button asChild>
                      <Link href={`/cycles/${cycle.id}/days/new?day=${cycle.days?.length ? Math.max(...cycle.days.map(d => d.cycleDay)) + 1 : 1}&date=${(() => {
                        const nextDay = cycle.days?.length ? Math.max(...cycle.days.map(d => d.cycleDay)) + 1 : 1;
                        const startDate = new Date(cycle.startDate);
                        const dayDate = new Date(startDate);
                        dayDate.setDate(startDate.getDate() + (nextDay - 1));
                        return dayDate.toISOString();
                      })()}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Day
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {cycle.days && cycle.days.length > 0 ? (
              <div className="grid gap-4">
                {(() => {
                  // Get existing days sorted by cycle day number
                  const existingDays = cycle.days.sort((a, b) => a.cycleDay - b.cycleDay)
                  const maxDay = existingDays.length > 0 ? Math.max(...existingDays.map(d => d.cycleDay)) : 0
                  const allDays = []

                  // Create array of all days from 1 to maxDay
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
                        medications: [],
                        notes: ''
                      }
                      allDays.push({ type: 'placeholder', day: placeholderDay })
                    }
                  }

                  return allDays.map(({ type, day }) => (
                    <div key={day.id} className={`relative ${isDeleteMode ? 'ring-2 ring-muted rounded-lg p-1' : ''}`}>
                      {isDeleteMode && (
                        <div className="absolute top-3 left-3 z-10">
                          <Checkbox
                            checked={selectedDays.has(day.id)}
                            onCheckedChange={(checked) => handleDaySelection(day.id, !!checked)}
                            className="bg-white border-2 shadow-sm"
                          />
                        </div>
                      )}
                      <div className={isDeleteMode ? 'ml-8' : ''}>
                        <DayCard 
                          day={day} 
                          cycleId={cycle.id} 
                          isPlaceholder={type === 'placeholder'}
                        />
                      </div>
                    </div>
                  ))
                })()}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No days tracked yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Start tracking your daily medications, appointments, and measurements
                  </p>
                  <Button asChild>
                    <Link href={`/cycles/${cycle.id}/days/new?day=1&date=${cycle.startDate}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Day
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="charts">
            <CycleChartsView cycle={cycle} />
          </TabsContent>

          <TabsContent value="outcome">
            <CycleOutcomeCard cycle={cycle} />
          </TabsContent>

          <TabsContent value="costs">
            <CycleCostsView cycle={cycle} />
          </TabsContent>

          <TabsContent value="medications">
            <CycleMedicationOverview cycle={cycle} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
