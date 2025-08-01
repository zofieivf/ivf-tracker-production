"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Calendar, Clock, ArrowRight, TestTube, CalendarCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIVFStore } from "@/lib/store"

export function CycleList() {
  const { cycles } = useIVFStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6 h-40"></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (cycles.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">No cycles yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Create your first IVF cycle to start tracking</p>
          </div>
          <Link href="/cycles/new">
            <Button>Create Cycle</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {cycles.map((cycle) => (
        <Link key={cycle.id} href={`/cycles/${cycle.id}`}>
          <Card className="hover:border-primary/50 transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{cycle.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {format(new Date(cycle.startDate), "MMM d, yyyy")}
                      {cycle.endDate && (
                        <>
                          <ArrowRight className="h-3.5 w-3.5 mx-1 inline" />
                          {format(new Date(cycle.endDate), "MMM d, yyyy")}
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    cycle.status === "active" ? "default" : cycle.status === "completed" ? "success" : "destructive"
                  }
                >
                  {cycle.status}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {cycle.cycleType}
                </Badge>
                {cycle.outcome?.eggsRetrieved && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <TestTube className="h-3 w-3" />
                    {cycle.outcome.eggsRetrieved} eggs
                  </Badge>
                )}
                {cycle.days.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CalendarCheck className="h-3 w-3" />
                    {cycle.days.length} days
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6 py-3">
              <Button variant="ghost" className="w-full justify-start p-0 h-auto text-sm font-normal">
                View details
              </Button>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}
