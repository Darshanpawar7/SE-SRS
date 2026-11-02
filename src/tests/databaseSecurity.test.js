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
  it('makes audit records append-only and prevents project deletion from cascading into history', () => {
    expect(schema).toMatch(/CREATE POLICY activity_logs_insert_member[\s\S]*?FOR INSERT TO authenticated/i);
    expect(schema).toMatch(/GRANT SELECT, INSERT ON TABLE activity_logs TO authenticated/i);
    expect(schema).not.toMatch(/CREATE POLICY[^;]*activity_logs[^;]*FOR\s+(?:UPDATE|DELETE)/i);
    expect(schema).toMatch(/FOREIGN KEY \(project_id\) REFERENCES projects\(id\) ON DELETE RESTRICT/i);
  });
});
