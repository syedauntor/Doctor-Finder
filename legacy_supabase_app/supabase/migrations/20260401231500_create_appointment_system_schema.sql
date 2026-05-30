/*
  # Create Appointment Booking System Schema

  ## Overview
  Complete appointment booking system for doctors to manage their practice and patients to book appointments.

  ## New Tables

  ### 1. `patients`
  Patient information for booking appointments
  - `id` (uuid, primary key)
  - `name` (text) - Patient full name
  - `email` (text) - Patient email
  - `phone` (text) - Patient phone number
  - `date_of_birth` (date) - Patient DOB
  - `gender` (text) - Patient gender
  - `address` (text) - Patient address
  - `created_at` (timestamptz) - Record creation time

  ### 2. `doctor_availability`
  Weekly schedule for each doctor
  - `id` (uuid, primary key)
  - `doctor_id` (uuid, foreign key to doctors)
  - `day_of_week` (integer) - 0=Sunday, 6=Saturday
  - `start_time` (time) - Slot start time
  - `end_time` (time) - Slot end time
  - `slot_duration` (integer) - Duration in minutes (e.g., 30)
  - `is_active` (boolean) - Enable/disable schedule
  - `created_at` (timestamptz)

  ### 3. `appointments`
  Appointment bookings between patients and doctors
  - `id` (uuid, primary key)
  - `doctor_id` (uuid, foreign key to doctors)
  - `patient_id` (uuid, foreign key to patients)
  - `appointment_date` (date) - Date of appointment
  - `appointment_time` (time) - Time of appointment
  - `status` (text) - pending/confirmed/cancelled/completed
  - `consultation_type` (text) - in-person/online
  - `notes` (text) - Patient notes/symptoms
  - `doctor_notes` (text) - Doctor's notes after consultation
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `doctor_auth`
  Doctor authentication and login credentials
  - `id` (uuid, primary key, references auth.users)
  - `doctor_id` (uuid, foreign key to doctors, unique)
  - `email` (text, unique)
  - `is_verified` (boolean) - Email verification status
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Patients can view/create their own appointments
  - Doctors can view/manage appointments for themselves
  - Public can view doctor availability
  - Only authenticated doctors can modify their availability

  ## Indexes
  - Index on appointment date and doctor_id for fast queries
  - Index on patient email for quick lookups
  - Index on doctor_id in availability table
*/

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  address text,
  created_at timestamptz DEFAULT now()
);

-- Create doctor_availability table
CREATE TABLE IF NOT EXISTS doctor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration integer NOT NULL DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  consultation_type text NOT NULL DEFAULT 'in-person' CHECK (consultation_type IN ('in-person', 'online')),
  notes text,
  doctor_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create doctor_auth table
CREATE TABLE IF NOT EXISTS doctor_auth (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id uuid UNIQUE NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_auth_doctor ON doctor_auth(doctor_id);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_auth ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients table
CREATE POLICY "Anyone can create patient records"
  ON patients FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Patients can view own records"
  ON patients FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM doctor_auth WHERE id = auth.uid()));

-- RLS Policies for doctor_availability table
CREATE POLICY "Anyone can view doctor availability"
  ON doctor_availability FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Doctors can manage own availability"
  ON doctor_availability FOR ALL
  TO authenticated
  USING (
    doctor_id IN (
      SELECT doctor_id FROM doctor_auth WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    doctor_id IN (
      SELECT doctor_id FROM doctor_auth WHERE id = auth.uid()
    )
  );

-- RLS Policies for appointments table
CREATE POLICY "Anyone can create appointments"
  ON appointments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Patients can view appointments with their email"
  ON appointments FOR SELECT
  TO anon, authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE email = (
        SELECT raw_user_meta_data->>'email' FROM auth.users WHERE id = auth.uid()
      )
    )
    OR doctor_id IN (
      SELECT doctor_id FROM doctor_auth WHERE id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    doctor_id IN (
      SELECT doctor_id FROM doctor_auth WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    doctor_id IN (
      SELECT doctor_id FROM doctor_auth WHERE id = auth.uid()
    )
  );

-- RLS Policies for doctor_auth table
CREATE POLICY "Doctors can view own auth record"
  ON doctor_auth FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Create function to update appointment updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for appointment updates
DROP TRIGGER IF EXISTS update_appointment_timestamp_trigger ON appointments;
CREATE TRIGGER update_appointment_timestamp_trigger
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_timestamp();