import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SESSION_CHECK_TIMEOUT_MS,
  sessionCheckFailure,
  verifyCloudSession
} from '../services/authService';
import { activateSessionCache } from '../services/sessionCache';
import { setSupabaseClient } from '../services/supabaseClient';

let data;
beforeEach(() => {
  data = new Map();
  vi.stubGlobal('localStorage', {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  });
});
afterEach(() => {
  setSupabaseClient(undefined);
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const clientReturning = result => ({ auth: { getUser: async () => result } });
const authError = (name, status, message = name) => Object.assign(new Error(message), { name, status });

describe('cloud session check: only a rejected session signs the user out', () => {
  it('treats a missing session as "not signed in", without an error', async () => {
    setSupabaseClient(clientReturning({ data: { user: null }, error: authError('AuthSessionMissingError', 400, 'Auth session missing!') }));
    await expect(verifyCloudSession()).resolves.toBeNull();
  });

  it.each([
    ['a dropped connection', authError('AuthRetryableFetchError', 0, 'Failed to fetch')],
    ['a server error', authError('AuthApiError', 503, 'Service unavailable')],
    ['a rate limit', authError('AuthApiError', 429, 'Too many requests')]
  ])('marks %s as transient', async (_, error) => {
    setSupabaseClient(clientReturning({ data: { user: null }, error }));
    await expect(verifyCloudSession()).rejects.toMatchObject({ name: 'SessionCheckError', transient: true });
  });

  it('marks a thrown network failure as transient', async () => {
    setSupabaseClient({ auth: { getUser: async () => { throw new TypeError('Failed to fetch'); } } });
    await expect(verifyCloudSession()).rejects.toMatchObject({ transient: true });
  });

  it('marks a check that never answers as transient after the timeout', async () => {
    vi.useFakeTimers();
    setSupabaseClient({ auth: { getUser: () => new Promise(() => {}) } });
    const check = expect(verifyCloudSession()).rejects.toMatchObject({ transient: true, message: 'Session verification timed out.' });
    await vi.advanceTimersByTimeAsync(SESSION_CHECK_TIMEOUT_MS);
    await check;
  });

  it.each([
    ['an expired or invalid token', authError('AuthApiError', 401, 'JWT expired')],
    ['a forbidden session', authError('AuthApiError', 403, 'Forbidden')],
    ['an unknown error', new Error('expired')]
  ])('fails closed on %s', async (_, error) => {
    setSupabaseClient(clientReturning({ data: { user: null }, error }));
    await expect(verifyCloudSession()).rejects.toMatchObject({ transient: false });
  });

  it('keeps a verified user (and their open edits) through a network blip and retries', () => {
    expect(sessionCheckFailure({ transient: true }, true)).toEqual({ keepUser: true, retry: true, message: '' });
  });

  it('retries without signing anyone in when the first check cannot reach Supabase', () => {
    const outcome = sessionCheckFailure({ transient: true }, false);
    expect(outcome).toMatchObject({ keepUser: false, retry: true });
    expect(outcome.message).toMatch(/try again when the connection is back/);
  });

  it('signs the user out when Supabase rejects the session', () => {
    const outcome = sessionCheckFailure({ transient: false }, true);
    expect(outcome).toMatchObject({ keepUser: false, retry: false });
    expect(outcome.message).toMatch(/session has ended/);
  });
});

describe('workspace cache owner across upgrades and mode switches', () => {
  const pendingWithTask = '{"seq":2,"tables":{"tasks":2},"deletedTaskIds":[],"deletedSprintIds":[],"activity":[]}';

  it('keeps the cache and unsent changes of the same account on the first run after the upgrade', () => {
    data.set('sprintflow_session', JSON.stringify({ memberId: 'u-1', email: 'darshan@pes.edu', mode: 'supabase' }));
    data.set('sprintflow_tasks', '[{"id":"my-cloud-work"}]');
    data.set('sprintflow_pending_sync', pendingWithTask);

    activateSessionCache('endpoint:uid-1', 'darshan@pes.edu');

    expect(data.get('sprintflow_tasks')).toContain('my-cloud-work');
    expect(data.get('sprintflow_pending_sync')).toContain('"tasks":2');
    expect(data.get('sprintflow_cache_owner')).toBe('endpoint:uid-1');
    expect(data.has('sprintflow_cache_backup:legacy-unverified')).toBe(false);
  });

  it('still quarantines a legacy cache left by a different account', () => {
    data.set('sprintflow_session', JSON.stringify({ memberId: 'u-1', email: 'darshan@pes.edu', mode: 'supabase' }));
    data.set('sprintflow_tasks', '[{"id":"darshan-private"}]');
    data.set('sprintflow_pending_sync', pendingWithTask);

    activateSessionCache('endpoint:uid-4', 'eshwar@pes.edu');

    expect(data.get('sprintflow_tasks')).not.toContain('darshan-private');
    expect(data.get('sprintflow_pending_sync')).not.toContain('"tasks":2');
    expect(data.get('sprintflow_cache_backup:legacy-unverified')).toContain('darshan-private');
  });

  it('brings the demo board back after switching from demo mode to the cloud and back', () => {
    data.set('sprintflow_session', JSON.stringify({ memberId: 'u-1', email: 'darshan@pes.edu', mode: 'demo' }));
    data.set('sprintflow_tasks', '[{"id":"demo-work"}]');

    activateSessionCache('demo');
    expect(data.get('sprintflow_cache_owner')).toBe('demo');

    data.delete('sprintflow_session');
    activateSessionCache('endpoint:uid-1', 'darshan@pes.edu');
    expect(data.get('sprintflow_tasks')).not.toContain('demo-work');

    activateSessionCache('demo');
    expect(data.get('sprintflow_tasks')).toContain('demo-work');
  });
});
