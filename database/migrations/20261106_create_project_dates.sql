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
NOTIFY pgrst, 'reload schema';
