/*
  # Add BMDC, Research, and Expertise Fields

  ## Overview
  Add fields for BMDC registration number, research publications, and detailed expertise
  to the doctors table.

  ## Changes to Tables
  
  ### 1. `doctors` table modifications
  - Add `bmdc_number` (text) - Bangladesh Medical & Dental Council registration number
  - Remove rating and review related fields (keeping them in schema but will hide in UI)
  
  ### 2. New `research_publications` table
  - `id` (uuid, primary key)
  - `doctor_id` (uuid) - Reference to doctors table
  - `title` (text) - Publication title
  - `journal` (text) - Journal or conference name
  - `year` (integer) - Publication year
  - `authors` (text) - List of authors
  - `link` (text) - URL to publication
  - `created_at` (timestamptz)
  
  ### 3. New `expertise` table
  - `id` (uuid, primary key)
  - `doctor_id` (uuid) - Reference to doctors table
  - `title` (text) - Expertise area title
  - `description` (text) - Detailed description
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on new tables
  - Add policies for public read access
*/

-- Add BMDC number to doctors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'bmdc_number'
  ) THEN
    ALTER TABLE doctors ADD COLUMN bmdc_number text DEFAULT '';
  END IF;
END $$;

-- Create research_publications table
CREATE TABLE IF NOT EXISTS research_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  journal text DEFAULT '',
  year integer DEFAULT 0,
  authors text DEFAULT '',
  link text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create expertise table
CREATE TABLE IF NOT EXISTS expertise (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE research_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE expertise ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can view research publications"
  ON research_publications FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view expertise"
  ON expertise FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_research_publications_doctor_id ON research_publications(doctor_id);
CREATE INDEX IF NOT EXISTS idx_expertise_doctor_id ON expertise(doctor_id);