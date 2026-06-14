import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wsszybvlwtgvktzmzkom.supabase.co'

let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!supabaseAnonKey || supabaseAnonKey === 'sb_publishable_DN6doE5OGy_DvNMi3Shy_Q_e1FaUKo') {
  supabaseAnonKey = 'sb_publishable_DN6doE5OGy_DvNMi3Shy_Q_e1FaUKoI'
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
