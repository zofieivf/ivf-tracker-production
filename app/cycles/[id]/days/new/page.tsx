"use client"

import React, { useState, use } from "react"
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

const clinicVisitSchema = z.object({
  type: z.enum(["baseline", "monitoring", "retrieval", "transfer", "beta", "iui", "other"]),
  notes: z.string().optional(),
  betaHcgValue: z.number().optional(),
  betaHcgUnit: z.string().optional(),
})

const follicleSizesSchema = z.object({
  left: z.array(z.number()).default([]),
  right: z.array(z.number()).default([]),
  liningCheck: z.boolean().default(false),
  liningThickness: z.number().optional(),
}).refine((data) => {
  if (data.liningCheck && !data.liningThickness) {
    return false
  }
  return true
}, {
  message: "Endometrial lining measurement is required when lining check is selected",
  path: ["liningThickness"]
})

const bloodworkSchema = z.array(
  z.object({
    test: z.string().min(1, "Test name is required"),
    value: z.string().min(1, "Value is required"),
    unit: z.string().optional(),
  }),
)

const formSchema = z.object({
  hasClinicVisit: z.boolean().default(false),
  clinicVisit: clinicVisitSchema.optional(),
  hasFollicleSizes: z.boolean().default(false),
  follicleSizes: follicleSizesSchema.optional(),
  hasBloodwork: z.boolean().default(false),
  bloodwork: bloodworkSchema.default([]),
  notes: z.string().optional(),
})

export default function NewDayPageNoMeds({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const dayNumber = searchParams.get("day")
  const dateString = searchParams.get("date")

  const { getCycleById, addDay } = useIVFStore()
  const cycle = getCycleById(id)

  const [bloodworkResults, setBloodworkResults] = useState<
    { id: string; test: string; value: string; unit?: string }[]
  >([])
  const [leftFollicles, setLeftFollicles] = useState<string>("")
  const [rightFollicles, setRightFollicles] = useState<string>("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasClinicVisit: false,
      hasFollicleSizes: false,
      hasBloodwork: false,
      bloodwork: [],
      follicleSizes: {
        liningCheck: false,
        liningThickness: undefined,
      },
      notes: "",
    },
  })

  // Common tests for bloodwork dropdown
  const commonBloodworkTests = [
    "Estradiol (E2)", "LH", "FSH", "Progesterone", "hCG",
    "Testosterone", "Prolactin", "Thyroid (TSH)", "AMH"
  ]

  // Use cycle goal to determine what monitoring options to show
  const shouldShowLiningCheck = cycle.cycleGoal !== "retrieval"
  const shouldShowFollicleMeasurements = cycle.cycleGoal !== "transfer"

  function addBloodworkResult() {
    const newResult = { id: uuidv4(), test: "", value: "", unit: "" }
    setBloodworkResults([...bloodworkResults, newResult])
  }

  function updateBloodworkResult(id: string, field: string, value: any) {
    setBloodworkResults(bloodworkResults.map((result) => (result.id === id ? { ...result, [field]: value } : result)))
  }

  function removeBloodworkResult(id: string) {
    setBloodworkResults(bloodworkResults.filter((result) => result.id !== id))
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Parse follicle sizes if provided
    let follicleData
    if (values.hasFollicleSizes) {
      const left = leftFollicles
        .split(",")
        .map((size) => parseFloat(size.trim()))
        .filter((size) => !isNaN(size))
      const right = rightFollicles
        .split(",")
        .map((size) => parseFloat(size.trim()))
        .filter((size) => !isNaN(size))

      follicleData = {
        left,
        right,
        liningThickness: form.getValues("follicleSizes.liningCheck") 
          ? form.getValues("follicleSizes.liningThickness")
          : undefined,
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
      clinicVisit: values.hasClinicVisit ? values.clinicVisit : undefined,
      follicleSizes: values.hasFollicleSizes ? follicleData : undefined,
      bloodwork: values.hasBloodwork
        ? bloodworkResults.filter((result) => result.test.trim() !== "" && result.value.trim() !== "")
        : undefined,
      notes: values.notes,
    }

    // Add the day
    addDay(id, newDay)

    // Navigate back to cycle
    router.push(`/cycles/${id}`)
  }

  if (!cycle) {
    return <div>Cycle not found</div>
  }

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-6">
        <Link href={`/cycles/${id}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cycle
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add Day</h1>
        <p className="text-muted-foreground">
          Record clinic visits, monitoring data, and notes for Day {dayNumber || "1"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Day {dayNumber || "1"} Details</CardTitle>
          <CardDescription>
            {dateString ? `${format(parseISO(dateString), "EEEE, MMMM d, yyyy")}` : "Add information for this cycle day"}
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="clinic">
              <TabsList className="grid grid-cols-3 mx-6 mt-2">
                <TabsTrigger value="clinic">Clinic Visit</TabsTrigger>
                <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <CardContent className="p-6">
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
                              <FormLabel>I had a clinic visit today</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("hasClinicVisit") && (
                      <div className="space-y-4 pl-6 border-l-2 border-gray-200">
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
                                  <SelectItem value="retrieval">Egg Retrieval</SelectItem>
                                  <SelectItem value="transfer">Embryo Transfer</SelectItem>
                                  <SelectItem value="beta">Beta hCG Test</SelectItem>
                                  <SelectItem value="iui">IUI</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {form.watch("clinicVisit.type") === "beta" && (
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="clinicVisit.betaHcgValue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Beta hCG Value</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.1"
                                      placeholder="e.g., 150.5"
                                      {...field}
                                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="clinicVisit.betaHcgUnit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select unit" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="mIU/mL">mIU/mL</SelectItem>
                                      <SelectItem value="IU/L">IU/L</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}

                        <FormField
                          control={form.control}
                          name="clinicVisit.notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Visit Notes</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Any notes about the visit..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="monitoring">
                  <div className="space-y-6">
                    {/* Follicle Measurements */}
                    {shouldShowFollicleMeasurements && (
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
                                  <FormLabel>Record follicle measurements</FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        {form.watch("hasFollicleSizes") && (
                          <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Left Ovary (mm)</label>
                                <Input
                                  value={leftFollicles}
                                  onChange={(e) => setLeftFollicles(e.target.value)}
                                  placeholder="e.g., 12, 14, 16"
                                />
                                <p className="text-xs text-muted-foreground">Separate sizes with commas</p>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Right Ovary (mm)</label>
                                <Input
                                  value={rightFollicles}
                                  onChange={(e) => setRightFollicles(e.target.value)}
                                  placeholder="e.g., 13, 15, 17"
                                />
                                <p className="text-xs text-muted-foreground">Separate sizes with commas</p>
                              </div>
                            </div>

                            {shouldShowLiningCheck && (
                              <div className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="follicleSizes.liningCheck"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel>Endometrial lining measured</FormLabel>
                                      </div>
                                    </FormItem>
                                  )}
                                />

                                {form.watch("follicleSizes.liningCheck") && (
                                  <FormField
                                    control={form.control}
                                    name="follicleSizes.liningThickness"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Lining Thickness (mm)</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            step="0.1"
                                            placeholder="e.g., 8.5"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bloodwork */}
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
                                <FormLabel>Record bloodwork results</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      {form.watch("hasBloodwork") && (
                        <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Bloodwork Results</h4>
                            <Button type="button" variant="outline" size="sm" onClick={addBloodworkResult}>
                              <Plus className="h-4 w-4 mr-1" /> Add Test
                            </Button>
                          </div>

                          {bloodworkResults.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                              No test results added yet. Click the button above to add one.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {bloodworkResults.map((result, index) => (
                                <div key={result.id} className="grid gap-4 p-3 border rounded-md">
                                  <div className="flex justify-between items-start">
                                    <h5 className="font-medium">Test {index + 1}</h5>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeBloodworkResult(result.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Trash className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium">Test</label>
                                      <Select
                                        value={result.test}
                                        onValueChange={(value) => updateBloodworkResult(result.id, "test", value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select test" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {commonBloodworkTests.map((test) => (
                                            <SelectItem key={test} value={test}>
                                              {test}
                                            </SelectItem>
                                          ))}
                                          <SelectItem value="other">Other...</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium">Value</label>
                                      <Input
                                        value={result.value}
                                        onChange={(e) => updateBloodworkResult(result.id, "value", e.target.value)}
                                        placeholder="Enter value"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium">Unit</label>
                                      <Input
                                        value={result.unit}
                                        onChange={(e) => updateBloodworkResult(result.id, "unit", e.target.value)}
                                        placeholder="e.g., pg/mL"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
                            placeholder="Any additional notes about this day..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Record any symptoms, side effects, or other observations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.push(`/cycles/${id}`)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Day
                </Button>
              </CardFooter>
            </Tabs>
          </form>
        </Form>
      </Card>
    </div>
  )
}