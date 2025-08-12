"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { IVFCycle, CycleOutcome, CycleDay, ProcedureRecord, UserProfile, NaturalPregnancy, MedicationSchedule, DailyMedicationStatus } from "./types"

interface IVFStore {
  cycles: IVFCycle[]
  procedures: ProcedureRecord[]
  naturalPregnancies: NaturalPregnancy[]
  medicationSchedules: MedicationSchedule[]
  dailyMedicationStatuses: DailyMedicationStatus[]
  userProfile: UserProfile | null
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
  setUserProfile: (profile: UserProfile) => void
  updateUserProfile: (profile: Partial<UserProfile>) => void
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
        return get().dailyMedicationStatuses.find((status) => 
          status.cycleId === cycleId && status.cycleDay === cycleDay
        )
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
        const state = get()
        let existingStatus = state.dailyMedicationStatuses.find(
          status => status.cycleId === cycleId && status.cycleDay === cycleDay
        )
        
        if (!existingStatus) {
          const { createEmptyDailyStatus } = require('./medication-utils')
          existingStatus = createEmptyDailyStatus(cycleId, cycleDay, date)
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
    }),
    {
      name: "ivf-tracker-storage",
    },
  ),
)
