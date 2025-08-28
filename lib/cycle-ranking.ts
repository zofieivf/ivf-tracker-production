import type { IVFCycle, PublicCycle, CycleMetricOption, BestCycleComparison } from './types'
import { getCycleWithMedications, type CycleWithMedications } from './cycle-with-medications'

// Available metrics for comparison - separate metrics for different cycle types
export const CYCLE_METRICS: CycleMetricOption[] = [
  // Retrieval cycle metrics
  {
    key: 'mature-eggs', 
    label: 'Mature Eggs',
    description: 'Number of mature (MII) eggs - the foundation of a successful cycle',
    availableFor: ['retrieval'],
    requiresOutcome: true
  },
  {
    key: 'blastocysts',
    label: 'Blastocysts',
    description: 'Number of embryos that reached blastocyst stage - quality indicator',
    availableFor: ['retrieval'],
    requiresOutcome: true
  },
  {
    key: 'euploids',
    label: 'Euploid Embryos',
    description: 'Number of chromosomally normal embryos - your transferable options',
    availableFor: ['retrieval'],
    requiresOutcome: true
  },
  // Transfer cycle metrics
  {
    key: 'transfer-success',
    label: 'Transfer Success',
    description: 'Positive beta HCG (pregnancy achieved) - the only metric that matters for transfers',
    availableFor: ['transfer'],
    requiresOutcome: true
  }
]

// Get metric value from a cycle
export function getCycleMetricValue(
  cycle: IVFCycle | PublicCycle, 
  metric: CycleMetricOption['key']
): number {
  const outcome = 'outcome' in cycle ? cycle.outcome : undefined
  
  if (!outcome) return 0
  
  switch (metric) {
    case 'mature-eggs':
      return outcome.matureEggs || 0
    case 'blastocysts':
      return outcome.blastocysts || 0
    case 'euploids':
      return outcome.euploidBlastocysts || 0
    case 'transfer-success':
      // For transfers, success is binary: 1 for positive beta HCG, 0 for negative
      // Transfer success is determined by:
      // 1. Explicit success status, OR
      // 2. Meaningful beta HCG levels (>= 25 is typically considered positive)
      return (outcome.transferStatus === 'successful' || 
              outcome.liveBirth === 'yes' ||
              (outcome.betaHcg1 && outcome.betaHcg1 >= 25) || 
              (outcome.betaHcg2 && outcome.betaHcg2 >= 25)) ? 1 : 0
    default:
      return 0
  }
}

// Find the best cycle(s) for a user based on a metric
export function findBestCycles(
  cycles: (IVFCycle | PublicCycle)[],
  metric: CycleMetricOption['key']
): { cycles: { cycle: IVFCycle | PublicCycle; value: number; rank: number }[]; hasTies: boolean } | null {
  
  // Filter cycles that have outcome data and match the metric requirements
  const validCycles = cycles.filter(cycle => {
    const hasOutcome = 'outcome' in cycle && cycle.outcome
    const isRetrievalCycle = cycle.cycleGoal === 'retrieval'
    const isTransferCycle = cycle.cycleGoal === 'transfer'
    
    // Retrieval metrics are only for retrieval cycles
    if (['mature-eggs', 'blastocysts', 'euploids'].includes(metric)) {
      return hasOutcome && isRetrievalCycle
    }
    
    // Transfer success metric is only for transfer cycles
    if (metric === 'transfer-success') {
      return hasOutcome && isTransferCycle
    }
    
    return hasOutcome
  })
  
  if (validCycles.length === 0) return null
  
  // Find the highest value for this metric
  let bestValue = 0
  validCycles.forEach(cycle => {
    const value = getCycleMetricValue(cycle, metric)
    if (value > bestValue) {
      bestValue = value
    }
  })
  
  // Find all cycles that achieved this best value
  const bestCycles = validCycles.filter(cycle => 
    getCycleMetricValue(cycle, metric) === bestValue
  )
  
  // Sort cycles chronologically to get ranks
  const allCycles = cycles.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  
  // Map to include rank information
  const bestCyclesWithRanks = bestCycles.map(cycle => ({
    cycle,
    value: bestValue,
    rank: allCycles.findIndex(c => c.id === cycle.id) + 1
  }))
  
  // Sort by date (most recent first for display)
  bestCyclesWithRanks.sort((a, b) => 
    new Date(b.cycle.startDate).getTime() - new Date(a.cycle.startDate).getTime()
  )
  
  return {
    cycles: bestCyclesWithRanks,
    hasTies: bestCyclesWithRanks.length > 1
  }
}

// Backward compatibility function - returns the first best cycle
export function findBestCycle(
  cycles: (IVFCycle | PublicCycle)[],
  metric: CycleMetricOption['key']
): { cycle: IVFCycle | PublicCycle; value: number; rank: number } | null {
  const result = findBestCycles(cycles, metric)
  return result?.cycles[0] || null
}

// Compare best cycles between two users - now handles ties and includes medication data
export function compareBestCycles(
  yourCycles: (IVFCycle | PublicCycle)[],
  theirCycles: (IVFCycle | PublicCycle)[],
  metric: CycleMetricOption['key']
): BestCycleComparison | null {
  
  const yourBest = findBestCycle(yourCycles, metric)
  const theirBest = findBestCycle(theirCycles, metric)
  
  if (!yourBest || !theirBest) return null
  
  // Ensure we're comparing the same cycle types
  if (yourBest.cycle.cycleGoal !== theirBest.cycle.cycleGoal) {
    return null // Cannot compare different cycle types (retrieval vs transfer)
  }
  
  // Enhance your cycle with medication data if it's from live app (has id field)
  let yourEnhancedCycle = yourBest.cycle as PublicCycle
  if ('id' in yourBest.cycle && yourBest.cycle.id) {
    const enhanced = getCycleWithMedications(yourBest.cycle.id)
    if (enhanced) {
      yourEnhancedCycle = {
        ...yourBest.cycle,
        days: enhanced.days
      } as PublicCycle
      console.log(`✅ Enhanced your cycle "${yourBest.cycle.name}" with medication data`)
    } else {
      console.log(`⚠️ Could not enhance your cycle "${yourBest.cycle.name}" with medication data`)
    }
  }
  
  const difference = yourBest.value - theirBest.value
  const percentageDifference = theirBest.value === 0 ? 
    (yourBest.value > 0 ? 100 : 0) : 
    Math.round((difference / theirBest.value) * 100)
  
  let winner: 'you' | 'them' | 'tie' = 'tie'
  if (yourBest.value > theirBest.value) winner = 'you'
  else if (theirBest.value > yourBest.value) winner = 'them'
  
  return {
    metric,
    yourBestCycle: {
      cycle: yourEnhancedCycle,
      value: yourBest.value,
      rank: yourBest.rank
    },
    theirBestCycle: {
      cycle: theirBest.cycle as PublicCycle,
      value: theirBest.value,  
      rank: theirBest.rank
    },
    comparison: {
      winner,
      difference: Math.abs(difference),
      percentageDifference: Math.abs(percentageDifference)
    }
  }
}

// Get available metrics for a set of cycles - ensures both users have the same cycle types
export function getAvailableMetrics(cycles: (IVFCycle | PublicCycle)[]): CycleMetricOption[] {
  const hasRetrievalCycles = cycles.some(c => c.cycleGoal === 'retrieval')
  const hasTransferCycles = cycles.some(c => c.cycleGoal === 'transfer')
  const hasOutcomes = cycles.some(c => 'outcome' in c && c.outcome)
  
  return CYCLE_METRICS.filter(metric => {
    // Check if cycles support this metric
    const cycleGoalsMatch = metric.availableFor.some(goal => 
      cycles.some(c => c.cycleGoal === goal)
    )
    
    // Check if outcomes are available when required
    const outcomeRequirement = !metric.requiresOutcome || hasOutcomes
    
    return cycleGoalsMatch && outcomeRequirement
  })
}

// Get available metrics for comparison between two users - only returns metrics where both have compatible cycles
export function getAvailableMetricsForComparison(
  yourCycles: (IVFCycle | PublicCycle)[],
  theirCycles: (IVFCycle | PublicCycle)[]
): CycleMetricOption[] {
  const yourCycleGoals = new Set(yourCycles.map(c => c.cycleGoal))
  const theirCycleGoals = new Set(theirCycles.map(c => c.cycleGoal))
  
  return CYCLE_METRICS.filter(metric => {
    // Both users must have cycles that support this metric
    const bothHaveCompatibleCycles = metric.availableFor.some(goal => 
      yourCycleGoals.has(goal as any) && theirCycleGoals.has(goal as any)
    )
    
    // Both must have outcome data if required
    const yourHaveOutcomes = yourCycles.some(c => 'outcome' in c && c.outcome)
    const theirHaveOutcomes = theirCycles.some(c => 'outcome' in c && c.outcome)
    const outcomeRequirement = !metric.requiresOutcome || (yourHaveOutcomes && theirHaveOutcomes)
    
    return bothHaveCompatibleCycles && outcomeRequirement
  })
}