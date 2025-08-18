"use client"

// Simple localStorage-based store for remembering date picker selections
const DATE_PICKER_STORAGE_KEY = "ivf-tracker-date-picker-preferences"

interface DatePickerPreferences {
  lastStartDate?: string
  lastEndDate?: string  
  lastDateOfBirth?: string
  lastClinicVisitDate?: string
  lastDayDate?: string
}

export const datePickerStore = {
  // Get stored preferences
  getPreferences(): DatePickerPreferences {
    if (typeof window === "undefined") return {}
    
    try {
      const stored = localStorage.getItem(DATE_PICKER_STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  },

  // Save a specific date preference
  saveDate(key: keyof DatePickerPreferences, date: Date) {
    if (typeof window === "undefined") return
    
    try {
      const current = this.getPreferences()
      const updated = {
        ...current,
        [key]: date.toISOString()
      }
      localStorage.setItem(DATE_PICKER_STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // Silently fail if localStorage is not available
    }
  },

  // Get a specific saved date
  getDate(key: keyof DatePickerPreferences): Date | undefined {
    const prefs = this.getPreferences()
    const dateString = prefs[key]
    
    if (!dateString) return undefined
    
    try {
      return new Date(dateString)
    } catch {
      return undefined
    }
  },

  // Get a good default month for the calendar to open to
  getDefaultMonth(key: keyof DatePickerPreferences, fallback?: Date): Date {
    const savedDate = this.getDate(key)
    if (savedDate && !isNaN(savedDate.getTime())) {
      return savedDate
    }
    return fallback || new Date()
  }
}