// Temporary Supabase client implementation
// This will be replaced once we can install the official packages

export interface SupabaseClient {
  auth: {
    signUp: (credentials: { email: string; password: string; options?: any }) => Promise<any>
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<any>
    signOut: () => Promise<any>
    getSession: () => Promise<any>
    onAuthStateChange: (callback: (event: string, session: any) => void) => { data: { subscription: any } }
  }
  from: (table: string) => {
    select: (columns?: string) => any
    insert: (data: any) => any
    update: (data: any) => any
    delete: () => any
    eq: (column: string, value: any) => any
  }
}

// Temporary implementation - will be replaced with real Supabase client
export const createClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found. Using mock client.')
    return createMockClient()
  }

  // This will be replaced with actual Supabase client
  return createMockClient()
}

// Mock client for development
const createMockClient = (): SupabaseClient => ({
  auth: {
    signUp: async (credentials) => {
      console.log('Mock signUp:', credentials.email)
      return { data: { user: { id: 'mock-user', email: credentials.email } }, error: null }
    },
    signInWithPassword: async (credentials) => {
      console.log('Mock signIn:', credentials.email)
      return { data: { user: { id: 'mock-user', email: credentials.email } }, error: null }
    },
    signOut: async () => {
      console.log('Mock signOut')
      return { error: null }
    },
    getSession: async () => {
      console.log('Mock getSession')
      return { data: { session: null }, error: null }
    },
    onAuthStateChange: (callback) => {
      console.log('Mock onAuthStateChange')
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
  },
  from: (table) => ({
    select: (columns) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    }),
    insert: (data) => Promise.resolve({ data, error: null }),
    update: (data) => ({
      eq: (column: string, value: any) => Promise.resolve({ data, error: null })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
    }),
    eq: (column: string, value: any) => Promise.resolve({ data: [], error: null })
  })
})