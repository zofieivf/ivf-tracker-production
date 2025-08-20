/**
 * Medication Data Migration Utility
 * 
 * Safely migrates existing medication data from the legacy complex system
 * to the new clean medication system without data loss.
 */

import type { Medication } from './medications'
import type { MedicationSchedule, DailyMedicationStatus } from './types'
import { createMedicationId, formatTime } from './medications'

export interface MigrationResult {
  migratedMedications: Medication[]
  skippedCount: number
  errorCount: number
  summary: {
    scheduledMedications: number
    daySpecificMedications: number
    totalMigrated: number
  }
}

export interface MigrationOptions {
  preserveTimestamps?: boolean
  skipIncompleteData?: boolean
  logProgress?: boolean
}

/**
 * Main migration function - converts all legacy medication data to new format
 */
export function migrateLegacyMedicationData(
  cycleId: string,
  legacySchedules: MedicationSchedule[],
  legacyDailyStatuses: DailyMedicationStatus[],
  options: MigrationOptions = {}
): MigrationResult {
  const { preserveTimestamps = true, skipIncompleteData = false, logProgress = false } = options
  
  const result: MigrationResult = {
    migratedMedications: [],
    skippedCount: 0,
    errorCount: 0,
    summary: {
      scheduledMedications: 0,
      daySpecificMedications: 0,
      totalMigrated: 0
    }
  }

  if (logProgress) {
    console.log(`🔄 Starting medication migration for cycle: ${cycleId}`)
  }

  // Migrate scheduled medications
  const cycleSchedule = legacySchedules.find(s => s.cycleId === cycleId)
  if (cycleSchedule) {
    result.migratedMedications.push(...migrateScheduledMedications(
      cycleId, 
      cycleSchedule, 
      legacyDailyStatuses, 
      options,
      result
    ))
  }

  // Migrate day-specific medications
  const cycleDailyStatuses = legacyDailyStatuses.filter(s => s.cycleId === cycleId)
  cycleDailyStatuses.forEach(dailyStatus => {
    result.migratedMedications.push(...migrateDaySpecificMedications(
      cycleId,
      dailyStatus,
      options,
      result
    ))
  })

  result.summary.totalMigrated = result.migratedMedications.length
  
  if (logProgress) {
    console.log(`✅ Migration complete:`, result.summary)
  }

  return result
}

/**
 * Migrate scheduled medications from MedicationSchedule
 */
function migrateScheduledMedications(
  cycleId: string,
  schedule: MedicationSchedule,
  dailyStatuses: DailyMedicationStatus[],
  options: MigrationOptions,
  result: MigrationResult
): Medication[] {
  const medications: Medication[] = []

  schedule.medications.forEach(legacyMed => {
    try {
      // Create one medication entry for each day it's active
      for (let day = legacyMed.startDay; day <= legacyMed.endDay; day++) {
        const dailyStatus = dailyStatuses.find(s => 
          s.cycleId === cycleId && 
          s.cycleDay === day
        )
        
        const medicationStatus = dailyStatus?.medications.find(m => 
          m.scheduledMedicationId === legacyMed.id
        )

        const medication: Medication = {
          id: createMedicationId(),
          cycleId,
          cycleDay: day,
          name: legacyMed.name,
          dosage: medicationStatus?.actualDosage || legacyMed.dosage,
          time: formatTime(
            parseInt(legacyMed.hour), 
            parseInt(legacyMed.minute), 
            legacyMed.ampm
          ),
          refrigerated: legacyMed.refrigerated,
          type: 'scheduled',
          startDay: legacyMed.startDay,
          endDay: legacyMed.endDay,
          taken: medicationStatus?.taken || false,
          skipped: medicationStatus?.skipped || false,
          takenAt: medicationStatus?.takenAt,
          notes: combineNotes(legacyMed.notes, medicationStatus?.notes),
          createdAt: options.preserveTimestamps ? schedule.createdAt : new Date().toISOString(),
          updatedAt: medicationStatus?.takenAt ? medicationStatus.takenAt : undefined
        }

        medications.push(medication)
        result.summary.scheduledMedications++
      }
    } catch (error) {
      console.error(`Error migrating scheduled medication ${legacyMed.name}:`, error)
      result.errorCount++
    }
  })

  return medications
}

/**
 * Migrate day-specific medications from DailyMedicationStatus
 */
function migrateDaySpecificMedications(
  cycleId: string,
  dailyStatus: DailyMedicationStatus,
  options: MigrationOptions,
  result: MigrationResult
): Medication[] {
  const medications: Medication[] = []

  if (!dailyStatus.daySpecificMedications) {
    return medications
  }

  dailyStatus.daySpecificMedications.forEach(legacyMed => {
    try {
      // Validate required fields
      if (!legacyMed.name || !legacyMed.dosage) {
        if (options.skipIncompleteData) {
          result.skippedCount++
          return
        }
      }

      const medication: Medication = {
        id: legacyMed.id || createMedicationId(),
        cycleId,
        cycleDay: dailyStatus.cycleDay,
        name: legacyMed.name,
        dosage: legacyMed.dosage,
        time: formatTime(
          parseInt(legacyMed.hour), 
          parseInt(legacyMed.minute), 
          legacyMed.ampm
        ),
        refrigerated: legacyMed.refrigerated,
        type: 'one-time',
        taken: legacyMed.taken || false,
        skipped: legacyMed.skipped || false,
        takenAt: legacyMed.takenAt,
        notes: legacyMed.notes,
        createdAt: options.preserveTimestamps ? dailyStatus.createdAt : new Date().toISOString(),
        updatedAt: legacyMed.takenAt ? legacyMed.takenAt : undefined
      }

      medications.push(medication)
      result.summary.daySpecificMedications++
    } catch (error) {
      console.error(`Error migrating day-specific medication ${legacyMed.name}:`, error)
      result.errorCount++
    }
  })

  return medications
}

/**
 * Helper function to combine notes from different sources
 */
function combineNotes(scheduleNotes?: string, statusNotes?: string): string | undefined {
  const notes = [scheduleNotes, statusNotes].filter(Boolean)
  return notes.length > 0 ? notes.join(' | ') : undefined
}

/**
 * Validate migrated data for consistency
 */
export function validateMigratedData(medications: Medication[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  medications.forEach((med, index) => {
    // Required field validation
    if (!med.id) errors.push(`Medication ${index}: Missing ID`)
    if (!med.cycleId) errors.push(`Medication ${index}: Missing cycleId`)
    if (!med.name) errors.push(`Medication ${index}: Missing name`)
    if (!med.dosage) errors.push(`Medication ${index}: Missing dosage`)
    if (!med.time) errors.push(`Medication ${index}: Missing time`)
    if (med.cycleDay < 1) errors.push(`Medication ${index}: Invalid cycleDay`)

    // Type-specific validation
    if (med.type === 'scheduled') {
      if (!med.startDay || !med.endDay) {
        warnings.push(`Scheduled medication ${med.name}: Missing startDay/endDay`)
      }
      if (med.startDay && med.endDay && med.startDay > med.endDay) {
        errors.push(`Scheduled medication ${med.name}: startDay > endDay`)
      }
    }

    // Time format validation
    if (!/^\d{2}:\d{2} (AM|PM)$/.test(med.time)) {
      errors.push(`Medication ${med.name}: Invalid time format: ${med.time}`)
    }

    // Status validation
    if (med.taken && med.skipped) {
      warnings.push(`Medication ${med.name}: Both taken and skipped`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Clean up duplicate medications that might exist after migration
 */
export function deduplicateMedications(medications: Medication[]): Medication[] {
  const seen = new Set<string>()
  const deduplicated: Medication[] = []

  medications.forEach(med => {
    // Create a key based on core medication properties
    const key = `${med.cycleId}-${med.cycleDay}-${med.name}-${med.time}-${med.type}`
    
    if (!seen.has(key)) {
      seen.add(key)
      deduplicated.push(med)
    }
  })

  return deduplicated
}

/**
 * Store method to trigger migration for a specific cycle
 */
export function createMigrationStoreMethod() {
  return (cycleId: string, options?: MigrationOptions) => {
    // This will be called from the store with access to get() and set()
    console.log(`🔄 Starting medication migration for cycle: ${cycleId}`)
    
    // Implementation will be added to store
    return { success: true, message: 'Migration utility ready' }
  }
}