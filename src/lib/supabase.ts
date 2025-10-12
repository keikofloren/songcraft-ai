import { createClient } from '@supabase/supabase-js'

const supabaseAnonKey = "***REMOVED***"
const supabaseUrl = "https://***REMOVED***"

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
)

