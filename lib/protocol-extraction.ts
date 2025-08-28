import type { IVFCycle, PublicCycle, CycleDay } from './types'

export interface ExtractedProtocolDetails {
  // Transfer cycle details
  fetType?: 'natural' | 'modified-natural' | 'medicated'
  lhMonitoring?: boolean
  ovulationTiming?: string
  transferDay?: number
  baselineE2?: number
  
  // Retrieval cycle details  
  stimDuration?: number
  medications?: Array<{
    name: string
    totalUnits?: number
    dailyDose?: number
    days?: number
  }>
  triggerType?: string
  triggerTiming?: string
  triggerDay?: number
  baselineE2?: number
  peakE2?: number
  
  // Common details
  monitoringVisits?: number
  specialNotes?: string[]
}

export function extractProtocolDetails(cycle: IVFCycle | PublicCycle): ExtractedProtocolDetails {
  // Check if cycle already has protocolDetails (for mock data compatibility)
  const existingProtocol = (cycle as any).protocolDetails
  if (existingProtocol) {
    console.log(`📋 Using existing protocol details for cycle "${cycle.name}":`, existingProtocol)
    const enhancedProtocol = {
      ...existingProtocol,
      fetType: existingProtocol.fetType || (cycle.cycleType?.includes('natural') 
        ? (cycle.cycleType.includes('modified') ? 'modified-natural' : 'natural')
        : 'medicated'),
      lhMonitoring: existingProtocol.lhMonitoring ?? cycle.cycleType?.includes('natural'),
      transferDay: existingProtocol.transferDay
    }
    console.log(`📋 Enhanced protocol details:`, enhancedProtocol)
    return enhancedProtocol
  }
  
  if (!cycle.days || cycle.days.length === 0) {
    return {}
  }

  const details: ExtractedProtocolDetails = {}
  const notes: string[] = []

  if (cycle.cycleGoal === 'transfer') {
    // Extract FET protocol details
    details.fetType = cycle.cycleType?.includes('natural') 
      ? (cycle.cycleType.includes('modified') ? 'modified-natural' : 'natural')
      : 'medicated'
    
    // Check for LH monitoring
    const lhTests = cycle.days.filter(day => 
      day.bloodwork?.some(test => 
        test.test?.toLowerCase().includes('lh') && parseFloat(test.value) > 0
      )
    )
    details.lhMonitoring = lhTests.length > 0
    
    // Find LH surge for ovulation timing
    const lhSurge = cycle.days.find(day => 
      day.bloodwork?.some(test => 
        test.test?.toLowerCase().includes('lh') && parseFloat(test.value) > 15
      )
    )
    if (lhSurge) {
      details.ovulationTiming = `Day ${lhSurge.cycleDay} (LH: ${lhSurge.bloodwork?.find(b => b.test?.toLowerCase().includes('lh'))?.value})`
    }
    
    // Find transfer day
    const transferDay = cycle.days.find(day => 
      day.clinicVisit?.type === 'transfer'
    )
    if (transferDay) {
      details.transferDay = transferDay.cycleDay
    }
    
    // Extract support medications for transfers (Letrozole, Medrol, PIO, Estrace, etc.)
    const medicationDays = cycle.days.filter(day => 
      day.medications && day.medications.length > 0
    )
    
    if (medicationDays.length > 0) {
      // Aggregate support medications
      const medicationMap = new Map<string, { totalUnits: number, days: number, dailyDoses: number[] }>()
      
      medicationDays.forEach(day => {
        day.medications?.forEach(med => {
          const name = med.name
          const dose = parseFloat(med.dosage) || 0
          
          if (!medicationMap.has(name)) {
            medicationMap.set(name, { totalUnits: 0, days: 0, dailyDoses: [] })
          }
          
          const medData = medicationMap.get(name)!
          medData.totalUnits += dose
          medData.days += 1
          medData.dailyDoses.push(dose)
        })
      })
      
      details.medications = Array.from(medicationMap.entries()).map(([name, data]) => ({
        name,
        totalUnits: data.totalUnits,
        dailyDose: Math.round(data.totalUnits / data.days * 100) / 100, // Round to 2 decimals
        days: data.days
      }))
      
    }
    
    // Get baseline E2
    const baselineDay = cycle.days.find(day => 
      day.clinicVisit?.type === 'baseline' && 
      day.bloodwork?.some(test => test.test?.toLowerCase().includes('estradiol') || test.test?.toLowerCase().includes('e2'))
    )
    if (baselineDay) {
      const e2Test = baselineDay.bloodwork?.find(test => 
        test.test?.toLowerCase().includes('estradiol') || test.test?.toLowerCase().includes('e2')
      )
      if (e2Test) {
        details.baselineE2 = parseFloat(e2Test.value)
      }
    }

  } else if (cycle.cycleGoal === 'retrieval') {
    // Extract retrieval protocol details
    
    // Find stim medications
    const medicationDays = cycle.days.filter(day => 
      day.medications && day.medications.length > 0
    )
    
    if (medicationDays.length > 0) {
      details.stimDuration = medicationDays.length
      
      // Aggregate medications
      const medicationMap = new Map<string, { totalUnits: number, days: number, dailyDoses: number[] }>()
      
      medicationDays.forEach(day => {
        day.medications?.forEach(med => {
          const name = med.name
          const dose = parseFloat(med.dosage) || 0
          
          if (!medicationMap.has(name)) {
            medicationMap.set(name, { totalUnits: 0, days: 0, dailyDoses: [] })
          }
          
          const medData = medicationMap.get(name)!
          medData.totalUnits += dose
          medData.days += 1
          medData.dailyDoses.push(dose)
        })
      })
      
      details.medications = Array.from(medicationMap.entries()).map(([name, data]) => ({
        name,
        totalUnits: data.totalUnits,
        dailyDose: Math.round(data.totalUnits / data.days),
        days: data.days
      }))
    }
    
    // Find trigger information - check for trigger medications first, then fallback to notes
    console.log(`🔍 Looking for trigger medications in cycle: ${cycle.name}`)
    console.log(`🔍 Cycle has ${cycle.days?.length || 0} days`)
    
    // Debug: Check what medications exist on each day
    cycle.days?.forEach(day => {
      if (day.medications && day.medications.length > 0) {
        console.log(`🔍 Day ${day.cycleDay}: ${day.medications.length} medications`)
        day.medications.forEach(med => {
          console.log(`   - ${med.name} (trigger: ${med.trigger}, type: ${typeof med.trigger})`)
          console.log(`     Full med object:`, med)
        })
      }
    })
    
    let triggerDay = cycle.days.find(day => {
      if (day.medications && day.medications.length > 0) {
        const hasTrigger = day.medications.some(med => {
          console.log(`🔍 Checking med ${med.name}: trigger=${med.trigger}, truthy=${!!med.trigger}`)
          return med.trigger
        })
        console.log(`🔍 Day ${day.cycleDay} has trigger medication: ${hasTrigger}`)
        return hasTrigger
      }
      return false
    })
    console.log(`🔍 Found trigger day:`, triggerDay ? `Day ${triggerDay.cycleDay}` : 'None')
    
    // Fallback to notes-based detection if no trigger medication found
    if (!triggerDay) {
      triggerDay = cycle.days.find(day => 
        day.clinicVisit?.type === 'monitoring' && 
        (day.notes?.toLowerCase().includes('trigger') || 
         day.clinicVisit?.notes?.toLowerCase().includes('trigger'))
      )
    }
    
    if (triggerDay) {
      details.triggerDay = triggerDay.cycleDay
      
      // Check if we have trigger medications with specific names
      const triggerMedication = triggerDay.medications?.find(med => med.trigger)
      if (triggerMedication) {
        const medName = triggerMedication.name.toLowerCase()
        if (medName.includes('lupron')) {
          details.triggerType = 'lupron'
        } else if (medName.includes('pregnyl') || medName.includes('novarel')) {
          details.triggerType = 'hcg-only'
        } else if (medName.includes('ovidrel')) {
          details.triggerType = 'hcg-only'
        } else {
          details.triggerType = 'trigger'
        }
      } else {
        // Fallback to note-based detection
        const triggerInfo = (triggerDay.notes || triggerDay.clinicVisit?.notes || '').toLowerCase()
        
        if (triggerInfo.includes('lupron')) {
          details.triggerType = 'lupron'
        } else if (triggerInfo.includes('dual')) {
          details.triggerType = 'dual-trigger'
        } else if (triggerInfo.includes('hcg')) {
          details.triggerType = 'hcg-only'
        } else {
          details.triggerType = 'trigger'
        }
      }
      
      const triggerInfo = (triggerDay.notes || triggerDay.clinicVisit?.notes || '').toLowerCase()
      if (triggerInfo.includes('evening') || triggerInfo.includes('night')) {
        details.triggerTiming = `day-${triggerDay.cycleDay}-evening`
      } else {
        details.triggerTiming = `day-${triggerDay.cycleDay}`
      }
    }
    
    // Get baseline and peak E2
    const baselineDay = cycle.days.find(day => 
      day.clinicVisit?.type === 'baseline' && 
      day.bloodwork?.some(test => test.test?.toLowerCase().includes('estradiol') || test.test?.toLowerCase().includes('e2'))
    )
    if (baselineDay) {
      const e2Test = baselineDay.bloodwork?.find(test => 
        test.test?.toLowerCase().includes('estradiol') || test.test?.toLowerCase().includes('e2')
      )
      if (e2Test) {
        details.baselineE2 = parseFloat(e2Test.value)
      }
    }
    
    // Find peak E2 (highest value)
    let peakE2 = 0
    cycle.days.forEach(day => {
      const e2Test = day.bloodwork?.find(test => 
        test.test?.toLowerCase().includes('estradiol') || test.test?.toLowerCase().includes('e2')
      )
      if (e2Test && parseFloat(e2Test.value) > peakE2) {
        peakE2 = parseFloat(e2Test.value)
      }
    })
    if (peakE2 > 0) {
      details.peakE2 = peakE2
    }
  }
  
  // Count monitoring visits
  details.monitoringVisits = cycle.days.filter(day => 
    day.clinicVisit?.type === 'monitoring'
  ).length
  
  // Collect special notes
  cycle.days.forEach(day => {
    if (day.notes && day.notes.trim()) {
      notes.push(`Day ${day.cycleDay}: ${day.notes}`)
    }
    if (day.clinicVisit?.notes && day.clinicVisit.notes.trim()) {
      notes.push(`Day ${day.cycleDay}: ${day.clinicVisit.notes}`)
    }
  })
  
  if (notes.length > 0) {
    details.specialNotes = notes
  }
  
  return details
}

export function formatProtocolSummary(details: ExtractedProtocolDetails, cycleGoal: string): string {
  if (cycleGoal === 'transfer') {
    const parts = []
    if (details.fetType) {
      parts.push(`${details.fetType} FET`)
    }
    if (details.ovulationTiming) {
      parts.push(`Ovulation: ${details.ovulationTiming}`)
    }
    if (details.transferDay) {
      parts.push(`Transfer: Day ${details.transferDay}`)
    }
    return parts.join(', ') || 'Transfer cycle'
  } else {
    const parts = []
    if (details.stimDuration) {
      parts.push(`${details.stimDuration} days stim`)
    }
    if (details.triggerType) {
      parts.push(`${details.triggerType} trigger`)
    }
    if (details.medications && details.medications.length > 0) {
      parts.push(`${details.medications.length} medications`)
    }
    return parts.join(', ') || 'Retrieval cycle'
  }
}