// Data migration from localStorage to Supabase
import { createClient } from './supabase-client'
import type { IVFCycle, UserProfile, ProcedureRecord, NaturalPregnancy } from './types'

export interface LocalStorageData {
  cycles: IVFCycle[]
  procedures: ProcedureRecord[]
  naturalPregnancies: NaturalPregnancy[]
  userProfile: UserProfile | null
  medicationSchedules: any[]
  dailyMedicationStatuses: any[]
  medications: any[]
}

export class SupabaseMigration {
  private supabase = createClient()

  async migrateUserData(userId: string, localData: LocalStorageData): Promise<boolean> {
    try {
      console.log('Starting migration for user:', userId)
      
      // 1. Migrate user profile
      if (localData.userProfile) {
        await this.migrateUserProfile(userId, localData.userProfile)
      }

      // 2. Migrate IVF cycles
      for (const cycle of localData.cycles) {
        await this.migrateCycle(userId, cycle)
      }

      // 3. Migrate procedures
      for (const procedure of localData.procedures) {
        await this.migrateProcedure(userId, procedure)
      }

      // 4. Migrate natural pregnancies
      for (const pregnancy of localData.naturalPregnancies) {
        await this.migrateNaturalPregnancy(userId, pregnancy)
      }

      // 5. Migrate medications
      for (const medication of localData.medications) {
        await this.migrateMedication(userId, medication)
      }

      console.log('Migration completed successfully')
      return true
    } catch (error) {
      console.error('Migration failed:', error)
      return false
    }
  }

  private async migrateUserProfile(userId: string, profile: UserProfile) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        display_name: profile.name || 'User',
        location: profile.location,
        date_of_birth: profile.dateOfBirth,
        ivf_reasons: profile.ivfReasons || [],
        ivf_reason_other: profile.ivfReasonOther,
        genetic_reasons_details: profile.geneticReasonsDetails,
        living_children: profile.livingChildren || 0,
        children_from_ivf: profile.childrenFromIVF,
        number_of_ivf_children: profile.numberOfIVFChildren
      })

    if (error) {
      console.error('Failed to migrate user profile:', error)
      throw error
    }

    console.log('User profile migrated successfully')
  }

  private async migrateCycle(userId: string, cycle: IVFCycle) {
    // Insert main cycle
    const { data: cycleData, error: cycleError } = await this.supabase
      .from('ivf_cycles')
      .insert({
        id: cycle.id,
        user_id: userId,
        name: cycle.name,
        start_date: cycle.startDate,
        end_date: cycle.endDate,
        protocol: cycle.protocol,
        clinic: cycle.clinic,
        notes: cycle.notes,
        status: cycle.status || 'completed'
      })

    if (cycleError) {
      console.error('Failed to migrate cycle:', cycleError)
      throw cycleError
    }

    // Migrate cycle days
    if (cycle.days && cycle.days.length > 0) {
      for (const day of cycle.days) {
        await this.migrateCycleDay(cycle.id, day)
      }
    }

    // Migrate cycle outcome
    if (cycle.outcome) {
      await this.migrateCycleOutcome(cycle.id, cycle.outcome)
    }

    console.log('Cycle migrated successfully:', cycle.name)
  }

  private async migrateCycleDay(cycleId: string, day: any) {
    // Insert cycle day
    const { error: dayError } = await this.supabase
      .from('cycle_days')
      .insert({
        cycle_id: cycleId,
        cycle_day: day.cycleDay,
        date: day.date,
        notes: day.notes,
        side_effects: day.sideEffects,
        mood: day.mood
      })

    if (dayError) {
      console.error('Failed to migrate cycle day:', dayError)
      throw dayError
    }

    // Migrate clinic visits, follicle measurements, bloodwork if they exist
    if (day.clinicVisit) {
      await this.migrateClinicVisit(cycleId, day.cycleDay, day.clinicVisit)
    }
  }

  private async migrateClinicVisit(cycleId: string, cycleDay: number, visit: any) {
    const { data: visitData, error: visitError } = await this.supabase
      .from('clinic_visits')
      .insert({
        cycle_id: cycleId,
        cycle_day: cycleDay,
        date: visit.date,
        visit_type: visit.visitType,
        notes: visit.notes
      })
      .select()
      .single()

    if (visitError) {
      console.error('Failed to migrate clinic visit:', visitError)
      throw visitError
    }

    const visitId = visitData.id

    // Migrate follicle measurements
    if (visit.follicleMeasurements && visit.follicleMeasurements.length > 0) {
      for (const measurement of visit.follicleMeasurements) {
        await this.supabase
          .from('follicle_measurements')
          .insert({
            visit_id: visitId,
            size: measurement.size
          })
      }
    }

    // Migrate bloodwork
    if (visit.bloodwork) {
      await this.supabase
        .from('bloodwork_results')
        .insert({
          visit_id: visitId,
          estradiol: visit.bloodwork.estradiol,
          lh: visit.bloodwork.lh,
          fsh: visit.bloodwork.fsh,
          progesterone: visit.bloodwork.progesterone,
          hcg: visit.bloodwork.hcg
        })
    }
  }

  private async migrateCycleOutcome(cycleId: string, outcome: any) {
    const { error } = await this.supabase
      .from('cycle_outcomes')
      .insert({
        cycle_id: cycleId,
        eggs_retrieved: outcome.eggsRetrieved,
        eggs_mature: outcome.eggsMature,
        eggs_fertilized: outcome.eggsFertilized,
        embryos_day3: outcome.embryosDay3,
        embryos_day5: outcome.embryosDay5,
        embryos_frozen: outcome.embryosFrozen,
        embryos_transferred: outcome.embryosTransferred,
        transfer_date: outcome.transferDate,
        transfer_type: outcome.transferType,
        pregnancy_test_date: outcome.pregnancyTestDate,
        pregnancy_test_result: outcome.pregnancyTestResult,
        beta_hcg_1: outcome.betaHcg1,
        beta_hcg_2: outcome.betaHcg2,
        clinical_pregnancy: outcome.clinicalPregnancy,
        ongoing_pregnancy: outcome.ongoingPregnancy,
        live_birth: outcome.liveBirth
      })

    if (error) {
      console.error('Failed to migrate cycle outcome:', error)
      throw error
    }
  }

  private async migrateProcedure(userId: string, procedure: ProcedureRecord) {
    const { error } = await this.supabase
      .from('procedures')
      .insert({
        id: procedure.id,
        user_id: userId,
        name: procedure.name,
        procedure_date: procedure.procedureDate,
        clinic: procedure.clinic,
        notes: procedure.notes,
        outcome: procedure.outcome
      })

    if (error) {
      console.error('Failed to migrate procedure:', error)
      throw error
    }

    console.log('Procedure migrated successfully:', procedure.name)
  }

  private async migrateNaturalPregnancy(userId: string, pregnancy: NaturalPregnancy) {
    const { error } = await this.supabase
      .from('natural_pregnancies')
      .insert({
        id: pregnancy.id,
        user_id: userId,
        date_of_conception: pregnancy.dateOfConception,
        pregnancy_test_date: pregnancy.pregnancyTestDate,
        due_date: pregnancy.dueDate,
        outcome: pregnancy.outcome,
        notes: pregnancy.notes
      })

    if (error) {
      console.error('Failed to migrate natural pregnancy:', error)
      throw error
    }

    console.log('Natural pregnancy migrated successfully')
  }

  private async migrateMedication(userId: string, medication: any) {
    const { error } = await this.supabase
      .from('medications')
      .insert({
        id: medication.id,
        user_id: userId,
        cycle_id: medication.cycleId,
        name: medication.name,
        dosage: medication.dosage,
        unit: medication.unit,
        timing: medication.timing,
        start_day: medication.startDay,
        end_day: medication.endDay,
        is_trigger: medication.trigger || false
      })

    if (error) {
      console.error('Failed to migrate medication:', error)
      throw error
    }
  }

  // Helper method to get all localStorage data for a user
  static getLocalStorageData(userId: string): LocalStorageData | null {
    try {
      const data = localStorage.getItem(`ivf-tracker-storage-${userId}`)
      if (!data) return null
      
      const parsed = JSON.parse(data)
      return parsed.state || parsed
    } catch (error) {
      console.error('Failed to parse localStorage data:', error)
      return null
    }
  }

  // Helper method to backup localStorage data before migration
  static backupLocalStorageData(userId: string): void {
    try {
      const data = localStorage.getItem(`ivf-tracker-storage-${userId}`)
      if (data) {
        const backupKey = `ivf-tracker-backup-${userId}-${Date.now()}`
        localStorage.setItem(backupKey, data)
        console.log('Backup created:', backupKey)
      }
    } catch (error) {
      console.error('Failed to create backup:', error)
    }
  }
}