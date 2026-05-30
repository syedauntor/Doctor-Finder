/*
  # Create Suggestion Tables for Institutions and Positions

  1. New Tables
    - `institutions`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `usage_count` (integer) - track popularity
      - `created_at` (timestamptz)
    
    - `positions`
      - `id` (uuid, primary key)
      - `title` (text, unique)
      - `usage_count` (integer) - track popularity
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Allow public read access for autocomplete
    - Allow authenticated users to insert new suggestions
    - Only admins can delete suggestions

  3. Initial Data
    - Seed with common institutions and positions in Bangladesh
*/

CREATE TABLE IF NOT EXISTS institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text UNIQUE NOT NULL,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read institutions"
  ON institutions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert institutions"
  ON institutions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update institution usage"
  ON institutions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read positions"
  ON positions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert positions"
  ON positions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update position usage"
  ON positions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO institutions (name) VALUES
  ('Bangladesh Medical College'),
  ('Dhaka Medical College'),
  ('Sir Salimullah Medical College'),
  ('Chittagong Medical College'),
  ('Rajshahi Medical College'),
  ('Sylhet MAG Osmani Medical College'),
  ('Mymensingh Medical College'),
  ('Bangladesh College of Physicians and Surgeons'),
  ('Bangabandhu Sheikh Mujib Medical University'),
  ('Holy Family Red Crescent Hospital'),
  ('Ibn Sina Hospital'),
  ('Square Hospital'),
  ('United Hospital'),
  ('Apollo Hospitals Dhaka'),
  ('Popular Diagnostic Centre'),
  ('Lab Aid Hospital'),
  ('Bangladesh Specialized Hospital'),
  ('National Institute of Cardiovascular Diseases'),
  ('Dhaka Shishu Hospital'),
  ('National Institute of Cancer Research and Hospital')
ON CONFLICT (name) DO NOTHING;

INSERT INTO positions (title) VALUES
  ('Professor'),
  ('Associate Professor'),
  ('Assistant Professor'),
  ('Senior Consultant'),
  ('Consultant'),
  ('Medical Officer'),
  ('Resident Physician'),
  ('Registrar'),
  ('Senior Registrar'),
  ('Chief Consultant'),
  ('Specialist'),
  ('Junior Consultant'),
  ('Lecturer'),
  ('Clinical Fellow'),
  ('House Officer'),
  ('Intern'),
  ('Chief of Department'),
  ('Head of Department'),
  ('Director'),
  ('Medical Director')
ON CONFLICT (title) DO NOTHING;
