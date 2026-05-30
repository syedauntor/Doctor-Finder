/*
  # Add Location Coordinates to Chambers

  1. Changes
    - Add `latitude` (numeric) to chambers table
    - Add `longitude` (numeric) to chambers table
    - Add `map_url` (text) to chambers table for Google Maps link

  2. Purpose
    - Enable map integration for doctor chambers
    - Store precise location coordinates
    - Allow "Get Directions" functionality
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chambers' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE chambers ADD COLUMN latitude numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chambers' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE chambers ADD COLUMN longitude numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chambers' AND column_name = 'map_url'
  ) THEN
    ALTER TABLE chambers ADD COLUMN map_url text DEFAULT '';
  END IF;
END $$;
