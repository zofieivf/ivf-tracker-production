"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { UnifiedEditDay } from "@/components/unified-edit-day"

export default function EditDayPage({ params }: { params: Promise<{ id: string; dayId: string }> }) {
  const { id, dayId } = use(params)
  const router = useRouter()

  return (
    <UnifiedEditDay
      cycleId={id}
      dayId={dayId}
      onSave={() => router.push(`/cycles/${id}/days/${dayId}`)}
      onCancel={() => router.push(`/cycles/${id}/days/${dayId}`)}
    />
  )
}
