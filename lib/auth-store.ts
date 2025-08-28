"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Simple password hashing utility (client-side)
// Note: In production, use proper server-side hashing
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'ivf-tracker-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const hashedInput = await hashPassword(password)
  return hashedInput === hash
}

export interface User {
  id: string
  username: string
  displayName: string
  email: string
  passwordHash: string
  createdAt: string
  lastLoginAt: string
}

interface AuthStore {
  currentUser: User | null
  users: User[]
  
  // Auth actions
  createAccount: (username: string, displayName: string, email: string, password: string) => Promise<User>
  loginUser: (username: string, password: string) => Promise<User | null>
  logoutUser: () => void
  switchUser: (userId: string) => Promise<void>
  deleteAccount: (userId: string) => Promise<void>
  
  // User management
  updateCurrentUser: (updates: Partial<User>) => void
  getUserById: (id: string) => User | undefined
  getAllUsers: () => User[]
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],

      createAccount: async (username: string, displayName: string, email: string, password: string) => {
        const { users } = get()
        
        // Check if username already exists
        if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
          throw new Error('Username already exists')
        }

        // Check if email already exists
        if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
          throw new Error('Email already exists')
        }

        // Hash the password
        const passwordHash = await hashPassword(password)

        const newUser: User = {
          id: crypto.randomUUID(),
          username: username.toLowerCase(),
          displayName,
          email,
          passwordHash,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        }

        set((state) => ({
          users: [...state.users, newUser],
          currentUser: newUser
        }))

        // Initialize empty store for new user
        localStorage.setItem(`ivf-tracker-storage-${newUser.id}`, JSON.stringify({
          state: {
            cycles: [],
            procedures: [],
            naturalPregnancies: [],
            medicationSchedules: [],
            dailyMedicationStatuses: [],
            userProfile: null,
            medications: []
          },
          version: 0
        }))

        return newUser
      },

      loginUser: async (username: string, password: string) => {
        const { users } = get()
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase())
        
        if (!user) {
          throw new Error('Invalid username or password')
        }

        // Verify password
        const isPasswordValid = await verifyPassword(password, user.passwordHash)
        if (!isPasswordValid) {
          throw new Error('Invalid username or password')
        }

        const updatedUser = { ...user, lastLoginAt: new Date().toISOString() }
        
        set((state) => ({
          currentUser: updatedUser,
          users: state.users.map(u => u.id === user.id ? updatedUser : u)
        }))

        // Data loading will be handled by AuthWrapper
        
        return updatedUser
      },

      logoutUser: () => {
        set({ currentUser: null })
        // Clear main store will happen via storage system
      },

      switchUser: async (userId: string) => {
        const { users } = get()
        const user = users.find(u => u.id === userId)
        
        if (!user) {
          throw new Error('User not found')
        }

        // Update current user - the store will handle the data switching
        set({ 
          currentUser: { ...user, lastLoginAt: new Date().toISOString() }
        })
        
        // Reload the page to trigger store rehydration with new user data
        setTimeout(() => {
          window.location.reload()
        }, 100)
      },

      deleteAccount: async (userId: string) => {
        const { users, currentUser } = get()
        
        // Remove user data from localStorage
        localStorage.removeItem(`ivf-tracker-storage-${userId}`)
        
        // Remove user from users array
        const updatedUsers = users.filter(u => u.id !== userId)
        
        // If we're deleting the current user, logout
        const newCurrentUser = currentUser?.id === userId ? null : currentUser
        
        set({
          users: updatedUsers,
          currentUser: newCurrentUser
        })

        if (newCurrentUser === null) {
          // Clear localStorage will happen via storage system
          window.location.reload()
        }
      },

      updateCurrentUser: (updates: Partial<User>) => {
        const { currentUser, users } = get()
        if (!currentUser) return

        const updatedUser = { ...currentUser, ...updates }
        
        set({
          currentUser: updatedUser,
          users: users.map(u => u.id === currentUser.id ? updatedUser : u)
        })
      },

      getUserById: (id: string) => {
        return get().users.find(u => u.id === id)
      },

      getAllUsers: () => {
        return get().users
      }
    }),
    {
      name: "ivf-tracker-auth",
    }
  )
)