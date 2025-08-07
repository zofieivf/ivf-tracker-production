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
  hour?: string
  minute?: string
  ampm?: string
  taken: boolean
  refrigerated?: boolean
}

export interface ClinicVisit {
  type: "baseline" | "monitoring" | "retrieval" | "transfer" | "other"
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
  cycleType: "antagonist" | "long-lupron" | "microdose-flare" | "mini-ivf" | "other" | "fresh" | "frozen-medicated" | "frozen-modified-natural" | "frozen-natural"
  cycleGoal: "retrieval" | "transfer"
  embryoDetails?: "day3-embryo" | "day5-blastocyst" | "day6-blastocyst" | "day7-blastocyst"
  embryoGrade?: string
  pgtATested?: "euploid" | "mosaic" | "not-tested"
  embryoSex?: "M" | "F"
  retrievalCycleId?: string
  status: "active" | "completed" | "cancelled"
  days: CycleDay[]
  outcome?: CycleOutcome
}

export interface EmbryoGrade {
  id: string
  day3Grade?: string
  day5Grade?: string
  day6Grade?: string
  day7Grade?: string
  pgtA?: "Euploid" | "Mosaic" | "Aneuploid"
  sex?: string
  pgtM?: string
  pgtSR?: string
}

export interface CycleOutcome {
  // For Retrieval cycles
  eggsRetrieved?: number
  matureEggs?: number
  fertilizationMethod?: "IVF" | "ICSI"
  fertilized?: number
  day3Embryos?: number
  day3EmbryoGrades?: EmbryoGrade[]
  blastocysts?: number
  euploidBlastocysts?: number
  frozen?: number
  embryosAvailableForTransfer?: number
  
  // For Transfer cycles
  betaHcg1?: number
  betaHcg1Day?: number
  betaHcg2?: number
  betaHcg2Day?: number
  transferStatus?: "successful" | "not-successful"
  liveBirth?: "yes" | "no"
}

export type FertilityProcedure = 
  | "Hysterosalpingogram (HSG)"
  | "Hysteroscopy (HSC)"
  | "Endometrial Biopsy/ CD138 Stain"
  | "RPL Bloodwork"
  | "ReceptivaDX"
  | "ERA"
  | "ALICE"
  | "Laparoscopic excision"
  | "Karotyping"
  | "Blood clotting (Leiden V Factor, MTHFR, PAI-1)"
  | "Thyroid panel"
  | "Uterine Biopsy"
  | "Immune panel"
  | "Prolactin (PRL)"
  | "Sonohysterogram"
  | "Polyp removal"
  | "Lymphocyte immunotherapy"
  | "Cytokine panel"
  | "Intralipids"
  | "Semen Analysis"
  | "Sperm DNA Fragmentation"
  | "Other"

export interface ProcedureRecord {
  id: string
  procedureType: FertilityProcedure
  customProcedureName?: string
  procedureDate: string
  clinicName?: string
  notes?: string
  results?: string
}
