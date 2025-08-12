import type { ScheduledMedication, DailyMedicationStatus, MedicationSchedule } from "@/lib/types"

// Unified medication data structure for a single day
export interface UnifiedDayMedications {
  scheduled: {
    medication: ScheduledMedication
    status: {
      taken: boolean
      skipped: boolean
      actualDosage?: string
      takenAt?: string
      notes?: string
    }
  }[]
  daySpecific: {
    id: string
    name: string
    dosage: string
    hour: string
    minute: string
    ampm: string
    refrigerated: boolean
    taken: boolean
    skipped: boolean
    takenAt?: string
    notes?: string
  }[]
  totalCount: number
}

// Get all medications for a specific day from the unified system
export function getUnifiedMedicationsForDay(
  cycleId: string,
  cycleDay: number,
  schedule: MedicationSchedule | null,
  dailyStatus: DailyMedicationStatus | null
): UnifiedDayMedications {
  const result: UnifiedDayMedications = {
    scheduled: [],
    daySpecific: [],
    totalCount: 0
  }

  // Get scheduled medications active on this day
  if (schedule) {
    const todaysMedications = schedule.medications.filter(
      med => med.startDay <= cycleDay && med.endDay >= cycleDay
    )

    result.scheduled = todaysMedications.map(medication => {
      const status = dailyStatus?.medications.find(m => m.scheduledMedicationId === medication.id)
      return {
        medication,
        status: {
          taken: status?.taken || false,
          skipped: status?.skipped || false,
          actualDosage: status?.actualDosage,
          takenAt: status?.takenAt,
          notes: status?.notes
        }
      }
    })
  }

  // Get day-specific medications
  if (dailyStatus?.daySpecificMedications) {
    result.daySpecific = [...dailyStatus.daySpecificMedications]
  }

  result.totalCount = result.scheduled.length + result.daySpecific.length
  return result
}

// Convert unified medications back to legacy format (for backward compatibility during migration)
export function unifiedToLegacyMedications(unified: UnifiedDayMedications) {
  const legacy: any[] = []

  // Add scheduled medications
  unified.scheduled.forEach(({ medication, status }) => {
    legacy.push({
      name: medication.name,
      dosage: status.actualDosage || medication.dosage,
      hour: medication.hour,
      minute: medication.minute,
      ampm: medication.ampm,
      taken: status.taken,
      refrigerated: medication.refrigerated
    })
  })

  // Add day-specific medications
  unified.daySpecific.forEach(med => {
    legacy.push({
      name: med.name,
      dosage: med.dosage,
      hour: med.hour,
      minute: med.minute,
      ampm: med.ampm,
      taken: med.taken,
      refrigerated: med.refrigerated
    })
  })

  return legacy
}

// Create a new daily medication status if none exists
export function createEmptyDailyStatus(
  cycleId: string,
  cycleDay: number,
  date: string
): DailyMedicationStatus {
  return {
    id: crypto.randomUUID(),
    cycleId,
    cycleDay,
    date,
    medications: [],
    daySpecificMedications: [],
    createdAt: new Date().toISOString()
  }
}

// Group medications by time period for display
export function groupMedicationsByTime(unified: UnifiedDayMedications) {
  const morning: (typeof unified.scheduled[0] | typeof unified.daySpecific[0])[] = []
  const evening: (typeof unified.scheduled[0] | typeof unified.daySpecific[0])[] = []

  // Add scheduled medications
  unified.scheduled.forEach(item => {
    if (item.medication.ampm === "AM") {
      morning.push(item)
    } else {
      evening.push(item)
    }
  })

  // Add day-specific medications
  unified.daySpecific.forEach(med => {
    if (med.ampm === "AM") {
      morning.push(med)
    } else {
      evening.push(med)
    }
  })

  return { morning, evening }
}