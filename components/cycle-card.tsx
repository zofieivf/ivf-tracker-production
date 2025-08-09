import Link from "next/link"
import { format, parseISO } from "date-fns"
import { Calendar, User, Target, Beaker, Eye, Edit, Zap, Heart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { IVFCycle } from "@/lib/types"

interface CycleCardProps {
  cycle: IVFCycle
  allCycles?: IVFCycle[]
}

export function CycleCard({ cycle, allCycles = [] }: CycleCardProps) {
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

  const getCardStyling = (goal: string) => {
    switch (goal) {
      case "retrieval":
        return {
          borderColor: "border-l-blue-500",
          headerBg: "bg-blue-50"
        }
      case "transfer":
        return {
          borderColor: "border-l-pink-500", 
          headerBg: "bg-pink-50"
        }
      default:
        return {
          borderColor: "border-l-gray-300",
          headerBg: "bg-gray-50"
        }
    }
  }

  const cardStyle = getCardStyling(cycle.cycleGoal)

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
    const summaryItems = []
    
    // Handle transfer cycles differently
    if (cycle.cycleGoal === "transfer") {
      // Number of embryos
      if (cycle.numberOfEmbryos) {
        const embryoText = cycle.numberOfEmbryos === 1 ? "1 embryo" : `${cycle.numberOfEmbryos} embryos`
        summaryItems.push({ text: embryoText, class: "text-blue-700 bg-blue-100", isStatus: true })
      }
      
      if (cycle.donorEggs) {
        const eggText = cycle.donorEggs === "donor" ? "Donor Eggs" : "Own Eggs"
        summaryItems.push({ text: eggText, class: "", isStatus: false })
      }
      
      // Embryo Information - show individual embryo summaries in sequence
      if (cycle.embryos && cycle.embryos.length > 0) {
        cycle.embryos.forEach((embryo, index) => {
          const embryoDetails = []
          
          // Stage
          const stage = embryo.embryoDetails.replace("-", " ").replace("day", "Day ")
          embryoDetails.push(stage)
          
          // Grade
          if (embryo.embryoGrade) {
            embryoDetails.push(`Grade ${embryo.embryoGrade}`)
          }
          
          // Sex
          if (embryo.embryoSex) {
            const sexText = embryo.embryoSex === "M" ? "Male" : "Female"
            embryoDetails.push(sexText)
          }
          
          // PGT-A
          if (embryo.pgtATested && embryo.pgtATested !== "not-tested") {
            embryoDetails.push(`PGT-A ${embryo.pgtATested}`)
          }
          
          const embryoSummary = embryoDetails.join(", ")
          const embryoLabel = cycle.embryos && cycle.embryos.length > 1 ? `Embryo ${index + 1}: ` : ""
          summaryItems.push({ 
            text: `${embryoLabel}${embryoSummary}`, 
            class: "", 
            isStatus: false 
          })
        })
      }
      
      // Show source retrieval cycles with names
      if (cycle.embryos && cycle.embryos.length > 0) {
        const retrievalCycleIds = [...new Set(cycle.embryos.map(e => e.retrievalCycleId).filter(Boolean))]
        if (retrievalCycleIds.length > 0) {
          const retrievalCycleNames = retrievalCycleIds.map(id => {
            const retrievalCycle = allCycles.find(c => c.id === id)
            return retrievalCycle ? retrievalCycle.name : `Cycle ${id?.slice(-4)}`
          })
          
          if (retrievalCycleIds.length === 1) {
            summaryItems.push({ text: `From ${retrievalCycleNames[0]}`, class: "text-muted-foreground", isStatus: false })
          } else {
            summaryItems.push({ text: `From ${retrievalCycleNames.join(", ")}`, class: "text-muted-foreground", isStatus: false })
          }
        }
      }
      
      // Only show outcome-dependent items if outcome exists
      if (outcome) {
        // Transfer Status
        if (outcome.transferStatus) {
          const statusText = outcome.transferStatus === "successful" ? "✓ Successful Transfer" : "✗ Transfer Failed"
          const statusClass = outcome.transferStatus === "successful" ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
          summaryItems.push({ text: statusText, class: statusClass, isStatus: true })
        }
        
        // Beta HCG values (moved before Live Birth)
        if (outcome.betaHcg1 !== undefined) {
          const dayText = outcome.betaHcg1Day ? ` (Day ${outcome.betaHcg1Day})` : ""
          summaryItems.push({ text: `Beta HCG 1: ${outcome.betaHcg1}${dayText}`, class: "", isStatus: false })
        }
        
        if (outcome.betaHcg2 !== undefined) {
          const dayText = outcome.betaHcg2Day ? ` (Day ${outcome.betaHcg2Day})` : ""
          summaryItems.push({ text: `Beta HCG 2: ${outcome.betaHcg2}${dayText}`, class: "", isStatus: false })
        }
        
        // Live Birth (moved after Beta HCG)
        if (outcome.liveBirth) {
          const birthText = outcome.liveBirth === "yes" ? "🍼 Live Birth" : "No Live Birth"
          const birthClass = outcome.liveBirth === "yes" ? "text-green-700 bg-green-100" : "text-gray-700 bg-gray-100"
          summaryItems.push({ text: birthText, class: birthClass, isStatus: true })
        }
      }
    } else if (outcome) {
      // Handle retrieval cycles (simplified logic) - only if outcome exists
      if (outcome.eggsRetrieved !== undefined) {
        summaryItems.push({ text: `${outcome.eggsRetrieved} eggs retrieved`, class: "", isStatus: false })
      }
      
      if (outcome.fertilized !== undefined) {
        summaryItems.push({ text: `${outcome.fertilized} fertilized`, class: "", isStatus: false })
      }
      
      // If there are blastocysts, show those instead of day 3 embryos
      if (outcome.blastocysts !== undefined) {
        summaryItems.push({ text: `${outcome.blastocysts} blastocysts`, class: "", isStatus: false })
      } else if (outcome.day3Embryos !== undefined) {
        // Only show day 3 embryos if no blastocysts
        summaryItems.push({ text: `${outcome.day3Embryos} day 3 embryos`, class: "", isStatus: false })
      }
      
      if (outcome.euploidBlastocysts !== undefined) {
        summaryItems.push({ text: `${outcome.euploidBlastocysts} euploid`, class: "", isStatus: false })
      }
      
      // Removed frozen embryos count as requested
      
      if (outcome.embryosAvailableForTransfer !== undefined) {
        summaryItems.push({ text: `${outcome.embryosAvailableForTransfer} available for transfer`, class: "", isStatus: false })
      }
    }

    return summaryItems.length > 0 ? summaryItems : null
  }

  return (
    <Card className={`hover:shadow-md transition-shadow w-full border-l-4 ${cardStyle.borderColor}`}>
      <CardHeader className={cardStyle.headerBg}>
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
      <CardContent className="pt-3">
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
                  <p className="text-sm font-medium text-foreground mb-1">
                    {cycle.cycleGoal === "transfer" ? "Transfer Summary" : "Outcome Summary"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {formatOutcomeSummary()?.map((item, index) => {
                      if (typeof item === "string") {
                        // Backward compatibility for retrieval cycles
                        return (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        )
                      } else {
                        // New structure for transfer cycles with custom styling
                        return (
                          <Badge 
                            key={index} 
                            variant={item.isStatus ? "default" : "secondary"} 
                            className={`text-xs ${item.class || ""}`}
                          >
                            {item.text}
                          </Badge>
                        )
                      }
                    })}
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
