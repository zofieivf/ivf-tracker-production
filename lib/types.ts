export interface CycleDay {
  id: string
  date: string
  cycleDay: number
  medications: Medication[]
  clinicVisit?: ClinicVisit
  follicleSizes?: FollicleMeasurement
  bloodwork?: BloodworkResult[]
  notes?: string
}

export interface Medication {
  name: string
  dosage?: string
  taken: boolean
  refrigerated?: boolean
}

export interface ClinicVisit {
  type: "baseline" | "monitoring" | "consult" | "retrieval" | "transfer" | "other"
  notes?: string
}

export interface FollicleMeasurement {
  left: number[]
  right: number[]
  liningThickness?: number
}

export interface BloodworkResult {
  test: string
  value: string
  unit?: string
  reference?: string
}

export interface IVFCycle {
  id: string
  name: string
  startDate: string
  endDate?: string
  dateOfBirth?: string
  ageAtStart?: number
  cycleType: "standard" | "mini" | "natural" | "antagonist" | "long" | "other"
  status: "active" | "completed" | "cancelled"
  days: CycleDay[]
  outcome?: CycleOutcome
}

export interface CycleOutcome {
  eggsRetrieved?: number
  matureEggs?: number
  fertilized?: number
  day3Embryos?: number
  day5Blasts?: number
  pgtTested?: number
  pgtNormal?: number
  transferred?: number
  frozen?: number
  outcome?: "positive" | "negative" | "chemical" | "miscarriage" | "ongoing"
}
