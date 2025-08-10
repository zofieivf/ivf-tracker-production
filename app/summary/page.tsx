"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FertilityJourneySummary } from "@/components/fertility-journey-summary"

export default function SummaryPage() {
  return (
    <div className="container max-w-6xl py-10">
      <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0">
        <Link href="/" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      <FertilityJourneySummary />
    </div>
  )
}