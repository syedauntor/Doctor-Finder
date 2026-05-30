/*
  # Doctor Listing Platform Schema

  ## Overview
  Complete database schema for a doctor listing platform with profiles, specializations, 
  chambers, and related information.

  ## New Tables
  
  ### 1. `doctors`
  Main doctor information table
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Doctor's full name
  - `title` (text) - Medical title (MBBS, MD, etc.)
  - `profile_image` (text) - URL to profile image
  - `overview` (text) - Professional overview/bio
  - `years_of_experience` (integer) - Total years of practice
  - `consultation_fee` (integer) - Fee in BDT
  - `phone` (text) - Contact phone number
  - `email` (text) - Email address
  - `rating` (numeric) - Average rating (0-5)
  - `total_reviews` (integer) - Number of reviews
  - `created_at` (timestamptz) - Record creation time

  ### 2. `specializations`
  Medical specializations/categories
  - `id` (uuid, primary key)
  - `name` (text) - Specialization name
  - `slug` (text) - URL-friendly version
  - `created_at` (timestamptz)

  ### 3. `doctor_specializations`
  Links doctors to their specializations
  - `id` (uuid, primary key)
  - `doctor_id` (uuid) - Reference to doctors table
  - `specialization_id` (uuid) - Reference to specializations table
  - `is_primary` (boolean) - Whether this is the primary specialization
  - `created_at` (timestamptz)

  ### 4. `chambers`
  Doctor consultation chambers/clinics
  - `id` (uuid, primary key)
  - `doctor_id` (uuid) - Reference to doctors table
  - `name` (text) - Chamber/clinic name
  - `address` (text) - Full address
  - `area` (text) - Area/locality
  - `city` (text) - City name
  - `created_at` (timestamptz)

  ### 5. `chamber_schedules`
  Consultation schedules for each chamber
  - `id` (uuid, primary key)
  - `chamber_id` (uuid) - Reference to chambers table
  - `day_of_week` (text) - Day name
  - `start_time` (time) - Consultation start time
  - `end_time` (time) - Consultation end time
  - `created_at` (timestamptz)

  ### 6. `education`
  Educational qualifications
  - `id` (uuid, primary key)
  - `doctor_id` (uuid) - Reference to doctors table
  - `degree` (text) - Degree name
  - `institution` (text) - Institution name
  - `year` (integer) - Year of completion
  - `created_at` (timestamptz)

  ### 7. `awards`
  Awards and recognitions
  - `id` (uuid, primary key)
  - `doctor_id` (uuid) - Reference to doctors table
  - `title` (text) - Award title
  - `organization` (text) - Awarding organization
  - `year` (integer) - Year received
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for public read access (anyone can view doctor listings)
  - Restrict write access (would require admin authentication in future)
*/

-- Create specializations table
CREATE TABLE IF NOT EXISTS specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text DEFAULT '',
  profile_image text DEFAULT '',
  overview text DEFAULT '',
  years_of_experience integer DEFAULT 0,
  consultation_fee integer DEFAULT 0,
  phone text DEFAULT '',
  email text DEFAULT '',
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create doctor_specializations linking table
CREATE TABLE IF NOT EXISTS doctor_specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  specialization_id uuid REFERENCES specializations(id) ON DELETE CASCADE NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, specialization_id)
);

-- Create chambers table
CREATE TABLE IF NOT EXISTS chambers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  address text DEFAULT '',
  area text DEFAULT '',
  city text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create chamber_schedules table
CREATE TABLE IF NOT EXISTS chamber_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamber_id uuid REFERENCES chambers(id) ON DELETE CASCADE NOT NULL,
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create education table
CREATE TABLE IF NOT EXISTS education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  degree text NOT NULL,
  institution text DEFAULT '',
  year integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create awards table
CREATE TABLE IF NOT EXISTS awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  organization text DEFAULT '',
  year integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chambers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chamber_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can view specializations"
  ON specializations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view doctors"
  ON doctors FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view doctor specializations"
  ON doctor_specializations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view chambers"
  ON chambers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view chamber schedules"
  ON chamber_schedules FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view education"
  ON education FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view awards"
  ON awards FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_doctors_rating ON doctors(rating DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_specializations_doctor_id ON doctor_specializations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_specializations_specialization_id ON doctor_specializations(specialization_id);
CREATE INDEX IF NOT EXISTS idx_chambers_doctor_id ON chambers(doctor_id);
CREATE INDEX IF NOT EXISTS idx_chamber_schedules_chamber_id ON chamber_schedules(chamber_id);
CREATE INDEX IF NOT EXISTS idx_education_doctor_id ON education(doctor_id);
CREATE INDEX IF NOT EXISTS idx_awards_doctor_id ON awards(doctor_id);