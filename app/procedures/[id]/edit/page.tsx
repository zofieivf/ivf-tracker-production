"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format, parseISO } from "date-fns"
import { ArrowLeft, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useIVFStore } from "@/lib/store"
import type { FertilityProcedure } from "@/lib/types"

const fertilityProcedures: FertilityProcedure[] = [
  "Hysterosalpingogram (HSG)",
  "Hysteroscopy (HSC)",
  "Endometrial Biopsy/ CD138 Stain",
  "RPL Bloodwork",
  "ReceptivaDX",
  "ERA",
  "ALICE",
  "Laparoscopic excision",
  "Karotyping",
  "Blood clotting (Leiden V Factor, MTHFR, PAI-1)",
  "Thyroid panel",
  "Uterine Biopsy",
  "Immune panel",
  "Prolactin (PRL)",
  "Sonohysterogram",
  "Polyp removal",
  "Lymphocyte immunotherapy",
  "Cytokine panel",
  "Intralipids",
  "Semen Analysis",
  "Sperm DNA Fragmentation",
  "Other"
]

const formSchema = z.object({
  procedureType: z.enum(fertilityProcedures as [string, ...string[]], {
    required_error: "Procedure type is required",
  }),
  customProcedureName: z.string().optional(),
  procedureDate: z.date({
    required_error: "Procedure date is required",
  }),
  clinicName: z.string().optional(),
  notes: z.string().optional(),
  results: z.string().optional(),
  cost: z.number().optional(),
  insuranceCoverage: z.number().optional(),
}).refine((data) => {
  if (data.procedureType === "Other" && !data.customProcedureName?.trim()) {
    return false
  }
  return true
}, {
  message: "Procedure name is required when 'Other' is selected",
  path: ["customProcedureName"]
})

export default function EditProcedurePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { getProcedureById, updateProcedure, procedures } = useIVFStore()
  const [procedure, setProcedure] = useState(getProcedureById(params.id))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setProcedure(getProcedureById(params.id))
  }, [params.id, getProcedureById, procedures])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      procedureType: procedure?.procedureType || undefined,
      customProcedureName: procedure?.customProcedureName || "",
      procedureDate: procedure ? parseISO(procedure.procedureDate) : new Date(),
      clinicName: procedure?.clinicName || "",
      notes: procedure?.notes || "",
      results: procedure?.results || "",
      cost: procedure?.cost || undefined,
      insuranceCoverage: procedure?.insuranceCoverage || undefined,
    },
  })

  // Update form when procedure changes
  useEffect(() => {
    if (procedure) {
      form.reset({
        procedureType: procedure.procedureType,
        customProcedureName: procedure.customProcedureName || "",
        procedureDate: parseISO(procedure.procedureDate),
        clinicName: procedure.clinicName || "",
        notes: procedure.notes || "",
        results: procedure.results || "",
        cost: procedure.cost || undefined,
        insuranceCoverage: procedure.insuranceCoverage || undefined,
      })
    }
  }, [procedure, form])

  const watchedProcedureType = form.watch("procedureType")

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!procedure) return

    const updatedProcedure = {
      procedureType: values.procedureType,
      customProcedureName: values.customProcedureName,
      procedureDate: values.procedureDate.toISOString(),
      clinicName: values.clinicName,
      notes: values.notes,
      results: values.results,
      cost: values.cost,
      insuranceCoverage: values.insuranceCoverage,
    }

    updateProcedure(procedure.id, updatedProcedure)
    router.push(`/procedures/${procedure.id}`)
  }

  if (!mounted) return null

  if (!procedure) {
    return (
      <div className="container max-w-lg py-10">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-bold mb-2">Procedure not found</h2>
          <p className="text-muted-foreground mb-6">The procedure you're trying to edit doesn't exist</p>
          <Button asChild>
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-lg py-10">
      <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0">
        <Link href={`/procedures/${procedure.id}`} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to procedure
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Procedure</CardTitle>
          <CardDescription>Update this fertility-related procedure or test</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="procedureType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedure Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select procedure type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fertilityProcedures.map((procedure) => (
                          <SelectItem key={procedure} value={procedure}>
                            {procedure}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>The type of fertility procedure or test</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedProcedureType === "Other" && (
                <FormField
                  control={form.control}
                  name="customProcedureName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procedure Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the procedure name" {...field} />
                      </FormControl>
                      <FormDescription>Specify the name of the procedure</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="procedureDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Procedure Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus captionLayout="dropdown" />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>The date when the procedure was or will be performed</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clinicName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic/Hospital Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fertility Center" {...field} />
                    </FormControl>
                    <FormDescription>Where the procedure was performed (optional)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="results"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Results/Findings</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any results, findings, or test values..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Results, findings, or test values (optional)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes about the procedure..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Additional notes or comments (optional)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>Total cost of the procedure (optional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insuranceCoverage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Coverage</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>Amount covered by insurance (optional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push(`/procedures/${procedure.id}`)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}