"use client"

import { format } from "date-fns"
import { Calendar, User, Activity, FileText } from 'lucide-react'
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useIVFStore } from "@/lib/store"

export function CycleList() {
  const { cycles } = useIVFStore()

  if (!cycles || cycles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No cycles yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create your first IVF cycle to start tracking medications, appointments, and results.
          </p>
          <Button asChild>
            <Link href="/cycles/new">Create First Cycle</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {cycles.map((cycle) => (
        <Card key={cycle.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{cycle.name}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Started {format(new Date(cycle.startDate), "MMM d, yyyy")}</span>
                  </div>
                  {cycle.ageAtStart && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{cycle.ageAtStart}y</span>
                    </div>
                  )}
                </CardDescription>
              </div>
              <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'}>
                {cycle.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span>{cycle.days && cycle.days.length > 0 ? `${cycle.days.length} days tracked` : 'No days tracked'}</span>
                </div>
                <Badge variant="outline">{cycle.cycleType}</Badge>
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
