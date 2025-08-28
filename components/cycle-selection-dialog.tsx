"use client"

import { 
  Calendar, 
  Trophy, 
  Check,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { IVFCycle, PublicCycle } from '@/lib/types'

interface CycleOption {
  cycle: IVFCycle | PublicCycle
  value: number
  rank: number
}

interface CycleSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (cycle: CycleOption) => void
  cycles: CycleOption[]
  username: string
  displayName?: string
  metric: string
  metricLabel: string
}

export function CycleSelectionDialog({
  isOpen,
  onClose,
  onSelect,
  cycles,
  username,
  displayName,
  metric,
  metricLabel
}: CycleSelectionDialogProps) {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCycleTypeDisplay = (cycle: IVFCycle | PublicCycle) => {
    if (cycle.cycleGoal === 'transfer') {
      if (cycle.cycleType === 'frozen-modified-natural') return 'Modified Natural FET'
      if (cycle.cycleType === 'frozen-medicated') return 'Medicated FET'
      if (cycle.cycleType === 'frozen-natural') return 'Natural FET'
      return 'FET'
    }
    return cycle.cycleType
  }

  const getSuccessDisplay = (cycle: IVFCycle | PublicCycle) => {
    if (cycle.cycleGoal === 'transfer') {
      const outcome = 'outcome' in cycle ? cycle.outcome : undefined
      if (outcome?.liveBirth === 'yes') return 'Live Birth'
      if (outcome?.transferStatus === 'successful') return 'Ongoing Pregnancy'
      return 'Successful'
    }
    return `${metric === 'mature-eggs' ? 'Mature Eggs' : 
            metric === 'blastocysts' ? 'Blastocysts' : 
            'Euploids'}: ${cycles[0].value}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Multiple Best Cycles Found
          </DialogTitle>
          <DialogDescription>
            {displayName || username} has {cycles.length} cycles tied for best {metricLabel.toLowerCase()}. 
            Choose which one to compare against:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {cycles.map((cycleOption, index) => {
            const cycle = cycleOption.cycle
            return (
              <Card key={cycle.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg">{cycle.name}</h4>
                        <Badge variant="outline">Cycle #{cycleOption.rank}</Badge>
                        <Badge variant="secondary">{getCycleTypeDisplay(cycle)}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(cycle.startDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          {getSuccessDisplay(cycle)}
                        </div>
                      </div>

                      {cycle.cycleGoal === 'transfer' && 'outcome' in cycle && cycle.outcome?.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          {cycle.outcome.notes}
                        </p>
                      )}

                      {cycle.cycleGoal === 'retrieval' && 'outcome' in cycle && cycle.outcome && (
                        <div className="text-sm space-y-1">
                          <div className="flex gap-4">
                            <span>Eggs Retrieved: {cycle.outcome.eggsRetrieved || 'N/A'}</span>
                            <span>Mature: {cycle.outcome.matureEggs || 'N/A'}</span>
                            <span>Blastocysts: {cycle.outcome.blastocysts || 'N/A'}</span>
                            <span>Euploids: {cycle.outcome.euploidBlastocysts || 'N/A'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => onSelect(cycleOption)}
                      variant="default"
                      className="ml-4"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Compare This One
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-800 font-medium">Why choose?</p>
              <p className="text-blue-700">
                Each cycle may have used different protocols, medications, or timing. 
                Comparing the most relevant one gives you better insights for your own treatment planning.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}