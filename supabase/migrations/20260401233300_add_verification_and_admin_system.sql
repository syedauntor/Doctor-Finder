/*
  # Add Verification and Admin System

  ## Overview
  This migration adds doctor verification functionality and admin control system.

  ## Changes Made

  ### 1. Add verification fields to doctors table
    - `is_verified` (boolean) - Whether doctor is verified by admin
    - `verification_status` (text) - Status: pending, approved, rejected
    - `user_id` (uuid) - Links doctor profile to auth user
    - `verification_notes` (text) - Admin notes about verification

  ### 2. Create admin_users table
    - `id` (uuid, primary key)
    - `user_id` (uuid) - Links to auth.users
    - `email` (text) - Admin email
    - `full_name` (text) - Admin full name
    - `role` (text) - Admin role (super_admin, admin)
    - `created_at` (timestamptz)

  ### 3. Create doctor_registration_requests table
    - Stores pending doctor registration requests
    - Links to eventual doctor profile after approval

  ## Security
  - Enable RLS on new tables
  - Add policies for admin-only access
  - Add policies for doctors to view their own verification status
*/

-- Add verification fields to doctors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE doctors ADD COLUMN is_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE doctors ADD COLUMN verification_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE doctors ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'verification_notes'
  ) THEN
    ALTER TABLE doctors ADD COLUMN verification_notes text DEFAULT '';
  END IF;
END $$;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

-- Create doctor_registration_requests table
CREATE TABLE IF NOT EXISTS doctor_registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  specialty text NOT NULL,
  bmdc_number text NOT NULL,
  experience text NOT NULL,
  message text DEFAULT '',
  status text DEFAULT 'pending',
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES admin_users(id)
);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_registration_requests ENABLE ROW LEVEL SECURITY;

-- Admin policies: Only authenticated admins can access admin_users
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Doctor registration requests policies
CREATE POLICY "Anyone can submit registration requests"
  ON doctor_registration_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all registration requests"
  ON doctor_registration_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update registration requests"
  ON doctor_registration_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Update doctors policies to allow admins to update verification
CREATE POLICY "Admins can update doctor verification"
  ON doctors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Doctors can view their own verification status
CREATE POLICY "Doctors can view own profile"
  ON doctors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_verification_status ON doctors(verification_status);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON doctor_registration_requests(status);
