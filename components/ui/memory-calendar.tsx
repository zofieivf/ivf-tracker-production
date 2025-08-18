"use client"

import { Calendar } from "@/components/ui/calendar"
import { datePickerStore } from "@/lib/date-picker-store"

interface MemoryCalendarProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  captionLayout?: "dropdown" | "default"
  fromYear?: number
  toYear?: number
  initialFocus?: boolean
  memoryKey: "lastStartDate" | "lastEndDate" | "lastDateOfBirth" | "lastClinicVisitDate" | "lastDayDate"
  className?: string
}

export function MemoryCalendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  captionLayout,
  fromYear,
  toYear,
  initialFocus,
  memoryKey,
  className
}: MemoryCalendarProps) {
  
  // Get the default month based on either the current selected date or the saved preference
  const getDefaultMonth = () => {
    if (selected && !isNaN(selected.getTime())) {
      return selected
    }
    return datePickerStore.getDefaultMonth(memoryKey)
  }

  const handleSelect = (date: Date | undefined) => {
    if (date && !isNaN(date.getTime())) {
      // Save the selected date to memory
      datePickerStore.saveDate(memoryKey, date)
    }
    
    // Call the original onSelect handler
    onSelect?.(date)
  }

  return (
    <Calendar
      mode={mode}
      selected={selected}
      onSelect={handleSelect}
      disabled={disabled}
      captionLayout={captionLayout}
      fromYear={fromYear}
      toYear={toYear}
      initialFocus={initialFocus}
      defaultMonth={getDefaultMonth()}
      className={className}
    />
  )
}