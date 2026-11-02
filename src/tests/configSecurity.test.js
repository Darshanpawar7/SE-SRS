import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isValidSupabaseAnonKey, isValidSupabaseUrl } from '../services/supabaseClient';

const gitignore = readFileSync(new URL('../../.gitignore', import.meta.url), 'utf8');
const envExample = readFileSync(new URL('../../.env.example', import.meta.url), 'utf8');
const encodeJwtPayload = (payload) =>
  btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

describe('Supabase credential configuration', () => {
  it('ignores local environment files and keeps the example credential-free', () => {
    expect(gitignore).toMatch(/^\.env$/m);
    expect(gitignore).toMatch(/^\.env\.local$/m);
    expect(gitignore).toMatch(/^\.env\.production$/m);
    expect(envExample).toContain('your-project.supabase.co');
    expect(envExample).toContain('your-anon-public-key');
    expect(envExample).not.toMatch(/eyJ[a-zA-Z0-9_-]{20,}/);
  });

  it('accepts only HTTPS URLs and non-secret public key values', () => {
    expect(isValidSupabaseUrl('https://team11.supabase.co')).toBe(true);
    expect(isValidSupabaseUrl('http://team11.supabase.co')).toBe(false);
    expect(isValidSupabaseAnonKey('anon-key')).toBe(true);
    expect(isValidSupabaseAnonKey('your-anon-public-key')).toBe(false);
    expect(isValidSupabaseAnonKey('service_role_secret')).toBe(false);
    expect(isValidSupabaseAnonKey('sb_secret_example')).toBe(false);
    expect(isValidSupabaseAnonKey('eyJhbGciOiJub25lIn0.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature')).toBe(false);
    expect(isValidSupabaseAnonKey('key with spaces')).toBe(false);
  });

  it('rejects service-role JWTs while allowing legacy anon public JWTs', () => {
    const serviceRoleKey = `eyJhbGciOiJIUzI1NiJ9.${encodeJwtPayload({ role: 'service_role' })}.signature`;
    const anonPublicKey = `eyJhbGciOiJIUzI1NiJ9.${encodeJwtPayload({ role: 'anon' })}.signature`;

    expect(isValidSupabaseAnonKey(serviceRoleKey)).toBe(false);
    expect(isValidSupabaseAnonKey(anonPublicKey)).toBe(true);
  });
});
