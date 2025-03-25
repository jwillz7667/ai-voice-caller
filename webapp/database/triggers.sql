-- This is a reference SQL file for Supabase database setup
-- Run these commands in the Supabase SQL editor

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create storage bucket for user avatars if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'user-avatars');

DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'user-avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'user-avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'user-avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Create credits_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.credits_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  payment_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create function for incrementing credits
CREATE OR REPLACE FUNCTION public.increment_credits(amount INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(credits, 0) + amount;
END;
$$ LANGUAGE plpgsql;

-- Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, credits, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    10, -- Start with 10 free credits
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add row level security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for credits_transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credits_transactions;
CREATE POLICY "Users can view their own transactions"
  ON public.credits_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Grant necessary privileges
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.credits_transactions TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SEQUENCE public.credits_transactions_id_seq TO postgres, anon, authenticated, service_role; 