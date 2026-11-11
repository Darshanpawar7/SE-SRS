import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserProject, listUserProjects, listProjectMembers, listProjectInvitations, inviteProjectMember, changeProjectMemberRole, removeProjectMember, manageProjectInvitation, resendProjectInvitation, respondToProjectInvitation, subscribeSelectedProjectRealtime } from '../services/projectService';
import { getAuthSession, normalizeAuthUser, subscribeAuth } from '../services/authService';
import { DataService, setSupabaseClient } from '../services/supabaseClient';
import { createFakeSupabase } from './helpers/fakeSupabase';

beforeEach(() => {
  const storage = new Map();
  vi.stubGlobal('localStorage', {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  });
});

afterEach(() => {
  setSupabaseClient(undefined);
  vi.unstubAllGlobals();
});

describe('Supabase identity and project entry points', () => {
  it('builds the UI identity from the Supabase user and metadata, not a team registry', () => {
    expect(normalizeAuthUser({
      id: 'auth-uuid', email: 'someone@example.com', user_metadata: { full_name: 'Someone New' }
    })).toMatchObject({ id: 'auth-uuid', authUserId: 'auth-uuid', name: 'Someone New', email: 'someone@example.com' });
    expect(normalizeAuthUser({ email: 'missing-id@example.com' })).toBeNull();
  });

  it('restores and observes the Supabase Auth session', async () => {
    const user = { id: 'auth-session', email: 'person@example.com', user_metadata: { full_name: 'Person' } };
    const unsubscribe = vi.fn();
    let listener;
    setSupabaseClient({ auth: {
      getUser: async () => ({ data: { user }, error: null }),
      onAuthStateChange: callback => { listener = callback; return { data: { subscription: { unsubscribe } } }; }
    } });
    await expect(getAuthSession()).resolves.toMatchObject({ isCloud: true, user: { id: user.id, name: 'Person' } });
    const events = [];
    const stop = subscribeAuth(event => events.push(event));
    listener('SIGNED_IN', { user });
    stop();
    expect(events).toMatchObject([{ event: 'SIGNED_IN', user: { id: user.id, email: user.email } }]);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('lists only the project rows returned by the authenticated Supabase query', async () => {
    const visible = [{ id: 'project-a', key: 'A1', name: 'Alpha' }];
    const supabase = {
      from: table => ({
        select: columns => ({
          order: async () => {
            expect(table).toBe('projects');
            expect(columns).toContain('id');
            return { data: visible, error: null };
          }
        })
      })
    };
    setSupabaseClient(supabase);
    await expect(listUserProjects()).resolves.toEqual(visible);
  });

  it('creates a project only through the atomic Supabase RPC with validated fields', async () => {
    let call;
    setSupabaseClient({
      rpc: async (name, args) => { call = { name, args }; return { data: 'new-project-id', error: null }; }
    });
    const project = await createUserProject({
      name: 'New Project', key: 'np', description: 'Planning board',
      start_date: '2026-11-06', target_date: '2026-12-06'
    });
    expect(call).toEqual({
      name: 'create_project',
      args: {
        project_name: 'New Project', project_key: 'NP', project_description: 'Planning board',
        project_start_date: '2026-11-06', project_target_date: '2026-12-06'
      }
    });
    expect(project).toMatchObject({ id: 'new-project-id', key: 'NP', name: 'New Project' });
    await expect(createUserProject({ name: 'X', key: 'np', start_date: '2026-11-06', target_date: '2026-12-06' }))
      .rejects.toThrow('Project name');
  });

  it('loads only the selected project records and keeps each project cache scoped', async () => {
    const storage = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    });
    const supabase = createFakeSupabase({
      projects: [{ id: 'project-a', name: 'Alpha', key: 'AL', owner_id: 'u-a' }, { id: 'project-b', name: 'Beta', key: 'BE', owner_id: 'u-b' }],
      sprints: [{ id: 's-a', project_id: 'project-a', name: 'Sprint A' }, { id: 's-b', project_id: 'project-b', name: 'Sprint B' }],
      tasks: [{ id: 't-a', project_id: 'project-a', title: 'Task A' }, { id: 't-b', project_id: 'project-b', title: 'Task B' }]
    });
    setSupabaseClient(supabase);
    DataService.setActiveProject('project-a');

    await expect(DataService.loadAll('project-a')).resolves.toMatchObject({
      project: { id: 'project-a' },
      sprints: [{ id: 's-a' }],
      tasks: [{ id: 't-a' }]
    });
    expect(storage.has('sprintflow_project:project-a')).toBe(true);
    expect(storage.has('sprintflow_project:project-b')).toBe(false);
    expect(supabase.calls.filter(call => ['sprints', 'tasks', 'activity_logs'].includes(call.table))
      .every(call => call.filters.some(([column, id]) => column === 'project_id' && id === 'project-a'))).toBe(true);
  });

  it('loads project membership through the scoped RPC, including real role and email', async () => {
    const rows = [{ member_id: 'm1', user_id: 'u1', member_name: 'Lead Person', email: 'lead@example.com', role: 'lead' }];
    const calls = [];
    setSupabaseClient({ rpc: async (name, args) => { calls.push([name, args]); return { data: rows, error: null }; } });
    await expect(listProjectMembers('p1')).resolves.toEqual(rows);
    expect(calls[0]).toEqual(['list_project_members', { target_project_id: 'p1' }]);
  });

  it('stores invite creation through the generic RPC and treats duplicates as the same pending invite', async () => {
    const calls = [];
    setSupabaseClient({ rpc: async (name, args) => { calls.push([name, args]); return { data: 'invited', error: null }; } });
    await expect(inviteProjectMember('p1', 'New@Example.com', 'developer')).resolves.toBe('invited');
    await expect(inviteProjectMember('p1', 'new@example.com', 'developer')).resolves.toBe('invited');
    expect(calls).toHaveLength(2);
    expect(calls[0][1].invite_email).toBe('new@example.com');
    await expect(inviteProjectMember('p1', 'not-an-email', 'developer')).rejects.toThrow(/valid email/i);
  });

  it('uses the email function first and falls back to a pending in-app invite if unavailable', async () => {
    const calls = [];
    setSupabaseClient({
      functions: { invoke: async (name, options) => { calls.push(['function', name, options]); return { data: { result: 'invited' }, error: null }; } },
      rpc: async (name, args) => { calls.push(['rpc', name, args]); return { data: 'invited', error: null }; }
    });
    await expect(inviteProjectMember('project-1', 'person@example.com', 'developer')).resolves.toBe('invited');
    expect(calls[0]).toEqual(['function', 'invite-member', { body: { project_id: 'project-1', email: 'person@example.com', role: 'developer' } }]);

    calls.length = 0;
    setSupabaseClient({
      functions: { invoke: async () => ({ data: null, error: new Error('Function unavailable') }) },
      rpc: async (name, args) => { calls.push([name, args]); return { data: 'invited', error: null }; }
    });
    await expect(inviteProjectMember('project-1', 'person@example.com', 'developer')).resolves.toBe('invited');
    expect(calls[0][0]).toBe('add_project_member_by_email');
  });

  it('uses server-authorized RPCs for role changes, removal, invitation responses and resend/cancel', async () => {
    const calls = [];
    setSupabaseClient({ rpc: async (name, args) => { calls.push([name, args]); return { data: null, error: null }; } });
    await changeProjectMemberRole('p1', 'm2', 'viewer');
    await removeProjectMember('p1', 'm2');
    await manageProjectInvitation('i1', 'resend');
    await manageProjectInvitation('i1', 'cancel');
    await respondToProjectInvitation('i1', true);
    await respondToProjectInvitation('i1', false);
    expect(calls.map(([name]) => name)).toEqual([
      'change_project_member_role', 'remove_project_member', 'manage_project_invitation',
      'manage_project_invitation', 'respond_project_invitation', 'respond_project_invitation'
    ]);
  });

  it('resends by refreshing the pending record and invoking the email path', async () => {
    const calls = [];
    setSupabaseClient({
      functions: { invoke: async (...args) => { calls.push(['function', ...args]); return { data: { result: 'invited' }, error: null }; } },
      rpc: async (name, args) => { calls.push(['rpc', name, args]); return { data: 'invited', error: null }; }
    });
    await resendProjectInvitation('p1', { invitation_id: 'i1', email: 'person@example.com', role: 'viewer' });
    expect(calls.map(([kind, name]) => [kind, name])).toEqual([
      ['rpc', 'manage_project_invitation'], ['function', 'invite-member']
    ]);
  });

  it('lists invitations from the database without looking up account existence', async () => {
    const rows = [{ invitation_id: 'i1', project_id: 'p1', project_name: 'Alpha', email: 'person@example.com', role: 'viewer' }];
    let call;
    setSupabaseClient({ rpc: async (name, args) => { call = [name, args]; return { data: rows, error: null }; } });
    await expect(listProjectInvitations('p1')).resolves.toEqual(rows);
    expect(call).toEqual(['list_project_invitations', { target_project_id: 'p1' }]);
  });

  it('subscribes only to selected-project task, sprint and member changes and cleans up', () => {
    const registrations = [];
    const channel = {
      on: (event, config, callback) => { registrations.push({ event, config, callback }); return channel; },
      subscribe: vi.fn()
    };
    const removeChannel = vi.fn();
    const onChange = vi.fn();
    const unsubscribe = subscribeSelectedProjectRealtime({ channel: vi.fn(() => channel), removeChannel }, 'p1', onChange);
    expect(registrations.map(item => item.config.table)).toEqual(['tasks', 'sprints', 'project_members']);
    expect(registrations.every(item => item.config.filter === 'project_id=eq.p1')).toBe(true);
    registrations[0].callback({});
    expect(onChange).toHaveBeenCalledWith('tasks');
    expect(channel.subscribe).toHaveBeenCalledOnce();
    unsubscribe();
    expect(removeChannel).toHaveBeenCalledWith(channel);
  });
});
