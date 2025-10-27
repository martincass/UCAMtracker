// services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials for environments where .env is not available.
const supabaseUrl = "https://gyhubpfzckiatzlqypip.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aHVicGZ6Y2tpYXR6bHF5cGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTc4OTgsImV4cCI6MjA3Njk3Mzg5OH0.M5JRvIGVpM9cOSC7NzDhtWYgCMOLMkXrNirWJMF8DdM";

if (!supabaseUrl || !supabaseAnonKey) {
  // This check is kept as a safeguard but should not be triggered with hardcoded values.
  throw new Error("Supabase URL and Anon Key must be provided.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);