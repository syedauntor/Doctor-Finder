/*
  # Add Multiple Consultation Fee Types

  ## Overview
  Modify the doctors table to support three different consultation fee types:
  - New Patient fee
  - Old Patient fee (within 6 months)
  - Report Checking fee (after 3 days)

  ## Changes to Tables
  
  ### `doctors` table modifications
  - Add `fee_new_patient` (integer) - Fee for new patients
  - Add `fee_old_patient` (integer) - Fee for old patients (check within 6 months)
  - Add `fee_report_checking` (integer) - Fee for report checking (after 3 days)
  - Keep existing `consultation_fee` column as fallback/default

  ## Security
  - No new tables, existing RLS policies remain in effect
*/

-- Add new consultation fee columns to doctors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'fee_new_patient'
  ) THEN
    ALTER TABLE doctors ADD COLUMN fee_new_patient integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'fee_old_patient'
  ) THEN
    ALTER TABLE doctors ADD COLUMN fee_old_patient integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'fee_report_checking'
  ) THEN
    ALTER TABLE doctors ADD COLUMN fee_report_checking integer DEFAULT 0;
  END IF;
END $$;
