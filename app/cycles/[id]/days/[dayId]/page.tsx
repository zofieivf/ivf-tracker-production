"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ArrowLeft, Edit, Pill, Droplet, Stethoscope, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useIVFStore } from "@/lib/store"
import { DailyMedicationChecklist } from "@/components/daily-medication-checklist"
import type { CycleDay } from "@/lib/types"

export default function DayDetailPage({ params }: { params: Promise<{ id: string; dayId: string }> }) {
  const { id, dayId } = use(params)
  const router = useRouter()
  const { getCycleById, getMedicationScheduleByCycleId, ensureScheduledDaysExist } = useIVFStore()
  const [cycle, setCycle] = useState(getCycleById(id))
  const [day, setDay] = useState<CycleDay | undefined>(cycle?.days.find((d) => d.id === dayId))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Ensure all days covered by medication schedule exist
    ensureScheduledDaysExist(id)
    const currentCycle = getCycleById(id)
    setCycle(currentCycle)
    setDay(currentCycle?.days.find((d) => d.id === dayId))
  }, [id, dayId, getCycleById, ensureScheduledDaysExist])

  // Navigation helpers
  const getNavigationInfo = () => {
    if (!cycle || !day) return { prevDay: null, nextDay: null }
    
    const sortedDays = cycle.days.sort((a, b) => a.cycleDay - b.cycleDay)
    const currentIndex = sortedDays.findIndex(d => d.id === day.id)
    
    return {
      prevDay: currentIndex > 0 ? sortedDays[currentIndex - 1] : null,
      nextDay: currentIndex < sortedDays.length - 1 ? sortedDays[currentIndex + 1] : null
    }
  }

  const { prevDay, nextDay } = getNavigationInfo()

  if (!mounted) return null

  if (!cycle || !day) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-bold mb-2">Day not found</h2>
          <p className="text-muted-foreground mb-6">The day you're looking for doesn't exist</p>
          <Button asChild>
            <Link href={`/cycles/${id}`}>Go back to cycle</Link>
          </Button>
        </div>
      </div>
    )
  }


  return (
    <div className="container max-w-4xl py-10">
      <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0">
        <Link href={`/cycles/${id}`} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to cycle
        </Link>
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Day {day.cycleDay}</h1>
            <Badge variant="outline" className="text-base">
              {format(parseISO(day.date), "EEEE, MMMM d, yyyy")}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{cycle.name}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Previous Day Button */}
          {prevDay ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/cycles/${id}/days/${prevDay.id}`}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Day {prevDay.cycleDay}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          
          {/* Next Day Button */}
          {nextDay ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/cycles/${id}/days/${nextDay.id}`}>
                Day {nextDay.cycleDay}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {/* Edit Day Button */}
          <Button asChild variant="outline" size="sm">
            <Link href={`/cycles/${id}/days/${dayId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Day
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Medication Checklist */}
        <DailyMedicationChecklist 
          cycleId={id} 
          cycleDay={day.cycleDay} 
          date={day.date} 
        />

        <div className="grid gap-6 md:grid-cols-2">
        {/* Only show old medications if no medication schedule exists */}
        {day.medications && day.medications.length > 0 && !getMedicationScheduleByCycleId(id) && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                <CardTitle>Medications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {day.medications.map((med, index) => (
                  <li key={index} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          {med.dosage && <span>{med.dosage}</span>}
                          {(med.hour && med.minute && med.ampm) && (
                            <>
                              {med.dosage && <span>•</span>}
                              <span>{med.hour}:{med.minute} {med.ampm}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {med.taken && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Taken
                          </Badge>
                        )}
                        {med.refrigerated && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Refrigerated
                          </Badge>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {day.clinicVisit && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                <CardTitle>Clinic Visit</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Visit Type</p>
                  <p className="capitalize">{day.clinicVisit.type}</p>
                </div>

                {day.clinicVisit.notes && (
                  <div>
                    <p className="text-sm font-medium">Notes</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{day.clinicVisit.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {day.follicleSizes && (day.follicleSizes.left.length > 0 || day.follicleSizes.right.length > 0) && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-primary" />
                <CardTitle>Follicle Measurements</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Left Ovary</p>
                    {day.follicleSizes.left.length > 0 ? (
                      <p>{day.follicleSizes.left.join(", ")} mm</p>
                    ) : (
                      <p className="text-muted-foreground">No measurements</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium">Right Ovary</p>
                    {day.follicleSizes.right.length > 0 ? (
                      <p>{day.follicleSizes.right.join(", ")} mm</p>
                    ) : (
                      <p className="text-muted-foreground">No measurements</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {day.follicleSizes && day.follicleSizes.liningThickness && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-primary" />
                <CardTitle>Lining Check</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm font-medium">Endometrial Lining</p>
                <p>{day.follicleSizes.liningThickness} mm</p>
              </div>
            </CardContent>
          </Card>
        )}

        {day.bloodwork && day.bloodwork.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-primary" />
                <CardTitle>Bloodwork Results</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {day.bloodwork.map((result, index) => (
                  <li key={index} className="border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="flex justify-between">
                        <p className="font-medium">{result.test}</p>
                        <p>
                          {result.value} {result.unit}
                        </p>
                      </div>
                      {result.reference && (
                        <p className="text-sm text-muted-foreground">Reference range: {result.reference}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {day.notes && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Notes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{day.notes}</p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  )
}
