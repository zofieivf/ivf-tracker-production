"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { format, differenceInDays } from "date-fns"
import { ArrowLeft, Calendar, Edit, Plus, BarChart3, User, Clock } from "lucide-react"

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
  const [activeTab, setActiveTab] = useState("overview")

  const cycleId = params.id as string
  const cycle = cycles.find((c) => c.id === cycleId)

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
  const cycleDuration = cycle.endDate
    ? differenceInDays(new Date(cycle.endDate), new Date(cycle.startDate))
    : differenceInDays(new Date(), new Date(cycle.startDate))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{cycle.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(cycle.startDate), "MMM d, yyyy")}</span>
                {cycle.endDate && <span> - {format(new Date(cycle.endDate), "MMM d, yyyy")}</span>}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="capitalize">{cycle.cycleType}</span>
              </div>
              {cycle.ageAtStart && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Age: {cycle.ageAtStart} years</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={cycle.status === "active" ? "default" : cycle.status === "completed" ? "success" : "destructive"}
            >
              {cycle.status}
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/cycles/${cycle.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Cycle
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="days">Daily Tracking</TabsTrigger>
          <TabsTrigger value="charts">Charts & Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cycle Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cycleDuration} days</div>
                <p className="text-xs text-muted-foreground">{cycle.status === "active" ? "So far" : "Total"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Days Tracked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cycle.days.length}</div>
                <p className="text-xs text-muted-foreground">Data entries</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{cycle.status}</div>
                <p className="text-xs text-muted-foreground">Current state</p>
              </CardContent>
            </Card>
          </div>

          {cycle.outcome && <CycleOutcomeCard outcome={cycle.outcome} />}

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest tracked days</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedDays.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No days tracked yet</p>
                  <Button asChild>
                    <Link href={`/cycles/${cycle.id}/days/new`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Day
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedDays
                    .slice(-3)
                    .reverse()
                    .map((day) => (
                      <DayCard key={day.id} day={day} cycleId={cycle.id} />
                    ))}
                  {sortedDays.length > 3 && (
                    <div className="text-center pt-4">
                      <Button variant="outline" onClick={() => setActiveTab("days")}>
                        View All Days ({sortedDays.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="days" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Daily Tracking</h2>
            <Button asChild>
              <Link href={`/cycles/${cycle.id}/days/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Day
              </Link>
            </Button>
          </div>

          {sortedDays.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">No days tracked yet</p>
                <Button asChild>
                  <Link href={`/cycles/${cycle.id}/days/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Day
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedDays.map((day) => (
                <DayCard key={day.id} day={day} cycleId={cycle.id} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Charts & Analysis</h2>
          </div>
          <CycleChartsView cycle={cycle} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
