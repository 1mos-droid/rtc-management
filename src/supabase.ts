import { createClient } from '@supabase/supabase-js';

/**
 * RTCI - SUPABASE CONFIGURATION
 * Using environment variables for production security.
 */
const getEnvUrl = () => {
  if (typeof process !== 'undefined') {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (process.env.NEXT_PUBLIC_VITE_SUPABASE_URL) return process.env.NEXT_PUBLIC_VITE_SUPABASE_URL;
    if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
    if (process.env.VITE_SUPABASE_URL) return process.env.VITE_SUPABASE_URL;
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.VITE_SUPABASE_URL) return import.meta.env.VITE_SUPABASE_URL;
      if (import.meta.env.SUPABASE_URL) return import.meta.env.SUPABASE_URL;
    }
  } catch (e) {}
  return undefined;
};

const getEnvKey = () => {
  if (typeof process !== 'undefined') {
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (process.env.NEXT_PUBLIC_VITE_SUPABASE_ANON_KEY) return process.env.NEXT_PUBLIC_VITE_SUPABASE_ANON_KEY;
    if (process.env.SUPABASE_ANON_KEY) return process.env.SUPABASE_ANON_KEY;
    if (process.env.VITE_SUPABASE_ANON_KEY) return process.env.VITE_SUPABASE_ANON_KEY;
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.VITE_SUPABASE_ANON_KEY) return import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (import.meta.env.SUPABASE_ANON_KEY) return import.meta.env.SUPABASE_ANON_KEY;
    }
  } catch (e) {}
  return undefined;
};

const supabaseUrl = getEnvUrl() || 'https://placeholder.supabase.co';
const supabaseKey = getEnvKey() || 'placeholder-key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.error('Supabase URL configuration missing! Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
