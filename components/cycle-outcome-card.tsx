"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { IVFCycle } from "@/lib/types"
import { useIVFStore } from "@/lib/store"

const formSchema = z.object({
  eggsRetrieved: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  matureEggs: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  fertilized: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  day3Embryos: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  day5Blasts: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  pgtTested: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  pgtNormal: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  transferred: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  frozen: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  outcome: z.enum(["positive", "negative", "chemical", "miscarriage", "ongoing"]).optional(),
})

interface CycleOutcomeCardProps {
  cycle: IVFCycle
}

export function CycleOutcomeCard({ cycle }: CycleOutcomeCardProps) {
  const router = useRouter()
  const { updateCycleOutcome } = useIVFStore()
  const [isEditing, setIsEditing] = useState(!cycle.outcome)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eggsRetrieved: cycle.outcome?.eggsRetrieved?.toString() || "",
      matureEggs: cycle.outcome?.matureEggs?.toString() || "",
      fertilized: cycle.outcome?.fertilized?.toString() || "",
      day3Embryos: cycle.outcome?.day3Embryos?.toString() || "",
      day5Blasts: cycle.outcome?.day5Blasts?.toString() || "",
      pgtTested: cycle.outcome?.pgtTested?.toString() || "",
      pgtNormal: cycle.outcome?.pgtNormal?.toString() || "",
      transferred: cycle.outcome?.transferred?.toString() || "",
      frozen: cycle.outcome?.frozen?.toString() || "",
      outcome: cycle.outcome?.outcome,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateCycleOutcome(cycle.id, values)
    setIsEditing(false)
  }

  if (!isEditing && cycle.outcome) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cycle Outcome</CardTitle>
          <CardDescription>Results and outcomes from your IVF cycle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

            {cycle.outcome.day5Blasts !== undefined && (
              <div>
                <p className="text-sm font-medium">Day 5 Blastocysts</p>
                <p className="text-2xl font-bold">{cycle.outcome.day5Blasts}</p>
              </div>
            )}

            {cycle.outcome.pgtTested !== undefined && (
              <div>
                <p className="text-sm font-medium">PGT Tested</p>
                <p className="text-2xl font-bold">{cycle.outcome.pgtTested}</p>
              </div>
            )}

            {cycle.outcome.pgtNormal !== undefined && (
              <div>
                <p className="text-sm font-medium">PGT Normal</p>
                <p className="text-2xl font-bold">{cycle.outcome.pgtNormal}</p>
              </div>
            )}

            {cycle.outcome.transferred !== undefined && (
              <div>
                <p className="text-sm font-medium">Transferred</p>
                <p className="text-2xl font-bold">{cycle.outcome.transferred}</p>
              </div>
            )}

            {cycle.outcome.frozen !== undefined && (
              <div>
                <p className="text-sm font-medium">Frozen</p>
                <p className="text-2xl font-bold">{cycle.outcome.frozen}</p>
              </div>
            )}

            {cycle.outcome.outcome && (
              <div>
                <p className="text-sm font-medium">Pregnancy Outcome</p>
                <p className="text-2xl font-bold capitalize">{cycle.outcome.outcome}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit Outcomes
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cycle Outcome</CardTitle>
        <CardDescription>Record the results and outcomes from your IVF cycle</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
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
                name="day5Blasts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day 5 Blastocysts</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pgtTested"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PGT Tested</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pgtNormal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PGT Normal</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transferred"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transferred</FormLabel>
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
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pregnancy Outcome</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="positive">Positive</SelectItem>
                        <SelectItem value="negative">Negative</SelectItem>
                        <SelectItem value="chemical">Chemical</SelectItem>
                        <SelectItem value="miscarriage">Miscarriage</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
