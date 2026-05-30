/*
  # Add Designation and Medical Experience

  ## Overview
  Add designation field to doctors table and create new tables for current and 
  previous medical institution experience.

  ## Changes to Tables
  
  ### 1. `doctors` table modifications
  - Add `designation` (text) - Academic/professional title (Professor, Assistant Professor, etc.)
  
  ### 2. New `current_experience` table
  - `id` (uuid, primary key)
  - `doctor_id` (uuid) - Reference to doctors table
  - `institution` (text) - Hospital/medical institution name
  - `position` (text) - Position/role at institution
  - `department` (text) - Department name
  - `since_year` (integer) - Year started
  - `created_at` (timestamptz)
  
  ### 3. New `previous_experience` table
  - `id` (uuid, primary key)
  - `doctor_id` (uuid) - Reference to doctors table
  - `institution` (text) - Hospital/medical institution name
  - `position` (text) - Position/role at institution
  - `department` (text) - Department name
  - `start_year` (integer) - Year started
  - `end_year` (integer) - Year ended
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on new tables
  - Add policies for public read access
*/

-- Add designation to doctors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'designation'
  ) THEN
    ALTER TABLE doctors ADD COLUMN designation text DEFAULT '';
  END IF;
END $$;

-- Create current_experience table
CREATE TABLE IF NOT EXISTS current_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  institution text NOT NULL,
  position text DEFAULT '',
  department text DEFAULT '',
  since_year integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create previous_experience table
CREATE TABLE IF NOT EXISTS previous_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  institution text NOT NULL,
  position text DEFAULT '',
  department text DEFAULT '',
  start_year integer DEFAULT 0,
  end_year integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE current_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE previous_experience ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can view current experience"
  ON current_experience FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view previous experience"
  ON previous_experience FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_current_experience_doctor_id ON current_experience(doctor_id);
CREATE INDEX IF NOT EXISTS idx_previous_experience_doctor_id ON previous_experience(doctor_id);