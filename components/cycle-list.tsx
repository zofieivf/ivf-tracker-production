"use client"

import Link from "next/link"
import { format, parseISO } from "date-fns"
import { Calendar, User, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { IVFCycle } from "@/lib/types"

interface CycleListProps {
  cycles: IVFCycle[]
}

export function CycleList({ cycles }: CycleListProps) {
  if (!cycles || cycles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No cycles yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create your first IVF cycle to start tracking your journey
          </p>
          <Button asChild>
            <Link href="/cycles/new">Create First Cycle</Link>
          </Button>
        </CardContent>
      </Card>
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

  const getCycleGoalDisplay = (goal?: string) => {
    switch (goal) {
      case "retrieval":
        return "Egg Retrieval"
      case "transfer":
        return "Embryo Transfer"
      case "iui":
        return "IUI"
      default:
        return "Egg Retrieval" // Default fallback
    }
  }

  const getCycleTypeDisplay = (type: string, goal?: string) => {
    if (goal === "iui") {
      switch (type) {
        case "antagonist":
          return "Letrozole/Clomid + Trigger"
        case "long-lupron":
          return "Injectable Gonadotropins"
        case "microdose-flare":
          return "Natural Cycle"
        case "mini-ivf":
          return "Clomid Only"
        case "other":
          return "Other"
        default:
          return type
      }
    }
    
    switch (type) {
      case "standard":
        return "Standard"
      case "mini":
        return "Mini"
      case "natural":
        return "Natural"
      case "antagonist":
        return "Antagonist"
      case "long":
        return "Long"
      case "other":
        return "Other"
      default:
        return type
    }
  }

  return (
    <div className="grid gap-4">
      {cycles.map((cycle) => (
        <Card key={cycle.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{cycle.name}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(parseISO(cycle.startDate), "MMM d, yyyy")}
                  </div>
                  {cycle.ageAtStart && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {cycle.ageAtStart}y
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {getCycleGoalDisplay(cycle.cycleGoal)}
                  </div>
                </CardDescription>
              </div>
              <Badge className={getStatusColor(cycle.status)}>{cycle.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{getCycleTypeDisplay(cycle.cycleType, cycle.cycleGoal)} Protocol</span>
                <span>
                  {cycle.days && cycle.days.length > 0 ? `${cycle.days.length} days tracked` : "No days tracked"}
                </span>
              </div>
              <Button asChild>
                <Link href={`/cycles/${cycle.id}`}>View Details</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
