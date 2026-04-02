/*
  # Add Departments Table and Rename Position to Designation

  1. New Tables
    - `departments`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Department name
      - `slug` (text, unique) - URL-friendly version
      - `created_at` (timestamptz)
  
  2. Changes
    - Rename `position` column to `designation` in `current_experience` table
    - Add `department_id` column to `current_experience` table
    - Keep existing `department` column for backward compatibility
  
  3. Security
    - Enable RLS on `departments` table
    - Add policies for authenticated users to read departments
    - Add policies for admin users to manage departments
*/

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view departments"
  ON departments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert departments"
  ON departments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update departments"
  ON departments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete departments"
  ON departments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'current_experience' AND column_name = 'position'
  ) THEN
    ALTER TABLE current_experience RENAME COLUMN position TO designation;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'current_experience' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE current_experience ADD COLUMN department_id uuid REFERENCES departments(id) ON DELETE SET NULL;
  END IF;
END $$;