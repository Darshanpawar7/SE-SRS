import { getSupabase } from './supabaseClient';
import { validateProjectMetadata } from '../utils/projectMetadata';

export async function listUserProjects() {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from('projects')
    .select('id,name,key,description,status,start_date,target_date,created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || 'Your projects could not be loaded.');
  return data ?? [];
}

export async function createUserProject(values, existingProjects = []) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Connect Supabase to create a shared project.');
  const clean = validateProjectMetadata(values, existingProjects);
  const { data, error } = await supabase.rpc('create_project', {
    project_name: clean.name,
    project_key: clean.key,
    project_description: clean.description || null,
    project_start_date: clean.start_date,
    project_target_date: clean.target_date
  });
  if (error) throw new Error(error.message || 'Project creation failed.');
  const id = typeof data === 'string' ? data : data?.id ?? data?.project_id;
  if (!id) throw new Error('The project was created but Supabase did not return its ID.');
  return { id, ...clean, status: 'active' };
}

export async function listProjectMembers(projectId) {
  const supabase = getSupabase();
  if (!supabase || !projectId) return [];
  const { data, error } = await supabase.rpc('list_project_members', { target_project_id: projectId });
  if (error) throw new Error(error.message || 'Project members could not be loaded.');
  return data ?? [];
}

export async function listProjectInvitations(projectId = null) {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('list_project_invitations', { target_project_id: projectId });
  if (error) throw new Error(error.message || 'Invitations could not be loaded.');
  return data ?? [];
}

export async function inviteProjectMember(projectId, email, role) {
  const cleanEmail = String(email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Enter a valid email address.');
  const supabase = getSupabase();
  if (!supabase) throw new Error('Connect Supabase before inviting a teammate.');
  // The function persists the pending invitation before attempting email delivery.
  // Direct RPC fallback keeps in-app invitations usable when the function is not deployed.
  let result = null;
  let functionError = new Error('Invitation email function is unavailable.');
  if (supabase.functions?.invoke) {
    try {
      ({ data: result, error: functionError } = await supabase.functions.invoke('invite-member', {
        body: { project_id: projectId, email: cleanEmail, role }
      }));
    } catch (error) {
      functionError = error;
    }
  }
  if (!functionError) return result?.result ?? 'invited';
  const { data, error } = await supabase.rpc('add_project_member_by_email', {
    target_project_id: projectId, invite_email: cleanEmail, member_role: role
  });
  if (error) throw new Error(error.message || 'Invitation could not be sent.');
  return data;
}

export async function changeProjectMemberRole(projectId, memberId, role) {
  const { error } = await getSupabase().rpc('change_project_member_role', {
    target_project_id: projectId, target_member_id: memberId, new_role: role
  });
  if (error) throw new Error(error.message || 'Member role could not be changed.');
}

export async function removeProjectMember(projectId, memberId) {
  const { error } = await getSupabase().rpc('remove_project_member', {
    target_project_id: projectId, target_member_id: memberId
  });
  if (error) throw new Error(error.message || 'Member could not be removed.');
}

export async function manageProjectInvitation(invitationId, action) {
  const { data, error } = await getSupabase().rpc('manage_project_invitation', {
    target_invitation_id: invitationId, action
  });
  if (error) throw new Error(error.message || 'Invitation could not be updated.');
  return data;
}

export async function resendProjectInvitation(projectId, invitation) {
  await manageProjectInvitation(invitation.invitation_id, 'resend');
  return inviteProjectMember(projectId, invitation.email, invitation.role);
}

export async function respondToProjectInvitation(invitationId, accept) {
  const { error } = await getSupabase().rpc('respond_project_invitation', {
    target_invitation_id: invitationId, accept_invitation: Boolean(accept)
  });
  if (error) throw new Error(error.message || 'Invitation response could not be saved.');
}

export function subscribeSelectedProjectRealtime(supabase, projectId, onTableChange) {
  if (!supabase?.channel || !projectId || typeof onTableChange !== 'function') return () => {};
  const channel = supabase.channel(`project-${projectId}-changes`);
  ['tasks', 'sprints', 'project_members'].forEach(table => {
    channel.on('postgres_changes', {
      event: '*', schema: 'public', table, filter: `project_id=eq.${projectId}`
    }, () => onTableChange(table));
  });
  channel.subscribe();
  return () => { supabase.removeChannel?.(channel); };
}
