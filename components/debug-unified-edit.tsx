"use client"

import { useIVFStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

export function createDebugHandleSubmit(originalHandleSubmit: () => void, cycleId: string, cycleDay: number, daySpecificMedications: any[]) {
  return () => {
    const { getDailyMedicationStatus, ensureDailyMedicationStatus } = useIVFStore.getState()
    
    console.log("=== DEBUG BEFORE SAVE ===")
    console.log("CycleId:", cycleId, "CycleDay:", cycleDay)
    console.log("Day-specific medications to save:", daySpecificMedications)
    
    const beforeStatus = getDailyMedicationStatus(cycleId, cycleDay)
    console.log("Status before save:", beforeStatus)
    
    // Call original submit
    originalHandleSubmit()
    
    // Check after save
    setTimeout(() => {
      const afterStatus = getDailyMedicationStatus(cycleId, cycleDay)
      console.log("=== DEBUG AFTER SAVE ===")
      console.log("Status after save:", afterStatus)
      console.log("Day-specific medications in store:", afterStatus?.daySpecificMedications)
    }, 100)
  }
}