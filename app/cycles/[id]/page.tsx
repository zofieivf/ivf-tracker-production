"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, addDays, parseISO } from "date-fns"
import { ArrowLeft, Calendar, Clock, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIVFStore } from "@/lib/store"
import type { CycleDay } from "@/lib/types"
import { DayCard } from "@/components/day-card"
import { CycleOutcomeCard } from "@/components/cycle-outcome-card"
import { CycleChartsView } from "@/components/cycle-charts-view"

export default function CyclePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { cycles, getCycleById } = useIVFStore()
  const [cycle, setCycle] = useState(getCycleById(params.id))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCycle(getCycleById(params.id))
  }, [params.id, cycles, getCycleById])

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

  // Generate all days from start date to today or end date
  const startDate = parseISO(cycle.startDate)
  const endDate = cycle.endDate ? parseISO(cycle.endDate) : new Date()
  const dayCount = Math.max(
    cycle.days.length,
    Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  )

  const allDays: CycleDay[] = Array.from({ length: dayCount }, (_, i) => {
    const date = addDays(startDate, i)
    const existingDay = cycle.days.find((day) => day.cycleDay === i + 1)

    if (existingDay) {
      return existingDay
    }

    return {
      id: `temp-${i}`,
      date: date.toISOString(),
      cycleDay: i + 1,
      medications: [],
    }
  })

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0">
          <Link href="/" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to all cycles
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{cycle.name}</h1>
              <Badge
                variant={
                  cycle.status === "active" ? "default" : cycle.status === "completed" ? "success" : "destructive"
                }
              >
                {cycle.status}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(parseISO(cycle.startDate), "MMM d, yyyy")}
                  {cycle.endDate && (
                    <>
                      {" - "}
                      {format(parseISO(cycle.endDate), "MMM d, yyyy")}
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{cycle.cycleType}</span>
              </div>
            </div>
          </div>

          <Button asChild variant="outline" size="sm">
            <Link href={`/cycles/${cycle.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Cycle
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="days">
        <TabsList className="mb-4">
          <TabsTrigger value="days">Daily Tracking</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
        </TabsList>

        <TabsContent value="days" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allDays.map((day) => (
              <DayCard key={day.id} day={day} cycleId={cycle.id} isPlaceholder={day.id.startsWith("temp")} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="charts">
          <CycleChartsView cycle={cycle} />
        </TabsContent>

        <TabsContent value="outcomes">
          <CycleOutcomeCard cycle={cycle} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
