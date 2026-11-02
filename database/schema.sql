-- ====================================================================
-- SPRINTFLOW - Project Management System Database Schema (Supabase/PostgreSQL)
-- Team 11: PES2UG24CS143, PES2UG24CS158, PES2UG24CS128, PES2UG24CS173
-- Features: Workflow, Visibility, Estimation, Kanban, Sprints, Activity Logs
-- ====================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase Auth or Standalone)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    usn TEXT,
    role TEXT DEFAULT 'developer' CHECK (role IN ('lead', 'developer', 'scrum_master', 'product_owner')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    description TEXT,
    owner_id TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    start_date DATE,
    target_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Project Members
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    role TEXT DEFAULT 'contributor' CHECK (role IN ('owner', 'scrum_master', 'lead', 'contributor')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, user_id)
);

-- 4. Sprints Table (Estimation and Workflow tracking)
CREATE TABLE IF NOT EXISTS sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    goal TEXT,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
    start_date DATE,
    end_date DATE,
    total_points INT DEFAULT 0,
    completed_points INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tasks / Work Items (Kanban items with Estimation)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    story_points INT DEFAULT 3 CHECK (story_points IN (1, 2, 3, 5, 8, 13, 21)),
    assignee_id TEXT,
    assignee_name TEXT,
    reporter_name TEXT,
    labels TEXT[], -- e.g. ['frontend', 'api', 'security']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Task Comments
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Audit & Activity Log (Visibility & History tracking)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE RESTRICT,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'task', 'sprint', 'project'
    entity_title TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Preserve audit history if a project is removed; do not allow cascade deletion.
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_project_id_fkey;
ALTER TABLE activity_logs
    ADD CONSTRAINT activity_logs_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT;

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_logs(project_id);

-- Authenticated users are mapped to the provisioned team profile by their verified
-- Supabase Auth email. Project membership, not a client-supplied user id, controls access.
CREATE OR REPLACE FUNCTION public.current_profile_user_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT p.user_id
    FROM public.profiles AS p
    WHERE lower(p.email) = lower(auth.jwt() ->> 'email')
    LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_profile_name()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT p.full_name
    FROM public.profiles AS p
    WHERE lower(p.email) = lower(auth.jwt() ->> 'email')
    LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(target_project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.projects AS p
        WHERE p.id = target_project_id
          AND p.owner_id = public.current_profile_user_id()
    ) OR EXISTS (
        SELECT 1
        FROM public.project_members AS pm
        WHERE pm.project_id = target_project_id
          AND pm.user_id = public.current_profile_user_id()
    )
$$;

CREATE OR REPLACE FUNCTION public.has_project_role(target_project_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT (
        'owner' = ANY(allowed_roles)
        AND EXISTS (
            SELECT 1
            FROM public.projects AS p
            WHERE p.id = target_project_id
              AND p.owner_id = public.current_profile_user_id()
        )
    ) OR EXISTS (
        SELECT 1
        FROM public.project_members AS pm
        WHERE pm.project_id = target_project_id
          AND pm.user_id = public.current_profile_user_id()
          AND pm.role = ANY(allowed_roles)
    )
$$;

CREATE OR REPLACE FUNCTION public.is_task_project_member(target_task_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.tasks AS t
        WHERE t.id = target_task_id
          AND public.is_project_member(t.project_id)
    )
$$;

REVOKE ALL ON FUNCTION public.current_profile_user_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_profile_name() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_project_member(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_project_role(UUID, TEXT[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_task_project_member(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_profile_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_project_role(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_task_project_member(UUID) TO authenticated;

-- Row Level Security (RLS) policies. Drop only policies owned by this schema script.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON profiles;
DROP POLICY IF EXISTS "Public Write Access" ON profiles;
DROP POLICY IF EXISTS "Projects Public Access" ON projects;
DROP POLICY IF EXISTS "Tasks Public Access" ON tasks;
DROP POLICY IF EXISTS "Sprints Public Access" ON sprints;
DROP POLICY IF EXISTS "Comments Public Access" ON comments;
DROP POLICY IF EXISTS "Activity Logs Public Access" ON activity_logs;
DROP POLICY IF EXISTS profiles_select_self ON profiles;
DROP POLICY IF EXISTS projects_select_member ON projects;
DROP POLICY IF EXISTS projects_insert_owner ON projects;
DROP POLICY IF EXISTS projects_update_lead ON projects;
DROP POLICY IF EXISTS projects_delete_owner ON projects;
DROP POLICY IF EXISTS project_members_select_member ON project_members;
DROP POLICY IF EXISTS project_members_insert_manager ON project_members;
DROP POLICY IF EXISTS project_members_update_manager ON project_members;
DROP POLICY IF EXISTS project_members_delete_manager ON project_members;
DROP POLICY IF EXISTS sprints_member_access ON sprints;
DROP POLICY IF EXISTS tasks_member_access ON tasks;
DROP POLICY IF EXISTS comments_select_member ON comments;
DROP POLICY IF EXISTS comments_insert_member ON comments;
DROP POLICY IF EXISTS comments_update_manager ON comments;
DROP POLICY IF EXISTS comments_delete_author_or_manager ON comments;
DROP POLICY IF EXISTS activity_logs_select_member ON activity_logs;
DROP POLICY IF EXISTS activity_logs_insert_member ON activity_logs;

CREATE POLICY profiles_select_self ON profiles
    FOR SELECT TO authenticated
    USING (lower(email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY projects_select_member ON projects
    FOR SELECT TO authenticated
    USING (public.is_project_member(id));
CREATE POLICY projects_insert_owner ON projects
    FOR INSERT TO authenticated
    WITH CHECK (owner_id = public.current_profile_user_id());
CREATE POLICY projects_update_lead ON projects
    FOR UPDATE TO authenticated
    USING (public.has_project_role(id, ARRAY['owner', 'lead']))
    WITH CHECK (public.has_project_role(id, ARRAY['owner', 'lead']));
CREATE POLICY projects_delete_owner ON projects
    FOR DELETE TO authenticated
    USING (public.has_project_role(id, ARRAY['owner']));

CREATE POLICY project_members_select_member ON project_members
    FOR SELECT TO authenticated
    USING (public.is_project_member(project_id));
CREATE POLICY project_members_insert_manager ON project_members
    FOR INSERT TO authenticated
    WITH CHECK (
        public.has_project_role(project_id, ARRAY['owner', 'lead'])
        AND (role <> 'owner' OR public.has_project_role(project_id, ARRAY['owner']))
    );
CREATE POLICY project_members_update_manager ON project_members
    FOR UPDATE TO authenticated
    USING (
        public.has_project_role(project_id, ARRAY['owner', 'lead'])
        AND (role <> 'owner' OR public.has_project_role(project_id, ARRAY['owner']))
    )
    WITH CHECK (
        public.has_project_role(project_id, ARRAY['owner', 'lead'])
        AND (role <> 'owner' OR public.has_project_role(project_id, ARRAY['owner']))
    );
CREATE POLICY project_members_delete_manager ON project_members
    FOR DELETE TO authenticated
    USING (public.has_project_role(project_id, ARRAY['owner', 'lead']) AND role <> 'owner');

CREATE POLICY sprints_member_access ON sprints
    FOR ALL TO authenticated
    USING (public.is_project_member(project_id))
    WITH CHECK (public.is_project_member(project_id));
CREATE POLICY tasks_member_access ON tasks
    FOR ALL TO authenticated
    USING (public.is_project_member(project_id))
    WITH CHECK (public.is_project_member(project_id));

CREATE POLICY comments_select_member ON comments
    FOR SELECT TO authenticated
    USING (public.is_task_project_member(task_id));
CREATE POLICY comments_insert_member ON comments
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_task_project_member(task_id)
        AND author_name = public.current_profile_name()
    );
CREATE POLICY comments_update_manager ON comments
    FOR UPDATE TO authenticated
    USING (
        public.is_task_project_member(task_id)
        AND public.has_project_role(
            (SELECT t.project_id FROM public.tasks AS t WHERE t.id = comments.task_id),
            ARRAY['owner', 'lead', 'scrum_master']
        )
    )
    WITH CHECK (
        public.is_task_project_member(task_id)
        AND public.has_project_role(
            (SELECT t.project_id FROM public.tasks AS t WHERE t.id = comments.task_id),
            ARRAY['owner', 'lead', 'scrum_master']
        )
    );
CREATE POLICY comments_delete_author_or_manager ON comments
    FOR DELETE TO authenticated
    USING (
        public.is_task_project_member(task_id)
        AND (
            author_name = public.current_profile_name()
            OR public.has_project_role(
                (SELECT t.project_id FROM public.tasks AS t WHERE t.id = comments.task_id),
                ARRAY['owner', 'lead', 'scrum_master']
            )
        )
    );

CREATE POLICY activity_logs_select_member ON activity_logs
    FOR SELECT TO authenticated
    USING (public.is_project_member(project_id));
CREATE POLICY activity_logs_insert_member ON activity_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_project_member(project_id)
        AND user_name = public.current_profile_name()
    );

-- Only authenticated application users can access project data. Audit records are
-- explicitly insert/read-only; they have no UPDATE or DELETE policy or table grant.
REVOKE ALL ON TABLE profiles, projects, project_members, sprints, tasks, comments, activity_logs
    FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE projects, project_members, sprints, tasks, comments
    TO authenticated;
GRANT SELECT, INSERT ON TABLE activity_logs TO authenticated;

-- ====================================================================
-- SEED DATA FOR TEAM 11 EVALUATION
-- ====================================================================

-- Seed Profiles
INSERT INTO profiles (user_id, full_name, email, usn, role) VALUES
('u-1', 'Darshan P Pawar', 'darshan@pes.edu', 'PES2UG24CS143', 'lead'),
('u-2', 'Dhatri Shivaprasad', 'dhatri@pes.edu', 'PES2UG24CS158', 'developer'),
('u-3', 'Chandan Kumar K', 'chandan@pes.edu', 'PES2UG24CS128', 'developer'),
('u-4', 'Gurubelli Yekambar Eshwar Rao', 'eshwar@pes.edu', 'PES2UG24CS173', 'developer')
ON CONFLICT (user_id) DO NOTHING;

-- Seed Project
INSERT INTO projects (id, name, key, description, owner_id, status, start_date, target_date) VALUES
('11111111-1111-1111-1111-111111111111', 'Project Management System (Team 11)', 'PMS', 'Collaborative project management tool featuring real-time Kanban boards, Agile sprint planning, Fibonacci estimation, and burndown analytics.', 'u-1', 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- Project roles seed the access scope for the four provisioned Team 11 accounts.
INSERT INTO project_members (project_id, user_id, member_name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'u-1', 'Darshan P Pawar', 'owner'),
('11111111-1111-1111-1111-111111111111', 'u-2', 'Dhatri Shivaprasad', 'contributor'),
('11111111-1111-1111-1111-111111111111', 'u-3', 'Chandan Kumar K', 'contributor'),
('11111111-1111-1111-1111-111111111111', 'u-4', 'Gurubelli Yekambar Eshwar Rao', 'contributor')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Seed Sprint
INSERT INTO sprints (id, project_id, name, goal, status, start_date, end_date, total_points, completed_points) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Sprint 1 - Core MVP & Workflow', 'Complete authentication, Supabase connection, Kanban workflow, and estimation logic.', 'active', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '11 days', 21, 8)
ON CONFLICT (id) DO NOTHING;

-- Seed Tasks
INSERT INTO tasks (project_id, sprint_id, title, description, status, priority, story_points, assignee_id, assignee_name, reporter_name, labels) VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Design Supabase Database Schema', 'Define relational tables for projects, sprints, tasks, and audit logs with RLS policies.', 'done', 'high', 5, 'u-3', 'Chandan Kumar K', 'Darshan P Pawar', ARRAY['database', 'backend', 'supabase']),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Build Kanban Drag-and-Drop Board', 'Implement interactive status lanes: Backlog, Todo, In Progress, Review, and Done.', 'done', 'critical', 8, 'u-2', 'Dhatri Shivaprasad', 'Darshan P Pawar', ARRAY['frontend', 'ui', 'kanban']),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Implement Sprint Estimation & Burndown', 'Add Fibonacci story point inputs and calculate velocity charts with completion burn rate.', 'in_progress', 'high', 5, 'u-4', 'Gurubelli Yekambar Eshwar Rao', 'Darshan P Pawar', ARRAY['estimation', 'analytics', 'sprints']),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Setup GitHub Actions CI/CD Pipeline', 'Automate linting, unit testing, and build verification on push and PR triggers.', 'in_progress', 'medium', 3, 'u-4', 'Gurubelli Yekambar Eshwar Rao', 'Darshan P Pawar', ARRAY['devops', 'ci-cd', 'github-actions']),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Create Executive Visibility Dashboard', 'Display real-time KPI metrics, task distribution donut chart, and team workload summary.', 'todo', 'high', 5, 'u-1', 'Darshan P Pawar', 'Darshan P Pawar', ARRAY['frontend', 'dashboard', 'visibility']),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Write SRS Document & Traceability Matrix', 'Draft formal IEEE 830 compliant SRS with 15+ FRs, 5 NFRs, and RTM table.', 'todo', 'critical', 8, 'u-1', 'Darshan P Pawar', 'Darshan P Pawar', ARRAY['documentation', 'srs', 'pes-submission']);
