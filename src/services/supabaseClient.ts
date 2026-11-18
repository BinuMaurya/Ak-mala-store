import { createClient } from '@supabase/supabase-js';

// Apne Supabase project ki credentials yahan daalein (Aapko ye Supabase Dashboard ke Project Settings > API mein mil jayengi)
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);