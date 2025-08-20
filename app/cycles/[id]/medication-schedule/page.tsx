"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { format, addDays, parseISO } from "date-fns"
import { ArrowLeft, Plus, Trash2, Clock, Pill, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { useIVFStore } from "@/lib/store"
import { CompactMedicationTimeline } from "@/components/compact-medication-timeline"
import { CleanUnifiedDailyMedicationChecklist } from "@/components/clean-unified-daily-medication-checklist"
import type { MedicationSchedule, ScheduledMedication } from "@/lib/types"

const medicationSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  customName: z.string().optional(),
  dosage: z.string().min(1, "Dosage is required"),
  hour: z.string().min(1, "Hour is required"),
  minute: z.string().min(1, "Minute is required"),
  ampm: z.enum(["AM", "PM"]),
  refrigerated: z.boolean().default(false),
  startDay: z.number().min(1, "Start day must be at least 1").optional(),
  endDay: z.number().min(1, "End day must be at least 1").optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // If "custom" is selected, customName must be provided
  if (data.name === "custom" && !data.customName?.trim()) {
    return false
  }
  return true
}, {
  message: "Custom medication name is required",
  path: ["customName"]
}).refine((data) => {
  if (data.startDay && data.endDay) {
    return data.endDay >= data.startDay
  }
  return true
}, {
  message: "End day must be after or equal to start day",
  path: ["endDay"]
})

const scheduleSchema = z.object({
  medications: z.array(medicationSchema).min(1, "At least one medication is required"),
})

const daySpecificSchema = z.object({
  cycleDay: z.number().min(1, "Day must be at least 1"),
  name: z.string().min(1, "Medication name is required"),
  customName: z.string().optional(),
  dosage: z.string().min(1, "Dosage is required"),
  hour: z.string().min(1, "Hour is required"),
  minute: z.string().min(1, "Minute is required"),
  ampm: z.enum(["AM", "PM"]),
  refrigerated: z.boolean().default(false),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.name === "custom" && !data.customName?.trim()) {
    return false
  }
  return true
}, {
  message: "Custom medication name is required",
  path: ["customName"]
})

interface MedicationSchedulePageProps {
  params: Promise<{ id: string }>
}

const commonMedications = [
  "Gonal-F", "Menopur", "Cetrotide", "Lupron", "Estrace", "Progesterone",
  "Follistim", "Ganirelix", "Ovidrel", "Pregnyl", "Crinone", "Endometrin", "Medrol",
  "Estradiol", "Prometrium Inserts", "Progesterone in Oil (PIO)"
]

const medicationTemplates = {
  "antagonist": [
    { name: "Gonal-F", dosage: "", time: "8:00 PM", refrigerated: true },
    { name: "Menopur", dosage: "", time: "8:00 PM", refrigerated: false },
    { name: "Cetrotide", dosage: "", time: "8:00 PM", refrigerated: true }
  ],
  "lupron": [
    { name: "Lupron", dosage: "", time: "8:00 PM", refrigerated: true }
  ],
  "transfer": [
    { name: "Medrol", dosage: "", time: "8:00 PM", refrigerated: false },
    { name: "Estradiol", dosage: "", time: "8:00 PM", refrigerated: false },
    { name: "Prometrium Inserts", dosage: "", time: "8:00 PM", refrigerated: false },
    { name: "Progesterone in Oil (PIO)", dosage: "", time: "8:00 PM", refrigerated: false }
  ]
}

export default function MedicationSchedulePage({ params }: MedicationSchedulePageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { getCycleById, addMedicationSchedule, getMedicationScheduleByCycleId, updateMedicationSchedule, addCleanDaySpecificMedication } = useIVFStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDaySpecificForm, setShowDaySpecificForm] = useState(false)
  const [daySpecificDay, setDaySpecificDay] = useState<number>(1)
  
  const cycle = getCycleById(id)
  const existingSchedule = getMedicationScheduleByCycleId(id)

  // Helper function to calculate actual date from cycle day
  const getActualDate = (cycleDay: number | undefined) => {
    if (!cycleDay || !cycle) return null
    const cycleStartDate = parseISO(cycle.startDate)
    return addDays(cycleStartDate, cycleDay - 1)
  }
  
  // Transform existing medications to handle custom medications properly
  const transformedMedications = existingSchedule?.medications?.map(med => {
    const isCustom = !commonMedications.includes(med.name)
    return {
      name: isCustom ? "custom" : med.name,
      customName: isCustom ? med.name : "",
      dosage: med.dosage,
      hour: med.hour,
      minute: med.minute,
      ampm: med.ampm,
      refrigerated: med.refrigerated,
      startDay: med.startDay,
      endDay: med.endDay,
      notes: med.notes || ""
    }
  }) || [{
    name: "",
    customName: "",
    dosage: "",
    hour: "8",
    minute: "00",
    ampm: "PM",
    refrigerated: false,
    startDay: undefined,
    endDay: undefined,
    notes: ""
  }]

  const form = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      medications: transformedMedications,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications",
  })

  // Day-specific medication form
  const daySpecificForm = useForm<z.infer<typeof daySpecificSchema>>({
    resolver: zodResolver(daySpecificSchema),
    defaultValues: {
      cycleDay: daySpecificDay,
      name: "",
      customName: "",
      dosage: "",
      hour: "8",
      minute: "00",
      ampm: "PM",
      refrigerated: false,
      notes: ""
    }
  })

  if (!cycle) {
    return <div>Cycle not found</div>
  }

  const addMedication = () => {
    append({
      name: "",
      customName: "",
      dosage: "",
      hour: "8",
      minute: "00",
      ampm: "PM",
      refrigerated: false,
      startDay: undefined,
      endDay: undefined,
      notes: ""
    })
  }

  const loadTemplate = (templateKey: keyof typeof medicationTemplates) => {
    const template = medicationTemplates[templateKey]
    const medications = template.map((med) => {
      const [hour, minute] = med.time.split(":")
      const ampm = med.time.includes("AM") ? "AM" : "PM"
      
      return {
        name: med.name,
        customName: "",
        dosage: med.dosage,
        hour: hour,
        minute: minute.replace(/[^\d]/g, ""),
        ampm: ampm as "AM" | "PM",
        refrigerated: med.refrigerated,
        startDay: undefined,
        endDay: undefined,
        notes: ""
      }
    })
    
    form.setValue("medications", medications)
  }

  function onDaySpecificSubmit(values: z.infer<typeof daySpecificSchema>) {
    if (!cycle) return

    // Calculate date for the cycle day
    const cycleStartDate = parseISO(cycle.startDate)
    const dayDate = addDays(cycleStartDate, values.cycleDay - 1)

    // Create day-specific medication
    const medication = {
      name: values.name === "custom" ? values.customName || "" : values.name,
      dosage: values.dosage,
      hour: values.hour,
      minute: values.minute,
      ampm: values.ampm,
      refrigerated: values.refrigerated,
      taken: false,
      skipped: false,
      takenAt: undefined,
      notes: values.notes || ""
    }

    addCleanDaySpecificMedication(cycle.id, values.cycleDay, dayDate.toISOString(), medication)
    
    // Reset form and close
    daySpecificForm.reset()
    setShowDaySpecificForm(false)
  }

  function onSubmit(values: z.infer<typeof scheduleSchema>) {
    setIsSubmitting(true)
    
    // Validate that all medications have start and end days
    const invalidMeds = values.medications.filter(med => !med.startDay || !med.endDay)
    if (invalidMeds.length > 0) {
      alert("Please fill in start and end days for all medications")
      setIsSubmitting(false)
      return
    }
    
    const scheduledMedications: ScheduledMedication[] = values.medications
      .map((med, index) => ({
        id: crypto.randomUUID(),
        name: med.name === "custom" ? med.customName || "" : med.name,
        dosage: med.dosage,
        hour: med.hour,
        minute: med.minute,
        ampm: med.ampm,
        refrigerated: med.refrigerated,
        startDay: med.startDay || 1,
        endDay: med.endDay || 1,
        notes: med.notes || "",
      }))

    const scheduleData: MedicationSchedule = {
      id: existingSchedule?.id || crypto.randomUUID(),
      cycleId: id,
      medications: scheduledMedications,
      createdAt: existingSchedule?.createdAt || new Date().toISOString(),
    }

    if (existingSchedule) {
      updateMedicationSchedule(existingSchedule.id, {
        medications: scheduledMedications,
        updatedAt: new Date().toISOString(),
      })
    } else {
      addMedicationSchedule(scheduleData)
    }

    setIsSubmitting(false)
    router.push(`/cycles/${id}`)
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push(`/cycles/${id}?tab=medications`)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Medications
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Medication Schedule</h1>
        <p className="text-muted-foreground mt-1">
          Set up your medication protocol for {cycle.name}
        </p>
        
        {/* Usage Instructions */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Pill className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">When to Use Medication Schedule</h3>
              <p className="text-blue-800 text-sm mb-3">
                Use this medication schedule for <strong>recurring medications</strong> that you take on the same schedule for multiple days. This makes it easy to set up your regular protocol once and track daily compliance.
              </p>
              <p className="text-blue-800 text-sm">
                <strong>For one-time doses</strong> or if you prefer <strong>day-by-day tracking</strong>, use the "Edit Day" function on individual cycle days instead.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout for better visibility */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left column - Current Schedule Timeline */}
        <div className="xl:sticky xl:top-4 xl:h-fit">
          <CompactMedicationTimeline cycle={cycle} />
        </div>

        {/* Right column - Editing Forms */}
        <div className="space-y-6">
          {/* Quick Templates */}
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Quick Templates
              </CardTitle>
              <CardDescription>
                Load a common medication protocol to get started quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => loadTemplate("antagonist")}
                >
                  Standard Antagonist Protocol
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => loadTemplate("lupron")}
                >
                  Long Lupron Protocol
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => loadTemplate("transfer")}
                >
                  Transfer Protocol
                </Button>
              </div>
            </CardContent>
          </Card>

        {/* Recurring Medication Form */}
        <Card>
          <CardHeader>
            <CardTitle>Recurring Medication</CardTitle>
            <CardDescription>
              Add recurring medications with their dosages, timing, and duration. These will appear on each day within the specified date range for easy daily tracking.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Medication {index + 1}</h3>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Medication Name */}
                      <FormField
                        control={form.control}
                        name={`medications.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medication Name</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select medication" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {commonMedications.map((med) => (
                                  <SelectItem key={med} value={med}>
                                    {med}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom">Custom medication...</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Custom Medication Name */}
                      {form.watch(`medications.${index}.name`) === "custom" && (
                        <FormField
                          control={form.control}
                          name={`medications.${index}.customName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Custom Medication Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter medication name" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Dosage */}
                      <FormField
                        control={form.control}
                        name={`medications.${index}.dosage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dosage</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 150 IU, 2mg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Time */}
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <div className="flex gap-1">
                          <FormField
                            control={form.control}
                            name={`medications.${index}.hour`}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                                    <SelectItem key={hour} value={hour.toString()}>
                                      {hour}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          <span className="self-center">:</span>
                          <FormField
                            control={form.control}
                            name={`medications.${index}.minute`}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="00">00</SelectItem>
                                  <SelectItem value="15">15</SelectItem>
                                  <SelectItem value="30">30</SelectItem>
                                  <SelectItem value="45">45</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`medications.${index}.ampm`}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="AM">AM</SelectItem>
                                  <SelectItem value="PM">PM</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      </FormItem>

                      {/* Start Day */}
                      <FormField
                        control={form.control}
                        name={`medications.${index}.startDay`}
                        render={({ field }) => {
                          const actualDate = getActualDate(field.value)
                          return (
                            <FormItem>
                              <FormLabel>Start Day</FormLabel>
                              <FormControl>
                                <Input 
                                  type="text" 
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  placeholder="Enter day" 
                                  value={field.value || ""}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    if (value === "") {
                                      field.onChange(undefined)
                                    } else if (/^\d+$/.test(value)) {
                                      const numValue = parseInt(value)
                                      if (numValue > 0) {
                                        field.onChange(numValue)
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                              {actualDate && (
                                <FormDescription>
                                  {format(actualDate, "MMM d, yyyy")}
                                </FormDescription>
                              )}
                              <FormMessage />
                            </FormItem>
                          )
                        }}
                      />

                      {/* End Day */}
                      <FormField
                        control={form.control}
                        name={`medications.${index}.endDay`}
                        render={({ field }) => {
                          const actualDate = getActualDate(field.value)
                          return (
                            <FormItem>
                              <FormLabel>End Day</FormLabel>
                              <FormControl>
                                <Input 
                                  type="text" 
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  placeholder="Enter day" 
                                  value={field.value || ""}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    if (value === "") {
                                      field.onChange(undefined)
                                    } else if (/^\d+$/.test(value)) {
                                      const numValue = parseInt(value)
                                      if (numValue > 0) {
                                        field.onChange(numValue)
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                              {actualDate && (
                                <FormDescription>
                                  {format(actualDate, "MMM d, yyyy")}
                                </FormDescription>
                              )}
                              <FormMessage />
                            </FormItem>
                          )
                        }}
                      />

                      {/* Refrigerated */}
                      <FormField
                        control={form.control}
                        name={`medications.${index}.refrigerated`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Refrigerated</FormLabel>
                              <FormDescription>
                                Requires refrigeration
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name={`medications.${index}.notes`}
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any special instructions..."
                              className="min-h-[60px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addMedication}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Medication
                </Button>
              </CardContent>

              <div className="flex justify-between p-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push(`/cycles/${id}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : existingSchedule ? "Update Schedule" : "Save Schedule"}
                </Button>
              </div>
            </form>
          </Form>
        </Card>

        {/* Day-Specific Medications - Compact Form */}
        <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Day-Specific Medications
                  </CardTitle>
                  <CardDescription>
                    Add one-time doses for specific days
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowDaySpecificForm(!showDaySpecificForm)}>
                  <Plus className="h-4 w-4 mr-1" />
                  {showDaySpecificForm ? 'Cancel' : 'Add One-Time Dose'}
                </Button>
              </div>
            </CardHeader>
            {showDaySpecificForm && (
              <CardContent className="border-t">
                <Form {...daySpecificForm}>
                  <form onSubmit={daySpecificForm.handleSubmit(onDaySpecificSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Cycle Day */}
                      <FormField
                        control={daySpecificForm.control}
                        name="cycleDay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Day</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                placeholder="5"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Medication Name */}
                      <FormField
                        control={daySpecificForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medication</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {commonMedications.map((med) => (
                                  <SelectItem key={med} value={med}>
                                    {med}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom">Custom...</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Dosage */}
                      <FormField
                        control={daySpecificForm.control}
                        name="dosage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dosage</FormLabel>
                            <FormControl>
                              <Input placeholder="250 IU" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Time - Compact */}
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <div className="flex gap-1">
                          <FormField
                            control={daySpecificForm.control}
                            name="hour"
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="w-16">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                                    <SelectItem key={hour} value={hour.toString()}>
                                      {hour}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          <FormField
                            control={daySpecificForm.control}
                            name="minute"
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="w-16">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="00">00</SelectItem>
                                  <SelectItem value="30">30</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          <FormField
                            control={daySpecificForm.control}
                            name="ampm"
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="w-16">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="AM">AM</SelectItem>
                                  <SelectItem value="PM">PM</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      </FormItem>
                    </div>

                    {/* Custom Name if needed */}
                    {daySpecificForm.watch("name") === "custom" && (
                      <FormField
                        control={daySpecificForm.control}
                        name="customName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter medication name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Additional options in one row */}
                    <div className="flex items-center justify-between">
                      <FormField
                        control={daySpecificForm.control}
                        name="refrigerated"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Refrigerated</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            daySpecificForm.reset()
                            setShowDaySpecificForm(false)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" size="sm">
                          Add Medication
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}