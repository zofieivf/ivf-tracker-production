"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format, parseISO } from "date-fns"
import { ArrowLeft, Plus, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIVFStore } from "@/lib/store"
import { v4 as uuidv4 } from "uuid"

const medicationSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().optional(),
  taken: z.boolean().default(false),
  refrigerated: z.boolean().default(false),
})

const clinicVisitSchema = z.object({
  type: z.enum(["baseline", "monitoring", "consult", "retrieval", "transfer", "other"]),
  notes: z.string().optional(),
})

const follicleSizesSchema = z.object({
  left: z.array(z.number()).default([]),
  right: z.array(z.number()).default([]),
  liningThickness: z.number().optional(),
})

const bloodworkSchema = z.array(
  z.object({
    test: z.string().min(1, "Test name is required"),
    value: z.string().min(1, "Value is required"),
    unit: z.string().optional(),
    reference: z.string().optional(),
  }),
)

const formSchema = z.object({
  medications: z.array(medicationSchema).default([]),
  hasClinicVisit: z.boolean().default(false),
  clinicVisit: clinicVisitSchema.optional(),
  hasFollicleSizes: z.boolean().default(false),
  follicleSizes: follicleSizesSchema.optional(),
  hasBloodwork: z.boolean().default(false),
  bloodwork: bloodworkSchema.default([]),
  notes: z.string().optional(),
})

export default function NewDayPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dayNumber = searchParams.get("day")
  const dateString = searchParams.get("date")

  const { getCycleById, addDay } = useIVFStore()
  const cycle = getCycleById(params.id)

  const [medications, setMedications] = useState<
    { id: string; name: string; dosage?: string; taken: boolean; refrigerated?: boolean }[]
  >([])
  const [bloodworkResults, setBloodworkResults] = useState<
    { id: string; test: string; value: string; unit?: string; reference?: string }[]
  >([])
  const [leftFollicles, setLeftFollicles] = useState<string>("")
  const [rightFollicles, setRightFollicles] = useState<string>("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medications: [],
      hasClinicVisit: false,
      hasFollicleSizes: false,
      hasBloodwork: false,
      bloodwork: [],
    },
  })

  if (!cycle) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-bold mb-2">Cycle not found</h2>
          <p className="text-muted-foreground mb-6">The cycle you're looking for doesn't exist</p>
          <Button asChild>
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      </div>
    )
  }

  function addMedication() {
    const newMed = { id: uuidv4(), name: "", dosage: "", taken: false, refrigerated: false }
    setMedications([...medications, newMed])
  }

  function updateMedication(id: string, field: string, value: any) {
    setMedications(medications.map((med) => (med.id === id ? { ...med, [field]: value } : med)))
  }

  function removeMedication(id: string) {
    setMedications(medications.filter((med) => med.id !== id))
  }

  function addBloodworkResult() {
    const newResult = { id: uuidv4(), test: "", value: "", unit: "", reference: "" }
    setBloodworkResults([...bloodworkResults, newResult])
  }

  function updateBloodworkResult(id: string, field: string, value: any) {
    setBloodworkResults(bloodworkResults.map((result) => (result.id === id ? { ...result, [field]: value } : result)))
  }

  function removeBloodworkResult(id: string) {
    setBloodworkResults(bloodworkResults.filter((result) => result.id !== id))
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Process follicle sizes
    let follicleData = undefined
    if (values.hasFollicleSizes) {
      const left = leftFollicles
        .split(",")
        .map((size) => Number.parseFloat(size.trim()))
        .filter((size) => !isNaN(size))
      const right = rightFollicles
        .split(",")
        .map((size) => Number.parseFloat(size.trim()))
        .filter((size) => !isNaN(size))

      follicleData = {
        left,
        right,
        liningThickness: form.getValues("follicleSizes.liningThickness"),
      }
    }

    // Calculate the correct date based on cycle start date and day number
    const cycleDay = Number.parseInt(dayNumber || "1")
    let calculatedDate = dateString
    
    if (!calculatedDate && cycle) {
      // Calculate date as cycle start date + (cycleDay - 1) days
      const startDate = new Date(cycle.startDate)
      const dayDate = new Date(startDate)
      dayDate.setDate(startDate.getDate() + (cycleDay - 1))
      calculatedDate = dayDate.toISOString()
    }

    // Create new day
    const newDay = {
      id: uuidv4(),
      date: calculatedDate || new Date().toISOString(),
      cycleDay,
      medications: medications.filter((med) => med.name.trim() !== ""),
      clinicVisit: values.hasClinicVisit ? values.clinicVisit : undefined,
      follicleSizes: values.hasFollicleSizes ? follicleData : undefined,
      bloodwork: values.hasBloodwork
        ? bloodworkResults.filter((result) => result.test.trim() !== "" && result.value.trim() !== "")
        : undefined,
      notes: values.notes,
    }

    addDay(params.id, newDay)
    router.push(`/cycles/${params.id}`)
  }

  return (
    <div className="container max-w-2xl py-10">
      <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0">
        <Link href={`/cycles/${params.id}`} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to cycle
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add Day {dayNumber} Data</CardTitle>
          <CardDescription>{dateString && format(parseISO(dateString), "EEEE, MMMM d, yyyy")}</CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="medications">
              <TabsList className="grid grid-cols-4 mx-6 mt-2">
                <TabsTrigger value="medications">Medications</TabsTrigger>
                <TabsTrigger value="clinic">Clinic Visit</TabsTrigger>
                <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <CardContent className="p-6">
                <TabsContent value="medications" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Medications</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                      <Plus className="h-4 w-4 mr-1" /> Add Medication
                    </Button>
                  </div>

                  {medications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No medications added yet. Click the button above to add one.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {medications.map((med, index) => (
                        <div key={med.id} className="grid gap-4 p-4 border rounded-md">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">Medication {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMedication(med.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                  value={med.name}
                                  onChange={(e) => updateMedication(med.id, "name", e.target.value)}
                                  placeholder="e.g., Gonal-F"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Dosage</label>
                                <Input
                                  value={med.dosage}
                                  onChange={(e) => updateMedication(med.id, "dosage", e.target.value)}
                                  placeholder="e.g., 225 IU"
                                />
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`taken-${med.id}`}
                                checked={med.taken}
                                onCheckedChange={(checked) => updateMedication(med.id, "taken", checked)}
                              />
                              <label htmlFor={`taken-${med.id}`} className="text-sm font-medium">
                                Taken
                              </label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`refrigerated-${med.id}`}
                                checked={med.refrigerated}
                                onCheckedChange={(checked) => updateMedication(med.id, "refrigerated", checked)}
                              />
                              <label htmlFor={`refrigerated-${med.id}`} className="text-sm font-medium">
                                Refrigerated
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="clinic">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="hasClinicVisit"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Clinic Visit</FormLabel>
                              <FormDescription>Did you have a clinic visit on this day?</FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("hasClinicVisit") && (
                      <div className="space-y-4 border rounded-md p-4">
                        <FormField
                          control={form.control}
                          name="clinicVisit.type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Visit Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select visit type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="baseline">Baseline</SelectItem>
                                  <SelectItem value="monitoring">Monitoring</SelectItem>
                                  <SelectItem value="consult">Consultation</SelectItem>
                                  <SelectItem value="retrieval">Egg Retrieval</SelectItem>
                                  <SelectItem value="transfer">Embryo Transfer</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="clinicVisit.notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Visit Notes</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Enter any notes about your clinic visit" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="monitoring" className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="hasFollicleSizes"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Follicle Measurements</FormLabel>
                              <FormDescription>Did you have follicle measurements on this day?</FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("hasFollicleSizes") && (
                      <div className="space-y-4 border rounded-md p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Left Ovary Follicles (mm)</label>
                            <Input
                              value={leftFollicles}
                              onChange={(e) => setLeftFollicles(e.target.value)}
                              placeholder="e.g., 18, 16, 14"
                            />
                            <p className="text-xs text-muted-foreground">Enter sizes separated by commas</p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Right Ovary Follicles (mm)</label>
                            <Input
                              value={rightFollicles}
                              onChange={(e) => setRightFollicles(e.target.value)}
                              placeholder="e.g., 17, 15, 13"
                            />
                            <p className="text-xs text-muted-foreground">Enter sizes separated by commas</p>
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="follicleSizes.liningThickness"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Endometrial Lining (mm)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="e.g., 8.5"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? Number.parseFloat(e.target.value) : undefined)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="hasBloodwork"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Bloodwork Results</FormLabel>
                              <FormDescription>Did you have bloodwork done on this day?</FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("hasBloodwork") && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium">Bloodwork Results</h3>
                          <Button type="button" variant="outline" size="sm" onClick={addBloodworkResult}>
                            <Plus className="h-4 w-4 mr-1" /> Add Result
                          </Button>
                        </div>

                        {bloodworkResults.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground text-sm border rounded-md">
                            No bloodwork results added yet. Click the button above to add one.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {bloodworkResults.map((result, index) => (
                              <div key={result.id} className="grid gap-4 p-4 border rounded-md">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium">Result {index + 1}</h4>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeBloodworkResult(result.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="grid gap-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Test</label>
                                      <Input
                                        value={result.test}
                                        onChange={(e) => updateBloodworkResult(result.id, "test", e.target.value)}
                                        placeholder="e.g., Estradiol"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Value</label>
                                      <Input
                                        value={result.value}
                                        onChange={(e) => updateBloodworkResult(result.id, "value", e.target.value)}
                                        placeholder="e.g., 250"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Unit</label>
                                      <Input
                                        value={result.unit}
                                        onChange={(e) => updateBloodworkResult(result.id, "unit", e.target.value)}
                                        placeholder="e.g., pg/mL"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Reference Range</label>
                                      <Input
                                        value={result.reference}
                                        onChange={(e) => updateBloodworkResult(result.id, "reference", e.target.value)}
                                        placeholder="e.g., 100-500"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="notes">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any additional notes for this day"
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Record any symptoms, feelings, or other observations</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </CardContent>
            </Tabs>

            <CardFooter className="flex justify-between border-t p-6">
              <Button type="button" variant="outline" onClick={() => router.push(`/cycles/${params.id}`)}>
                Cancel
              </Button>
              <Button type="submit">Save Day</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
