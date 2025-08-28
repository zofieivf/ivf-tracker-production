"use client"

import { useState, useEffect } from "react"
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
    "adenomyosis",
    "pcos", 
    "blocked-fallopian-tubes", 
    "secondary-infertility", 
    "recurrent-pregnancy-loss",
    "same-sex", 
    "genetic-reasons", 
    "antiphospholipid-syndrome", 
    "male-factor", 
    "other"
  ])).min(1, "Please select at least one reason for undergoing IVF"),
  ivfReasonOther: z.string().optional(),
  geneticReasonsDetails: z.string().optional(),
  livingChildren: z.number({
    required_error: "Please specify the number of living children",
  }).min(0).max(10),
  childrenFromIVF: z.enum(["yes", "no"]).optional(),
  numberOfIVFChildren: z.number().min(1).max(10).optional(),
  regularPeriods: z.enum(["yes", "no"]).optional(),
  menstrualCycleDays: z.number().min(21).max(45).optional(),
}).refine((data) => {
  if (data.ivfReasons.includes("other") && !data.ivfReasonOther?.trim()) {
    return false
  }
  return true
}, {
  message: "Please specify the reason when selecting 'Other'",
  path: ["ivfReasonOther"]
}).refine((data) => {
  if (data.ivfReasons.includes("genetic-reasons") && !data.geneticReasonsDetails?.trim()) {
    return false
  }
  return true
}, {
  message: "Please provide details when selecting 'Genetic Reasons'",
  path: ["geneticReasonsDetails"]
}).refine((data) => {
  if (data.livingChildren > 0 && !data.childrenFromIVF) {
    return false
  }
  return true
}, {
  message: "Please specify if any children were conceived through IVF",
  path: ["childrenFromIVF"]
}).refine((data) => {
  if (data.childrenFromIVF === "yes" && !data.numberOfIVFChildren) {
    return false
  }
  return true
}, {
  message: "Please specify how many children were conceived through IVF",
  path: ["numberOfIVFChildren"]
}).refine((data) => {
  if (data.numberOfIVFChildren && data.numberOfIVFChildren > data.livingChildren) {
    return false
  }
  return true
}, {
  message: "Number of IVF children cannot exceed total living children",
  path: ["numberOfIVFChildren"]
})

const countryOptions = [
  { value: "AD", label: "Andorra" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "AL", label: "Albania" },
  { value: "AR", label: "Argentina" },
  { value: "AT", label: "Austria" },
  { value: "AU", label: "Australia" },
  { value: "BA", label: "Bosnia and Herzegovina" },
  { value: "BE", label: "Belgium" },
  { value: "BF", label: "Burkina Faso" },
  { value: "BG", label: "Bulgaria" },
  { value: "BI", label: "Burundi" },
  { value: "BJ", label: "Benin" },
  { value: "BO", label: "Bolivia" },
  { value: "BR", label: "Brazil" },
  { value: "BW", label: "Botswana" },
  { value: "BY", label: "Belarus" },
  { value: "CA", label: "Canada" },
  { value: "CD", label: "Democratic Republic of the Congo" },
  { value: "CF", label: "Central African Republic" },
  { value: "CG", label: "Republic of the Congo" },
  { value: "CH", label: "Switzerland" },
  { value: "CI", label: "Côte d'Ivoire" },
  { value: "CL", label: "Chile" },
  { value: "CM", label: "Cameroon" },
  { value: "CN", label: "China" },
  { value: "CO", label: "Colombia" },
  { value: "CV", label: "Cape Verde" },
  { value: "CY", label: "Cyprus" },
  { value: "CZ", label: "Czech Republic" },
  { value: "DE", label: "Germany" },
  { value: "DJ", label: "Djibouti" },
  { value: "DK", label: "Denmark" },
  { value: "DZ", label: "Algeria" },
  { value: "EC", label: "Ecuador" },
  { value: "EE", label: "Estonia" },
  { value: "EG", label: "Egypt" },
  { value: "ER", label: "Eritrea" },
  { value: "ES", label: "Spain" },
  { value: "ET", label: "Ethiopia" },
  { value: "FI", label: "Finland" },
  { value: "FK", label: "Falkland Islands" },
  { value: "FR", label: "France" },
  { value: "GA", label: "Gabon" },
  { value: "GB", label: "United Kingdom" },
  { value: "GF", label: "French Guiana" },
  { value: "GH", label: "Ghana" },
  { value: "GM", label: "Gambia" },
  { value: "GN", label: "Guinea" },
  { value: "GQ", label: "Equatorial Guinea" },
  { value: "GR", label: "Greece" },
  { value: "GW", label: "Guinea-Bissau" },
  { value: "GY", label: "Guyana" },
  { value: "HK", label: "Hong Kong" },
  { value: "HR", label: "Croatia" },
  { value: "HU", label: "Hungary" },
  { value: "ID", label: "Indonesia" },
  { value: "IE", label: "Ireland" },
  { value: "IL", label: "Israel" },
  { value: "IN", label: "India" },
  { value: "IS", label: "Iceland" },
  { value: "IT", label: "Italy" },
  { value: "JP", label: "Japan" },
  { value: "KE", label: "Kenya" },
  { value: "KM", label: "Comoros" },
  { value: "KR", label: "South Korea" },
  { value: "LI", label: "Liechtenstein" },
  { value: "LR", label: "Liberia" },
  { value: "LS", label: "Lesotho" },
  { value: "LT", label: "Lithuania" },
  { value: "LU", label: "Luxembourg" },
  { value: "LV", label: "Latvia" },
  { value: "LY", label: "Libya" },
  { value: "MA", label: "Morocco" },
  { value: "MC", label: "Monaco" },
  { value: "MD", label: "Moldova" },
  { value: "ME", label: "Montenegro" },
  { value: "MG", label: "Madagascar" },
  { value: "MK", label: "North Macedonia" },
  { value: "ML", label: "Mali" },
  { value: "MR", label: "Mauritania" },
  { value: "MT", label: "Malta" },
  { value: "MU", label: "Mauritius" },
  { value: "MW", label: "Malawi" },
  { value: "MX", label: "Mexico" },
  { value: "MY", label: "Malaysia" },
  { value: "MZ", label: "Mozambique" },
  { value: "NA", label: "Namibia" },
  { value: "NE", label: "Niger" },
  { value: "NG", label: "Nigeria" },
  { value: "NL", label: "Netherlands" },
  { value: "NO", label: "Norway" },
  { value: "NZ", label: "New Zealand" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "PY", label: "Paraguay" },
  { value: "RO", label: "Romania" },
  { value: "RS", label: "Serbia" },
  { value: "RU", label: "Russia" },
  { value: "RW", label: "Rwanda" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "SC", label: "Seychelles" },
  { value: "SD", label: "Sudan" },
  { value: "SE", label: "Sweden" },
  { value: "SG", label: "Singapore" },
  { value: "SI", label: "Slovenia" },
  { value: "SK", label: "Slovakia" },
  { value: "SL", label: "Sierra Leone" },
  { value: "SM", label: "San Marino" },
  { value: "SN", label: "Senegal" },
  { value: "SO", label: "Somalia" },
  { value: "SR", label: "Suriname" },
  { value: "SS", label: "South Sudan" },
  { value: "ST", label: "São Tomé and Príncipe" },
  { value: "SZ", label: "Eswatini" },
  { value: "TD", label: "Chad" },
  { value: "TG", label: "Togo" },
  { value: "TH", label: "Thailand" },
  { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Turkey" },
  { value: "TW", label: "Taiwan" },
  { value: "TZ", label: "Tanzania" },
  { value: "UA", label: "Ukraine" },
  { value: "UG", label: "Uganda" },
  { value: "US", label: "United States" },
  { value: "UY", label: "Uruguay" },
  { value: "VA", label: "Vatican City" },
  { value: "VE", label: "Venezuela" },
  { value: "VN", label: "Vietnam" },
  { value: "XK", label: "Kosovo" },
  { value: "ZA", label: "South Africa" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" },
]

const ivfReasonOptions = [
  { value: "low-amh", label: "Low AMH" },
  { value: "dor", label: "DOR (Diminished Ovarian Reserve)" },
  { value: "premature-ovarian-failure", label: "Premature Ovarian Failure" },
  { value: "endo", label: "Endometriosis" },
  { value: "adenomyosis", label: "Adenomyosis" },
  { value: "pcos", label: "Polycystic ovary syndrome (PCOS)" },
  { value: "blocked-fallopian-tubes", label: "Blocked Fallopian Tubes" },
  { value: "secondary-infertility", label: "Secondary Infertility" },
  { value: "recurrent-pregnancy-loss", label: "Recurrent Pregnancy Loss" },
  { value: "same-sex", label: "Same-sex Couple" },
  { value: "genetic-reasons", label: "Genetic Reasons" },
  { value: "antiphospholipid-syndrome", label: "Antiphospholipid Syndrome" },
  { value: "male-factor", label: "Sperm Factor Infertility" },
  { value: "other", label: "Other" },
]

export function AboutMeCard() {
  const { userProfile, setUserProfile, updateUserProfile } = useIVFStore()
  const [isEditing, setIsEditing] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle client-side mounting and check for user profile
  useEffect(() => {
    setMounted(true)
  }, [])

  // Separate effect to handle profile check after mount
  useEffect(() => {
    if (mounted && !userProfile && !isEditing) {
      setIsEditing(true)
    }
  }, [mounted, userProfile, isEditing])

  const form = useForm<z.infer<typeof aboutMeSchema>>({
    resolver: zodResolver(aboutMeSchema),
    defaultValues: {
      location: userProfile?.location || "",
      dateOfBirth: userProfile?.dateOfBirth ? new Date(userProfile.dateOfBirth) : undefined,
      ivfReasons: userProfile?.ivfReasons || [],
      ivfReasonOther: userProfile?.ivfReasonOther || "",
      geneticReasonsDetails: userProfile?.geneticReasonsDetails || "",
      livingChildren: userProfile?.livingChildren ?? 0,
      childrenFromIVF: userProfile?.childrenFromIVF || undefined,
      numberOfIVFChildren: userProfile?.numberOfIVFChildren || undefined,
      regularPeriods: userProfile?.regularPeriods || undefined,
      menstrualCycleDays: userProfile?.menstrualCycleDays || undefined,
    },
  })

  // Reset form when entering edit mode
  useEffect(() => {
    if (isEditing && userProfile) {
      form.reset({
        location: userProfile.location || "",
        dateOfBirth: userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth) : undefined,
        ivfReasons: userProfile.ivfReasons || [],
        ivfReasonOther: userProfile.ivfReasonOther || "",
        geneticReasonsDetails: userProfile.geneticReasonsDetails || "",
        livingChildren: userProfile.livingChildren ?? 0,
        childrenFromIVF: userProfile.childrenFromIVF || undefined,
        numberOfIVFChildren: userProfile.numberOfIVFChildren || undefined,
        regularPeriods: userProfile.regularPeriods || undefined,
        menstrualCycleDays: userProfile.menstrualCycleDays || undefined,
      })
    }
  }, [isEditing, userProfile, form])

  const watchedIvfReasons = form.watch("ivfReasons")
  const watchedDateOfBirth = form.watch("dateOfBirth")
  const watchedLivingChildren = form.watch("livingChildren")
  const watchedChildrenFromIVF = form.watch("childrenFromIVF")
  const watchedRegularPeriods = form.watch("regularPeriods")

  const calculateAge = () => {
    if (watchedDateOfBirth) {
      return differenceInYears(new Date(), watchedDateOfBirth)
    }
    return null
  }

  const getReasonLabel = (reason: string) => {
    return ivfReasonOptions.find(option => option.value === reason)?.label || reason
  }

  const getCountryLabel = (countryCode: string) => {
    return countryOptions.find(option => option.value === countryCode)?.label || countryCode
  }

  function onSubmit(values: z.infer<typeof aboutMeSchema>) {
    const profileData: UserProfile = {
      id: userProfile?.id || crypto.randomUUID(),
      location: values.location,
      dateOfBirth: values.dateOfBirth.toISOString(),
      ivfReasons: values.ivfReasons,
      ivfReasonOther: values.ivfReasonOther,
      geneticReasonsDetails: values.geneticReasonsDetails,
      livingChildren: values.livingChildren,
      childrenFromIVF: values.childrenFromIVF,
      numberOfIVFChildren: values.numberOfIVFChildren,
      regularPeriods: values.regularPeriods,
      menstrualCycleDays: values.menstrualCycleDays,
      createdAt: userProfile?.createdAt || new Date().toISOString(),
    }

    if (userProfile) {
      updateUserProfile(profileData)
    } else {
      setUserProfile(profileData)
    }
    setIsEditing(false)
  }

  // Show loading state during hydration
  if (!mounted) {
    return (
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="bg-purple-50">
          <div className="flex items-start gap-3">
            <User className="h-6 w-6 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <CardTitle className="text-xl">About Me</CardTitle>
              <CardDescription className="mt-2">Loading...</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
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
                <p className="font-medium">Country</p>
                <p>{getCountryLabel(userProfile.location)}</p>
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
            
            {userProfile.childrenFromIVF === "yes" && userProfile.numberOfIVFChildren && (
              <div>
                <p className="font-medium">Number from IVF</p>
                <p>{userProfile.numberOfIVFChildren}</p>
              </div>
            )}
            
            {userProfile.regularPeriods && (
              <div>
                <p className="font-medium">Regular Periods</p>
                <p>{userProfile.regularPeriods === "yes" ? "Yes" : "No"}</p>
              </div>
            )}
            
            {userProfile.menstrualCycleDays && (
              <div>
                <p className="font-medium">Menstrual Cycle</p>
                <p>{userProfile.menstrualCycleDays} days</p>
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
            
            {userProfile.ivfReasons.includes("genetic-reasons") && userProfile.geneticReasonsDetails && (
              <div className="md:col-span-2">
                <p className="font-medium">Genetic Reasons Details</p>
                <p className="text-sm text-gray-700 mt-1">{userProfile.geneticReasonsDetails}</p>
              </div>
            )}
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
                  <FormLabel>Country (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countryOptions.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Your country of residence</FormDescription>
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

            {watchedIvfReasons?.includes("genetic-reasons") && (
              <FormField
                control={form.control}
                name="geneticReasonsDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genetic Reasons Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide details about the genetic reasons for undergoing IVF"
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

            {watchedChildrenFromIVF === "yes" && (
              <FormField
                control={form.control}
                name="numberOfIVFChildren"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How many children were conceived through IVF?</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of IVF children" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: Math.min(10, watchedLivingChildren || 10) }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="regularPeriods"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regular Periods (Optional)</FormLabel>
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
                  <FormDescription>Do you have regular menstrual periods?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedRegularPeriods === "yes" && (
              <FormField
                control={form.control}
                name="menstrualCycleDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Menstrual Cycle Length</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="21"
                        max="45"
                        placeholder="28"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>Length of your menstrual cycle in days (typically 21-45 days)</FormDescription>
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