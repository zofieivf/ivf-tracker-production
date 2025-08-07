import Link from "next/link"
import { format, parseISO } from "date-fns"
import { Calendar, User, Target, Beaker, Eye, Edit } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { IVFCycle } from "@/lib/types"

interface CycleCardProps {
  cycle: IVFCycle
}

export function CycleCard({ cycle }: CycleCardProps) {
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
      default:
        return "Egg Retrieval" // Default fallback
    }
  }

  const getCycleTypeDisplay = (type: string) => {
    switch (type) {
      case "antagonist":
        return "Antagonist"
      case "long-lupron":
        return "Long Lupron"
      case "microdose-flare":
        return "Microdose Flare"
      case "mini-ivf":
        return "Mini-IVF"
      case "fresh":
        return "Fresh Transfer"
      case "frozen-medicated":
        return "Frozen (Medicated)"
      case "frozen-modified-natural":
        return "Frozen (Modified Natural)"
      case "frozen-natural":
        return "Frozen (Natural)"
      case "other":
        return "Other"
      default:
        return type
    }
  }

  const formatOutcomeSummary = () => {
    const outcome = cycle.outcome
    if (!outcome) return null

    const summaryItems = []
    
    if (outcome.eggsRetrieved !== undefined) {
      summaryItems.push(`${outcome.eggsRetrieved} eggs retrieved`)
    }
    
    if (outcome.fertilized !== undefined) {
      summaryItems.push(`${outcome.fertilized} fertilized`)
    }
    
    if (outcome.day3Embryos !== undefined) {
      summaryItems.push(`${outcome.day3Embryos} day 3 embryos`)
    }
    
    if (outcome.blastocysts !== undefined) {
      summaryItems.push(`${outcome.blastocysts} blastocysts`)
    }
    
    if (outcome.euploidBlastocysts !== undefined) {
      summaryItems.push(`${outcome.euploidBlastocysts} euploid`)
    }
    
    if (outcome.frozen !== undefined) {
      summaryItems.push(`${outcome.frozen} frozen`)
    }
    
    if (outcome.embryosAvailableForTransfer !== undefined) {
      summaryItems.push(`${outcome.embryosAvailableForTransfer} available for transfer`)
    }

    return summaryItems.length > 0 ? summaryItems : null
  }

  return (
    <Card className="hover:shadow-md transition-shadow w-full">
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
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(cycle.status)}>{cycle.status}</Badge>
            <Badge variant="outline" className="text-xs">
              {getCycleGoalDisplay(cycle.cycleGoal)}
            </Badge>
            <div className="flex gap-1">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/cycles/${cycle.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/cycles/${cycle.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{getCycleTypeDisplay(cycle.cycleType)} Protocol</span>
            <span>
              {cycle.days && cycle.days.length > 0 ? `${cycle.days.length} days tracked` : "No days tracked"}
            </span>
          </div>
          
          {formatOutcomeSummary() && (
            <div className="border-t pt-3">
              <div className="flex items-start gap-2">
                <Beaker className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Outcome Summary</p>
                  <div className="flex flex-wrap gap-1">
                    {formatOutcomeSummary()?.map((item, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}