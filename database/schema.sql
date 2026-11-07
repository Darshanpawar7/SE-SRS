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
    due_date DATE,
    blocked_reason TEXT DEFAULT '' CHECK (char_length(blocked_reason) <= 300),
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

-- Additive auth/project security layer. Existing text user_id values and seeded
-- rows are retained; see docs/AUTH_SCHEMA_MIGRATION.md before production rollout.
BEGIN;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS auth_user_id UUID;
DO $$ BEGIN
    ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_auth_user_id_fkey
        FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_auth_user_id_unique
    ON public.profiles(auth_user_id);

-- Link existing profiles to matching Auth accounts without changing legacy IDs.
UPDATE public.profiles AS p
SET auth_user_id = u.id
FROM auth.users AS u
WHERE p.auth_user_id IS NULL
  AND lower(p.email) = lower(u.email)
  AND u.email_confirmed_at IS NOT NULL;

ALTER TABLE public.project_members
    DROP CONSTRAINT IF EXISTS project_members_role_check;
ALTER TABLE public.project_members
    ADD CONSTRAINT project_members_role_check
    CHECK (role IN ('owner', 'lead', 'scrum_master', 'developer', 'viewer', 'contributor'));

CREATE TABLE IF NOT EXISTS public.project_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('lead', 'scrum_master', 'developer', 'viewer')),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    claimed_at TIMESTAMPTZ,
    UNIQUE (project_id, email)
);
CREATE INDEX IF NOT EXISTS project_invitations_email_idx
    ON public.project_invitations (lower(email)) WHERE claimed_at IS NULL;

CREATE OR REPLACE FUNCTION public.current_profile_user_id()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$ SELECT p.user_id FROM public.profiles p WHERE p.auth_user_id = auth.uid() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.current_profile_name()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$ SELECT p.full_name FROM public.profiles p WHERE p.auth_user_id = auth.uid() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.is_project_member(target_project_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = target_project_id
      AND pm.user_id = public.current_profile_user_id()
  )
$$;

CREATE OR REPLACE FUNCTION public.has_project_role(target_project_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = target_project_id
      AND pm.user_id = public.current_profile_user_id()
      AND pm.role = ANY(allowed_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.is_task_project_member(target_task_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.tasks t
    WHERE t.id = target_task_id AND public.is_project_member(t.project_id))
$$;

-- New Auth registrations receive a profile keyed by auth_user_id. Legacy
-- user_id values remain untouched and are only generated for new accounts.
CREATE OR REPLACE FUNCTION public.provision_auth_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL OR NEW.email IS NULL THEN RETURN NEW; END IF;
  UPDATE public.profiles SET auth_user_id = NEW.id, email = NEW.email
  WHERE auth_user_id IS NULL AND lower(email) = lower(NEW.email);
  IF FOUND THEN RETURN NEW; END IF;
  INSERT INTO public.profiles (user_id, auth_user_id, full_name, email, role)
  VALUES ('auth:' || NEW.id::text, NEW.id,
          COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), split_part(NEW.email, '@', 1)),
          NEW.email, 'developer')
  ON CONFLICT (auth_user_id) DO UPDATE
    SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.provision_auth_profile();

CREATE OR REPLACE FUNCTION public.create_project(
  project_name TEXT, project_key TEXT, project_description TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE created_project_id UUID; profile_user_id TEXT;
BEGIN
  IF auth.uid() IS NULL OR auth.jwt() ->> 'email' IS NULL THEN
    RAISE EXCEPTION 'Authenticated account required';
  END IF;
  SELECT p.user_id INTO profile_user_id FROM public.profiles p WHERE p.auth_user_id = auth.uid();
  IF profile_user_id IS NULL THEN RAISE EXCEPTION 'Profile unavailable'; END IF;
  INSERT INTO public.projects (name, key, description, owner_id)
  VALUES (btrim(project_name), upper(btrim(project_key)), project_description, profile_user_id)
  RETURNING id INTO created_project_id;
  INSERT INTO public.project_members (project_id, user_id, member_name, role)
  SELECT created_project_id, p.user_id, p.full_name, 'lead'
  FROM public.profiles p WHERE p.auth_user_id = auth.uid();
  RETURN created_project_id;
END;
$$;

-- The response is intentionally invariant. Existing verified users are added
-- immediately; all other addresses get a pending invitation.
CREATE OR REPLACE FUNCTION public.add_project_member_by_email(
  target_project_id UUID, invite_email TEXT, member_role TEXT
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE normalized_email TEXT := lower(btrim(invite_email)); target_user_id UUID; target_profile_user_id TEXT;
BEGIN
  IF NOT public.has_project_role(target_project_id, ARRAY['lead']) THEN
    RAISE EXCEPTION 'Project lead permission required';
  END IF;
  IF normalized_email = lower(COALESCE(auth.jwt() ->> 'email', '')) THEN
    RAISE EXCEPTION 'Members cannot add themselves';
  END IF;
  IF member_role NOT IN ('lead','scrum_master','developer','viewer') THEN
    RAISE EXCEPTION 'Invalid project role';
  END IF;
  SELECT u.id INTO target_user_id FROM auth.users u
  WHERE lower(u.email) = normalized_email AND u.email_confirmed_at IS NOT NULL LIMIT 1;
  IF target_user_id IS NOT NULL THEN
    SELECT p.user_id INTO target_profile_user_id FROM public.profiles p WHERE p.auth_user_id = target_user_id;
  END IF;
  IF target_profile_user_id IS NOT NULL THEN
    INSERT INTO public.project_members(project_id, user_id, member_name, role)
    SELECT target_project_id, p.user_id, p.full_name, member_role FROM public.profiles p
    WHERE p.auth_user_id = target_user_id
    ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role;
    DELETE FROM public.project_invitations WHERE project_id = target_project_id AND lower(email) = normalized_email;
  ELSE
    INSERT INTO public.project_invitations(project_id, email, role, invited_by)
    VALUES (target_project_id, normalized_email, member_role, auth.uid())
    ON CONFLICT (project_id, email) DO UPDATE SET role = EXCLUDED.role, invited_by = EXCLUDED.invited_by,
      created_at = now(), claimed_at = NULL;
  END IF;
  RETURN 'invited';
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_project_invitations()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE verified_email TEXT; claimant_user_id TEXT; claimant_name TEXT; claimed_count INTEGER;
BEGIN
  SELECT lower(u.email), p.user_id, p.full_name INTO verified_email, claimant_user_id, claimant_name
  FROM auth.users u JOIN public.profiles p ON p.auth_user_id = u.id
  WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL;
  IF verified_email IS NULL OR claimant_user_id IS NULL THEN
    RAISE EXCEPTION 'A verified email is required';
  END IF;
  INSERT INTO public.project_members(project_id, user_id, member_name, role)
  SELECT i.project_id, claimant_user_id, claimant_name, i.role
  FROM public.project_invitations i
  WHERE lower(i.email) = verified_email AND i.claimed_at IS NULL
  ON CONFLICT (project_id, user_id) DO NOTHING;
  GET DIAGNOSTICS claimed_count = ROW_COUNT;
  UPDATE public.project_invitations SET claimed_at = now()
  WHERE lower(email) = verified_email AND claimed_at IS NULL;
  RETURN claimed_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_project_member_role(
  target_project_id UUID, target_member_id UUID, new_role TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.has_project_role(target_project_id, ARRAY['lead']) THEN
    RAISE EXCEPTION 'Project lead permission required';
  END IF;
  PERFORM 1 FROM public.projects p WHERE p.id = target_project_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.project_members pm
    WHERE pm.id = target_member_id AND pm.project_id = target_project_id
      AND pm.user_id = public.current_profile_user_id()) THEN
    RAISE EXCEPTION 'Members cannot change their own role';
  END IF;
  IF new_role NOT IN ('lead','scrum_master','developer','viewer') THEN
    RAISE EXCEPTION 'Invalid project role';
  END IF;
  UPDATE public.project_members SET role = new_role
  WHERE id = target_member_id AND project_id = target_project_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project member not found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_project_member(
  target_project_id UUID, target_member_id UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.has_project_role(target_project_id, ARRAY['lead']) THEN
    RAISE EXCEPTION 'Project lead permission required';
  END IF;
  PERFORM 1 FROM public.projects p WHERE p.id = target_project_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.project_members pm
    WHERE pm.id = target_member_id AND pm.project_id = target_project_id
      AND pm.user_id = public.current_profile_user_id()) THEN
    RAISE EXCEPTION 'Members cannot remove themselves';
  END IF;
  DELETE FROM public.project_members
  WHERE id = target_member_id AND project_id = target_project_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project member not found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_last_project_lead()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE old_is_lead BOOLEAN; new_is_lead BOOLEAN;
BEGIN
  old_is_lead := OLD.role IN ('owner','lead');
  new_is_lead := FALSE;
  IF TG_OP = 'UPDATE' THEN new_is_lead := NEW.role IN ('owner','lead'); END IF;
  -- Serialize lead removals/demotions for this project so concurrent changes
  -- cannot both observe a different remaining lead and remove the last one.
  PERFORM 1 FROM public.projects p WHERE p.id = OLD.project_id FOR UPDATE;
  IF old_is_lead AND NOT new_is_lead AND NOT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = OLD.project_id AND pm.id <> OLD.id AND pm.role IN ('owner','lead')
  ) THEN RAISE EXCEPTION 'A project must retain at least one lead'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS project_members_keep_lead ON public.project_members;
CREATE TRIGGER project_members_keep_lead
BEFORE UPDATE OF role OR DELETE ON public.project_members
FOR EACH ROW EXECUTE FUNCTION public.protect_last_project_lead();

-- Replace self-only profile visibility with shared-project visibility.
DROP POLICY IF EXISTS profiles_select_self ON public.profiles;
DROP POLICY IF EXISTS profiles_select_project_member ON public.profiles;
CREATE POLICY profiles_select_project_member ON public.profiles
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.project_members mine
  JOIN public.project_members theirs ON theirs.project_id = mine.project_id
  WHERE mine.user_id = public.current_profile_user_id()
    AND theirs.user_id = profiles.user_id
));

ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_invitations_select_lead ON public.project_invitations;
CREATE POLICY project_invitations_select_lead ON public.project_invitations
FOR SELECT TO authenticated USING (public.has_project_role(project_id, ARRAY['lead']));

-- Clients cannot write membership, profiles, project ownership, or invitations
-- directly. All mutations go through scoped security-definer entry points.
REVOKE INSERT, UPDATE, DELETE ON public.profiles, public.projects, public.project_members,
  public.project_invitations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles, public.projects, public.project_members TO authenticated;
GRANT SELECT ON public.project_invitations TO authenticated;
REVOKE ALL ON FUNCTION public.provision_auth_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_last_project_lead() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_project(TEXT,TEXT,TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_project_member_by_email(UUID,TEXT,TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_project_invitations() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.change_project_member_role(UUID,UUID,TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_project_member(UUID,UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_project(TEXT,TEXT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_project_member_by_email(UUID,TEXT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_project_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_project_member_role(UUID,UUID,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_project_member(UUID,UUID) TO authenticated;
COMMIT;
NOTIFY pgrst, 'reload schema';

-- Extend the atomic project RPC to persist optional planning dates.
BEGIN;

CREATE OR REPLACE FUNCTION public.create_project(
  project_name TEXT, project_key TEXT, project_description TEXT,
  project_start_date DATE, project_target_date DATE
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE created_project_id UUID;
BEGIN
  IF project_start_date IS NULL OR project_target_date IS NULL
     OR project_target_date < project_start_date THEN
    RAISE EXCEPTION 'Choose a valid project date range';
  END IF;
  created_project_id := public.create_project(project_name, project_key, project_description);
  UPDATE public.projects
  SET start_date = project_start_date,
      target_date = project_target_date,
      updated_at = now()
  WHERE id = created_project_id;
  RETURN created_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_project(TEXT,TEXT,TEXT,DATE,DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_project(TEXT,TEXT,TEXT,DATE,DATE) TO authenticated;

COMMIT;


-- Apply the idempotent dashboard, membership, invitation, and realtime layer.
-- Project-scoped member, invitation, date, and realtime support.
BEGIN;

DO $ BEGIN
  ALTER TABLE public.projects ADD CONSTRAINT projects_target_date_after_start
    CHECK (start_date IS NULL OR target_date IS NULL OR target_date >= start_date) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $;

ALTER TABLE public.project_invitations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.project_invitations
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
UPDATE public.project_invitations
SET status = CASE WHEN claimed_at IS NULL THEN 'pending' ELSE 'accepted' END
WHERE status IS DISTINCT FROM CASE WHEN claimed_at IS NULL THEN 'pending' ELSE 'accepted' END;
DO $ BEGIN
  ALTER TABLE public.project_invitations ADD CONSTRAINT project_invitations_status_check
    CHECK (status IN ('pending','accepted','declined','cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $;
CREATE INDEX IF NOT EXISTS project_invitations_pending_email_idx
  ON public.project_invitations (lower(email), project_id) WHERE status = 'pending';

-- Replace the earlier account-sensitive implementation: every valid invite is
-- stored as pending and the result never reveals whether an account exists.
CREATE OR REPLACE FUNCTION public.add_project_member_by_email(
  target_project_id UUID, invite_email TEXT, member_role TEXT
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $
DECLARE normalized_email TEXT := lower(btrim(invite_email));
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_project_role(target_project_id, ARRAY['lead']) THEN
    RAISE EXCEPTION 'Project lead permission required';
  END IF;
  IF normalized_email !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+ THEN
    RAISE EXCEPTION 'Enter a valid email address';
  END IF;
  IF normalized_email = lower(COALESCE(auth.jwt() ->> 'email', '')) THEN
    RAISE EXCEPTION 'You cannot invite yourself';
  END IF;
  IF member_role NOT IN ('lead','scrum_master','developer','viewer') THEN
    RAISE EXCEPTION 'Invalid project role';
  END IF;
  INSERT INTO public.project_invitations(project_id, email, role, invited_by, claimed_at, status, responded_at)
  VALUES (target_project_id, normalized_email, member_role, auth.uid(), NULL, 'pending', NULL)
  ON CONFLICT (project_id, email) DO UPDATE
    SET role = EXCLUDED.role, invited_by = EXCLUDED.invited_by,
        created_at = now(), claimed_at = NULL, status = 'pending', responded_at = NULL;
  RETURN 'invited';
END;
$;

CREATE OR REPLACE FUNCTION public.list_project_members(target_project_id UUID)
RETURNS TABLE(member_id UUID, user_id TEXT, member_name TEXT, email TEXT, role TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_project_member(target_project_id) THEN
    RAISE EXCEPTION 'Project membership required';
  END IF;
  RETURN QUERY
    SELECT pm.id, pm.user_id, pm.member_name, p.email, pm.role
    FROM public.project_members pm
    LEFT JOIN public.profiles p ON p.user_id = pm.user_id
    WHERE pm.project_id = target_project_id
    ORDER BY CASE WHEN pm.role IN ('owner','lead') THEN 0 ELSE 1 END, pm.member_name;
END;
$;

CREATE OR REPLACE FUNCTION public.list_project_invitations(target_project_id UUID DEFAULT NULL)
RETURNS TABLE(invitation_id UUID, project_id UUID, project_name TEXT, email TEXT, role TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $
DECLARE verified_email TEXT;
BEGIN
  SELECT lower(u.email) INTO verified_email FROM auth.users u
  WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL;
  IF verified_email IS NULL THEN RAISE EXCEPTION 'A verified email is required'; END IF;
  RETURN QUERY
    SELECT i.id, i.project_id, p.name, i.email, i.role, i.created_at
    FROM public.project_invitations i JOIN public.projects p ON p.id = i.project_id
    WHERE i.status = 'pending'
      AND ((target_project_id IS NOT NULL AND i.project_id = target_project_id
            AND public.is_project_member(i.project_id))
        OR (target_project_id IS NULL AND lower(i.email) = verified_email));
END;
$;

CREATE OR REPLACE FUNCTION public.respond_project_invitation(target_invitation_id UUID, accept_invitation BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $
DECLARE verified_email TEXT; claimant_user_id TEXT; claimant_name TEXT; invitation RECORD;
BEGIN
  SELECT lower(u.email) INTO verified_email FROM auth.users u
  WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL;
  IF verified_email IS NULL THEN RAISE EXCEPTION 'A verified email is required'; END IF;
  SELECT p.user_id, p.full_name INTO claimant_user_id, claimant_name
  FROM public.profiles p WHERE p.auth_user_id = auth.uid();
  IF claimant_user_id IS NULL THEN RAISE EXCEPTION 'Profile unavailable'; END IF;
  SELECT i.* INTO invitation FROM public.project_invitations i
  WHERE i.id = target_invitation_id AND i.status = 'pending'
    AND lower(i.email) = verified_email FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pending invitation not found'; END IF;
  IF accept_invitation THEN
    INSERT INTO public.project_members(project_id,user_id,member_name,role)
    VALUES (invitation.project_id, claimant_user_id, claimant_name, invitation.role)
    ON CONFLICT (project_id,user_id) DO UPDATE SET role = EXCLUDED.role;
    UPDATE public.project_invitations SET status='accepted', claimed_at=now(), responded_at=now()
    WHERE id=target_invitation_id;
  ELSE
    UPDATE public.project_invitations SET status='declined', claimed_at=now(), responded_at=now()
    WHERE id=target_invitation_id;
  END IF;
END;
$;

CREATE OR REPLACE FUNCTION public.manage_project_invitation(target_invitation_id UUID, action TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $
DECLARE invitation RECORD;
BEGIN
  SELECT i.* INTO invitation FROM public.project_invitations i
  WHERE i.id=target_invitation_id FOR UPDATE;
  IF NOT FOUND OR NOT public.has_project_role(invitation.project_id, ARRAY['lead']) THEN
    RAISE EXCEPTION 'Project lead permission required';
  END IF;
  IF action = 'cancel' THEN
    UPDATE public.project_invitations SET status='cancelled', claimed_at=now(), responded_at=now()
    WHERE id=target_invitation_id AND status='pending';
  ELSIF action = 'resend' THEN
    UPDATE public.project_invitations SET created_at=now()
    WHERE id=target_invitation_id AND status='pending';
  ELSE RAISE EXCEPTION 'Invalid invitation action';
  END IF;
  RETURN 'invited';
END;
$;

CREATE OR REPLACE FUNCTION public.update_project_details(
  target_project_id UUID, project_name TEXT, project_key TEXT,
  project_description TEXT, project_start_date DATE, project_target_date DATE
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $
BEGIN
  IF NOT public.has_project_role(target_project_id, ARRAY['lead']) THEN
    RAISE EXCEPTION 'Only a project lead can edit project details';
  END IF;
  IF project_start_date IS NOT NULL AND project_target_date IS NOT NULL
     AND project_target_date < project_start_date THEN
    RAISE EXCEPTION 'Target date cannot be before the start date';
  END IF;
  UPDATE public.projects SET name=btrim(project_name), key=upper(btrim(project_key)),
    description=project_description, start_date=project_start_date,
    target_date=project_target_date, updated_at=now()
  WHERE id=target_project_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project not found'; END IF;
END;
$;

REVOKE ALL ON FUNCTION public.add_project_member_by_email(UUID,TEXT,TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_project_members(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_project_invitations(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_project_invitation(UUID,BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.manage_project_invitation(UUID,TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_project_details(UUID,TEXT,TEXT,TEXT,DATE,DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_project_invitations() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_project_member_by_email(UUID,TEXT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_project_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_project_invitations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_project_invitation(UUID,BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manage_project_invitation(UUID,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_project_details(UUID,TEXT,TEXT,TEXT,DATE,DATE) TO authenticated;

COMMIT;

-- Run once after the migration to publish scoped change events. Supabase Realtime
-- evaluates each subscriber's SELECT grants and RLS policies for returned rows.
DO $ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='sprints') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sprints;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='project_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
  END IF;
END $;
NOTIFY pgrst, 'reload schema';
