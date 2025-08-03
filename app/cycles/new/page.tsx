"use client"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format, differenceInYears } from "date-fns"
import { CalendarIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useIVFStore } from "@/lib/store"
import { v4 as uuidv4 } from "uuid"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  cycleType: z.enum(["standard", "mini", "natural", "antagonist", "long", "other"], {
    required_error: "Cycle type is required",
  }),
})

export default function NewCyclePage() {
  const router = useRouter()
  const { addCycle } = useIVFStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cycleType: "standard",
    },
  })

  const watchedStartDate = form.watch("startDate")
  const watchedDateOfBirth = form.watch("dateOfBirth")

  // Calculate age at cycle start
  const ageAtCycleStart =
    watchedStartDate && watchedDateOfBirth ? differenceInYears(watchedStartDate, watchedDateOfBirth) : null

  function onSubmit(values: z.infer<typeof formSchema>) {
    const ageAtStart = differenceInYears(values.startDate, values.dateOfBirth)

    const newCycle = {
      id: uuidv4(),
      name: values.name,
      startDate: values.startDate.toISOString(),
      dateOfBirth: values.dateOfBirth.toISOString(),
      ageAtStart,
      cycleType: values.cycleType,
      status: "active" as const,
      days: [],
    }

    addCycle(newCycle)
    router.push(`/cycles/${newCycle.id}`)
  }

  return (
    <div className="container max-w-lg py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create New IVF Cycle</CardTitle>
          <CardDescription>Start tracking a new IVF cycle with medications, appointments, and results</CardDescription>
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
                            {field.value ? format(field.value, "PPP") : <span>Pick your date of birth</span>}
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
                          initialFocus
                          fromYear={1940}
                          toYear={new Date().getFullYear()}
                          captionLayout="dropdown-buttons"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Your date of birth to calculate age at cycle start</FormDescription>
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
                    <FormDescription>
                      The first day of your IVF cycle
                      {ageAtCycleStart !== null && (
                        <span className="block mt-1 font-medium text-foreground">
                          Age at cycle start: {ageAtCycleStart} years old
                        </span>
                      )}
                    </FormDescription>
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push("/")}>
                Cancel
              </Button>
              <Button type="submit">Create Cycle</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
