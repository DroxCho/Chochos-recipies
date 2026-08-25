import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://bpgfxnwlrrgntzhjxqdr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const hasSupabaseAnonKey = supabaseAnonKey.length > 0;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
