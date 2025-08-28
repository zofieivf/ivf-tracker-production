"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useIVFStore } from "@/lib/store"
import { checkAndPromptMigration } from "@/lib/migrate-existing-data"
import { LoginForm } from "./login-form"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { currentUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isStoreRehydrated, setIsStoreRehydrated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initializeAuth = async () => {
      // Check if migration is needed
      const migrated = await checkAndPromptMigration()
      
      if (migrated) {
        // Refresh the page to load the migrated user
        window.location.reload()
        return
      }

      setIsLoading(false)
    }

    // Allow time for hydration and auth state to load
    const timer = setTimeout(initializeAuth, 100)

    return () => clearTimeout(timer)
  }, [])

  // Force store rehydration when user is available
  useEffect(() => {
    if (currentUser && !isStoreRehydrated) {
      console.log('Loading user data for:', currentUser.displayName, currentUser.id)
      
      // Load user-specific data directly
      useIVFStore.getState().loadUserData(currentUser.id)
      
      // Verify data was loaded
      const state = useIVFStore.getState()
      console.log('User profile after load:', state.userProfile)
      
      setIsStoreRehydrated(true)
    } else if (!currentUser) {
      setIsStoreRehydrated(false)
    }
  }, [currentUser, isStoreRehydrated])

  // Show loading state during hydration
  if (isLoading || (currentUser && !isStoreRehydrated)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 w-32 bg-gray-200 rounded mx-auto"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    )
  }

  // If no user is logged in, show login form
  if (!currentUser) {
    return <LoginForm />
  }

  // User is authenticated, show the app
  return <>{children}</>
}