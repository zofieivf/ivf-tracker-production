"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { IVFCycle, CycleOutcome, CycleDay, ProcedureRecord, UserProfile, NaturalPregnancy, MedicationSchedule, DailyMedicationStatus } from "./types"
import type { Medication, DayMedications, MedicationScheduleEntry } from "./medications"

interface IVFStore {
  cycles: IVFCycle[]
  procedures: ProcedureRecord[]
  naturalPregnancies: NaturalPregnancy[]
  medicationSchedules: MedicationSchedule[]
  dailyMedicationStatuses: DailyMedicationStatus[]
  userProfile: UserProfile | null
  
  // New Clean Medication System
  medications: Medication[]
  addCycle: (cycle: IVFCycle) => void
  updateCycle: (id: string, cycle: Partial<IVFCycle>) => void
  deleteCycle: (id: string) => void
  getCycleById: (id: string) => IVFCycle | undefined
  updateCycleOutcome: (id: string, outcome: Partial<CycleOutcome>) => void
  addDay: (cycleId: string, day: CycleDay) => void
  updateDay: (cycleId: string, dayId: string, day: Partial<CycleDay>) => void
  deleteDay: (cycleId: string, dayId: string) => void
  addProcedure: (procedure: ProcedureRecord) => void
  updateProcedure: (id: string, procedure: Partial<ProcedureRecord>) => void
  deleteProcedure: (id: string) => void
  getProcedureById: (id: string) => ProcedureRecord | undefined
  addNaturalPregnancy: (pregnancy: NaturalPregnancy) => void
  updateNaturalPregnancy: (id: string, pregnancy: Partial<NaturalPregnancy>) => void
  deleteNaturalPregnancy: (id: string) => void
  getNaturalPregnancyById: (id: string) => NaturalPregnancy | undefined
  addMedicationSchedule: (schedule: MedicationSchedule) => void
  updateMedicationSchedule: (id: string, schedule: Partial<MedicationSchedule>) => void
  deleteMedicationSchedule: (id: string) => void
  getMedicationScheduleById: (id: string) => MedicationSchedule | undefined
  getMedicationScheduleByCycleId: (cycleId: string) => MedicationSchedule | undefined
  addDailyMedicationStatus: (status: DailyMedicationStatus) => void
  updateDailyMedicationStatus: (id: string, status: Partial<DailyMedicationStatus>) => void
  getDailyMedicationStatus: (cycleId: string, cycleDay: number) => DailyMedicationStatus | undefined
  // Unified medication functions
  getUnifiedMedicationsForDay: (cycleId: string, cycleDay: number) => import('./medication-utils').UnifiedDayMedications
  ensureDailyMedicationStatus: (cycleId: string, cycleDay: number, date: string) => DailyMedicationStatus
  ensureScheduledDaysExist: (cycleId: string) => void
  ensureAllDaysExist: (cycleId: string) => void
  setUserProfile: (profile: UserProfile) => void
  updateUserProfile: (profile: Partial<UserProfile>) => void
  calculateDaysPostTransfer: (cycleId: string, currentDay: number) => number | null
  getBetaHcgFromDailyTracking: (cycleId: string) => { betaHcg1?: number; betaHcg1Day?: number; betaHcg2?: number; betaHcg2Day?: number }
  cleanupDuplicateDailyStatuses: (cycleId: string, cycleDay: number) => void
  migrateLegacyMedicationData: (cycleId: string) => void

  // New Clean Medication System Methods
  addMedication: (medication: Omit<Medication, 'id' | 'createdAt'>) => void
  updateMedication: (id: string, updates: Partial<Medication>) => void
  deleteMedication: (id: string) => void
  getMedication: (id: string) => Medication | undefined
  getMedicationsForDay: (cycleId: string, cycleDay: number) => Medication[]
  getMedicationsForCycle: (cycleId: string) => Medication[]
  getDayMedications: (cycleId: string, cycleDay: number, date: string) => DayMedications
  getCycleMedicationSchedule: (cycleId: string) => MedicationScheduleEntry[]
  markMedicationTaken: (id: string, takenAt?: string) => void
  markMedicationSkipped: (id: string) => void
  resetMedicationStatus: (id: string) => void
  duplicateMedicationToDay: (id: string, targetCycleDay: number) => void
  migrateToNewMedicationSystem: (cycleId: string, options?: any) => { success: boolean; message: string; data?: any }
  
  // Clean Medication System Integration
  getCleanMedicationScheduleOverview: (cycleId: string) => import('./clean-medication-system').MedicationScheduleOverview | null
  markCleanMedicationTaken: (medicationId: string, cycleId: string, cycleDay: number, takenAt?: string) => void
  markCleanMedicationSkipped: (medicationId: string, cycleId: string, cycleDay: number) => void
  resetCleanMedicationStatus: (medicationId: string, cycleId: string, cycleDay: number) => void
  addCleanDaySpecificMedication: (cycleId: string, cycleDay: number, date: string, medication: Omit<import('./clean-medication-system').DaySpecificMedication, 'id'>) => void
  updateCleanDaySpecificMedication: (cycleId: string, cycleDay: number, medicationId: string, medication: Partial<Omit<import('./clean-medication-system').DaySpecificMedication, 'id'>>) => void
  deleteCleanDaySpecificMedication: (cycleId: string, cycleDay: number, medicationId: string) => void
}

export const useIVFStore = create<IVFStore>()(
  persist(
    (set, get) => ({
      cycles: [],
      procedures: [],
      naturalPregnancies: [],
      medicationSchedules: [],
      dailyMedicationStatuses: [],
      userProfile: null,
      medications: [],

      addCycle: (cycle) => {
        set((state) => ({
          cycles: [...state.cycles, cycle],
        }))
      },

      updateCycle: (id, updatedCycle) => {
        set((state) => ({
          cycles: state.cycles.map((cycle) => (cycle.id === id ? { ...cycle, ...updatedCycle } : cycle)),
        }))
      },

      deleteCycle: (id) => {
        set((state) => ({
          cycles: state.cycles.filter((cycle) => cycle.id !== id),
        }))
      },

      getCycleById: (id) => {
        return get().cycles.find((cycle) => cycle.id === id)
      },

      updateCycleOutcome: (id, outcome) => {
        set((state) => ({
          cycles: state.cycles.map((cycle) => {
            if (cycle.id === id) {
              return {
                ...cycle,
                outcome: {
                  ...cycle.outcome,
                  ...outcome,
                },
              }
            }
            return cycle
          }),
        }))
      },

      addDay: (cycleId, day) => {
        set((state) => ({
          cycles: state.cycles.map((cycle) => {
            if (cycle.id === cycleId) {
              return {
                ...cycle,
                days: [...cycle.days, day],
              }
            }
            return cycle
          }),
        }))
      },

      updateDay: (cycleId, dayId, updatedDay) => {
        set((state) => ({
          cycles: state.cycles.map((cycle) => {
            if (cycle.id === cycleId) {
              return {
                ...cycle,
                days: cycle.days.map((day) => (day.id === dayId ? { ...day, ...updatedDay } : day)),
              }
            }
            return cycle
          }),
        }))
      },

      deleteDay: (cycleId, dayId) => {
        set((state) => ({
          cycles: state.cycles.map((cycle) => {
            if (cycle.id === cycleId) {
              return {
                ...cycle,
                days: cycle.days.filter((day) => day.id !== dayId),
              }
            }
            return cycle
          }),
        }))
      },

      addProcedure: (procedure) => {
        set((state) => ({
          procedures: [...state.procedures, procedure],
        }))
      },

      updateProcedure: (id, updatedProcedure) => {
        set((state) => ({
          procedures: state.procedures.map((procedure) => 
            procedure.id === id ? { ...procedure, ...updatedProcedure } : procedure
          ),
        }))
      },

      deleteProcedure: (id) => {
        set((state) => ({
          procedures: state.procedures.filter((procedure) => procedure.id !== id),
        }))
      },

      getProcedureById: (id) => {
        return get().procedures.find((procedure) => procedure.id === id)
      },

      addNaturalPregnancy: (pregnancy) => {
        set((state) => ({
          naturalPregnancies: [...state.naturalPregnancies, pregnancy],
        }))
      },

      updateNaturalPregnancy: (id, updatedPregnancy) => {
        set((state) => ({
          naturalPregnancies: state.naturalPregnancies.map((pregnancy) => 
            pregnancy.id === id ? { ...pregnancy, ...updatedPregnancy } : pregnancy
          ),
        }))
      },

      deleteNaturalPregnancy: (id) => {
        set((state) => ({
          naturalPregnancies: state.naturalPregnancies.filter((pregnancy) => pregnancy.id !== id),
        }))
      },

      getNaturalPregnancyById: (id) => {
        return get().naturalPregnancies.find((pregnancy) => pregnancy.id === id)
      },

      setUserProfile: (profile) => {
        set({ userProfile: profile })
      },

      updateUserProfile: (updatedProfile) => {
        set((state) => ({
          userProfile: state.userProfile ? { ...state.userProfile, ...updatedProfile } : null
        }))
      },

      addMedicationSchedule: (schedule) => {
        set((state) => ({
          medicationSchedules: [...state.medicationSchedules, schedule],
        }))
      },

      updateMedicationSchedule: (id, updatedSchedule) => {
        set((state) => ({
          medicationSchedules: state.medicationSchedules.map((schedule) => 
            schedule.id === id ? { ...schedule, ...updatedSchedule, updatedAt: new Date().toISOString() } : schedule
          ),
        }))
      },

      deleteMedicationSchedule: (id) => {
        set((state) => ({
          medicationSchedules: state.medicationSchedules.filter((schedule) => schedule.id !== id),
        }))
      },

      getMedicationScheduleById: (id) => {
        return get().medicationSchedules.find((schedule) => schedule.id === id)
      },

      getMedicationScheduleByCycleId: (cycleId) => {
        return get().medicationSchedules.find((schedule) => schedule.cycleId === cycleId)
      },

      addDailyMedicationStatus: (status) => {
        set((state) => ({
          dailyMedicationStatuses: [...state.dailyMedicationStatuses, status],
        }))
      },

      updateDailyMedicationStatus: (id, updatedStatus) => {
        set((state) => ({
          dailyMedicationStatuses: state.dailyMedicationStatuses.map((status) => 
            status.id === id ? { ...status, ...updatedStatus, updatedAt: new Date().toISOString() } : status
          ),
        }))
      },

      getDailyMedicationStatus: (cycleId, cycleDay) => {
        const matches = get().dailyMedicationStatuses.filter((status) => 
          status.cycleId === cycleId && status.cycleDay === cycleDay
        )
        
        if (matches.length > 1) {
          // Return the most recently updated one
          return matches.sort((a, b) => {
            const aTime = new Date(a.updatedAt || a.createdAt).getTime()
            const bTime = new Date(b.updatedAt || b.createdAt).getTime()
            return bTime - aTime
          })[0]
        }
        
        return matches[0]
      },

      // Unified medication functions
      getUnifiedMedicationsForDay: (cycleId, cycleDay) => {
        const state = get()
        const schedule = state.medicationSchedules.find(s => s.cycleId === cycleId)
        const dailyStatus = state.dailyMedicationStatuses.find(
          status => status.cycleId === cycleId && status.cycleDay === cycleDay
        )
        
        // Import the utility function dynamically to avoid circular imports
        const { getUnifiedMedicationsForDay } = require('./medication-utils')
        return getUnifiedMedicationsForDay(cycleId, cycleDay, schedule || null, dailyStatus || null)
      },

      ensureDailyMedicationStatus: (cycleId, cycleDay, date) => {
        console.log("🏗️ ensureDailyMedicationStatus called for cycleId:", cycleId, "cycleDay:", cycleDay)
        
        const state = get()
        let existingStatus = state.dailyMedicationStatuses.find(
          status => status.cycleId === cycleId && status.cycleDay === cycleDay
        )
        
        console.log("🏗️ Existing status found:", !!existingStatus)
        if (existingStatus) {
          console.log("🏗️ Existing status ID:", existingStatus.id)
        }
        
        if (!existingStatus) {
          const { createEmptyDailyStatus } = require('./medication-utils')
          existingStatus = createEmptyDailyStatus(cycleId, cycleDay, date)
          console.log("🏗️ Created new status with ID:", existingStatus.id)
          set((state) => ({
            dailyMedicationStatuses: [...state.dailyMedicationStatuses, existingStatus!]
          }))
        }
        
        return existingStatus
      },

      ensureScheduledDaysExist: (cycleId) => {
        const state = get()
        const cycle = state.cycles.find(c => c.id === cycleId)
        const schedule = state.medicationSchedules.find(s => s.cycleId === cycleId)
        
        if (!cycle || !schedule) return
        
        // Find the range of days needed by the medication schedule
        // Medications take priority - create days for all scheduled medications
        const maxScheduledDay = Math.max(...schedule.medications.map(m => m.endDay))
        const existingDays = cycle.days.map(d => d.cycleDay)
        const maxExistingDay = existingDays.length > 0 ? Math.max(...existingDays) : 0
        
        if (maxScheduledDay <= maxExistingDay) return // No new days needed
        
        // Calculate dates for new days
        const { addDays, parseISO } = require('date-fns')
        const cycleStartDate = parseISO(cycle.startDate)
        const newDays: CycleDay[] = []
        
        for (let dayNumber = maxExistingDay + 1; dayNumber <= maxScheduledDay; dayNumber++) {
          const dayDate = addDays(cycleStartDate, dayNumber - 1)
          const newDay: CycleDay = {
            id: crypto.randomUUID(),
            cycleDay: dayNumber,
            date: dayDate.toISOString(),
          }
          newDays.push(newDay)
        }
        
        // Add the new days to the cycle
        if (newDays.length > 0) {
          set((state) => ({
            cycles: state.cycles.map((c) => {
              if (c.id === cycleId) {
                return {
                  ...c,
                  days: [...c.days, ...newDays].sort((a, b) => a.cycleDay - b.cycleDay),
                }
              }
              return c
            }),
          }))
        }
      },

      ensureAllDaysExist: (cycleId) => {
        const state = get()
        const cycle = state.cycles.find(c => c.id === cycleId)
        
        if (!cycle || !cycle.days || cycle.days.length === 0) return
        
        // Find the highest day number that exists (from any source: medication schedule or manual creation)
        const existingDays = cycle.days.map(d => d.cycleDay)
        const maxDayNumber = Math.max(...existingDays)
        const { addDays, parseISO } = require('date-fns')
        const cycleStartDate = parseISO(cycle.startDate)
        const newDays: CycleDay[] = []
        
        // Create any missing days from 1 to maxDayNumber (fill gaps)
        for (let dayNumber = 1; dayNumber <= maxDayNumber; dayNumber++) {
          const dayExists = existingDays.includes(dayNumber)
          if (!dayExists) {
            const dayDate = addDays(cycleStartDate, dayNumber - 1)
            const newDay: CycleDay = {
              id: crypto.randomUUID(),
              cycleDay: dayNumber,
              date: dayDate.toISOString(),
            }
            newDays.push(newDay)
          }
        }
        
        // Add any missing days to the cycle
        if (newDays.length > 0) {
          set((state) => ({
            cycles: state.cycles.map((c) => {
              if (c.id === cycleId) {
                return {
                  ...c,
                  days: [...c.days, ...newDays].sort((a, b) => a.cycleDay - b.cycleDay),
                }
              }
              return c
            }),
          }))
        }
      },

      calculateDaysPostTransfer: (cycleId, currentDay) => {
        const state = get()
        const cycle = state.cycles.find(c => c.id === cycleId)
        
        if (!cycle || !cycle.days) return null
        
        // Find the transfer day (clinic visit type "transfer")
        const transferDay = cycle.days.find(day => 
          day.clinicVisit?.type === "transfer"
        )
        
        if (!transferDay) return null
        
        // Calculate days since transfer
        const daysSinceTransfer = currentDay - transferDay.cycleDay
        
        // Return positive number only (can't have negative days post-transfer)
        return daysSinceTransfer >= 0 ? daysSinceTransfer : null
      },

      getBetaHcgFromDailyTracking: (cycleId) => {
        const state = get()
        const cycle = state.cycles.find(c => c.id === cycleId)
        
        if (!cycle || !cycle.days) return {}
        
        // Find all beta clinic visits with HCG values
        const betaDays = cycle.days
          .filter(day => 
            day.clinicVisit?.type === "beta" && 
            day.clinicVisit?.betaHcgValue !== undefined
          )
          .sort((a, b) => a.cycleDay - b.cycleDay) // Sort by cycle day
        
        if (betaDays.length === 0) return {}
        
        const result: { betaHcg1?: number; betaHcg1Day?: number; betaHcg2?: number; betaHcg2Day?: number } = {}
        
        // First beta becomes betaHcg1
        if (betaDays[0]) {
          result.betaHcg1 = betaDays[0].clinicVisit!.betaHcgValue!
          const daysPost = get().calculateDaysPostTransfer(cycleId, betaDays[0].cycleDay)
          if (daysPost !== null) {
            result.betaHcg1Day = daysPost
          }
        }
        
        // Second beta becomes betaHcg2
        if (betaDays[1]) {
          result.betaHcg2 = betaDays[1].clinicVisit!.betaHcgValue!
          const daysPost = get().calculateDaysPostTransfer(cycleId, betaDays[1].cycleDay)
          if (daysPost !== null) {
            result.betaHcg2Day = daysPost
          }
        }
        
        return result
      },

      // Migration function to move old medication data to new system
      migrateLegacyMedicationData: (cycleId: string) => {
        console.log("🔄 Starting legacy medication data migration for cycle:", cycleId)
        
        const state = get()
        const cycle = state.cycles.find(c => c.id === cycleId)
        if (!cycle) return
        
        let migratedCount = 0
        
        cycle.days.forEach(day => {
          const legacyMedications = (day as any).medications
          if (legacyMedications && Array.isArray(legacyMedications) && legacyMedications.length > 0) {
            console.log(`🔄 Migrating ${legacyMedications.length} medications from Day ${day.cycleDay}`)
            
            // Get or create daily medication status
            const dailyStatus = get().ensureDailyMedicationStatus(cycleId, day.cycleDay, day.date)
            
            // Convert legacy medications to day-specific medications
            const validLegacyMeds = legacyMedications.filter((med: any) => med && med.name && med.name.trim() !== "")
            
            if (validLegacyMeds.length > 0 && (!dailyStatus.daySpecificMedications || dailyStatus.daySpecificMedications.length === 0)) {
              const daySpecificMeds = validLegacyMeds.map((med: any) => ({
                id: med.id || crypto.randomUUID(),
                name: med.name,
                dosage: med.dosage || "",
                hour: med.hour || "",
                minute: med.minute || "",
                ampm: med.ampm || "",
                refrigerated: med.refrigerated || false,
                taken: med.taken || false,
                skipped: false,
                takenAt: med.taken ? new Date().toISOString() : undefined,
                notes: med.notes
              }))
              
              // Update daily medication status with migrated data
              get().updateDailyMedicationStatus(dailyStatus.id, {
                daySpecificMedications: daySpecificMeds,
                updatedAt: new Date().toISOString(),
              })
              
              migratedCount += validLegacyMeds.length
            }
            
            // Remove the old medications field from the day
            delete (day as any).medications
          }
        })
        
        if (migratedCount > 0) {
          console.log(`🔄 Migration complete: ${migratedCount} medications migrated`)
          // Update the cycle in the store to persist the changes
          set((state) => ({
            cycles: state.cycles.map(c => c.id === cycleId ? cycle : c)
          }))
        } else {
          console.log("🔄 No legacy medication data found to migrate")
        }
      },

      cleanupDuplicateDailyStatuses: (cycleId, cycleDay) => {
        set((state) => {
          const matches = state.dailyMedicationStatuses.filter(
            status => status.cycleId === cycleId && status.cycleDay === cycleDay
          )
          
          if (matches.length <= 1) {
            return state
          }
          
          // Sort by creation/update time to find the most recent
          const sorted = matches.sort((a, b) => {
            const aTime = new Date(a.updatedAt || a.createdAt).getTime()
            const bTime = new Date(b.updatedAt || b.createdAt).getTime()
            return bTime - aTime
          })
          
          // Keep the most recent one and merge any day-specific medications
          const keeper = sorted[0]
          const toRemove = sorted.slice(1)
          
          // Merge day-specific medications from all duplicates
          const allDaySpecificMeds = matches.flatMap(m => m.daySpecificMedications || [])
          const uniqueDaySpecificMeds = allDaySpecificMeds.filter((med, index, arr) => 
            arr.findIndex(m => m.id === med.id) === index
          )
          
          // Update the keeper with merged data
          const mergedKeeper = {
            ...keeper,
            daySpecificMedications: uniqueDaySpecificMeds,
            updatedAt: new Date().toISOString()
          }
          
          // Remove duplicates and update the keeper
          const cleaned = state.dailyMedicationStatuses
            .filter(status => !toRemove.some(tr => tr.id === status.id))
            .map(status => status.id === keeper.id ? mergedKeeper : status)
          
          return {
            dailyMedicationStatuses: cleaned
          }
        })
      },

      // New Clean Medication System Implementation
      addMedication: (medicationData) => {
        const { createMedicationId } = require('./medications')
        const medication: Medication = {
          ...medicationData,
          id: createMedicationId(),
          createdAt: new Date().toISOString()
        }
        
        set((state) => ({
          medications: [...state.medications, medication]
        }))
      },

      updateMedication: (id, updates) => {
        set((state) => ({
          medications: state.medications.map(med => 
            med.id === id 
              ? { ...med, ...updates, updatedAt: new Date().toISOString() }
              : med
          )
        }))
      },

      deleteMedication: (id) => {
        set((state) => ({
          medications: state.medications.filter(med => med.id !== id)
        }))
      },

      getMedication: (id) => {
        return get().medications.find(med => med.id === id)
      },

      getMedicationsForDay: (cycleId, cycleDay) => {
        const { isMedicationActiveOnDay } = require('./medications')
        return get().medications.filter(med => 
          med.cycleId === cycleId && isMedicationActiveOnDay(med, cycleDay)
        )
      },

      getMedicationsForCycle: (cycleId) => {
        return get().medications.filter(med => med.cycleId === cycleId)
      },

      getDayMedications: (cycleId, cycleDay, date) => {
        // Use clean system if available, otherwise fallback to current system
        const { medicationSchedules, dailyMedicationStatuses } = get()
        const { getCleanDayMedicationView } = require('./clean-medication-system')
        
        try {
          return getCleanDayMedicationView(cycleId, cycleDay, date, medicationSchedules, dailyMedicationStatuses)
        } catch (error) {
          // Fallback to current system
          const { getMedicationsForDay } = get()
          const medications = getMedicationsForDay(cycleId, cycleDay)
          
          return {
            cycleDay,
            date,
            medications,
            completed: medications.filter(m => m.taken || m.skipped).length,
            total: medications.length
          }
        }
      },

      getCycleMedicationSchedule: (cycleId) => {
        const { getMedicationCompletionRate } = require('./medications')
        const medications = get().medications.filter(med => med.cycleId === cycleId)
        
        // Group by medication template (name + time for scheduled, individual for one-time)
        const groupedMeds = new Map<string, Medication[]>()
        
        medications.forEach(med => {
          const key = med.type === 'scheduled' 
            ? `${med.name}-${med.time}-${med.startDay}-${med.endDay}`
            : med.id
          
          if (!groupedMeds.has(key)) {
            groupedMeds.set(key, [])
          }
          groupedMeds.get(key)!.push(med)
        })
        
        return Array.from(groupedMeds.entries()).map(([key, meds]) => {
          const representative = meds[0]
          const activeDays = representative.type === 'scheduled'
            ? Array.from({ length: (representative.endDay || 1) - (representative.startDay || 1) + 1 }, 
                (_, i) => (representative.startDay || 1) + i)
            : [representative.cycleDay]
          
          return {
            medication: representative,
            activeDays,
            completionRate: getMedicationCompletionRate(meds)
          }
        })
      },

      markMedicationTaken: (id, takenAt) => {
        const { updateMedication } = get()
        updateMedication(id, {
          taken: true,
          skipped: false,
          takenAt: takenAt || new Date().toISOString()
        })
      },

      markMedicationSkipped: (id) => {
        const { updateMedication } = get()
        updateMedication(id, {
          taken: false,
          skipped: true,
          takenAt: undefined
        })
      },

      resetMedicationStatus: (id) => {
        const { updateMedication } = get()
        updateMedication(id, {
          taken: false,
          skipped: false,
          takenAt: undefined
        })
      },

      duplicateMedicationToDay: (id, targetCycleDay) => {
        const { getMedication, addMedication } = get()
        const original = getMedication(id)
        
        if (original) {
          addMedication({
            ...original,
            cycleDay: targetCycleDay,
            type: 'one-time',
            startDay: undefined,
            endDay: undefined,
            taken: false,
            skipped: false,
            takenAt: undefined
          })
        }
      },

      migrateToNewMedicationSystem: (cycleId, options = {}) => {
        try {
          const { migrateLegacyMedicationData, validateMigratedData, deduplicateMedications } = require('./medication-migration')
          const state = get()
          
          console.log(`🔄 Starting migration to new medication system for cycle: ${cycleId}`)
          
          // Check if cycle exists
          const cycle = state.cycles.find(c => c.id === cycleId)
          if (!cycle) {
            return { success: false, message: `Cycle ${cycleId} not found` }
          }
          
          // Check if already migrated (has medications in new system)
          const existingNewMeds = state.medications.filter(m => m.cycleId === cycleId)
          if (existingNewMeds.length > 0) {
            return { 
              success: false, 
              message: `Cycle ${cycleId} already has ${existingNewMeds.length} medications in new system` 
            }
          }
          
          // Perform migration
          const migrationResult = migrateLegacyMedicationData(
            cycleId,
            state.medicationSchedules,
            state.dailyMedicationStatuses,
            { ...options, logProgress: true }
          )
          
          // Validate migrated data
          const validation = validateMigratedData(migrationResult.migratedMedications)
          if (!validation.isValid) {
            console.error('Migration validation failed:', validation.errors)
            return { 
              success: false, 
              message: `Migration validation failed: ${validation.errors.join(', ')}`,
              data: validation
            }
          }
          
          // Deduplicate if needed
          const cleanMedications = deduplicateMedications(migrationResult.migratedMedications)
          
          // Add migrated medications to store
          set((state) => ({
            medications: [...state.medications, ...cleanMedications]
          }))
          
          console.log(`✅ Migration successful:`, migrationResult.summary)
          
          if (validation.warnings.length > 0) {
            console.warn('Migration warnings:', validation.warnings)
          }
          
          return {
            success: true,
            message: `Successfully migrated ${migrationResult.summary.totalMigrated} medications`,
            data: {
              ...migrationResult.summary,
              warnings: validation.warnings,
              deduplicatedCount: migrationResult.migratedMedications.length - cleanMedications.length
            }
          }
          
        } catch (error) {
          console.error('Migration error:', error)
          return { 
            success: false, 
            message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          }
        }
      },

      // Clean Medication System Integration Implementation
      getCleanMedicationScheduleOverview: (cycleId) => {
        const { medicationSchedules, dailyMedicationStatuses, getCycleById } = get()
        const { getCleanScheduleOverview } = require('./clean-medication-system')
        
        const cycle = getCycleById(cycleId)
        if (!cycle) return null
        
        // Get all cycle days
        const cycleDays = cycle.days.map(day => day.cycleDay).sort((a, b) => a - b)
        
        return getCleanScheduleOverview(
          cycleId,
          cycle.startDate,
          cycleDays,
          medicationSchedules,
          dailyMedicationStatuses
        )
      },

      markCleanMedicationTaken: (medicationId, cycleId, cycleDay, takenAt) => {
        const { dailyMedicationStatuses } = get()
        const { updateCleanMedicationStatus } = require('./clean-medication-system')
        
        try {
          const updatedStatuses = updateCleanMedicationStatus(
            medicationId,
            cycleId,
            cycleDay,
            {
              taken: true,
              skipped: false,
              takenAt: takenAt || new Date().toISOString()
            },
            dailyMedicationStatuses
          )
          
          set((state) => ({
            dailyMedicationStatuses: updatedStatuses
          }))
        } catch (error) {
          console.error('Failed to mark medication as taken:', error)
        }
      },

      markCleanMedicationSkipped: (medicationId, cycleId, cycleDay) => {
        const { dailyMedicationStatuses } = get()
        const { updateCleanMedicationStatus } = require('./clean-medication-system')
        
        try {
          const updatedStatuses = updateCleanMedicationStatus(
            medicationId,
            cycleId,
            cycleDay,
            {
              taken: false,
              skipped: true,
              takenAt: undefined
            },
            dailyMedicationStatuses
          )
          
          set((state) => ({
            dailyMedicationStatuses: updatedStatuses
          }))
        } catch (error) {
          console.error('Failed to mark medication as skipped:', error)
        }
      },

      resetCleanMedicationStatus: (medicationId, cycleId, cycleDay) => {
        const { dailyMedicationStatuses } = get()
        const { updateCleanMedicationStatus } = require('./clean-medication-system')
        
        try {
          const updatedStatuses = updateCleanMedicationStatus(
            medicationId,
            cycleId,
            cycleDay,
            {
              taken: false,
              skipped: false,
              takenAt: undefined
            },
            dailyMedicationStatuses
          )
          
          set((state) => ({
            dailyMedicationStatuses: updatedStatuses
          }))
        } catch (error) {
          console.error('Failed to reset medication status:', error)
        }
      },

      addCleanDaySpecificMedication: (cycleId, cycleDay, date, medication) => {
        const { dailyMedicationStatuses } = get()
        const { addDaySpecificMedication } = require('./clean-medication-system')
        
        try {
          const updatedStatuses = addDaySpecificMedication(
            cycleId,
            cycleDay,
            date,
            medication,
            dailyMedicationStatuses
          )
          
          set((state) => ({
            dailyMedicationStatuses: updatedStatuses
          }))
        } catch (error) {
          console.error('Failed to add day-specific medication:', error)
        }
      },

      updateCleanDaySpecificMedication: (cycleId, cycleDay, medicationId, medication) => {
        const { dailyMedicationStatuses } = get()
        
        try {
          const { updateDaySpecificMedication } = require('./clean-medication-system')
          const updatedStatuses = updateDaySpecificMedication(
            cycleId,
            cycleDay,
            medicationId,
            medication,
            dailyMedicationStatuses
          )
          set((state) => ({ dailyMedicationStatuses: updatedStatuses }))
        } catch (error) {
          console.error('Failed to update day-specific medication:', error)
        }
      },

      deleteCleanDaySpecificMedication: (cycleId, cycleDay, medicationId) => {
        const { dailyMedicationStatuses } = get()
        
        try {
          const { deleteDaySpecificMedication } = require('./clean-medication-system')
          const updatedStatuses = deleteDaySpecificMedication(
            cycleId,
            cycleDay,
            medicationId,
            dailyMedicationStatuses
          )
          set((state) => ({ dailyMedicationStatuses: updatedStatuses }))
        } catch (error) {
          console.error('Failed to delete day-specific medication:', error)
        }
      },
    }),
    {
      name: "ivf-tracker-storage",
    },
  ),
)
