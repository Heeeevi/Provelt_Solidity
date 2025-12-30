import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

// Fallback values for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elkgqykpfxbhznpxksdn.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsa2dxeWtwZnhiaHpucHhrc2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNTI5NzIsImV4cCI6MjA4MjYyODk3Mn0._flz8aUNKcsy-Ac5oz73hIOekbjCaDyFB7RGI8zhvtc';

export function createClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}

// Singleton instance for convenience
export const supabase = createClient();

