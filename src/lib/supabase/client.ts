import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lqgpdsrntfwsjgxuxosa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZ3Bkc3JudGZ3c2pneHV4b3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MjQ4MTMsImV4cCI6MjA4MzUwMDgxM30.g6HlEjpcGT8zGnDZ1Rt0Gx9-AgFpTl0_-nYnhv_dxqc';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
