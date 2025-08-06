"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
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
}).refine((data) => {
  if (data.procedureType === "Other" && !data.customProcedureName?.trim()) {
    return false
  }
  return true
}, {
  message: "Procedure name is required when 'Other' is selected",
  path: ["customProcedureName"]
})

export default function NewProcedurePage() {
  const router = useRouter()
  const { addProcedure } = useIVFStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      procedureDate: new Date(),
      clinicName: "",
      customProcedureName: "",
      notes: "",
      results: "",
    },
  })

  const watchedProcedureType = form.watch("procedureType")

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newProcedure = {
      id: crypto.randomUUID(),
      procedureType: values.procedureType,
      customProcedureName: values.customProcedureName,
      procedureDate: values.procedureDate.toISOString(),
      clinicName: values.clinicName,
      notes: values.notes,
      results: values.results,
    }

    addProcedure(newProcedure)
    router.push("/")
  }

  return (
    <div className="container max-w-lg py-10">
      <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0">
        <Link href="/" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New Fertility-related Procedure</CardTitle>
          <CardDescription>Record a fertility-related procedure or test</CardDescription>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push("/")}>
                Cancel
              </Button>
              <Button type="submit">Save Procedure</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}