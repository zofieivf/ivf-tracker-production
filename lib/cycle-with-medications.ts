import type { IVFCycle } from './types'
import { useIVFStore } from './store'

/**
 * Enhanced cycle data that includes medication information for comparisons
 */
export interface CycleWithMedications extends IVFCycle {
  days: Array<IVFCycle['days'][0] & {
    medications?: Array<{
      name: string
      dosage: string
      unit?: string
      timing?: string
      route?: string
      taken?: boolean
      skipped?: boolean
    }>
  }>
}

/**
 * Get a cycle with all its medication data included for comparison purposes
 */
export function getCycleWithMedications(cycleId: string): CycleWithMedications | null {
  // Get the store state directly - this will work in the browser
  const store = useIVFStore.getState()
  
  const cycle = store.getCycleById(cycleId)
  if (!cycle) return null
  
  console.log(`🔍 Getting medications for cycle ${cycle.name} (${cycleId})`)
  
  // Find medication schedule for this cycle
  const medicationSchedule = store.medicationSchedules?.find(sched => sched.cycleId === cycleId)
  console.log(`Found medication schedule:`, medicationSchedule ? `${medicationSchedule.medications.length} medications` : 'none')
  
  // Create enhanced cycle with medication data for each day
  const enhancedCycle: CycleWithMedications = {
    ...cycle,
    days: cycle.days.map(day => {
      console.log(`  Checking day ${day.cycleDay}...`)
      
      // Get medications from all possible sources
      const allMedications: Array<{
        name: string
        dosage: string
        unit?: string
        timing?: string
        route?: string
        taken?: boolean
        skipped?: boolean
        trigger?: boolean
      }> = []
      
      // 1. Check if medications already exist on the day (from direct cycle data)
      if (day.medications && Array.isArray(day.medications)) {
        console.log(`    Found ${day.medications.length} direct medications`)
        day.medications.forEach(med => {
          console.log(`      Direct medication: ${med.name}, trigger: ${(med as any).trigger}`)
          allMedications.push({
            name: med.name,
            dosage: med.dosage || '',
            unit: med.unit,
            timing: med.time || med.timing,
            route: med.route,
            taken: med.taken,
            skipped: med.skipped,
            trigger: (med as any).trigger || false
          })
        })
      }
      
      // 2. Extract medications from medication schedule for this day
      if (medicationSchedule && medicationSchedule.medications) {
        console.log(`    Checking medication schedule for day ${day.cycleDay}...`)
        
        medicationSchedule.medications.forEach(med => {
          // Check if this medication applies to this cycle day
          if (day.cycleDay >= med.startDay && day.cycleDay <= med.endDay) {
            console.log(`      ${med.name} ${med.dosage} applies to day ${day.cycleDay}`)
            
            // Format timing from hour/minute/ampm
            let timing = undefined
            if (med.hour && med.minute) {
              const hour = parseInt(med.hour)
              const minute = med.minute
              const ampm = med.ampm
              
              if (ampm) {
                timing = `${med.hour}:${minute} ${ampm}`
              } else {
                // Convert 24hr to 12hr format
                const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                const displayAmPm = hour < 12 ? 'AM' : 'PM'
                timing = `${displayHour}:${minute} ${displayAmPm}`
              }
            }
            
            // Check if this exact medication already exists (avoid duplicates)
            const exists = allMedications.some(existing => 
              existing.name === med.name && 
              existing.dosage === med.dosage &&
              existing.timing === timing
            )
            
            if (!exists) {
              allMedications.push({
                name: med.name,
                dosage: med.dosage.replace(/\s*(mg|ml|units?)\s*/i, ''), // Remove unit from dosage
                unit: med.dosage.match(/mg|ml|units?/i)?.[0] || 'mg',
                timing: timing,
                route: med.route,
                taken: med.taken,
                skipped: med.skipped,
                trigger: med.trigger || false
              })
            }
          }
        })
      }
      
      // 3. Try store methods if they exist
      try {
        const dayMedications = store.getMedicationsForDay?.(cycleId, day.cycleDay)
        if (dayMedications && dayMedications.length > 0) {
          console.log(`    Found ${dayMedications.length} store medications`)
          dayMedications.forEach(med => {
            // Avoid duplicates
            const exists = allMedications.some(existing => 
              existing.name === med.name && existing.dosage === (med.dosage || ''))
            if (!exists) {
              allMedications.push({
                name: med.name,
                dosage: med.dosage || '',
                unit: med.unit,
                timing: med.time || med.timing,
                route: med.route,
                taken: med.taken,
                skipped: med.skipped
              })
            }
          })
        }
      } catch (e) {
        console.log(`    Store method getMedicationsForDay not available`)
      }
      
      // 4. Check unified medication system
      try {
        const unifiedMedications = store.getUnifiedMedicationsForDay?.(cycleId, day.cycleDay)
        if (unifiedMedications) {
          console.log(`    Found unified medications`)
          const unifiedMeds = unifiedMedications as any
          
          // Process day-specific medications from unified system
          if (unifiedMeds.daySpecific && Array.isArray(unifiedMeds.daySpecific)) {
            console.log(`    Processing ${unifiedMeds.daySpecific.length} unified day-specific medications`)
            unifiedMeds.daySpecific.forEach((med: any) => {
              console.log(`      Unified day-specific: ${med.name}, trigger: ${med.trigger}`)
              const existingIndex = allMedications.findIndex(existing => 
                existing.name === med.name && existing.dosage === (med.dosage || ''))
              const exists = existingIndex !== -1
              
              // If medication exists but this one has trigger=true and existing doesn't, replace it
              const shouldReplace = exists && med.trigger && !allMedications[existingIndex].trigger
              
              if (!exists || shouldReplace) {
                const medicationEntry = {
                  name: med.name,
                  dosage: med.dosage || '',
                  unit: med.unit,
                  timing: med.hour && med.minute && med.ampm ? 
                    `${med.hour}:${med.minute} ${med.ampm}` : med.timing,
                  taken: med.taken,
                  skipped: med.skipped,
                  trigger: med.trigger || false
                }
                if (shouldReplace) {
                  console.log(`        Replacing existing medication with trigger version:`, medicationEntry)
                  allMedications[existingIndex] = medicationEntry
                } else {
                  console.log(`        Adding unified medication to allMedications:`, medicationEntry)
                  allMedications.push(medicationEntry)
                }
              } else {
                console.log(`        Unified medication ${med.name} already exists, skipping`)
              }
            })
          }
          
          // Process scheduled medications from unified system
          if (unifiedMeds.scheduled && Array.isArray(unifiedMeds.scheduled)) {
            console.log(`    Processing ${unifiedMeds.scheduled.length} unified scheduled medications`)
            unifiedMeds.scheduled.forEach((item: any) => {
              const med = item.medication
              console.log(`      Unified scheduled: ${med.name}, trigger: ${med.trigger}`)
              const exists = allMedications.some(existing => 
                existing.name === med.name && existing.dosage === (med.dosage || ''))
              if (!exists) {
                const medicationEntry = {
                  name: med.name,
                  dosage: med.dosage || '',
                  unit: med.unit,
                  timing: med.hour && med.minute && med.ampm ? 
                    `${med.hour}:${med.minute} ${med.ampm}` : med.timing,
                  taken: item.status?.taken || false,
                  skipped: item.status?.skipped || false,
                  trigger: med.trigger || false
                }
                console.log(`        Adding unified scheduled medication to allMedications:`, medicationEntry)
                allMedications.push(medicationEntry)
              } else {
                console.log(`        Unified scheduled medication ${med.name} already exists, skipping`)
              }
            })
          }
        }
      } catch (e) {
        console.log(`    Unified medication system not available`)
      }
      
      // 5. Check daily medication statuses
      try {
        const dailyStatus = store.getDailyMedicationStatus?.(cycleId, day.cycleDay)
        if (dailyStatus?.daySpecificMedications) {
          console.log(`    Found ${dailyStatus.daySpecificMedications.length} daily status medications`)
          dailyStatus.daySpecificMedications.forEach(med => {
            console.log(`      Processing daily medication: ${med.name}, trigger: ${med.trigger}`)
            const existingIndex = allMedications.findIndex(existing => 
              existing.name === med.name && existing.dosage === med.dosage)
            const exists = existingIndex !== -1
            
            // If medication exists but this one has trigger=true and existing doesn't, replace it
            const shouldReplace = exists && med.trigger && !allMedications[existingIndex].trigger
            
            if (!exists || shouldReplace) {
              const medicationEntry = {
                name: med.name,
                dosage: med.dosage,
                unit: 'mg',
                timing: med.hour && med.minute && med.ampm ? 
                  `${med.hour}:${med.minute} ${med.ampm}` : undefined,
                taken: med.taken,
                skipped: med.skipped,
                trigger: med.trigger || false
              }
              if (shouldReplace) {
                console.log(`        Replacing existing medication with trigger version:`, medicationEntry)
                allMedications[existingIndex] = medicationEntry
              } else {
                console.log(`        Adding daily medication to allMedications:`, medicationEntry)
                allMedications.push(medicationEntry)
              }
            } else {
              console.log(`        Daily medication ${med.name} already exists, skipping`)
            }
          })
        }
      } catch (e) {
        console.log(`    Daily medication status not available`)
      }
      
      console.log(`    Total medications found for day ${day.cycleDay}: ${allMedications.length}`)
      
      const finalDay = {
        ...day,
        medications: allMedications.length > 0 ? allMedications : undefined
      }
      
      if (day.cycleDay === 13) {
        console.log(`🔧 Final Day 13 object:`, finalDay)
        console.log(`🔧 Day 13 medications:`, finalDay.medications)
      }
      
      return finalDay
    })
  }
  
  const totalMeds = enhancedCycle.days.reduce((sum, d) => sum + (d.medications?.length || 0), 0)
  const daysWithMeds = enhancedCycle.days.filter(d => d.medications && d.medications.length > 0).length
  
  console.log(`💊 Enhanced cycle ${cycle.name} with medications:`, {
    totalDays: enhancedCycle.days.length,
    daysWithMeds,
    totalMedications: totalMeds
  })
  
  return enhancedCycle
}

/**
 * Get all user cycles with medication data included
 */
export function getAllCyclesWithMedications(): CycleWithMedications[] {
  const store = useIVFStore.getState()
  
  return store.cycles
    .map(cycle => getCycleWithMedications(cycle.id))
    .filter((cycle): cycle is CycleWithMedications => cycle !== null)
}