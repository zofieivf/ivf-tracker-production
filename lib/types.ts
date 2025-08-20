export interface CycleDay {
  id: string
  date: string
  cycleDay: number
  // medications removed - now handled via dailyMedicationStatuses
  clinicVisit?: ClinicVisit
  follicleSizes?: FollicleMeasurement
  bloodwork?: BloodworkResult[]
  notes?: string
}


export interface ScheduledMedication {
  id: string
  name: string
  dosage: string
  hour: string
  minute: string
  ampm: string
  refrigerated: boolean
  startDay: number // cycle day to start
  endDay: number // cycle day to end
  notes?: string
}

export interface MedicationSchedule {
  id: string
  cycleId: string
  medications: ScheduledMedication[]
  createdAt: string
  updatedAt?: string
}

export interface DailyMedicationStatus {
  id: string
  cycleId: string
  cycleDay: number
  date: string
  medications: {
    scheduledMedicationId: string
    taken: boolean
    actualDosage?: string // if different from scheduled
    takenAt?: string // timestamp when marked as taken
    skipped: boolean
    notes?: string
  }[]
  daySpecificMedications?: {
    id: string
    name: string
    dosage: string
    hour: string
    minute: string
    ampm: string
    refrigerated: boolean
    taken: boolean
    takenAt?: string
    skipped: boolean
    notes?: string
  }[]
  createdAt: string
  updatedAt?: string
}

export interface ClinicVisit {
  type: "baseline" | "monitoring" | "retrieval" | "transfer" | "beta" | "iui" | "other"
  notes?: string
  betaHcgValue?: number
  betaHcgUnit?: string
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
}

export interface TransferEmbryo {
  id: string
  embryoDetails: "day3-embryo" | "day5-blastocyst" | "day6-blastocyst" | "day7-blastocyst"
  embryoGrade?: string
  pgtATested?: "euploid" | "mosaic" | "not-tested" | "inconclusive"
  embryoSex?: "M" | "F"
  retrievalCycleId?: string
}

export interface UserProfile {
  id: string
  location?: string
  dateOfBirth: string
  ivfReasons: ("low-amh" | "dor" | "premature-ovarian-failure" | "endo" | "pcos" | "blocked-fallopian-tubes" | "secondary-infertility" | "same-sex" | "genetic-reasons" | "antiphospholipid-syndrome" | "male-factor" | "other")[]
  ivfReasonOther?: string
  livingChildren: number
  childrenFromIVF?: "yes" | "no"
  numberOfIVFChildren?: number
  regularPeriods?: "yes" | "no"
  menstrualCycleDays?: number
  createdAt: string
}

export interface CycleCosts {
  cycleCost?: number
  pgtCost?: number
  medicationsCost?: number
  storageCost?: number
  insuranceCoverage?: number
}

export interface IVFCycle {
  id: string
  name: string
  startDate: string
  endDate?: string
  dateOfBirth?: string
  ageAtStart?: number
  cycleType: "antagonist" | "long-lupron" | "microdose-flare" | "mini-ivf" | "other" | "fresh" | "frozen-medicated" | "frozen-modified-natural" | "frozen-natural"
  cycleGoal: "retrieval" | "transfer" | "iui"
  donorEggs?: "donor" | "own"
  numberOfEmbryos?: number
  embryos?: TransferEmbryo[]
  status: "active" | "completed" | "cancelled"
  days: CycleDay[]
  outcome?: CycleOutcome
  costs?: CycleCosts
}

export interface EmbryoGrade {
  id: string
  day3Grade?: string
  day5Grade?: string
  day6Grade?: string
  day7Grade?: string
  pgtA?: "Euploid" | "Mosaic" | "Aneuploid" | "Inconclusive"
  pgtADetails?: string // For specific chromosome anomalies (e.g., "+21", "-16", "mosaic 45,X/46,XX")
  sex?: string
  pgtM?: string
  pgtMDetails?: string // For specific mutations detected/not detected
  pgtSR?: string
  pgtSRDetails?: string // For specific structural rearrangements
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
  | "Antiphospholipid Syndrome"
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
  cost?: number
  insuranceCoverage?: number
}

export interface NaturalPregnancy {
  id: string
  dateOfConception: string
  ageAtConception?: number
  dueDateOrBirthDate: string
  isDateOfBirth: boolean // true if it's date of birth, false if it's due date
  pregnancyOutcome?: "ongoing" | "live-birth" | "miscarriage" | "medical-termination"
  outcomeDate?: string // Date of miscarriage, termination, or birth
  reason?: string // Reason for miscarriage or termination
  notes?: string
  createdAt: string
  updatedAt?: string
}
