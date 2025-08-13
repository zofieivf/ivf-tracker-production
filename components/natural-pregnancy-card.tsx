import Link from "next/link"
import { format, parseISO, differenceInDays, differenceInWeeks } from "date-fns"
import { Calendar, User, Baby, Edit } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { NaturalPregnancy } from "@/lib/types"

interface NaturalPregnancyCardProps {
  pregnancy: NaturalPregnancy
}

export function NaturalPregnancyCard({ pregnancy }: NaturalPregnancyCardProps) {
  const conceptionDate = parseISO(pregnancy.dateOfConception)
  const dueOrBirthDate = parseISO(pregnancy.dueDateOrBirthDate)
  const today = new Date()

  // Calculate pregnancy progress
  const daysSinceConception = differenceInDays(today, conceptionDate)
  const weeksSinceConception = Math.floor(daysSinceConception / 7)
  const remainingDays = daysSinceConception % 7

  // Calculate time until due date or since birth
  const daysUntilDue = differenceInDays(dueOrBirthDate, today)
  const isOverdue = daysUntilDue < 0 && !pregnancy.isDateOfBirth
  const isBorn = pregnancy.isDateOfBirth

  // Status calculations
  const getStatusBadge = () => {
    if (pregnancy.pregnancyOutcome) {
      switch (pregnancy.pregnancyOutcome) {
        case "ongoing":
          if (isOverdue) {
            return { text: `${Math.abs(daysUntilDue)} days overdue`, class: "bg-orange-100 text-orange-800" }
          }
          if (daysUntilDue <= 14) {
            return { text: `Due in ${daysUntilDue} days`, class: "bg-blue-100 text-blue-800" }
          }
          return { text: "Ongoing Pregnancy", class: "bg-purple-100 text-purple-800" }
        
        case "live-birth":
          return { text: "Live Birth", class: "bg-green-100 text-green-800" }
        
        case "miscarriage":
          return { text: "Miscarriage", class: "bg-red-100 text-red-800" }
        
        case "medical-termination":
          return { text: "Medical Termination", class: "bg-yellow-100 text-yellow-800" }
        
        default:
          break
      }
    }
    
    // Fallback to old logic for backwards compatibility
    if (isBorn) {
      return { text: "Baby Born", class: "bg-green-100 text-green-800" }
    }
    
    if (isOverdue) {
      return { text: `${Math.abs(daysUntilDue)} days overdue`, class: "bg-orange-100 text-orange-800" }
    }
    
    if (daysUntilDue <= 14) {
      return { text: `Due in ${daysUntilDue} days`, class: "bg-blue-100 text-blue-800" }
    }
    
    return { text: "Expecting", class: "bg-purple-100 text-purple-800" }
  }

  const statusBadge = getStatusBadge()

  return (
    <Card className="hover:shadow-md transition-shadow w-full border-l-4 border-l-emerald-500">
      <CardHeader className="bg-emerald-50">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Baby className="h-6 w-6 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <CardTitle className="text-xl">Natural Pregnancy</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Conceived {format(conceptionDate, "MMM d, yyyy")}
                </div>
                {pregnancy.ageAtConception && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Age {pregnancy.ageAtConception}
                  </div>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusBadge.class}>{statusBadge.text}</Badge>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/pregnancies/${pregnancy.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {/* Pregnancy Progress - only for ongoing pregnancies */}
            {pregnancy.pregnancyOutcome === "ongoing" && (
              <div>
                <p className="font-medium">Pregnancy Progress</p>
                <p>{weeksSinceConception} weeks, {remainingDays} days</p>
              </div>
            )}

            {/* Outcome Date */}
            {pregnancy.outcomeDate ? (
              <div>
                <p className="font-medium">
                  {pregnancy.pregnancyOutcome === "live-birth" ? "Birth Date" :
                   pregnancy.pregnancyOutcome === "miscarriage" ? "Miscarriage Date" :
                   pregnancy.pregnancyOutcome === "medical-termination" ? "Termination Date" :
                   "Outcome Date"}
                </p>
                <p>{format(parseISO(pregnancy.outcomeDate), "MMM d, yyyy")}</p>
              </div>
            ) : pregnancy.dueDateOrBirthDate && (
              <div>
                <p className="font-medium">{pregnancy.isDateOfBirth ? "Birth Date" : "Due Date"}</p>
                <p>{format(dueOrBirthDate, "MMM d, yyyy")}</p>
              </div>
            )}

            {/* Reason for miscarriage/termination */}
            {pregnancy.reason && (pregnancy.pregnancyOutcome === "miscarriage" || pregnancy.pregnancyOutcome === "medical-termination") && (
              <div>
                <p className="font-medium">Reason</p>
                <p className="text-sm">{pregnancy.reason}</p>
              </div>
            )}

            {/* Days until due / Days since outcome */}
            {pregnancy.pregnancyOutcome === "ongoing" && (
              <div>
                <p className="font-medium">{isOverdue ? "Days Overdue" : "Days Until Due"}</p>
                <p>{Math.abs(daysUntilDue)} days</p>
              </div>
            )}

          </div>

          {/* Notes */}
          {pregnancy.notes && (
            <div className="border-t pt-3">
              <p className="text-sm font-medium text-foreground mb-1">Notes</p>
              <p className="text-sm text-muted-foreground">{pregnancy.notes}</p>
            </div>
          )}

          {/* Pregnancy Timeline Visual - only for ongoing pregnancies */}
          {pregnancy.pregnancyOutcome === "ongoing" && weeksSinceConception <= 40 && (
            <div className="border-t pt-3">
              <p className="text-sm font-medium text-foreground mb-2">Pregnancy Timeline</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((weeksSinceConception / 40) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Week 0</span>
                <span>Week {weeksSinceConception}</span>
                <span>Week 40</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
