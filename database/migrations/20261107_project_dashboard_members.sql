-- Project-scoped member, invitation, date, and realtime support.
BEGIN;

DO $$ BEGIN
  ALTER TABLE public.projects ADD CONSTRAINT projects_target_date_after_start
    CHECK (start_date IS NULL OR target_date IS NULL OR target_date >= start_date) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.project_invitations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.project_invitations
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
UPDATE public.project_invitations
SET status = CASE WHEN claimed_at IS NULL THEN 'pending' ELSE 'accepted' END
WHERE status IS DISTINCT FROM CASE WHEN claimed_at IS NULL THEN 'pending' ELSE 'accepted' END;
DO $$ BEGIN
  ALTER TABLE public.project_invitations ADD CONSTRAINT project_invitations_status_check
    CHECK (status IN ('pending','accepted','declined','cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS project_invitations_pending_email_idx
  ON public.project_invitations (lower(email), project_id) WHERE status = 'pending';

-- Replace the earlier account-sensitive implementation: every valid invite is
-- stored as pending and the result never reveals whether an account exists.
CREATE OR REPLACE FUNCTION public.add_project_member_by_email(
  target_project_id UUID, invite_email TEXT, member_role TEXT
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE normalized_email TEXT := lower(btrim(invite_email));
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_project_role(target_project_id, ARRAY['lead']) THEN
    RAISE EXCEPTION 'Project lead permission required';
  END IF;
  IF normalized_email !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$' THEN
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
$$;

CREATE OR REPLACE FUNCTION public.list_project_members(target_project_id UUID)
RETURNS TABLE(member_id UUID, user_id TEXT, member_name TEXT, email TEXT, role TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.list_project_invitations(target_project_id UUID DEFAULT NULL)
RETURNS TABLE(invitation_id UUID, project_id UUID, project_name TEXT, email TEXT, role TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.respond_project_invitation(target_invitation_id UUID, accept_invitation BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.manage_project_invitation(target_invitation_id UUID, action TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_project_details(
  target_project_id UUID, project_name TEXT, project_key TEXT,
  project_description TEXT, project_start_date DATE, project_target_date DATE
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
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
$$;

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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='sprints') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sprints;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='project_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
  END IF;
END $$;
NOTIFY pgrst, 'reload schema';
