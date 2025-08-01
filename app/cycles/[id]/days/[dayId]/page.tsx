"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ArrowLeft, Edit, Pill, Droplet, Stethoscope, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useIVFStore } from "@/lib/store"
import type { CycleDay } from "@/lib/types"

export default function DayDetailPage({ params }: { params: { id: string; dayId: string } }) {
  const router = useRouter()
  const { getCycleById } = useIVFStore()
  const [cycle, setCycle] = useState(getCycleById(params.id))
  const [day, setDay] = useState<CycleDay | undefined>(cycle?.days.find((d) => d.id === params.dayId))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const currentCycle = getCycleById(params.id)
    setCycle(currentCycle)
    setDay(currentCycle?.days.find((d) => d.id === params.dayId))
  }, [params.id, params.dayId, getCycleById])

  if (!mounted) return null

  if (!cycle || !day) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-bold mb-2">Day not found</h2>
          <p className="text-muted-foreground mb-6">The day you're looking for doesn't exist</p>
          <Button asChild>
            <Link href={`/cycles/${params.id}`}>Go back to cycle</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0">
        <Link href={`/cycles/${params.id}`} className="flex items-center gap-1">
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

        <Button asChild variant="outline" size="sm">
          <Link href={`/cycles/${params.id}/days/${params.dayId}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Day
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {day.medications && day.medications.length > 0 && (
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
                        {med.dosage && <p className="text-sm text-muted-foreground">{med.dosage}</p>}
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

        {day.follicleSizes && (
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

                {day.follicleSizes.liningThickness && (
                  <div>
                    <p className="text-sm font-medium">Endometrial Lining</p>
                    <p>{day.follicleSizes.liningThickness} mm</p>
                  </div>
                )}
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
  )
}
