"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format, parseISO, differenceInYears } from "date-fns"
import { ArrowLeft, CalendarIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useIVFStore } from "@/lib/store"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date().optional(),
  dateOfBirth: z
    .date({
      required_error: "Date of birth is required",
    })
    .refine((date) => {
      const today = new Date()
      const age = differenceInYears(today, date)
      return age >= 18 && age <= 60
    }, "Age must be between 18 and 60 years"),
  cycleType: z.enum(["antagonist", "long-lupron", "microdose-flare", "mini-ivf", "other", "fresh", "frozen-medicated", "frozen-modified-natural", "frozen-natural"], {
    required_error: "Cycle type is required",
  }),
  cycleGoal: z.enum(["retrieval", "transfer"], {
    required_error: "Cycle goal is required",
  }),
  embryoDetails: z.enum(["day3-embryo", "day5-blastocyst", "day6-blastocyst", "day7-blastocyst"]).optional(),
  embryoGrade: z.string().optional(),
  pgtATested: z.enum(["euploid", "mosaic", "not-tested"]).optional(),
  retrievalCycleId: z.string().optional(),
  status: z.enum(["active", "completed", "cancelled"], {
    required_error: "Status is required",
  }),
})

export default function EditCyclePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { getCycleById, updateCycle, deleteCycle, cycles } = useIVFStore()
  const [cycle, setCycle] = useState(getCycleById(params.id))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCycle(getCycleById(params.id))
  }, [params.id, getCycleById])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: cycle?.name || "",
      startDate: cycle ? parseISO(cycle.startDate) : new Date(),
      endDate: cycle?.endDate ? parseISO(cycle.endDate) : undefined,
      dateOfBirth: cycle?.dateOfBirth ? parseISO(cycle.dateOfBirth) : undefined,
      cycleType: cycle?.cycleType || "standard",
      cycleGoal: cycle?.cycleGoal || "retrieval",
      embryoDetails: cycle?.embryoDetails || undefined,
      embryoGrade: cycle?.embryoGrade || "",
      pgtATested: cycle?.pgtATested || undefined,
      retrievalCycleId: cycle?.retrievalCycleId || undefined,
      status: cycle?.status || "active",
    },
  })

  const watchedStartDate = form.watch("startDate")
  const watchedDateOfBirth = form.watch("dateOfBirth")
  const watchedCycleGoal = form.watch("cycleGoal")

  // Get retrieval cycles for dropdown
  const retrievalCycles = cycles.filter(c => c.cycleGoal === "retrieval" && c.id !== params.id)

  const calculateAge = () => {
    if (watchedStartDate && watchedDateOfBirth) {
      return differenceInYears(watchedStartDate, watchedDateOfBirth)
    }
    return null
  }

  // Reset cycle type when cycle goal changes to avoid incompatible values
  useEffect(() => {
    const currentCycleType = form.getValues("cycleType")
    const currentGoal = form.getValues("cycleGoal")
    
    // Check if current cycle type is incompatible with current goal
    const retrievalTypes = ["antagonist", "long-lupron", "microdose-flare", "mini-ivf", "other"]
    const transferTypes = ["fresh", "frozen-medicated", "frozen-modified-natural", "frozen-natural"]
    
    if (currentGoal === "transfer" && retrievalTypes.includes(currentCycleType)) {
      form.setValue("cycleType", "")
      form.setValue("embryoDetails", undefined)
      form.setValue("embryoGrade", "")
      form.setValue("pgtATested", undefined)
      form.setValue("retrievalCycleId", undefined)
    } else if (currentGoal === "retrieval" && transferTypes.includes(currentCycleType)) {
      form.setValue("cycleType", "")
      form.setValue("embryoDetails", undefined)
      form.setValue("embryoGrade", "")
      form.setValue("pgtATested", undefined)
      form.setValue("retrievalCycleId", undefined)
    } else if (currentGoal === "retrieval") {
      // Clear embryo details when switching to retrieval
      form.setValue("embryoDetails", undefined)
      form.setValue("embryoGrade", "")
      form.setValue("pgtATested", undefined)
      form.setValue("retrievalCycleId", undefined)
    }
  }, [watchedCycleGoal, form])

  const handleDeleteCycle = () => {
    deleteCycle(params.id)
    router.push("/")
  }

  if (!mounted) return null

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    const ageAtStart = differenceInYears(values.startDate, values.dateOfBirth)
    const newStartDate = values.startDate
    const originalStartDate = cycle ? parseISO(cycle.startDate) : new Date()

    // Check if start date has changed
    const startDateChanged = newStartDate.getTime() !== originalStartDate.getTime()

    const updatedCycle = {
      name: values.name,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate ? values.endDate.toISOString() : undefined,
      dateOfBirth: values.dateOfBirth.toISOString(),
      ageAtStart,
      cycleType: values.cycleType,
      cycleGoal: values.cycleGoal,
      embryoDetails: values.embryoDetails,
      embryoGrade: values.embryoGrade,
      pgtATested: values.pgtATested,
      retrievalCycleId: values.retrievalCycleId,
      status: values.status,
    }

    // If start date changed, also update all day dates
    if (startDateChanged && cycle?.days && cycle.days.length > 0) {
      console.log('Start date changed, updating day dates...')
      console.log('Original start date:', originalStartDate)
      console.log('New start date:', newStartDate)
      
      const updatedDays = cycle.days.map(day => {
        // Calculate new date based on the cycle day number and new start date
        const newDayDate = new Date(newStartDate)
        newDayDate.setDate(newStartDate.getDate() + (day.cycleDay - 1))
        
        console.log(`Day ${day.cycleDay}: ${day.date} -> ${newDayDate.toISOString()}`)
        
        return {
          ...day,
          date: newDayDate.toISOString()
        }
      })

      console.log('Updating cycle with new days:', updatedDays)
      
      updateCycle(params.id, {
        ...updatedCycle,
        days: updatedDays
      })
    } else {
      console.log('No start date change or no days to update')
      updateCycle(params.id, updatedCycle)
    }

    router.push(`/cycles/${params.id}`)
  }

  return (
    <div className="container max-w-lg py-10">
      <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0">
        <Link href={`/cycles/${params.id}`} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to cycle
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit IVF Cycle</CardTitle>
          <CardDescription>Update your IVF cycle details</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cycle Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., IVF Cycle #1" {...field} />
                    </FormControl>
                    <FormDescription>Give your cycle a name to easily identify it</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cycleGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cycle Goal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cycle goal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="retrieval">Egg Retrieval</SelectItem>
                        <SelectItem value="transfer">Embryo Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>The primary goal of this IVF cycle</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick your birth date</span>}
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
                          fromYear={1940}
                          toYear={new Date().getFullYear()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Your date of birth {calculateAge() && `(Age at cycle start: ${calculateAge()} years)`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
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
                        <Calendar 
                          mode="single" 
                          selected={field.value} 
                          onSelect={field.onChange} 
                          initialFocus 
                          captionLayout="dropdown"
                          fromYear={2020}
                          toYear={new Date().getFullYear() + 1}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>The first day of your menstrual cycle</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date (optional)</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar 
                          mode="single" 
                          selected={field.value} 
                          onSelect={field.onChange} 
                          initialFocus 
                          captionLayout="dropdown"
                          fromYear={2020}
                          toYear={new Date().getFullYear() + 1}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>The last day of your IVF cycle (optional)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cycleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {watchedCycleGoal === "transfer" ? "Transfer Type" : "Cycle Type"}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            watchedCycleGoal === "transfer" 
                              ? "Select transfer type" 
                              : "Select cycle type"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {watchedCycleGoal === "transfer" ? (
                          <>
                            <SelectItem value="fresh">Fresh</SelectItem>
                            <SelectItem value="frozen-medicated">Frozen (Medicated)</SelectItem>
                            <SelectItem value="frozen-modified-natural">Frozen (Modified Natural)</SelectItem>
                            <SelectItem value="frozen-natural">Frozen (Natural)</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="antagonist">Antagonist</SelectItem>
                            <SelectItem value="long-lupron">Long Lupron</SelectItem>
                            <SelectItem value="microdose-flare">Microdose Flare</SelectItem>
                            <SelectItem value="mini-ivf">Mini-IVF</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {watchedCycleGoal === "transfer" 
                        ? "The type of embryo transfer procedure"
                        : "The protocol type for this IVF cycle"
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedCycleGoal === "transfer" && (
                <FormField
                  control={form.control}
                  name="embryoDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Embryo Details</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select embryo stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="day3-embryo">Day 3 Embryo</SelectItem>
                          <SelectItem value="day5-blastocyst">Day 5 Blastocyst</SelectItem>
                          <SelectItem value="day6-blastocyst">Day 6 Blastocyst</SelectItem>
                          <SelectItem value="day7-blastocyst">Day 7 Blastocyst</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>The developmental stage of the embryo being transferred</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedCycleGoal === "transfer" && (
                <FormField
                  control={form.control}
                  name="embryoGrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Embryo Grade</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., AA, AB, 5AA, etc." {...field} />
                      </FormControl>
                      <FormDescription>The grade or quality rating of the embryo</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedCycleGoal === "transfer" && (
                <FormField
                  control={form.control}
                  name="pgtATested"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PGT-A Tested</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select PGT-A result" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="euploid">Euploid</SelectItem>
                          <SelectItem value="mosaic">Mosaic</SelectItem>
                          <SelectItem value="not-tested">Not Tested</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>PGT-A (genetic testing) result for this embryo</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedCycleGoal === "transfer" && (
                <FormField
                  control={form.control}
                  name="retrievalCycleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Which Egg Retrieval Cycle was embryo from?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select retrieval cycle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {retrievalCycles.length === 0 ? (
                            <SelectItem value="" disabled>No retrieval cycles found</SelectItem>
                          ) : (
                            retrievalCycles.map((cycle) => (
                              <SelectItem key={cycle.id} value={cycle.id}>
                                {cycle.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>Select the retrieval cycle this embryo originated from</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>The current status of this IVF cycle</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => router.push(`/cycles/${params.id}`)}>
                  Cancel
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" type="button" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Cycle
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete IVF Cycle</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{cycle.name}"? This action cannot be undone and will permanently remove the entire cycle including all tracked days, medications, clinic visits, measurements, bloodwork results, and cycle outcomes.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteCycle} className="bg-red-600 hover:bg-red-700">
                        Delete Cycle
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              
              <Button type="submit">Save Changes</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
