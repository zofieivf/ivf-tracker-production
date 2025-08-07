"use client"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format, differenceInYears } from "date-fns"
import { CalendarIcon, User, Edit, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useIVFStore } from "@/lib/store"
import type { UserProfile } from "@/lib/types"

const aboutMeSchema = z.object({
  location: z.string().optional(),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }).refine((date) => {
    const today = new Date()
    const age = differenceInYears(today, date)
    return age >= 18 && age <= 60
  }, "Age must be between 18 and 60 years"),
  ivfReasons: z.array(z.enum([
    "low-amh", 
    "dor", 
    "premature-ovarian-failure", 
    "endo", 
    "pcos", 
    "blocked-fallopian-tubes", 
    "secondary-infertility", 
    "same-sex", 
    "genetic-reasons", 
    "antiphospholipid-syndrome", 
    "male-factor", 
    "other"
  ])).min(1, "Please select at least one reason for undergoing IVF"),
  ivfReasonOther: z.string().optional(),
  livingChildren: z.number({
    required_error: "Please specify the number of living children",
  }).min(0).max(10),
  childrenFromIVF: z.enum(["yes", "no"]).optional(),
}).refine((data) => {
  if (data.ivfReasons.includes("other") && !data.ivfReasonOther?.trim()) {
    return false
  }
  return true
}, {
  message: "Please specify the reason when selecting 'Other'",
  path: ["ivfReasonOther"]
}).refine((data) => {
  if (data.livingChildren > 0 && !data.childrenFromIVF) {
    return false
  }
  return true
}, {
  message: "Please specify if any children were conceived through IVF",
  path: ["childrenFromIVF"]
})

const ivfReasonOptions = [
  { value: "low-amh", label: "Low AMH" },
  { value: "dor", label: "DOR (Diminished Ovarian Reserve)" },
  { value: "premature-ovarian-failure", label: "Premature Ovarian Failure" },
  { value: "endo", label: "Endometriosis" },
  { value: "pcos", label: "PCOS" },
  { value: "blocked-fallopian-tubes", label: "Blocked Fallopian Tubes" },
  { value: "secondary-infertility", label: "Secondary Infertility" },
  { value: "same-sex", label: "Same-sex Couple" },
  { value: "genetic-reasons", label: "Genetic Reasons" },
  { value: "antiphospholipid-syndrome", label: "Antiphospholipid Syndrome" },
  { value: "male-factor", label: "Male Factor" },
  { value: "other", label: "Other" },
]

export function AboutMeCard() {
  const { userProfile, setUserProfile, updateUserProfile } = useIVFStore()
  const [isEditing, setIsEditing] = useState(!userProfile)

  const form = useForm<z.infer<typeof aboutMeSchema>>({
    resolver: zodResolver(aboutMeSchema),
    defaultValues: {
      location: userProfile?.location || "",
      dateOfBirth: userProfile?.dateOfBirth ? new Date(userProfile.dateOfBirth) : undefined,
      ivfReasons: userProfile?.ivfReasons || [],
      ivfReasonOther: userProfile?.ivfReasonOther || "",
      livingChildren: userProfile?.livingChildren ?? 0,
      childrenFromIVF: userProfile?.childrenFromIVF || undefined,
    },
  })

  const watchedIvfReasons = form.watch("ivfReasons")
  const watchedDateOfBirth = form.watch("dateOfBirth")
  const watchedLivingChildren = form.watch("livingChildren")

  const calculateAge = () => {
    if (watchedDateOfBirth) {
      return differenceInYears(new Date(), watchedDateOfBirth)
    }
    return null
  }

  const getReasonLabel = (reason: string) => {
    return ivfReasonOptions.find(option => option.value === reason)?.label || reason
  }

  function onSubmit(values: z.infer<typeof aboutMeSchema>) {
    const profileData: UserProfile = {
      id: userProfile?.id || crypto.randomUUID(),
      location: values.location,
      dateOfBirth: values.dateOfBirth.toISOString(),
      ivfReasons: values.ivfReasons,
      ivfReasonOther: values.ivfReasonOther,
      livingChildren: values.livingChildren,
      childrenFromIVF: values.childrenFromIVF,
      createdAt: userProfile?.createdAt || new Date().toISOString(),
    }

    if (userProfile) {
      updateUserProfile(profileData)
    } else {
      setUserProfile(profileData)
    }
    setIsEditing(false)
  }

  if (!isEditing && userProfile) {
    return (
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="bg-purple-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <User className="h-6 w-6 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <CardTitle className="text-xl">About Me</CardTitle>
                <CardDescription className="mt-2">Your IVF journey information</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {userProfile.location && (
              <div>
                <p className="font-medium">Location</p>
                <p>{userProfile.location}</p>
              </div>
            )}
            
            <div>
              <p className="font-medium">Age</p>
              <p>{differenceInYears(new Date(), new Date(userProfile.dateOfBirth))} years</p>
            </div>
            
            <div>
              <p className="font-medium">Living Children</p>
              <p>{userProfile.livingChildren}</p>
            </div>
            
            {userProfile.livingChildren > 0 && userProfile.childrenFromIVF && (
              <div>
                <p className="font-medium">Children from IVF</p>
                <p>{userProfile.childrenFromIVF === "yes" ? "Yes" : "No"}</p>
              </div>
            )}
            
            <div className="md:col-span-2">
              <p className="font-medium">Reasons for IVF</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {userProfile.ivfReasons.map((reason, index) => (
                  <span key={reason} className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs">
                    {reason === "other" && userProfile.ivfReasonOther 
                      ? userProfile.ivfReasonOther 
                      : getReasonLabel(reason)
                    }
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader className="bg-purple-50">
        <div className="flex items-start gap-3">
          <User className="h-6 w-6 text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <CardTitle className="text-xl">About Me</CardTitle>
            <CardDescription className="mt-2">
              Tell us about yourself and your IVF journey
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., San Francisco, CA" {...field} />
                  </FormControl>
                  <FormDescription>Your city or general location</FormDescription>
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
                          {field.value ? format(field.value, "PPP") : <span>Select your birth date</span>}
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
                    {calculateAge() && `You are ${calculateAge()} years old`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ivfReasons"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reasons for undergoing IVF</FormLabel>
                  <FormDescription>Select all that apply</FormDescription>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {ivfReasonOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.value}
                          checked={field.value?.includes(option.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, option.value])
                            } else {
                              field.onChange(field.value?.filter((value: string) => value !== option.value))
                            }
                          }}
                        />
                        <label
                          htmlFor={option.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedIvfReasons?.includes("other") && (
              <FormField
                control={form.control}
                name="ivfReasonOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please specify</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe your specific reason for undergoing IVF"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="livingChildren"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Any Living Children</FormLabel>
                  <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of children" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedLivingChildren > 0 && (
              <FormField
                control={form.control}
                name="childrenFromIVF"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Were any of these children conceived through IVF?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select yes or no" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          <CardContent className="flex justify-between pt-0">
            {userProfile && (
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
            <Button type="submit">
              <Check className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  )
}