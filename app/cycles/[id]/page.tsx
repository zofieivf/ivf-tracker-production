"use client"

import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Calendar, Edit, Plus, User, BarChart3 } from 'lucide-react'
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIVFStore } from "@/lib/store"
import { DayCard } from "@/components/day-card"
import { CycleOutcomeCard } from "@/components/cycle-outcome-card"
import { CycleChartsView } from "@/components/cycle-charts-view"

export default function CyclePage() {
  const params = useParams()
  const router = useRouter()
  const { cycles } = useIVFStore()
  
  const cycle = cycles.find(c => c.id === params.id)

  if (!cycle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Cycle not found</h1>
          <Button asChild>
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  const sortedDays = [...cycle.days].sort((a, b) => a.cycleDay - b.cycleDay)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{cycle.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Started {format(new Date(cycle.startDate), "PPP")}</span>
              </div>
              {cycle.ageAtStart && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Age: {cycle.ageAtStart} years</span>
                </div>
              )}
              <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'}>
                {cycle.status}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/cycles/${cycle.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Cycle
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/cycles/${cycle.id}/days/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Day
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="days" className="space-y-6">
        <TabsList>
          <TabsTrigger value="days">Daily Tracking</TabsTrigger>
          <TabsTrigger value="charts">
            <BarChart3 className="mr-2 h-4 w-4" />
            Charts & Analysis
          </TabsTrigger>
          <TabsTrigger value="outcome">Outcome</TabsTrigger>
        </TabsList>

        <TabsContent value="days" className="space-y-6">
          {sortedDays.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No days tracked yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start tracking your IVF cycle by adding your first day of medications, appointments, and results.
                </p>
                <Button asChild>
                  <Link href={`/cycles/${cycle.id}/days/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Day
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sortedDays.map((day) => (
                <DayCard key={day.id} day={day} cycleId={cycle.id} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="charts">
          <CycleChartsView cycle={cycle} />
        </TabsContent>

        <TabsContent value="outcome">
          <CycleOutcomeCard cycle={cycle} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
