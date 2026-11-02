import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isValidSupabaseAnonKey, isValidSupabaseUrl } from '../services/supabaseClient';

const gitignore = readFileSync(new URL('../../.gitignore', import.meta.url), 'utf8');
const envExample = readFileSync(new URL('../../.env.example', import.meta.url), 'utf8');

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
    expect(isValidSupabaseAnonKey('key with spaces')).toBe(false);
  });
});
