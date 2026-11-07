import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization');
  const projectUrl = Deno.env.get('SUPABASE_URL');
  const publishableKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}');
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
  const anonKey = publishableKeys.default ?? Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = secretKeys.default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const appUrl = Deno.env.get('APP_URL');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const inviteFromEmail = Deno.env.get('INVITE_FROM_EMAIL');
  if (!authorization?.startsWith('Bearer ') || !projectUrl || !anonKey || !serviceRoleKey || !appUrl) {
    return json({ error: 'Authenticated invitation service is not configured.' }, 401);
  }

  let body: { project_id?: unknown; email?: unknown; role?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid invitation request.' }, 400);
  }
  const projectId = typeof body.project_id === 'string' ? body.project_id : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = typeof body.role === 'string' ? body.role : '';
  if (!projectId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || !['lead', 'scrum_master', 'developer', 'viewer'].includes(role)) {
    return json({ error: 'Enter a valid invitation email and project role.' }, 400);
  }

  const token = authorization.slice('Bearer '.length);
  const userClient = createClient(projectUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: 'A valid signed-in session is required.' }, 401);

  const { data: isLead, error: roleError } = await userClient.rpc('has_project_role', {
    target_project_id: projectId,
    allowed_roles: ['lead'],
  });
  if (roleError || isLead !== true) return json({ error: 'Project lead permission required.' }, 403);

  // Store the in-app invitation through the same RLS-authorized RPC used by the
  // client fallback. Email delivery is best-effort and its result is not exposed.
  const { error: invitationError } = await userClient.rpc('add_project_member_by_email', {
    target_project_id: projectId,
    invite_email: email,
    member_role: role,
  });
  if (invitationError) return json({ error: invitationError.message || 'Invitation could not be saved.' }, 400);

  const adminClient = createClient(projectUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  let authInviteError: unknown = null;
  try {
    ({ error: authInviteError } = await adminClient.auth.admin.inviteUserByEmail(email, { redirectTo: appUrl }));
  } catch (error) {
    authInviteError = error;
  }
  if (authInviteError && resendApiKey && inviteFromEmail) {
    // Auth invite emails only work for new accounts. For existing accounts (or
    // Auth SMTP delivery errors), send a generic project notice through the
    // configured mail provider. The invite is still accepted in the app after
    // signing in with the invited, verified email.
    const { data: project } = await userClient.from('projects').select('name').eq('id', projectId).maybeSingle();
    const projectName = project?.name || 'your project';
    const roleLabel = role === 'scrum_master' ? 'Scrum Master' : role[0].toUpperCase() + role.slice(1);
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: inviteFromEmail,
          to: [email],
          subject: `Invitation to join ${projectName} on SprintFlow`,
          text: `You have a pending invitation to join ${projectName} as ${roleLabel}. Open ${appUrl}, sign in or create an account with this email address, and accept the invitation under Your projects. You will be added to the project after you accept with this verified email.`,
        }),
      });
    } catch {
      // Delivery failures share the same response as every other invite outcome.
    }
  }

  return json({ result: 'invited', message: 'Invitation sent' });
});
