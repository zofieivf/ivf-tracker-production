import type { IVFCycle, CycleDay } from './types'

// Your actual 5 cycles for comparison testing  
export const TEST_USER_CYCLES: IVFCycle[] = [
  // TRANSFER 2 (Successful)
  {
    "id": "b5e381e5-be0b-41b0-96da-5176cb0c9e76",
    "name": "Transfer 2",
    "startDate": "2024-03-12T05:00:00.000Z",
    "dateOfBirth": "1988-05-10T07:00:00.000Z",
    "ageAtStart": 35,
    "cycleType": "frozen-modified-natural",
    "cycleGoal": "transfer",
    "donorEggs": "own",
    "numberOfEmbryos": 1,
    "embryos": [
      {
        "id": "2826c5bb-eff5-4af6-b90b-3588bf212896",
        "embryoDetails": "day5-blastocyst",
        "embryoGrade": "4AB",
        "pgtATested": "euploid",
        "embryoSex": "M",
        "retrievalCycleId": "4a1daa70-19f6-4ce1-a27a-db058a275598"
      }
    ],
    "status": "completed",
    "days": [
      {
        "id": "b1cd4a4e-453a-457d-b9a6-cc02d29bba85",
        "cycleDay": 1,
        "date": "2024-03-12T05:00:00.000Z",
        "clinicVisit": {
          "type": "baseline",
          "notes": ""
        },
        "bloodwork": [
          {
            "test": "estradiol",
            "value": "41.9",
            "unit": "pg/mL"
          }
        ],
        "notes": "Modified natural FET baseline"
      },
      {
        "id": "1c209dcb-380f-4b86-910b-aba0f9b2e755",
        "cycleDay": 10,
        "date": "2024-03-21T05:00:00.000Z",
        "clinicVisit": {
          "type": "monitoring",
          "notes": ""
        },
        "bloodwork": [
          {
            "test": "lh",
            "value": "10.4",
            "unit": "mIU/mL"
          },
          {
            "test": "progesterone",
            "value": "0.29",
            "unit": "ng/mL"
          }
        ],
        "notes": "Monitoring natural cycle development"
      },
      {
        "id": "a2554fab-f53a-47b2-9f68-d0f186777e9b",
        "cycleDay": 14,
        "date": "2024-03-25T05:00:00.000Z",
        "clinicVisit": {
          "type": "monitoring",
          "notes": ""
        },
        "bloodwork": [
          {
            "test": "lh",
            "value": "12",
            "unit": "mIU/mL"
          },
          {
            "test": "progesterone",
            "value": "0.36",
            "unit": "ng/mL"
          }
        ]
      },
      {
        "id": "4a286acd-2b3b-4d64-bf2a-8194851f4770",
        "cycleDay": 17,
        "date": "2024-03-28T05:00:00.000Z",
        "clinicVisit": {
          "type": "monitoring",
          "notes": ""
        },
        "bloodwork": [
          {
            "test": "lh",
            "value": "20.7",
            "unit": "mIU/mL"
          },
          {
            "test": "progesterone",
            "value": "1.77",
            "unit": "ng/mL"
          }
        ],
        "medications": [
          {
            "name": "Medrol",
            "dosage": "16",
            "unit": "mg",
            "timing": "morning",
            "route": "oral"
          }
        ],
        "notes": "Natural LH surge detected - ovulation confirmed, starting Medrol"
      },
      {
        "id": "day-18",
        "cycleDay": 18,
        "date": "2024-03-29T05:00:00.000Z",
        "medications": [
          {
            "name": "Medrol",
            "dosage": "16",
            "unit": "mg",
            "timing": "morning",
            "route": "oral"
          }
        ]
      },
      {
        "id": "day-19",
        "cycleDay": 19,
        "date": "2024-03-30T05:00:00.000Z",
        "medications": [
          {
            "name": "Medrol",
            "dosage": "16",
            "unit": "mg",
            "timing": "morning",
            "route": "oral"
          }
        ]
      },
      {
        "id": "day-20",
        "cycleDay": 20,
        "date": "2024-03-31T05:00:00.000Z",
        "medications": [
          {
            "name": "Medrol",
            "dosage": "16",
            "unit": "mg",
            "timing": "morning",
            "route": "oral"
          },
          {
            "name": "Prometrium",
            "dosage": "200",
            "unit": "mg",
            "timing": "bedtime",
            "route": "vaginal"
          }
        ],
        "notes": "Starting Prometrium inserts"
      },
      {
        "id": "day-21",
        "cycleDay": 21,
        "date": "2024-04-01T05:00:00.000Z",
        "medications": [
          {
            "name": "Prometrium",
            "dosage": "200",
            "unit": "mg",
            "timing": "bedtime",
            "route": "vaginal"
          }
        ]
      },
      {
        "id": "transfer-day",
        "cycleDay": 22,
        "date": "2024-04-02T05:00:00.000Z",
        "clinicVisit": {
          "type": "transfer",
          "notes": ""
        },
        "medications": [
          {
            "name": "Prometrium",
            "dosage": "200",
            "unit": "mg",
            "timing": "bedtime",
            "route": "vaginal"
          }
        ],
        "notes": "Single 4AB euploid blastocyst transferred"
      },
      {
        "id": "beta-day-1",
        "date": "2024-04-16T05:00:00.000Z",
        "cycleDay": 36,
        "clinicVisit": {
          "type": "beta",
          "betaHcgValue": 2669.9,
          "betaHcgUnit": "mIU/mL"
        },
        "notes": "First beta - excellent level!"
      },
      {
        "id": "beta-day-2",
        "date": "2024-04-18T05:00:00.000Z",
        "cycleDay": 38,
        "clinicVisit": {
          "type": "beta",
          "betaHcgValue": 6529.1,
          "betaHcgUnit": "mIU/mL"
        },
        "notes": "Second beta - perfect doubling! Successful pregnancy."
      }
    ],
    "outcome": {
      "transferStatus": "successful",
      "liveBirth": "yes"
    },
    "costs": {
      "cycleCost": 4649,
      "medicationsCost": 154.91
    },
    "createdAt": "2024-03-12T05:00:00.000Z"
  },
  // TRANSFER 1 (Unsuccessful) 
  {
    "id": "c6ed9f22-8eca-4f0d-975b-000d26b0d4c7",
    "name": "Transfer 1",
    "startDate": "2024-01-12T08:00:00.000Z",
    "endDate": "2024-02-11T08:00:00.000Z",
    "dateOfBirth": "1988-05-10T07:00:00.000Z",
    "ageAtStart": 35,
    "cycleType": "frozen-modified-natural",
    "cycleGoal": "transfer",
    "donorEggs": "own",
    "numberOfEmbryos": 1,
    "embryos": [
      {
        "id": "44155ec0-4030-46f3-88cc-f2f7efc7b402",
        "embryoDetails": "day6-blastocyst",
        "embryoGrade": "6AA",
        "pgtATested": "euploid",
        "embryoSex": "M"
      }
    ],
    "status": "completed",
    "days": [
      {
        "id": "baseline-day",
        "cycleDay": 1,
        "date": "2024-01-12T08:00:00.000Z",
        "clinicVisit": {
          "type": "baseline"
        },
        "notes": "Baseline for modified natural FET"
      },
      {
        "id": "lh-surge-day",
        "cycleDay": 11,
        "date": "2024-01-22T08:00:00.000Z",
        "bloodwork": [
          {
            "test": "lh",
            "value": "45.4",
            "unit": "mIU/mL"
          },
          {
            "test": "progesterone",
            "value": "0.96",
            "unit": "ng/mL"
          }
        ],
        "clinicVisit": {
          "type": "monitoring"
        },
        "notes": "LH surge detected!"
      },
      {
        "id": "transfer-day",
        "cycleDay": 17,
        "date": "2024-01-28T08:00:00.000Z",
        "clinicVisit": {
          "type": "transfer"
        },
        "notes": "Single 6AA euploid blastocyst transferred"
      },
      {
        "id": "beta-day",
        "date": "2024-02-11T08:00:00.000Z",
        "cycleDay": 31,
        "clinicVisit": {
          "type": "beta",
          "betaHcgValue": 0,
          "betaHcgUnit": "mIU/mL"
        },
        "notes": "Negative beta - cycle unsuccessful"
      }
    ],
    "outcome": {
      "transferStatus": "not-successful",
      "liveBirth": "no"
    },
    "costs": {
      "cycleCost": 5959,
      "medicationsCost": 130
    },
    "createdAt": "2024-01-12T08:00:00.000Z"
  },
  // EGG RETRIEVAL 3 (2023)
  {
    "id": "f9005bd2-d6b3-4fd8-a5fb-f8e41807b066",
    "name": "Egg Retrieval 3",
    "startDate": "2023-06-28T07:00:00.000Z",
    "dateOfBirth": "1988-05-10T07:00:00.000Z",
    "ageAtStart": 35,
    "cycleType": "antagonist",
    "cycleGoal": "retrieval",
    "status": "completed",
    "days": [
      {
        "id": "baseline-day",
        "cycleDay": 1,
        "date": "2023-06-28T07:00:00.000Z",
        "clinicVisit": {
          "type": "baseline"
        },
        "notes": "Antagonist protocol baseline"
      },
      {
        "id": "monitoring-day-1",
        "cycleDay": 4,
        "date": "2023-07-01T07:00:00.000Z",
        "clinicVisit": {
          "type": "monitoring"
        },
        "bloodwork": [
          {
            "test": "estradiol",
            "value": "51.8",
            "unit": "pg/mL"
          }
        ],
        "notes": "Day 3 stims monitoring"
      },
      {
        "id": "retrieval-day",
        "date": "2023-07-14T07:00:00.000Z",
        "cycleDay": 17,
        "clinicVisit": {
          "type": "retrieval"
        },
        "notes": "Egg retrieval - 7 eggs retrieved, all mature (100% maturity!)"
      }
    ],
    "outcome": {
      "eggsRetrieved": 7,
      "matureEggs": 7,
      "fertilizationMethod": "ICSI",
      "fertilized": 7,
      "day3Embryos": 7,
      "blastocysts": 1,
      "euploidBlastocysts": 1,
      "frozen": 1,
      "notes": "Excellent maturity rate - 7/7 mature eggs, but only 1 made it to euploid blastocyst"
    },
    "costs": {
      "cycleCost": 17117,
      "medicationsCost": 3810.99,
      "storageCost": 795
    },
    "createdAt": "2023-06-28T07:00:00.000Z"
  },
  // EGG RETRIEVAL 1 (2022)
  {
    "id": "4a1daa70-19f6-4ce1-a27a-db058a275598",
    "name": "Egg Retrieval 1",
    "startDate": "2022-11-03T07:00:00.000Z",
    "dateOfBirth": "1988-05-10T07:00:00.000Z",
    "ageAtStart": 34,
    "cycleType": "antagonist",
    "cycleGoal": "retrieval",
    "status": "completed",
    "days": [
      {
        "id": "baseline-day",
        "date": "2022-11-03T07:00:00.000Z",
        "cycleDay": 1,
        "clinicVisit": {
          "type": "baseline"
        },
        "notes": "First IVF cycle baseline - antagonist protocol"
      },
      {
        "id": "monitoring-day-1",
        "cycleDay": 5,
        "date": "2022-11-07T08:00:00.000Z",
        "clinicVisit": {
          "type": "monitoring"
        },
        "bloodwork": [
          {
            "test": "estradiol",
            "value": "137.5",
            "unit": "pg/mL"
          }
        ],
        "notes": "Day 4 stims monitoring"
      },
      {
        "id": "trigger-day",
        "date": "2022-11-15T08:00:00.000Z",
        "cycleDay": 13,
        "bloodwork": [
          {
            "test": "lh",
            "value": "93.3",
            "unit": "mIU/mL"
          },
          {
            "test": "progesterone",
            "value": "5.51",
            "unit": "ng/mL"
          }
        ],
        "clinicVisit": {
          "type": "monitoring"
        },
        "notes": "Trigger day - Lupron 4mg trigger due to high E2"
      },
      {
        "id": "retrieval-day",
        "date": "2022-11-16T08:00:00.000Z",
        "cycleDay": 14,
        "clinicVisit": {
          "type": "retrieval"
        },
        "notes": "Egg retrieval - 7 eggs retrieved, 6 mature (86% maturity)"
      }
    ],
    "outcome": {
      "eggsRetrieved": 7,
      "matureEggs": 6,
      "fertilizationMethod": "ICSI",
      "fertilized": 6,
      "day3Embryos": 6,
      "blastocysts": 2,
      "euploidBlastocysts": 2,
      "frozen": 2,
      "notes": "First IVF cycle - good result with 2 euploid embryos from 7 eggs"
    },
    "costs": {
      "cycleCost": 8750,
      "medicationsCost": 4360
    },
    "createdAt": "2022-11-03T07:00:00.000Z"
  }
]

// Function to add test data to your store
export function addTestCycles(store: any) {
  TEST_USER_CYCLES.forEach(cycle => {
    store.addCycle(cycle)
  })
  
  console.log('✅ Added your actual 4 cycles for comprehensive comparisons!')
  console.log('')
  console.log('🏆 Your cycle summary:')
  console.log('📈 TRANSFERS (2):')
  console.log('• Transfer 2: Modified natural FET → Live birth ✅ (2024)')
  console.log('• Transfer 1: Modified natural FET → Unsuccessful ❌ (2024)') 
  console.log('')
  console.log('🥚 RETRIEVALS (2):')
  console.log('• Egg Retrieval 3: 7 eggs → 7 mature (100%!) → 1 euploid (2023)')
  console.log('• Egg Retrieval 1: 7 eggs → 6 mature (86%) → 2 euploids (2022)')
  console.log('')
  console.log('📊 Best by metric:')
  console.log('• Transfer Success: Transfer 2 (live birth)')
  console.log('• Mature Eggs: Egg Retrieval 3 (7 mature, perfect maturity)')
  console.log('• Euploids: Egg Retrieval 1 (2 euploids)')
  console.log('')
  console.log('🔬 Now you can compare:')
  console.log('• Transfer success vs Jessica\'s transfer cycles')
  console.log('• Retrieval metrics vs Jessica\'s retrieval cycles')
  console.log('• Protocol differences and strategy insights')
}