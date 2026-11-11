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
