/*
# Create profiles, saved_universities, and checklist_items tables

## Overview
Creates the data model for a study-abroad admissions platform serving students
from CIS and Central Asia. Each authenticated user has one profile row (filled
out via a questionnaire), a list of saved universities categorized by admission
chance (Safety / Target / Reach), and a personalized preparation checklist with
deadlines. Includes avatar support.

## New Tables

### profiles
- `id` (uuid, PK, FK to auth.users, ON DELETE CASCADE) — one row per user.
- `full_name` (text) — student's name.
- `avatar_url` (text) — profile avatar image URL.
- `country` (text) — home country (Kazakhstan, Uzbekistan, Kyrgyzstan, etc.).
- `specialty` (text) — desired field of study.
- `gpa` (numeric, 0–5 scale) — current GPA.
- `ielts_score` (numeric, 0–9 scale) — IELTS band.
- `financial_situation` (text) — self-reported financial status (low / medium / high).
- `desired_countries` (text[]) — list of target study-abroad countries.
- `profile_completed` (boolean, default false) — whether the questionnaire has been submitted.
- `created_at`, `updated_at` (timestamptz) — timestamps.

### saved_universities
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, ON DELETE CASCADE, DEFAULT auth.uid())
- `university_id` (text) — identifier referencing the static university dataset.
- `university_name` (text)
- `country` (text) — university country.
- `category` (text) — Safety / Target / Reach (AI-categorized).
- `match_score` (integer, 0–100) — computed match score.
- `tuition_fee` (integer) — annual tuition in USD.
- `saved_at` (timestamptz)

### checklist_items
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, ON DELETE CASCADE, DEFAULT auth.uid())
- `title` (text) — checklist task title.
- `description` (text) — details about the task.
- `deadline` (date) — target date for completion.
- `is_completed` (boolean, default false) — task status.
- `category` (text) — e.g. "Documents", "Tests", "Applications", "Finance".
- `created_at` (timestamptz)

## Security
- RLS enabled on all three tables.
- Owner-scoped CRUD policies (select/insert/update/delete) using auth.uid().
- user_id columns default to auth.uid() so inserts from the client succeed.
*/

-- profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  country text,
  specialty text,
  gpa numeric,
  ielts_score numeric,
  financial_situation text,
  desired_countries text[],
  profile_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Добавляем колонку avatar_url на случай, если таблица уже существовала раньше
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);

-- saved_universities table
CREATE TABLE IF NOT EXISTS saved_universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id text NOT NULL,
  university_name text NOT NULL,
  country text NOT NULL,
  category text NOT NULL DEFAULT 'Target',
  match_score integer DEFAULT 0,
  tuition_fee integer DEFAULT 0,
  saved_at timestamptz DEFAULT now()
);

ALTER TABLE saved_universities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_universities" ON saved_universities;
CREATE POLICY "select_own_universities" ON saved_universities
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_universities" ON saved_universities;
CREATE POLICY "insert_own_universities" ON saved_universities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_universities" ON saved_universities;
CREATE POLICY "update_own_universities" ON saved_universities
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_universities" ON saved_universities;
CREATE POLICY "delete_own_universities" ON saved_universities
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- checklist_items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  deadline date,
  is_completed boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT 'Documents',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_checklist" ON checklist_items;
CREATE POLICY "select_own_checklist" ON checklist_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_checklist" ON checklist_items;
CREATE POLICY "insert_own_checklist" ON checklist_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_checklist" ON checklist_items;
CREATE POLICY "update_own_checklist" ON checklist_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_checklist" ON checklist_items;
CREATE POLICY "delete_own_checklist" ON checklist_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);