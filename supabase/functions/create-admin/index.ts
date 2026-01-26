import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, adminKey } = await req.json();

    // Validate inputs
    if (!email || !password || !adminKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email, password, and admin key are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin key
    const validAdminKey = Deno.env.get('ADMIN_SIGNUP_KEY');
    if (!validAdminKey || adminKey !== validAdminKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid admin key' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to create user and assign admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Try to create the user first
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    let userId: string;

    if (authError) {
      // If user already exists, try to get them and add admin role
      if (authError.message?.includes('already been registered')) {
        // Get existing user by email
        const { data: users, error: listError } = await adminClient.auth.admin.listUsers();
        
        if (listError) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to find existing user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const existingUser = users.users.find(u => u.email === email);
        if (!existingUser) {
          return new Response(
            JSON.stringify({ success: false, error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if already an admin
        const { data: existingRole } = await adminClient
          .from('user_roles')
          .select('id')
          .eq('user_id', existingUser.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (existingRole) {
          return new Response(
            JSON.stringify({ success: false, error: 'This user is already an admin. Please sign in instead.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        userId = existingUser.id;
      } else {
        console.error('Error creating user:', authError);
        return new Response(
          JSON.stringify({ success: false, error: authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (!authData.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      userId = authData.user.id;
    }

    // Add admin role
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' });

    if (roleError) {
      console.error('Error adding admin role:', roleError);
      // Only delete user if we just created them (not for existing users)
      if (authData?.user) {
        await adminClient.auth.admin.deleteUser(authData.user.id);
      }
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to assign admin role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Admin account created successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-admin:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
