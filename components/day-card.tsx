"use client"

import Link from "next/link"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pill, Droplet, Stethoscope, FileText, Plus } from "lucide-react"
import { useIVFStore } from "@/lib/store"
import type { CycleDay } from "@/lib/types"

interface DayCardProps {
  day: CycleDay
  cycleId: string
  isPlaceholder?: boolean
}

export function DayCard({ day, cycleId, isPlaceholder = false }: DayCardProps) {
  const { getMedicationScheduleByCycleId, getDailyMedicationStatus } = useIVFStore()
  
  // Check legacy medications
  const hasLegacyMedications = day.medications && day.medications.length > 0
  
  // Check new medication system
  const schedule = getMedicationScheduleByCycleId(cycleId)
  const dailyStatus = getDailyMedicationStatus(cycleId, day.cycleDay)
  const scheduledMedications = schedule?.medications.filter(
    med => med.startDay <= day.cycleDay && med.endDay >= day.cycleDay
  ) || []
  const daySpecificMedications = dailyStatus?.daySpecificMedications || []
  
  const totalMedicationCount = (hasLegacyMedications ? day.medications.length : 0) + 
                              scheduledMedications.length + 
                              daySpecificMedications.length
  
  const hasMedications = hasLegacyMedications || totalMedicationCount > 0
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
            <span className="text-sm text-muted-foreground">{format(parseISO(day.date), "EEE, MMM d")}</span>
          </div>
        </div>

        {hasData ? (
          <div className="space-y-2">
            {hasMedications && (
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  {totalMedicationCount} medication{totalMedicationCount !== 1 ? "s" : ""}
                </span>
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
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                    {day.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-2 text-center text-sm text-muted-foreground">
            {isPlaceholder ? "No data for this day" : "No data added yet"}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t p-2">
        {isPlaceholder ? (
          <Button variant="ghost" className="w-full justify-center" asChild>
            <Link href={`/cycles/${cycleId}/days/new?day=${day.cycleDay}&date=${day.date}`}>
              <Plus className="h-4 w-4 mr-2" />
              Add data
            </Link>
          </Button>
        ) : (
          <Button variant="ghost" className="w-full justify-center" asChild>
            <Link href={`/cycles/${cycleId}/days/${day.id}`}>View details</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
