"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format, parseISO, differenceInYears } from "date-fns"
import { ArrowLeft, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
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
  cycleType: z.enum(["standard", "mini", "natural", "antagonist", "long", "other"], {
    required_error: "Cycle type is required",
  }),
  cycleGoal: z.enum(["retrieval", "transfer"], {
    required_error: "Cycle goal is required",
  }),
  status: z.enum(["active", "completed", "cancelled"], {
    required_error: "Status is required",
  }),
})

export default function EditCyclePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { getCycleById, updateCycle } = useIVFStore()
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
      status: cycle?.status || "active",
    },
  })

  const watchedStartDate = form.watch("startDate")
  const watchedDateOfBirth = form.watch("dateOfBirth")

  const calculateAge = () => {
    if (watchedStartDate && watchedDateOfBirth) {
      return differenceInYears(watchedStartDate, watchedDateOfBirth)
    }
    return null
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

    updateCycle(params.id, {
      name: values.name,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate ? values.endDate.toISOString() : undefined,
      dateOfBirth: values.dateOfBirth.toISOString(),
      ageAtStart,
      cycleType: values.cycleType,
      cycleGoal: values.cycleGoal,
      status: values.status,
    })

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
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>The first day of your IVF cycle</FormDescription>
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
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                    <FormLabel>Cycle Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cycle type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="mini">Mini</SelectItem>
                        <SelectItem value="natural">Natural</SelectItem>
                        <SelectItem value="antagonist">Antagonist</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>The protocol type for this IVF cycle</FormDescription>
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
              <Button variant="outline" type="button" onClick={() => router.push(`/cycles/${params.id}`)}>
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
