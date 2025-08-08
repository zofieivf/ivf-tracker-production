"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { differenceInYears, parseISO } from "date-fns"
import { CalendarIcon, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useIVFStore } from "@/lib/store"
import type { NaturalPregnancy } from "@/lib/types"

const pregnancySchema = z.object({
  dateOfConception: z.date({
    required_error: "Date of conception is required",
  }),
  ageAtConception: z
    .string()
    .optional()
    .transform((val) => val ? Number.parseInt(val) : undefined),
  pregnancyOutcome: z.enum(["ongoing", "live-birth", "miscarriage", "medical-termination"], {
    required_error: "Please select the pregnancy outcome",
  }),
  dueDateOrBirthDate: z.date().optional(),
  dateType: z.enum(["due-date", "birth-date"]).optional(),
  outcomeDate: z.date().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // If ongoing, require due date
  if (data.pregnancyOutcome === "ongoing") {
    return data.dueDateOrBirthDate && data.dateType
  }
  // If live-birth, require birth date
  if (data.pregnancyOutcome === "live-birth") {
    return data.outcomeDate
  }
  // If miscarriage or termination, require outcome date and reason
  if (data.pregnancyOutcome === "miscarriage" || data.pregnancyOutcome === "medical-termination") {
    return data.outcomeDate && data.reason
  }
  return true
}, {
  message: "Please complete all required fields for the selected pregnancy outcome",
  path: ["pregnancyOutcome"]
})

export default function NewNaturalPregnancyPage() {
  const router = useRouter()
  const { addNaturalPregnancy, cycles, userProfile } = useIVFStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate age from existing data if available
  const suggestedAge = useMemo(() => {
    if (!userProfile?.dateOfBirth) return undefined
    
    // Find the most recent cycle to get a reference age
    const mostRecentCycle = cycles
      .filter(cycle => cycle.ageAtStart)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0]
    
    if (mostRecentCycle) {
      return mostRecentCycle.ageAtStart
    }
    
    // Fallback: calculate current age from birth date
    return differenceInYears(new Date(), parseISO(userProfile.dateOfBirth))
  }, [cycles, userProfile])

  const form = useForm<z.infer<typeof pregnancySchema>>({
    resolver: zodResolver(pregnancySchema),
    defaultValues: {
      ageAtConception: suggestedAge?.toString() || "",
      notes: "",
    },
  })

  function onSubmit(values: z.infer<typeof pregnancySchema>) {
    setIsSubmitting(true)
    
    const pregnancyData: NaturalPregnancy = {
      id: crypto.randomUUID(),
      dateOfConception: values.dateOfConception.toISOString(),
      ageAtConception: values.ageAtConception,
      pregnancyOutcome: values.pregnancyOutcome,
      dueDateOrBirthDate: values.dueDateOrBirthDate?.toISOString() || "",
      isDateOfBirth: values.dateType === "birth-date",
      outcomeDate: values.outcomeDate?.toISOString(),
      reason: values.reason,
      notes: values.notes,
      createdAt: new Date().toISOString(),
    }

    addNaturalPregnancy(pregnancyData)
    setIsSubmitting(false)
    router.push("/")
  }

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Record Natural Pregnancy</h1>
        <p className="text-muted-foreground mt-1">Add details about your natural pregnancy</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Natural Pregnancy Details</CardTitle>
          <CardDescription>
            Record information about your natural conception and pregnancy
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Date of Conception */}
              <FormField
                control={form.control}
                name="dateOfConception"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Conception</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Select conception date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          captionLayout="dropdown"
                          fromYear={1980}
                          toYear={new Date().getFullYear()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When did conception occur? (Estimated date is fine)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Age at Conception */}
              <FormField
                control={form.control}
                name="ageAtConception"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age at Conception</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter your age at conception" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {suggestedAge && `We found age ${suggestedAge} from your previous cycles - feel free to adjust if needed`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pregnancy Outcome */}
              <FormField
                control={form.control}
                name="pregnancyOutcome"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Pregnancy Outcome</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ongoing" id="ongoing" />
                          <Label htmlFor="ongoing">Ongoing pregnancy</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="live-birth" id="live-birth" />
                          <Label htmlFor="live-birth">Baby was born</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="miscarriage" id="miscarriage" />
                          <Label htmlFor="miscarriage">Miscarriage</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medical-termination" id="medical-termination" />
                          <Label htmlFor="medical-termination">Termination for medical reasons</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditional fields based on outcome */}
              {form.watch("pregnancyOutcome") === "ongoing" && (
                <FormField
                  control={form.control}
                  name="dueDateOrBirthDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expected Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Select due date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            captionLayout="dropdown"
                            fromYear={2020}
                            toYear={new Date().getFullYear() + 1}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When is the baby expected to be born?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch("pregnancyOutcome") === "live-birth" && (
                <FormField
                  control={form.control}
                  name="outcomeDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Birth Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Select birth date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            captionLayout="dropdown"
                            fromYear={2020}
                            toYear={new Date().getFullYear()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When was the baby born?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(form.watch("pregnancyOutcome") === "miscarriage" || form.watch("pregnancyOutcome") === "medical-termination") && (
                <>
                  <FormField
                    control={form.control}
                    name="outcomeDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          {form.watch("pregnancyOutcome") === "miscarriage" ? "Miscarriage Date" : "Termination Date"}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              >
                                {field.value ? format(field.value, "PPP") : 
                                  <span>Select {form.watch("pregnancyOutcome") === "miscarriage" ? "miscarriage" : "termination"} date</span>
                                }
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              captionLayout="dropdown"
                              fromYear={2020}
                              toYear={new Date().getFullYear()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When did the {form.watch("pregnancyOutcome") === "miscarriage" ? "miscarriage" : "termination"} occur?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={`Please describe the reason for the ${form.watch("pregnancyOutcome") === "miscarriage" ? "miscarriage" : "termination"}...`}
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe the reason or circumstances for the {form.watch("pregnancyOutcome") === "miscarriage" ? "miscarriage" : "termination"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes about the pregnancy..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Record any additional information about this pregnancy
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Natural Pregnancy"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}