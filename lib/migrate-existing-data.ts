/**
 * Migration utility to help existing single-user installations 
 * migrate to the new multi-user system
 */

import { useAuthStore } from "./auth-store"

export async function migrateExistingDataToMultiUser(): Promise<boolean> {
  try {
    // Check if there's existing data in the old format
    const existingData = localStorage.getItem('ivf-tracker-storage')
    
    if (!existingData) {
      console.log('No existing data to migrate')
      return false
    }

    // Check if we already have users (migration already done)
    const authData = localStorage.getItem('ivf-tracker-auth')
    if (authData) {
      const parsedAuthData = JSON.parse(authData)
      if (parsedAuthData.state?.users?.length > 0) {
        console.log('Migration already completed')
        return false
      }
    }

    console.log('Starting data migration...')

    // Parse existing data
    const parsedData = JSON.parse(existingData)
    const userData = parsedData.state || parsedData

    // Create a default user account for existing data
    const defaultUser = {
      id: crypto.randomUUID(),
      username: 'existing_user',
      displayName: 'My Account',
      email: 'migrated@ivftracker.local', // Placeholder email for migrated users
      passwordHash: 'migrated-user-no-password', // Placeholder hash - user should set password
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    }

    // Create auth store with the default user
    const authStoreData = {
      state: {
        currentUser: defaultUser,
        users: [defaultUser]
      },
      version: 0
    }

    // Save auth data
    localStorage.setItem('ivf-tracker-auth', JSON.stringify(authStoreData))

    // Move existing data to user-specific storage
    localStorage.setItem(`ivf-tracker-storage-${defaultUser.id}`, JSON.stringify({
      state: userData,
      version: 0
    }))

    // Remove old global storage
    localStorage.removeItem('ivf-tracker-storage')

    console.log('Migration completed successfully')
    return true

  } catch (error) {
    console.error('Migration failed:', error)
    return false
  }
}

/**
 * Check if migration is needed and prompt user
 */
export function checkAndPromptMigration(): Promise<boolean> {
  return new Promise((resolve) => {
    const existingData = localStorage.getItem('ivf-tracker-storage')
    const authData = localStorage.getItem('ivf-tracker-auth')
    
    // No migration needed if no existing data or already migrated
    if (!existingData || (authData && JSON.parse(authData).state?.users?.length > 0)) {
      resolve(false)
      return
    }

    // Show migration prompt
    const shouldMigrate = confirm(
      'We found existing IVF data on this device. Would you like to migrate it to the new multi-user system?\n\n' +
      'This will:\n' +
      '• Create a default account called "My Account"\n' +
      '• Preserve all your existing cycles and data\n' +
      '• Enable you to add additional accounts later\n\n' +
      'Click OK to migrate, or Cancel to start fresh.'
    )

    if (shouldMigrate) {
      migrateExistingDataToMultiUser().then(resolve)
    } else {
      // Clear old data if user chooses to start fresh
      localStorage.removeItem('ivf-tracker-storage')
      resolve(false)
    }
  })
}