import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verify environment variables are set
if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Missing environment variables for Supabase. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
  );
}

// Create a Supabase client for server-side operations
export const supabaseServer = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Type definition for the discord_users table
export type DiscordUser = {
  id?: string;
  discord_id: string;
  wallet_address?: string;
  portfolio_value: number;
  created_at?: string;
} 