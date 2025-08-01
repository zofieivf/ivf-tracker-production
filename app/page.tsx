import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { CycleList } from "@/components/cycle-list"

export default function Home() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IVF Tracker</h1>
          <p className="text-muted-foreground mt-1">Track your IVF journey, medications, and appointments</p>
        </div>
        <Link href="/cycles/new">
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            New Cycle
          </Button>
        </Link>
      </div>

      <CycleList />
    </div>
  )
}
