/*
  # Add Location Hierarchy Fields to Chambers

  ## Overview
  Adding Bangladesh location hierarchy fields to chambers table for better location-based filtering.

  ## Changes
  1. Add New Columns to `chambers` table
    - `division` (text) - Division name (e.g., Dhaka, Chittagong)
    - `district` (text) - District name (e.g., Dhaka, Gazipur)
    - `upazila` (text) - Upazila/Thana name (e.g., Gulshan, Dhanmondi)

  ## Notes
  - City field will be skipped as per requirements
  - These fields allow hierarchical filtering: Division > District > Upazila/Thana
  - All fields are optional to maintain backward compatibility
*/

-- Add location hierarchy columns to chambers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chambers' AND column_name = 'division'
  ) THEN
    ALTER TABLE chambers ADD COLUMN division text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chambers' AND column_name = 'district'
  ) THEN
    ALTER TABLE chambers ADD COLUMN district text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chambers' AND column_name = 'upazila'
  ) THEN
    ALTER TABLE chambers ADD COLUMN upazila text DEFAULT '';
  END IF;
END $$;

-- Add gender column to doctors table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'gender'
  ) THEN
    ALTER TABLE doctors ADD COLUMN gender text DEFAULT '';
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chambers_division ON chambers(division);
CREATE INDEX IF NOT EXISTS idx_chambers_district ON chambers(district);
CREATE INDEX IF NOT EXISTS idx_chambers_upazila ON chambers(upazila);
CREATE INDEX IF NOT EXISTS idx_doctors_gender ON doctors(gender);
