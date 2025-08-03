"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { differenceInYears, format } from "date-fns"
import { CalendarIcon, ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useIVFStore } from "@/lib/store"
import type { IVFCycle } from "@/lib/types"

export default function NewCyclePage() {
  const router = useRouter()
  const { addCycle } = useIVFStore()

  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [dateOfBirth, setDateOfBirth] = useState<Date>()
  const [cycleType, setCycleType] = useState<IVFCycle["cycleType"]>("standard")
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isBirthDateOpen, setIsBirthDateOpen] = useState(false)

  const calculateAge = () => {
    if (dateOfBirth && startDate) {
      return differenceInYears(startDate, dateOfBirth)
    }
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !startDate || !dateOfBirth) {
      return
    }

    const ageAtStart = calculateAge()

    const newCycle: IVFCycle = {
      id: crypto.randomUUID(),
      name,
      startDate: startDate.toISOString(),
      dateOfBirth: dateOfBirth.toISOString(),
      ageAtStart: ageAtStart || undefined,
      cycleType,
      status: "active",
      days: [],
    }

    addCycle(newCycle)
    router.push(`/cycles/${newCycle.id}`)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => currentYear - i)

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Create New Cycle</h1>
        <p className="text-muted-foreground mt-2">Start tracking a new IVF cycle</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cycle Information</CardTitle>
          <CardDescription>
            Enter the basic information for your new IVF cycle
            {calculateAge() && (
              <span className="block mt-2 text-sm font-medium text-foreground">
                Age at cycle start: {calculateAge()} years
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Cycle Name</Label>
              <Input
                id="name"
                placeholder="e.g., First IVF Cycle, Cycle #2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Popover open={isBirthDateOpen} onOpenChange={setIsBirthDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateOfBirth && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateOfBirth ? format(dateOfBirth, "PPP") : "Select your date of birth"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 border-b">
                    <Select
                      value={dateOfBirth?.getFullYear().toString()}
                      onValueChange={(year) => {
                        const newDate = new Date(dateOfBirth || new Date())
                        newDate.setFullYear(Number.parseInt(year))
                        setDateOfBirth(newDate)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Calendar
                    mode="single"
                    selected={dateOfBirth}
                    onSelect={(date) => {
                      setDateOfBirth(date)
                      setIsBirthDateOpen(false)
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Cycle Start Date</Label>
              <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select cycle start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date)
                      setIsStartDateOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cycleType">Cycle Type</Label>
              <Select value={cycleType} onValueChange={(value: IVFCycle["cycleType"]) => setCycleType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard IVF</SelectItem>
                  <SelectItem value="mini">Mini IVF</SelectItem>
                  <SelectItem value="natural">Natural Cycle</SelectItem>
                  <SelectItem value="antagonist">Antagonist Protocol</SelectItem>
                  <SelectItem value="long">Long Protocol</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={!name || !startDate || !dateOfBirth}>
                Create Cycle
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
