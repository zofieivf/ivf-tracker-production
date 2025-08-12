"use client"

import { useRouter } from "next/navigation"
import { UnifiedEditDay } from "@/components/unified-edit-day"

export default function EditDayPage({ params }: { params: { id: string; dayId: string } }) {
  const router = useRouter()

  return (
    <UnifiedEditDay
      cycleId={params.id}
      dayId={params.dayId}
      onSave={() => router.push(`/cycles/${params.id}/days/${params.dayId}`)}
      onCancel={() => router.push(`/cycles/${params.id}/days/${params.dayId}`)}
    />
  )
}
