"use client"

import Link from "next/link"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pill, Droplet, Stethoscope, FileText, Plus } from "lucide-react"
import { useIVFStore } from "@/lib/store"
import type { CycleDay } from "@/lib/types"

interface UnifiedDayCardProps {
  day: CycleDay
  cycleId: string
  isPlaceholder?: boolean
}

export function UnifiedDayCard({ day, cycleId, isPlaceholder = false }: UnifiedDayCardProps) {
  const { getUnifiedMedicationsForDay } = useIVFStore()
  
  // Use unified medication system - single source of truth
  const medications = getUnifiedMedicationsForDay(cycleId, day.cycleDay)
  const hasMedications = medications.totalCount > 0
  
  const hasClinicVisit = !!day.clinicVisit
  const hasFollicleSizes = !!day.follicleSizes
  const hasBloodwork = !!day.bloodwork && day.bloodwork.length > 0
  const hasNotes = !!day.notes

  const hasData = hasMedications || hasClinicVisit || hasFollicleSizes || hasBloodwork || hasNotes

  // Check if this is a key day (retrieval or transfer)
  const isKeyDay = day.clinicVisit?.type === "retrieval" || day.clinicVisit?.type === "transfer"
  const keyDayType = day.clinicVisit?.type === "retrieval" ? "Egg Retrieval" : day.clinicVisit?.type === "transfer" ? "Transfer" : null

  return (
    <Card className={`${isPlaceholder ? "border-dashed" : ""} ${isKeyDay ? "ring-2 ring-blue-500 bg-blue-50/50" : ""}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full px-2 py-0 h-6">
              Day {day.cycleDay}
            </Badge>
            {keyDayType && (
              <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                {keyDayType}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {format(parseISO(day.date), "MMM d")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {format(parseISO(day.date), "EEEE")}
          </span>
        </div>

        {hasData ? (
          <div className="space-y-2">
            {hasMedications && (
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  {medications.totalCount} medication{medications.totalCount !== 1 ? "s" : ""}
                </span>
                {/* Show breakdown of scheduled vs day-specific */}
                {medications.scheduled.length > 0 && medications.daySpecific.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({medications.scheduled.length} scheduled, {medications.daySpecific.length} day-specific)
                  </span>
                )}
              </div>
            )}

            {hasClinicVisit && (
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <span className="text-sm">{day.clinicVisit?.type} visit</span>
              </div>
            )}

            {hasFollicleSizes && (
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  {(day.follicleSizes?.left.length || 0) + (day.follicleSizes?.right.length || 0)} follicles
                </span>
              </div>
            )}

            {hasBloodwork && (
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  {day.bloodwork?.length || 0} bloodwork result{(day.bloodwork?.length || 0) !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {hasNotes && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm">Notes</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              {isPlaceholder ? `Day ${day.cycleDay}` : "No data recorded"}
            </p>
            {isPlaceholder && (
              <p className="text-xs text-muted-foreground">
                {format(parseISO(day.date), "EEEE, MMM d")}
              </p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 pt-0 flex gap-2">
        <Button asChild size="sm" variant={hasData ? "outline" : "default"} className="flex-1">
          <Link href={`/cycles/${cycleId}/days/${day.id}`}>
            {hasData ? "View Details" : "Add Data"}
          </Link>
        </Button>
        
        {hasData && (
          <Button asChild size="sm" variant="ghost">
            <Link href={`/cycles/${cycleId}/days/${day.id}/edit`}>
              Edit
            </Link>
          </Button>
        )}
        
        {isPlaceholder && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/cycles/${cycleId}/days/new?day=${day.cycleDay}&date=${day.date}`}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}