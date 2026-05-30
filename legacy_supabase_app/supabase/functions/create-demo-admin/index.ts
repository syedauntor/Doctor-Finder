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

    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: 'admin@demo.com',
      password: 'demo123456',
      email_confirm: true
    });

    if (authError) throw authError;

    if (authData.user) {
      const { data: adminData, error: adminError } = await supabaseClient
        .from('admin_users')
        .insert([
          {
            user_id: authData.user.id,
            email: 'admin@demo.com',
            full_name: 'Demo Admin',
            role: 'super_admin'
          }
        ])
        .select()
        .single();

      if (adminError) throw adminError;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Demo admin created successfully',
          credentials: {
            email: 'admin@demo.com',
            password: 'demo123456'
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
