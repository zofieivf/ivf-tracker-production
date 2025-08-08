"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { CycleList } from "@/components/cycle-list"
import { CycleCard } from "@/components/cycle-card"
import { ProcedureCard } from "@/components/procedure-card"
import { AboutMeCard } from "@/components/about-me-card"
import { useIVFStore } from "@/lib/store"
import { parseISO } from "date-fns"

export default function Home() {
  const { cycles, procedures } = useIVFStore()

  // Combine cycles and procedures and sort by date
  const combinedItems = [
    ...cycles.map(cycle => ({ 
      type: 'cycle' as const, 
      item: cycle, 
      date: parseISO(cycle.startDate) 
    })),
    ...procedures.map(procedure => ({ 
      type: 'procedure' as const, 
      item: procedure, 
      date: parseISO(procedure.procedureDate) 
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime()) // Oldest first

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IVF Tracker</h1>
          <p className="text-muted-foreground mt-1">Track your IVF journey, medications, and appointments</p>
        </div>
        <div className="flex gap-2">
          <Link href="/cycles/new">
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              New Cycle
            </Button>
          </Link>
          
          <Link href="/procedures/new">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              New Fertility-related Procedure
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* About Me Card - Always show first */}
        <AboutMeCard />
        
        {/* Cycles and Procedures */}
        {combinedItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No cycles or procedures recorded yet</p>
            <p className="text-sm text-muted-foreground">
              Get started by creating your first IVF cycle or recording a fertility procedure
            </p>
          </div>
        ) : (
          <>
            {combinedItems.map((item, index) => (
              <div key={`${item.type}-${item.item.id}`}>
                {item.type === 'cycle' ? (
                  <CycleCard cycle={item.item} allCycles={cycles} />
                ) : (
                  <ProcedureCard procedure={item.item} />
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}