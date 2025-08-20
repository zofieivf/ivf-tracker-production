/**
 * Clean Medication System - New Design
 * 
 * This replaces the complex legacy medication system with a simple, unified approach.
 * All medications (scheduled and one-time) use the same data model and interface.
 */

// Core medication entity
export interface Medication {
  id: string
  cycleId: string
  cycleDay: number
  
  // Medication details
  name: string
  dosage: string
  time: string // "08:00 AM" format
  refrigerated: boolean
  
  // Type distinction
  type: "scheduled" | "one-time"
  
  // For scheduled medications only
  startDay?: number
  endDay?: number
  
  // Tracking status
  taken: boolean
  skipped: boolean
  takenAt?: string // ISO timestamp when actually taken
  notes?: string
  
  // Metadata
  createdAt: string
  updatedAt?: string
}

// View models for components
export interface DayMedications {
  cycleDay: number
  date: string
  medications: Medication[]
  completed: number
  total: number
}

export interface MedicationScheduleEntry {
  medication: Medication
  activeDays: number[] // Which days this medication is active
  completionRate: number // 0-1
}

// Common medication names for dropdowns
export const COMMON_MEDICATIONS = [
  "Gonal-F",
  "Menopur", 
  "Cetrotide",
  "Lupron",
  "Estrace",
  "Progesterone",
  "Follistim",
  "Ganirelix",
  "Ovidrel",
  "Pregnyl",
  "Crinone",
  "Endometrin",
  "Medrol",
  "Estradiol",
  "Prometrium Inserts",
  "Progesterone in Oil (PIO)"
] as const

// Medication templates for quick setup
export interface MedicationTemplate {
  name: string
  dosage: string
  time: string
  refrigerated: boolean
  startDay: number
  endDay: number
}

export const MEDICATION_TEMPLATES = {
  "antagonist-protocol": [
    { name: "Gonal-F", dosage: "225 IU", time: "08:00 PM", refrigerated: true, startDay: 1, endDay: 10 },
    { name: "Menopur", dosage: "150 IU", time: "08:00 PM", refrigerated: false, startDay: 1, endDay: 10 },
    { name: "Cetrotide", dosage: "0.25 mg", time: "08:00 PM", refrigerated: true, startDay: 6, endDay: 10 }
  ],
  "lupron-protocol": [
    { name: "Lupron", dosage: "10 units", time: "08:00 PM", refrigerated: true, startDay: 1, endDay: 14 }
  ],
  "transfer-protocol": [
    { name: "Medrol", dosage: "16 mg", time: "08:00 AM", refrigerated: false, startDay: 1, endDay: 5 },
    { name: "Estradiol", dosage: "2 mg", time: "08:00 AM", refrigerated: false, startDay: 1, endDay: 10 },
    { name: "Progesterone in Oil (PIO)", dosage: "1 mL", time: "08:00 PM", refrigerated: false, startDay: 1, endDay: 10 }
  ]
} as const

// Utility functions
export function parseTime(timeString: string): { hour: number; minute: number; ampm: 'AM' | 'PM' } {
  const [time, ampm] = timeString.split(' ')
  const [hour, minute] = time.split(':').map(Number)
  return { hour, minute, ampm: ampm as 'AM' | 'PM' }
}

export function formatTime(hour: number, minute: number, ampm: 'AM' | 'PM'): string {
  const h = hour.toString().padStart(2, '0')
  const m = minute.toString().padStart(2, '0')
  return `${h}:${m} ${ampm}`
}

export function createMedicationId(): string {
  return crypto.randomUUID()
}

export function isMedicationActiveOnDay(medication: Medication, cycleDay: number): boolean {
  if (medication.type === "one-time") {
    return medication.cycleDay === cycleDay
  }
  
  if (medication.type === "scheduled") {
    return (medication.startDay || 1) <= cycleDay && cycleDay <= (medication.endDay || cycleDay)
  }
  
  return false
}

export function getMedicationCompletionRate(medications: Medication[]): number {
  if (medications.length === 0) return 0
  const completed = medications.filter(m => m.taken || m.skipped).length
  return completed / medications.length
}

export function groupMedicationsByTime(medications: Medication[]): {
  morning: Medication[]
  afternoon: Medication[]
  evening: Medication[]
} {
  const morning: Medication[] = []
  const afternoon: Medication[] = []
  const evening: Medication[] = []
  
  medications.forEach(med => {
    const { hour, ampm } = parseTime(med.time)
    
    if (ampm === 'AM' || (ampm === 'PM' && hour === 12)) {
      morning.push(med)
    } else if (hour < 6) {
      afternoon.push(med)
    } else {
      evening.push(med)
    }
  })
  
  return { morning, afternoon, evening }
}