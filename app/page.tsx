"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { CycleList } from "@/components/cycle-list"
import { CycleCard } from "@/components/cycle-card"
import { ProcedureCard } from "@/components/procedure-card"
import { AboutMeCard } from "@/components/about-me-card"
import { NaturalPregnancyCard } from "@/components/natural-pregnancy-card"
import { useIVFStore } from "@/lib/store"
import { parseISO } from "date-fns"

export default function Home() {
  const { cycles, procedures, naturalPregnancies } = useIVFStore()

  // Combine cycles, procedures, and natural pregnancies and sort by date
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
    })),
    ...naturalPregnancies.map(pregnancy => ({ 
      type: 'pregnancy' as const, 
      item: pregnancy, 
      date: parseISO(pregnancy.dateOfConception) 
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime()) // Oldest first

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">IVF Tracker</h1>
            <p className="text-muted-foreground mt-1">Track your IVF journey, medications, and appointments</p>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
            <Link href="/cycles/new">
              <Button className="flex items-center gap-2 w-full sm:w-auto">
                <PlusCircle className="h-4 w-4" />
                New Cycle
              </Button>
            </Link>
            
            <Link href="/procedures/new">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <PlusCircle className="h-4 w-4" />
                New Procedure
              </Button>
            </Link>
            
            <Link href="/pregnancies/new">
              <Button 
                variant="secondary" 
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <PlusCircle className="h-4 w-4" />
                Natural Pregnancy
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* About Me Card - Always show first */}
        <AboutMeCard />
        
        {/* Cycles, Procedures, and Natural Pregnancies */}
        {combinedItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No cycles, procedures, or pregnancies recorded yet</p>
            <p className="text-sm text-muted-foreground">
              Get started by creating your first IVF cycle, recording a fertility procedure, or adding a natural pregnancy
            </p>
          </div>
        ) : (
          <>
            {combinedItems.map((item, index) => (
              <div key={`${item.type}-${item.item.id}`}>
                {item.type === 'cycle' ? (
                  <CycleCard cycle={item.item} allCycles={cycles} />
                ) : item.type === 'procedure' ? (
                  <ProcedureCard procedure={item.item} />
                ) : (
                  <NaturalPregnancyCard pregnancy={item.item} />
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}