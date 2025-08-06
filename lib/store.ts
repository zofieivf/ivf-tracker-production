"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { IVFCycle, CycleOutcome, CycleDay, ProcedureRecord } from "./types"

interface IVFStore {
  cycles: IVFCycle[]
  procedures: ProcedureRecord[]
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
}

export const useIVFStore = create<IVFStore>()(
  persist(
    (set, get) => ({
      cycles: [],
      procedures: [],

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
    }),
    {
      name: "ivf-tracker-storage",
    },
  ),
)
