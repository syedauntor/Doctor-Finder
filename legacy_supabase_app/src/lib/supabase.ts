import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Doctor = {
  id: string;
  name: string;
  title: string;
  profile_image: string;
  overview: string;
  years_of_experience: number;
  consultation_fee: number;
  fee_new_patient: number;
  fee_old_patient: number;
  fee_report_checking: number;
  phone: string;
  email: string;
  bmdc_number: string;
  designation: string;
  rating: number;
  total_reviews: number;
  created_at: string;
};

export type Specialization = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Chamber = {
  id: string;
  doctor_id: string;
  name: string;
  address: string;
  area: string;
  city: string;
  created_at: string;
};

export type ChamberSchedule = {
  id: string;
  chamber_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  created_at: string;
};

export type Education = {
  id: string;
  doctor_id: string;
  degree: string;
  institution: string;
  year: number;
  created_at: string;
};

export type Award = {
  id: string;
  doctor_id: string;
  title: string;
  organization: string;
  year: number;
  created_at: string;
};

export type ResearchPublication = {
  id: string;
  doctor_id: string;
  title: string;
  journal: string;
  year: number;
  authors: string;
  link: string;
  created_at: string;
};

export type Expertise = {
  id: string;
  doctor_id: string;
  title: string;
  description: string;
  created_at: string;
};

export type CurrentExperience = {
  id: string;
  doctor_id: string;
  institution: string;
  position: string;
  department: string;
  since_year: number;
  created_at: string;
};

export type PreviousExperience = {
  id: string;
  doctor_id: string;
  institution: string;
  position: string;
  department: string;
  start_year: number;
  end_year: number;
  created_at: string;
};
