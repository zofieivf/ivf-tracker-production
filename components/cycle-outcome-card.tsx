"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { IVFCycle, EmbryoGrade } from "@/lib/types"
import { useIVFStore } from "@/lib/store"
import { v4 as uuidv4 } from "uuid"

// Schema for retrieval cycles
const retrievalFormSchema = z.object({
  eggsRetrieved: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: "Eggs retrieved cannot be negative"
    }),
  matureEggs: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: "Mature eggs cannot be negative"
    }),
  fertilizationMethod: z.enum(["IVF", "ICSI"]).optional(),
  fertilized: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: "Fertilized cannot be negative"
    }),
  day3Embryos: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: "Day 3 embryos cannot be negative"
    }),
  blastocysts: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: "Blastocysts cannot be negative"
    }),
  euploidBlastocysts: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: "Euploid blastocysts cannot be negative"
    }),
  frozen: z
    .string() 
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: "Frozen cannot be negative"
    }),
  embryosAvailableForTransfer: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: "Embryos available for transfer cannot be negative"
    }),
})

// Schema for transfer cycles
const transferFormSchema = z.object({
  betaHcg1: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: "Beta HCG 1 cannot be negative"
    }),
  betaHcg1Day: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: "Beta HCG 1 day cannot be negative"
    }),
  betaHcg2: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: "Beta HCG 2 cannot be negative"
    }),
  betaHcg2Day: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: "Beta HCG 2 day cannot be negative"
    }),
  transferStatus: z.enum(["successful", "not-successful"]).optional(),
  liveBirth: z.enum(["yes", "no"]).optional(),
})

interface CycleOutcomeCardProps {
  cycle: IVFCycle
}

export function CycleOutcomeCard({ cycle }: CycleOutcomeCardProps) {
  const router = useRouter()
  const { updateCycleOutcome, cycles } = useIVFStore()
  const [isEditing, setIsEditing] = useState(!cycle.outcome)
  const [embryoGrades, setEmbryoGrades] = useState<EmbryoGrade[]>(cycle.outcome?.day3EmbryoGrades || [])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  const isTransferCycle = cycle.cycleGoal === "transfer"
  
  // Get retrieval cycles for embryos (for transfer cycles)
  const getRetrievalCyclesForEmbryos = () => {
    if (!cycle.embryos) return []
    const retrievalCycleIds = [...new Set(cycle.embryos.map(e => e.retrievalCycleId).filter(Boolean))]
    return retrievalCycleIds.map(id => cycles.find(c => c.id === id)).filter(Boolean)
  }

  // Use different forms based on cycle type
  const retrievalForm = useForm<z.infer<typeof retrievalFormSchema>>({
    resolver: zodResolver(retrievalFormSchema),
    defaultValues: {
      eggsRetrieved: cycle.outcome?.eggsRetrieved?.toString() || "",
      matureEggs: cycle.outcome?.matureEggs?.toString() || "",
      fertilizationMethod: cycle.outcome?.fertilizationMethod || undefined,
      fertilized: cycle.outcome?.fertilized?.toString() || "",
      day3Embryos: cycle.outcome?.day3Embryos?.toString() || "",
      blastocysts: cycle.outcome?.blastocysts?.toString() || "",
      euploidBlastocysts: cycle.outcome?.euploidBlastocysts?.toString() || "",
      frozen: cycle.outcome?.frozen?.toString() || "",
      embryosAvailableForTransfer: cycle.outcome?.embryosAvailableForTransfer?.toString() || "",
    },
  })

  const transferForm = useForm<z.infer<typeof transferFormSchema>>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      betaHcg1: cycle.outcome?.betaHcg1?.toString() || "",
      betaHcg1Day: cycle.outcome?.betaHcg1Day?.toString() || "",
      betaHcg2: cycle.outcome?.betaHcg2?.toString() || "",
      betaHcg2Day: cycle.outcome?.betaHcg2Day?.toString() || "",
      transferStatus: cycle.outcome?.transferStatus || undefined,
      liveBirth: cycle.outcome?.liveBirth || undefined,
    },
  })

  const form = isTransferCycle ? transferForm : retrievalForm

  // Watch for changes in embryo count (retrieval cycles only)
  const day3Count = !isTransferCycle ? retrievalForm.watch("day3Embryos") : 0
  
  useEffect(() => {
    if (isTransferCycle) return // Skip for transfer cycles
    
    const count = parseInt(day3Count) || 0
    setEmbryoGrades(prevGrades => {
      if (count === 0) return []
      
      const newGrades = [...prevGrades]
      
      // Add new entries if needed
      while (newGrades.length < count) {
        newGrades.push({
          id: uuidv4()
        })
      }
      
      // Remove excess entries if needed
      if (newGrades.length > count) {
        newGrades.splice(count)
      }
      
      return newGrades
    })
  }, [day3Count, isTransferCycle])


  function onSubmit(values: any) {
    let outcomeData: any
    
    if (isTransferCycle) {
      // For transfer cycles, save all transfer data
      outcomeData = {
        betaHcg1: values.betaHcg1,
        betaHcg1Day: values.betaHcg1Day,
        betaHcg2: values.betaHcg2,
        betaHcg2Day: values.betaHcg2Day,
        transferStatus: values.transferStatus,
        liveBirth: values.liveBirth,
      }
    } else {
      // For retrieval cycles, save all retrieval data
      outcomeData = {
        ...values,
        day3EmbryoGrades: embryoGrades.length > 0 ? embryoGrades : undefined
      }
    }
    
    updateCycleOutcome(cycle.id, outcomeData)
    setIsEditing(false)
  }

  const updateEmbryoField = (id: string, field: keyof EmbryoGrade, value: string) => {
    setEmbryoGrades(prevGrades => 
      prevGrades.map(embryo => 
        embryo.id === id ? { ...embryo, [field]: value } : embryo
      )
    )
  }

  const toggleRowExpansion = (embryoId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(embryoId)) {
      newExpanded.delete(embryoId)
    } else {
      newExpanded.add(embryoId)
    }
    setExpandedRows(newExpanded)
  }


  if (!isEditing && cycle.outcome) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cycle Outcome</CardTitle>
            <CardDescription>Results and outcomes from your IVF cycle</CardDescription>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit Outcomes
          </Button>
        </CardHeader>
        <CardContent>
          {/* Embryo Information - Only for transfer cycles */}
          {isTransferCycle && cycle.embryos && cycle.embryos.length > 0 && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-3">Embryo Information</h4>
              <div className="space-y-4">
                {cycle.embryos.map((embryo, index) => {
                  const retrievalCycle = cycles.find(c => c.id === embryo.retrievalCycleId)
                  return (
                    <div key={embryo.id} className="border rounded-lg p-3">
                      <h5 className="text-sm font-medium mb-2">
                        Embryo {index + 1} 
{cycle.embryos && cycle.embryos.length > 1 && ` of ${cycle.embryos.length}`}
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Embryo Stage</p>
                          <p className="capitalize">
                            {embryo.embryoDetails.replace("-", " ").replace("day", "Day ")}
                          </p>
                        </div>
                        
                        {embryo.embryoGrade && (
                          <div>
                            <p className="font-medium">Grade</p>
                            <p>{embryo.embryoGrade}</p>
                          </div>
                        )}
                        
                        {embryo.pgtATested && (
                          <div>
                            <p className="font-medium">PGT-A Tested</p>
                            <p className="capitalize">{embryo.pgtATested}</p>
                          </div>
                        )}
                        
                        {embryo.embryoSex && (
                          <div>
                            <p className="font-medium">Embryo Sex</p>
                            <p>{embryo.embryoSex === "M" ? "Male" : "Female"} ({embryo.embryoSex})</p>
                          </div>
                        )}
                        
                        {retrievalCycle && (
                          <div className="md:col-span-2">
                            <p className="font-medium">From Retrieval Cycle</p>
                            <p>{retrievalCycle.name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {isTransferCycle ? (
              // Transfer cycle outcome display
              <>
                {cycle.outcome.betaHcg1 !== undefined && (
                  <div>
                    <p className="text-sm font-medium">
                      Beta HCG 1 {cycle.outcome.betaHcg1Day && `(Day ${cycle.outcome.betaHcg1Day})`}
                    </p>
                    <p className="text-2xl font-bold">{cycle.outcome.betaHcg1}</p>
                  </div>
                )}

                {cycle.outcome.betaHcg2 !== undefined && (
                  <div>
                    <p className="text-sm font-medium">
                      Beta HCG 2 {cycle.outcome.betaHcg2Day && `(Day ${cycle.outcome.betaHcg2Day})`}
                    </p>
                    <p className="text-2xl font-bold">{cycle.outcome.betaHcg2}</p>
                  </div>
                )}

                {cycle.outcome.transferStatus && (
                  <div>
                    <p className="text-sm font-medium">Transfer Status</p>
                    <p className="text-2xl font-bold capitalize">
                      {cycle.outcome.transferStatus === "not-successful" ? "Not Successful" : "Successful"}
                    </p>
                  </div>
                )}

                {cycle.outcome.liveBirth && (
                  <div>
                    <p className="text-sm font-medium">Live Birth</p>
                    <p className="text-2xl font-bold capitalize">{cycle.outcome.liveBirth}</p>
                  </div>
                )}
              </>
            ) : (
              // Retrieval cycle outcome display
              <>
                {cycle.outcome.eggsRetrieved !== undefined && (
                  <div>
                    <p className="text-sm font-medium">Eggs Retrieved</p>
                    <p className="text-2xl font-bold">{cycle.outcome.eggsRetrieved}</p>
                  </div>
                )}

                {cycle.outcome.matureEggs !== undefined && (
                  <div>
                    <p className="text-sm font-medium">Mature Eggs</p>
                    <p className="text-2xl font-bold">{cycle.outcome.matureEggs}</p>
                  </div>
                )}

                {cycle.outcome.fertilizationMethod && (
                  <div>
                    <p className="text-sm font-medium">Fertilization Method</p>
                    <p className="text-2xl font-bold">{cycle.outcome.fertilizationMethod}</p>
                  </div>
                )}

                {cycle.outcome.fertilized !== undefined && (
                  <div>
                    <p className="text-sm font-medium">Fertilized</p>
                    <p className="text-2xl font-bold">{cycle.outcome.fertilized}</p>
                  </div>
                )}

                {cycle.outcome.day3Embryos !== undefined && (
                  <div>
                    <p className="text-sm font-medium">Day 3 Embryos</p>
                    <p className="text-2xl font-bold">{cycle.outcome.day3Embryos}</p>
                  </div>
                )}

                {cycle.outcome.blastocysts !== undefined && (
                  <div>
                    <p className="text-sm font-medium">Day 5/6/7 Blastocysts</p>
                    <p className="text-2xl font-bold">{cycle.outcome.blastocysts}</p>
                  </div>
                )}

                {cycle.outcome.euploidBlastocysts !== undefined && (
                  <div>
                    <p className="text-sm font-medium">Euploid Blastocysts</p>
                    <p className="text-2xl font-bold">{cycle.outcome.euploidBlastocysts}</p>
                  </div>
                )}

                {cycle.outcome.frozen !== undefined && (
                  <div>
                    <p className="text-sm font-medium">Frozen</p>
                    <p className="text-2xl font-bold">{cycle.outcome.frozen}</p>
                  </div>
                )}

                {cycle.outcome.embryosAvailableForTransfer !== undefined && (
                  <div>
                    <p className="text-sm font-medium">Embryos Available for Transfer</p>
                    <p className="text-2xl font-bold">{cycle.outcome.embryosAvailableForTransfer}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Day 3 Embryo Details - Only for retrieval cycles */}
          {!isTransferCycle && cycle.outcome.day3EmbryoGrades && cycle.outcome.day3EmbryoGrades.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">Embryo Details and Progression</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Embryo #</TableHead>
                      <TableHead>Day 3</TableHead>
                      <TableHead>Day 5</TableHead>
                      <TableHead>Day 6</TableHead>
                      <TableHead>Day 7</TableHead>
                      <TableHead>PGT-A</TableHead>
                      <TableHead>Sex</TableHead>
                      <TableHead>PGT-M</TableHead>
                      <TableHead>PGT-SR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cycle.outcome.day3EmbryoGrades.map((embryo, index) => {
                      const hasDetails = embryo.pgtADetails || embryo.pgtMDetails || embryo.pgtSRDetails
                      
                      return (
                        <>
                          <TableRow key={embryo.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {hasDetails && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleRowExpansion(embryo.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    {expandedRows.has(embryo.id) ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                                Embryo {index + 1}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {embryo.day3Grade ? (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-mono">
                                  {embryo.day3Grade}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {embryo.day5Grade ? (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-mono">
                                  {embryo.day5Grade}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {embryo.day6Grade ? (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-mono">
                                  {embryo.day6Grade}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {embryo.day7Grade ? (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-mono">
                                  {embryo.day7Grade}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {embryo.pgtA ? (
                                <Badge 
                                  variant="outline" 
                                  className={`${
                                    embryo.pgtA === 'Euploid' ? 'border-green-500 text-green-700 bg-green-50' :
                                    embryo.pgtA === 'Mosaic' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                    'border-red-500 text-red-700 bg-red-50'
                                  }`}
                                >
                                  {embryo.pgtA}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{embryo.sex || "-"}</TableCell>
                            <TableCell className="font-medium">{embryo.pgtM || "-"}</TableCell>
                            <TableCell className="font-medium">{embryo.pgtSR || "-"}</TableCell>
                          </TableRow>
                          
                          {/* Expanded Detail Row for readonly view */}
                          {hasDetails && expandedRows.has(embryo.id) && (
                            <TableRow key={`${embryo.id}-details`} className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-l-4 border-l-blue-400">
                              <TableCell colSpan={9} className="p-0">
                                <div className="py-4 px-6 space-y-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <h4 className="text-sm font-semibold text-blue-900">Detailed Genetic Analysis</h4>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {embryo.pgtADetails && (
                                      <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                                        <div className="flex items-center gap-2 mb-3">
                                          <Badge className="bg-green-100 text-green-800 border-green-300">PGT-A</Badge>
                                          <span className="text-xs text-green-600 font-medium">Chromosome Analysis</span>
                                        </div>
                                        <div className="bg-green-50 rounded-md p-3 border border-green-200">
                                          <p className="text-sm font-mono text-green-900">
                                            {embryo.pgtADetails}
                                          </p>
                                        </div>
                                        <p className="text-xs text-green-600 mt-2 font-medium">
                                          Specific chromosome anomalies detected
                                        </p>
                                      </div>
                                    )}
                                    {embryo.pgtMDetails && (
                                      <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
                                        <div className="flex items-center gap-2 mb-3">
                                          <Badge className="bg-purple-100 text-purple-800 border-purple-300">PGT-M</Badge>
                                          <span className="text-xs text-purple-600 font-medium">Mutation Analysis</span>
                                        </div>
                                        <div className="bg-purple-50 rounded-md p-3 border border-purple-200">
                                          <p className="text-sm font-mono text-purple-900">
                                            {embryo.pgtMDetails}
                                          </p>
                                        </div>
                                        <p className="text-xs text-purple-600 mt-2 font-medium">
                                          Specific mutations tested
                                        </p>
                                      </div>
                                    )}
                                    {embryo.pgtSRDetails && (
                                      <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
                                        <div className="flex items-center gap-2 mb-3">
                                          <Badge className="bg-orange-100 text-orange-800 border-orange-300">PGT-SR</Badge>
                                          <span className="text-xs text-orange-600 font-medium">Structural Analysis</span>
                                        </div>
                                        <div className="bg-orange-50 rounded-md p-3 border border-orange-200">
                                          <p className="text-sm font-mono text-orange-900">
                                            {embryo.pgtSRDetails}
                                          </p>
                                        </div>
                                        <p className="text-xs text-orange-600 mt-2 font-medium">
                                          Structural rearrangements detected
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cycle Outcome</CardTitle>
        <CardDescription>
          {isTransferCycle 
            ? "Record your Beta HCG results from the transfer"
            : "Record the results and outcomes from your IVF cycle"
          }
        </CardDescription>
      </CardHeader>
      <Form {...(isTransferCycle ? transferForm : retrievalForm)}>
        <form onSubmit={(isTransferCycle ? transferForm : retrievalForm).handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {isTransferCycle ? (
              // Transfer cycle form fields
              <div className="space-y-6">
                {/* Beta HCG 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={transferForm.control}
                    name="betaHcg1Day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beta HCG 1 - Days Post-Transfer</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 21 }, (_, i) => i + 7).map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                Day {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={transferForm.control}
                    name="betaHcg1"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Beta HCG 1 Value</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="Enter value in mIU/mL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Beta HCG 2 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={transferForm.control}
                    name="betaHcg2Day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beta HCG 2 - Days Post-Transfer</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 21 }, (_, i) => i + 7).map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                Day {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={transferForm.control}
                    name="betaHcg2"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Beta HCG 2 Value</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="Enter value in mIU/mL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Transfer Status and Live Birth */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={transferForm.control}
                    name="transferStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transfer Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="successful">Successful</SelectItem>
                            <SelectItem value="not-successful">Not Successful</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={transferForm.control}
                    name="liveBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Live Birth</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ) : (
              // Retrieval cycle form fields
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={retrievalForm.control}
                  name="eggsRetrieved"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eggs Retrieved</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <FormField
                control={retrievalForm.control}
                name="matureEggs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mature Eggs</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={retrievalForm.control}
                name="fertilizationMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fertilization Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IVF">IVF</SelectItem>
                        <SelectItem value="ICSI">ICSI</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={retrievalForm.control}
                name="fertilized"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fertilized</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={retrievalForm.control}
                name="day3Embryos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day 3 Embryos</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <FormField
                control={retrievalForm.control}
                name="blastocysts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day 5/6/7 Blastocysts</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={retrievalForm.control}
                name="frozen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frozen</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={retrievalForm.control}
                name="euploidBlastocysts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Euploid Blastocysts</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={retrievalForm.control}
                name="embryosAvailableForTransfer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Embryos Available for Transfer</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Embryo Grading Table */}
              {embryoGrades.length > 0 && (
                <div className="col-span-2 space-y-2">
                  <FormLabel>Embryo Details and Progression</FormLabel>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Embryo #</TableHead>
                          <TableHead>Day 3 Grade</TableHead>
                          <TableHead>Day 5 Grade</TableHead>
                          <TableHead>Day 6 Grade</TableHead>
                          <TableHead>Day 7 Grade</TableHead>
                          <TableHead>PGT-A</TableHead>
                          <TableHead>Sex</TableHead>
                          <TableHead>PGT-M</TableHead>
                          <TableHead>PGT-SR</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {embryoGrades.map((embryo, index) => (
                          <>
                            <TableRow key={embryo.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleRowExpansion(embryo.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    {expandedRows.has(embryo.id) ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                  </Button>
                                  Embryo {index + 1}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={embryo.day3Grade || ""}
                                  onChange={(e) => updateEmbryoField(embryo.id, "day3Grade", e.target.value)}
                                  placeholder="Grade"
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={embryo.day5Grade || ""}
                                  onChange={(e) => updateEmbryoField(embryo.id, "day5Grade", e.target.value)}
                                  placeholder="Grade"
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={embryo.day6Grade || ""}
                                  onChange={(e) => updateEmbryoField(embryo.id, "day6Grade", e.target.value)}
                                  placeholder="Grade"
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={embryo.day7Grade || ""}
                                  onChange={(e) => updateEmbryoField(embryo.id, "day7Grade", e.target.value)}
                                  placeholder="Grade"
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                {(embryo.day5Grade || embryo.day6Grade || embryo.day7Grade) ? (
                                  <Select
                                    value={embryo.pgtA || ""}
                                    onValueChange={(value) => updateEmbryoField(embryo.id, "pgtA", value)}
                                  >
                                    <SelectTrigger className="w-28">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Euploid">Euploid</SelectItem>
                                      <SelectItem value="Mosaic">Mosaic</SelectItem>
                                      <SelectItem value="Aneuploid">Aneuploid</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {(embryo.day5Grade || embryo.day6Grade || embryo.day7Grade) ? (
                                  <Input
                                    value={embryo.sex || ""}
                                    onChange={(e) => updateEmbryoField(embryo.id, "sex", e.target.value)}
                                    placeholder="M/F"
                                    className="w-16"
                                  />
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={embryo.pgtM || ""}
                                  onChange={(e) => updateEmbryoField(embryo.id, "pgtM", e.target.value)}
                                  placeholder="Result"
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={embryo.pgtSR || ""}
                                  onChange={(e) => updateEmbryoField(embryo.id, "pgtSR", e.target.value)}
                                  placeholder="Result"
                                  className="w-24"
                                />
                              </TableCell>
                            </TableRow>
                            
                            {/* Expanded Detail Row */}
                            {expandedRows.has(embryo.id) && (
                              <TableRow key={`${embryo.id}-details`} className="bg-muted/30">
                                <TableCell></TableCell>
                                <TableCell colSpan={8}>
                                  <div className="py-2 space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground">Detailed PGT Results</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <label className="text-xs font-medium text-muted-foreground">PGT-A Details</label>
                                        <Input
                                          value={embryo.pgtADetails || ""}
                                          onChange={(e) => updateEmbryoField(embryo.id, "pgtADetails", e.target.value)}
                                          placeholder="e.g., +21, -16, mosaic 45,X/46,XX"
                                          className="mt-1 text-xs"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Specific chromosome anomalies
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-muted-foreground">PGT-M Details</label>
                                        <Input
                                          value={embryo.pgtMDetails || ""}
                                          onChange={(e) => updateEmbryoField(embryo.id, "pgtMDetails", e.target.value)}
                                          placeholder="e.g., BRCA1 negative, CF mutation detected"
                                          className="mt-1 text-xs"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Specific mutations tested
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-muted-foreground">PGT-SR Details</label>
                                        <Input
                                          value={embryo.pgtSRDetails || ""}
                                          onChange={(e) => updateEmbryoField(embryo.id, "pgtSRDetails", e.target.value)}
                                          placeholder="e.g., balanced translocation t(11;22)"
                                          className="mt-1 text-xs"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Structural rearrangements
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {cycle.outcome && (
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
            <Button type="submit">Save Outcomes</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
