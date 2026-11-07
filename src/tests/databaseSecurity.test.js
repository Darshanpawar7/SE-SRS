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

  it('keeps the project auth migration additive and carries it into the fresh schema', () => {
    const migration = readFileSync(new URL('../../database/migrations/20261106_auth_projects_rls.sql', import.meta.url), 'utf8');
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS auth_user_id UUID/i);
    expect(migration).toMatch(/REFERENCES auth\.users\(id\)/i);
    expect(migration).toMatch(/WHERE p\.auth_user_id IS NULL/i);
    expect(migration).not.toMatch(/UPDATE public\.profiles[^;]*SET user_id/i);
    expect(schema.replaceAll('\r\n', '\n')).toContain(migration.trim().replaceAll('\r\n', '\n'));
  });

  it('creates a project with only its authenticated creator as the initial member', () => {
    const migration = readFileSync(new URL('../../database/migrations/20261106_auth_projects_rls.sql', import.meta.url), 'utf8');
    const createFunction = migration.match(/CREATE OR REPLACE FUNCTION public\.create_project\([\s\S]*?\n\$\$;/i)?.[0] ?? '';
    expect(createFunction).toMatch(/INSERT INTO public\.project_members[\s\S]*?SELECT created_project_id, p\.user_id, p\.full_name, 'lead'[\s\S]*?WHERE p\.auth_user_id = auth\.uid\(\)/i);
    expect(createFunction).not.toMatch(/TEAM_MEMBERS|u-2|u-3|u-4|INSERT INTO public\.project_members[\s\S]*?VALUES\s*\(/i);
    const dashboardMigration = readFileSync(new URL('../../database/migrations/20261107_project_dashboard_members.sql', import.meta.url), 'utf8');
    expect(dashboardMigration.trimEnd()).toMatch(/NOTIFY pgrst, 'reload schema';$/i);
    expect(schema).toContain("You cannot invite yourself");
  });


  it('creates projects atomically and prevents self-service membership changes and loss of the last lead', () => {
    expect(schema).toMatch(/FUNCTION public\.create_project[\s\S]*?SECURITY DEFINER[\s\S]*?SET search_path = pg_catalog, public[\s\S]*?INSERT INTO public\.projects[\s\S]*?INSERT INTO public\.project_members/i);
    expect(schema).toMatch(/FUNCTION public\.change_project_member_role[\s\S]*?Members cannot change their own role/i);
    expect(schema).toMatch(/FUNCTION public\.remove_project_member[\s\S]*?Members cannot remove themselves/i);
    expect(schema).toMatch(/FUNCTION public\.protect_last_project_lead[\s\S]*?A project must retain at least one lead/i);
    expect(schema).toMatch(/BEFORE UPDATE OF role OR DELETE ON public\.project_members/i);
  });

  it('keeps invitation responses generic and claims only for a verified authenticated user', () => {
    expect(schema).toMatch(/FUNCTION public\.add_project_member_by_email[\s\S]*?RETURN 'invited'/i);
    expect(schema).toMatch(/FUNCTION public\.claim_project_invitations\(\)[\s\S]*?u\.id = auth\.uid\(\) AND u\.email_confirmed_at IS NOT NULL/i);
    expect(schema).toMatch(/FUNCTION public\.claim_project_invitations\(\)[\s\S]*?WHERE lower\(i\.email\) = verified_email/i);
    expect(schema).toMatch(/CREATE POLICY profiles_select_project_member[\s\S]*?theirs\.project_id = mine\.project_id/i);
  });

  it('declares every custom helper as security definer with a fixed search path', () => {
    const functions = [...schema.matchAll(/CREATE OR REPLACE FUNCTION public\.(\w+)\([\s\S]*?\$\$/gi)];
    expect(functions.length).toBeGreaterThan(10);
    functions.forEach(([definition]) => {
      expect(definition).toMatch(/SECURITY DEFINER/i);
      expect(definition).toMatch(/SET search_path = pg_catalog, public/i);
    });
  });
});
