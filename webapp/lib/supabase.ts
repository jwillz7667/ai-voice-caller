import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  avatar_url: string | null;
  credits: number;
  created_at?: string;
  updated_at?: string;
};

export type CreditsTransaction = {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'purchase' | 'usage';
  created_at: string;
  payment_id?: string;
  description?: string;
}; 