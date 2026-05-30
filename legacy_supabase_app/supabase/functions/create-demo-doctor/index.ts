import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const doctorId = 'c245eea9-dee1-45ee-8095-33e056dc8dae';
    const email = 'dr.farhana@example.com';
    const password = 'demo123456';

    const { data: existingAuth } = await supabaseClient
      .from('doctor_auth')
      .select('id')
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (existingAuth) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Doctor login already exists',
          credentials: {
            email: email,
            password: password
          }
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });

    if (authError) throw authError;

    if (authData.user) {
      const { error: linkError } = await supabaseClient
        .from('doctor_auth')
        .insert({
          id: authData.user.id,
          doctor_id: doctorId,
          email: email,
          is_verified: true,
        });

      if (linkError) throw linkError;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Doctor login created successfully',
          credentials: {
            name: 'Dr. Farhana Rahman',
            email: email,
            password: password
          }
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    throw new Error('User creation failed');

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
