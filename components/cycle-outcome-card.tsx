"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import type { IVFCycle, EmbryoGrade } from "@/lib/types"
import { useIVFStore } from "@/lib/store"
import { v4 as uuidv4 } from "uuid"

// Schema for retrieval cycles
const retrievalFormSchema = z.object({
  eggsRetrieved: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  matureEggs: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  fertilizationMethod: z.enum(["IVF", "ICSI"]).optional(),
  fertilized: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  day3Embryos: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  blastocysts: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  euploidBlastocysts: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  frozen: z
    .string() 
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  embryosAvailableForTransfer: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
})

// Schema for transfer cycles
const transferFormSchema = z.object({
  betaHcg1: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  betaHcg1Day: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  betaHcg2: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  betaHcg2Day: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
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
  
  const isTransferCycle = cycle.cycleGoal === "transfer"
  
  // Get retrieval cycle name for display
  const retrievalCycle = cycles.find(c => c.id === cycle.retrievalCycleId)

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
          {isTransferCycle && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-3">Embryo Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {cycle.embryoDetails && (
                  <div>
                    <p className="font-medium">Embryo Stage</p>
                    <p className="capitalize">
                      {cycle.embryoDetails.replace("-", " ").replace("day", "Day ")}
                    </p>
                  </div>
                )}
                
                {cycle.embryoGrade && (
                  <div>
                    <p className="font-medium">Grade</p>
                    <p>{cycle.embryoGrade}</p>
                  </div>
                )}
                
                {cycle.pgtATested && (
                  <div>
                    <p className="font-medium">PGT-A Tested</p>
                    <p className="capitalize">{cycle.pgtATested}</p>
                  </div>
                )}
                
                {cycle.embryoSex && (
                  <div>
                    <p className="font-medium">Embryo Sex</p>
                    <p>{cycle.embryoSex === "M" ? "Male" : "Female"} ({cycle.embryoSex})</p>
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
                    {cycle.outcome.day3EmbryoGrades.map((embryo, index) => (
                      <TableRow key={embryo.id}>
                        <TableCell>Embryo {index + 1}</TableCell>
                        <TableCell className="font-medium">{embryo.day3Grade || "-"}</TableCell>
                        <TableCell className="font-medium">{embryo.day5Grade || "-"}</TableCell>
                        <TableCell className="font-medium">{embryo.day6Grade || "-"}</TableCell>
                        <TableCell className="font-medium">{embryo.day7Grade || "-"}</TableCell>
                        <TableCell className="font-medium">{embryo.pgtA || "-"}</TableCell>
                        <TableCell className="font-medium">{embryo.sex || "-"}</TableCell>
                        <TableCell className="font-medium">{embryo.pgtM || "-"}</TableCell>
                        <TableCell className="font-medium">{embryo.pgtSR || "-"}</TableCell>
                      </TableRow>
                    ))}
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {isTransferCycle ? (
              // Transfer cycle form fields
              <div className="space-y-6">
                {/* Beta HCG 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="betaHcg1"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Beta HCG 1 Value</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter value in mIU/mL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Beta HCG 2 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="betaHcg2"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Beta HCG 2 Value</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter value in mIU/mL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Transfer Status and Live Birth */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                  control={form.control}
                  name="eggsRetrieved"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eggs Retrieved</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <FormField
                control={form.control}
                name="matureEggs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mature Eggs</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                control={form.control}
                name="fertilized"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fertilized</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="day3Embryos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day 3 Embryos</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="blastocysts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day 5/6/7 Blastocysts</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frozen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frozen</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="euploidBlastocysts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Euploid Blastocysts</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="embryosAvailableForTransfer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Embryos Available for Transfer</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                          <TableRow key={embryo.id}>
                            <TableCell>Embryo {index + 1}</TableCell>
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
