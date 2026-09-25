/*
# Create profiles, saved_universities, checklist_items, and user_portfolio tables

## Overview
Creates the data model for a study-abroad admissions platform serving students
from CIS and Central Asia. Each authenticated user has one profile row (filled
out via a questionnaire), a list of saved universities categorized by admission
chance (Safety / Target / Reach) with notes and stages, a personalized preparation 
checklist with deadlines, and a portfolio tracker. Includes avatar support.
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

-- saved_universities table (с добавлением note и stage для заметок и канбан-статусов)
CREATE TABLE IF NOT EXISTS saved_universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id text NOT NULL,
  university_name text NOT NULL,
  country text NOT NULL,
  category text NOT NULL DEFAULT 'Target',
  match_score integer DEFAULT 0,
  tuition_fee integer DEFAULT 0,
  note text,
  stage text DEFAULT 'research',
  saved_at timestamptz DEFAULT now()
);

ALTER TABLE saved_universities ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE saved_universities ADD COLUMN IF NOT EXISTS stage text DEFAULT 'research';

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

-- user_portfolio table (новая таблица с полными раздельными политиками)
CREATE TABLE IF NOT EXISTS user_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  description text,
  date text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_portfolio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_portfolio" ON user_portfolio;
CREATE POLICY "select_own_portfolio" ON user_portfolio
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_portfolio" ON user_portfolio;
CREATE POLICY "insert_own_portfolio" ON user_portfolio
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_portfolio" ON user_portfolio;
CREATE POLICY "update_own_portfolio" ON user_portfolio
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_portfolio" ON user_portfolio;
CREATE POLICY "delete_own_portfolio" ON user_portfolio
  FOR DELETE TO authenticated USING (auth.uid() = user_id);