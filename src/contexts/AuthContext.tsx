import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  doctorId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, doctorId: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchDoctorId(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchDoctorId(session.user.id);
        } else {
          setDoctorId(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchDoctorId(userId: string) {
    try {
      const { data, error } = await supabase
        .from('doctor_auth')
        .select('doctor_id')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setDoctorId(data?.doctor_id ?? null);
    } catch (error) {
      console.error('Error fetching doctor ID:', error);
      setDoctorId(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      await fetchDoctorId(data.user.id);
    } else {
      setLoading(false);
    }

    return { error };
  }

  async function signUp(email: string, password: string, doctorId: string) {
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return { error: authError };

    // Then link to doctor
    if (authData.user) {
      const { error: linkError } = await supabase
        .from('doctor_auth')
        .insert({
          id: authData.user.id,
          doctor_id: doctorId,
          email,
          is_verified: true,
        });

      if (linkError) return { error: linkError };
    }

    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setDoctorId(null);
  }

  const value = {
    user,
    doctorId,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
