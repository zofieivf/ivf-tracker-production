/**
 * Clean Medication System - Single Source of Truth
 * 
 * Handles both recurring medications (from Medication Schedule) 
 * and day-specific medications (from Daily Medication Status).
 * Provides unified view of all medications.
 */

import type { MedicationSchedule, ScheduledMedication, DailyMedicationStatus } from './types'

// Day-specific medication interface (matches existing structure)
export interface DaySpecificMedication {
  id: string
  name: string
  dosage: string
  hour: string
  minute: string
  ampm: 'AM' | 'PM'
  refrigerated: boolean
  taken: boolean
  skipped?: boolean
  notes?: string
  takenAt?: string
}

// Enhanced interfaces that build on existing types (no breaking changes)
export interface MedicationDayView {
  cycleDay: number
  date: string
  medications: UnifiedMedication[]
  totalCount: number
  completedCount: number
}

// Unified medication interface that can represent both recurring and day-specific
export interface UnifiedMedication {
  id: string
  name: string
  dosage: string
  hour: string
  minute: string
  ampm: 'AM' | 'PM'
  refrigerated: boolean
  type: 'recurring' | 'day-specific'
  notes?: string
  // For recurring medications
  startDay?: number
  endDay?: number
  // For status tracking (optional)
  taken?: boolean
  skipped?: boolean
  takenAt?: string
}

export interface MedicationScheduleOverview {
  schedule: MedicationSchedule
  totalMedications: number
  completedMedications: number
  dailyBreakdown: {
    day: number
    date: string
    medications: UnifiedMedication[]
    completed: number
    total: number
  }[]
}

/**
 * Core function: Get all medications for a specific day
 * Combines recurring medications (from schedule) and day-specific medications
 */
export function getMedicationsForDay(
  cycleId: string,
  cycleDay: number,
  schedule: MedicationSchedule | null,
  dailyStatuses: DailyMedicationStatus[]
): UnifiedMedication[] {
  const allMedications: UnifiedMedication[] = []

  // 1. Add recurring medications from schedule
  if (schedule) {
    const activeMedications = schedule.medications.filter(
      med => med.startDay <= cycleDay && med.endDay >= cycleDay
    )

    activeMedications.forEach(med => {
      allMedications.push({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        hour: med.hour,
        minute: med.minute,
        ampm: med.ampm,
        refrigerated: med.refrigerated,
        type: 'recurring',
        notes: med.notes,
        startDay: med.startDay,
        endDay: med.endDay
      })
    })
  }

  // 2. Add day-specific medications from daily status
  const dailyStatus = dailyStatuses.find(
    status => status.cycleId === cycleId && status.cycleDay === cycleDay
  )

  if (dailyStatus?.daySpecificMedications) {
    dailyStatus.daySpecificMedications.forEach(dayMed => {
      allMedications.push({
        id: dayMed.id,
        name: dayMed.name,
        dosage: dayMed.dosage,
        hour: dayMed.hour,
        minute: dayMed.minute,
        ampm: dayMed.ampm,
        refrigerated: dayMed.refrigerated,
        type: 'day-specific',
        notes: dayMed.notes,
        taken: dayMed.taken,
        skipped: dayMed.skipped,
        takenAt: dayMed.takenAt
      })
    })
  }

  // Sort by time
  return allMedications.sort((a, b) => {
    const timeA = parseInt(a.hour) * 60 + parseInt(a.minute) + (a.ampm === 'PM' && a.hour !== '12' ? 12 * 60 : 0) + (a.ampm === 'AM' && a.hour === '12' ? -12 * 60 : 0)
    const timeB = parseInt(b.hour) * 60 + parseInt(b.minute) + (b.ampm === 'PM' && b.hour !== '12' ? 12 * 60 : 0) + (b.ampm === 'AM' && b.hour === '12' ? -12 * 60 : 0)
    return timeA - timeB
  })
}

/**
 * Get complete day view (used by daily medication components)
 */
export function getDayMedicationView(
  cycleId: string,
  cycleDay: number,
  date: string,
  schedule: MedicationSchedule | null,
  dailyStatuses: DailyMedicationStatus[]
): MedicationDayView {
  const medications = getMedicationsForDay(cycleId, cycleDay, schedule, dailyStatuses)
  
  return {
    cycleDay,
    date,
    medications,
    totalCount: medications.length,
    completedCount: medications.filter(m => m.taken || m.skipped).length
  }
}

/**
 * Get complete schedule overview (used by medication schedule components)
 */
export function getScheduleOverview(
  cycleId: string,
  schedule: MedicationSchedule | null,
  cycleStartDate: string,
  cycleDays: number[],
  dailyStatuses: DailyMedicationStatus[]
): MedicationScheduleOverview | null {
  if (!schedule && dailyStatuses.filter(s => s.cycleId === cycleId).length === 0) {
    return null
  }

  const dailyBreakdown = cycleDays.map(day => {
    const medications = getMedicationsForDay(cycleId, day, schedule, dailyStatuses)
    
    // Calculate date for this day
    const startDate = new Date(cycleStartDate)
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + (day - 1))
    
    return {
      day,
      date: dayDate.toISOString(),
      medications,
      completed: medications.filter(m => m.taken || m.skipped).length,
      total: medications.length
    }
  })

  const totalMedications = dailyBreakdown.reduce((sum, day) => sum + day.total, 0)
  const completedMedications = dailyBreakdown.reduce((sum, day) => sum + day.completed, 0)

  return {
    schedule: schedule || { id: '', cycleId, medications: [], createdAt: '' },
    totalMedications,
    completedMedications,
    dailyBreakdown
  }
}

/**
 * Group medications by time period for display
 */
export function groupMedicationsByTime(medications: UnifiedMedication[]): {
  morning: UnifiedMedication[]
  evening: UnifiedMedication[]
} {
  const morning: UnifiedMedication[] = []
  const evening: UnifiedMedication[] = []

  medications.forEach(med => {
    const hour = parseInt(med.hour)
    if (med.ampm === 'AM' || (med.ampm === 'PM' && hour === 12)) {
      morning.push(med)
    } else {
      evening.push(med)
    }
  })

  return { morning, evening }
}

/**
 * Calculate medication count for calendar view
 */
export function getMedicationCountForDay(
  cycleId: string,
  cycleDay: number,
  schedule: MedicationSchedule | null,
  dailyStatuses: DailyMedicationStatus[]
): number {
  const medications = getMedicationsForDay(cycleId, cycleDay, schedule, dailyStatuses)
  return medications.length
}

/**
 * Helper to ensure daily status exists (for tracking)
 */
export function ensureDailyStatus(
  cycleId: string,
  cycleDay: number,
  date: string,
  schedule: MedicationSchedule | null,
  existingStatuses: DailyMedicationStatus[]
): DailyMedicationStatus {
  // Check if status already exists
  let existing = existingStatuses.find(
    status => status.cycleId === cycleId && status.cycleDay === cycleDay
  )

  if (existing) return existing

  // Create new status with proper medication entries
  const activeMedications = schedule?.medications.filter(
    med => med.startDay <= cycleDay && med.endDay >= cycleDay
  ) || []

  const newStatus: DailyMedicationStatus = {
    id: crypto.randomUUID(),
    cycleId,
    cycleDay,
    date,
    medications: activeMedications.map(med => ({
      scheduledMedicationId: med.id,
      taken: false,
      skipped: false
    })),
    createdAt: new Date().toISOString()
  }

  return newStatus
}

/**
 * Clean store integration functions
 * These functions integrate with the existing store structure
 */

// Get clean medication view for a day (to replace existing getDayMedications)
export function getCleanDayMedicationView(
  cycleId: string,
  cycleDay: number,
  date: string,
  medicationSchedules: MedicationSchedule[],
  dailyStatuses: DailyMedicationStatus[]
): MedicationDayView {
  const schedule = medicationSchedules.find(s => s.cycleId === cycleId)
  return getDayMedicationView(cycleId, cycleDay, date, schedule || null, dailyStatuses)
}

// Get clean schedule overview (to replace existing cycle medication overview)
export function getCleanScheduleOverview(
  cycleId: string,
  cycleStartDate: string,
  cycleDays: number[],
  medicationSchedules: MedicationSchedule[],
  dailyStatuses: DailyMedicationStatus[]
): MedicationScheduleOverview | null {
  const schedule = medicationSchedules.find(s => s.cycleId === cycleId)
  return getScheduleOverview(cycleId, schedule || null, cycleStartDate, cycleDays, dailyStatuses)
}

// Add day-specific medication
export function addDaySpecificMedication(
  cycleId: string,
  cycleDay: number,
  date: string,
  medication: Omit<DaySpecificMedication, 'id'>,
  dailyStatuses: DailyMedicationStatus[]
): DailyMedicationStatus[] {
  const newMedication: DaySpecificMedication = {
    ...medication,
    id: crypto.randomUUID()
  }

  // Find existing daily status or create new one
  let dailyStatus = dailyStatuses.find(
    status => status.cycleId === cycleId && status.cycleDay === cycleDay
  )

  if (!dailyStatus) {
    // Create new daily status
    dailyStatus = {
      id: crypto.randomUUID(),
      cycleId,
      cycleDay,
      date,
      medications: [],
      daySpecificMedications: [newMedication],
      createdAt: new Date().toISOString()
    }
    return [...dailyStatuses, dailyStatus]
  } else {
    // Update existing daily status
    const updatedDailyStatus = {
      ...dailyStatus,
      daySpecificMedications: [
        ...(dailyStatus.daySpecificMedications || []),
        newMedication
      ],
      updatedAt: new Date().toISOString()
    }
    
    return dailyStatuses.map(status =>
      status.id === dailyStatus.id ? updatedDailyStatus : status
    )
  }
}

// Update medication status (to replace existing store functions)
export function updateCleanMedicationStatus(
  medicationId: string,
  cycleId: string,
  cycleDay: number,
  updates: {
    taken?: boolean
    skipped?: boolean
    actualDosage?: string
    takenAt?: string
    notes?: string
  },
  dailyMedicationStatuses: DailyMedicationStatus[]
): DailyMedicationStatus[] {
  const dailyStatus = dailyMedicationStatuses.find(
    status => status.cycleId === cycleId && status.cycleDay === cycleDay
  )

  if (!dailyStatus) {
    throw new Error(`No daily status found for cycle ${cycleId} day ${cycleDay}`)
  }

  const updatedStatus = updateMedicationStatus(medicationId, cycleId, cycleDay, updates, dailyStatus)
  
  return dailyMedicationStatuses.map(status =>
    status.id === dailyStatus.id ? updatedStatus : status
  )
}

/**
 * Update medication status (mark as taken/skipped)
 */
export function updateMedicationStatus(
  medicationId: string,
  cycleId: string,
  cycleDay: number,
  updates: {
    taken?: boolean
    skipped?: boolean
    actualDosage?: string
    takenAt?: string
    notes?: string
  },
  dailyStatus: DailyMedicationStatus
): DailyMedicationStatus {
  const updatedMedications = dailyStatus.medications.map(med =>
    med.scheduledMedicationId === medicationId 
      ? { ...med, ...updates }
      : med
  )

  return {
    ...dailyStatus,
    medications: updatedMedications,
    updatedAt: new Date().toISOString()
  }
}

// Update day-specific medication
export function updateDaySpecificMedication(
  cycleId: string,
  cycleDay: number,
  medicationId: string,
  medication: Partial<Omit<DaySpecificMedication, 'id'>>,
  existingStatuses: DailyMedicationStatus[]
): DailyMedicationStatus[] {
  const targetStatus = existingStatuses.find(
    status => status.cycleId === cycleId && status.cycleDay === cycleDay
  )

  if (!targetStatus || !targetStatus.daySpecificMedications) {
    return existingStatuses
  }

  const updatedMedications = targetStatus.daySpecificMedications.map(med =>
    med.id === medicationId ? { ...med, ...medication } : med
  )

  return existingStatuses.map(status =>
    status.id === targetStatus.id
      ? { ...status, daySpecificMedications: updatedMedications, updatedAt: new Date().toISOString() }
      : status
  )
}

// Delete day-specific medication
export function deleteDaySpecificMedication(
  cycleId: string,
  cycleDay: number,
  medicationId: string,
  existingStatuses: DailyMedicationStatus[]
): DailyMedicationStatus[] {
  const targetStatus = existingStatuses.find(
    status => status.cycleId === cycleId && status.cycleDay === cycleDay
  )

  if (!targetStatus || !targetStatus.daySpecificMedications) {
    return existingStatuses
  }

  const filteredMedications = targetStatus.daySpecificMedications.filter(med => med.id !== medicationId)

  return existingStatuses.map(status =>
    status.id === targetStatus.id
      ? { 
          ...status, 
          daySpecificMedications: filteredMedications.length > 0 ? filteredMedications : [],
          updatedAt: new Date().toISOString() 
        }
      : status
  )
}