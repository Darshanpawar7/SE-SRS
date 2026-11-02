import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(new URL('../../database/schema.sql', import.meta.url), 'utf8');

describe('Supabase database security schema', () => {
  const applicationTables = [
    'profiles',
    'projects',
    'project_members',
    'sprints',
    'tasks',
    'comments',
    'activity_logs'
  ];

  it('enables RLS on every application table and scopes policies to authenticated users', () => {
    applicationTables.forEach(table => {
      expect(schema).toMatch(new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`, 'i'));
    });
    expect(schema).toMatch(/CREATE POLICY project_members_select_member[\s\S]*?is_project_member\(project_id\)/i);
    expect(schema).toMatch(/CREATE POLICY project_members_insert_manager[\s\S]*?ARRAY\['owner', 'lead'\]/i);
    expect(schema).not.toMatch(/CREATE POLICY[^;]*USING\s*\(true\)/i);
    expect(schema).not.toMatch(/CREATE POLICY[^;]*TO\s+(?:anon|public)/i);
  });

  it('derives cloud audit actors from the verified authenticated profile', () => {
    expect(schema).toMatch(/CREATE OR REPLACE FUNCTION public\.set_verified_activity_actor\(\)[\s\S]*?NEW\.user_name := verified_name/i);
    expect(schema).toMatch(/CREATE TRIGGER activity_logs_verified_actor[\s\S]*?BEFORE INSERT ON activity_logs/i);
  });
});
