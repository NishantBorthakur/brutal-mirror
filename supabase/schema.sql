-- ============================================================
-- Brutal Mirror — Supabase Schema
-- Run this in your Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- ─── profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 text,
  display_name          text,
  credits_balance       integer NOT NULL DEFAULT 0,
  free_credits_granted  boolean NOT NULL DEFAULT false,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- ─── credit_transactions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('free_grant', 'usage', 'purchase', 'refund', 'adjustment')),
  credits      integer NOT NULL,
  balance_after integer,
  reason       text,
  metadata     jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now()
);

-- ─── roast_logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roast_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  category         text,
  intensity        text,
  personality      text,
  refinement_mode  text,
  input_preview    text,
  input_tokens     integer DEFAULT 0,
  output_tokens    integer DEFAULT 0,
  total_tokens     integer DEFAULT 0,
  credits_used     integer DEFAULT 1,
  success          boolean NOT NULL DEFAULT true,
  error_message    text,
  created_at       timestamptz DEFAULT now()
);

-- ─── Enable Row Level Security ──────────────────────────────
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roast_logs        ENABLE ROW LEVEL SECURITY;

-- ─── RLS: profiles ──────────────────────────────────────────
-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- No direct frontend UPDATE — all credit changes go through service role.
-- Add a dedicated /api/profile endpoint if you need display_name editing.

-- ─── RLS: credit_transactions ───────────────────────────────
-- Users can read their own transactions (read-only)
CREATE POLICY "transactions_select_own"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ─── RLS: roast_logs ────────────────────────────────────────
-- Users can read their own roast logs (read-only)
CREATE POLICY "roast_logs_select_own"
  ON public.roast_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ─── Trigger: updated_at on profiles ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Trigger: auto-create profile + grant 5 free credits ────
-- Fires whenever a new auth.users row is inserted (i.e. on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile with 5 starter credits
  INSERT INTO public.profiles (id, email, credits_balance, free_credits_granted)
  VALUES (NEW.id, NEW.email, 5, true);

  -- Record the free credit grant
  INSERT INTO public.credit_transactions (user_id, type, credits, balance_after, reason)
  VALUES (NEW.id, 'free_grant', 5, 5, 'Starter free credits');

  RETURN NEW;
END;
$$;

-- Drop and recreate to avoid duplicate trigger errors on re-runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
