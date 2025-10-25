import { createClient } from '@supabase/supabase-js';

// These environment variables are expected to be provided by the hosting environment.
// For Vite, they must be prefixed with VITE_ to be exposed on the client.
// FIX: Cast `import.meta` to `any` to access `env` and resolve TypeScript error.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
// FIX: Cast `import.meta` to `any` to access `env` and resolve TypeScript error.
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // In a real app, you might want a more user-friendly error display,
  // but for development, throwing an error is clear.
  throw new Error("Supabase credentials are not set. Please check your environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).");
}

// Initialize the Supabase client.
// The generic type parameter is optional but provides full type safety
// when you generate types from your database schema.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // It is recommended to set autoRefreshToken to false for server-side operations.
    // For client-side, it's generally true, but we'll manage sessions explicitly.
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Crucial for password recovery and OAuth flows
  },
});