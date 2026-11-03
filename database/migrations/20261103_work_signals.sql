-- Apply once to an existing Supabase project before enabling the work-signal UI.
-- Additive columns only; existing RLS/grants remain authoritative. No seed rerun.
BEGIN;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS blocked_reason TEXT DEFAULT '';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.tasks'::regclass AND conname='tasks_blocked_reason_length') THEN
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_blocked_reason_length CHECK (char_length(blocked_reason) <= 300);
  END IF;
END $$;
COMMIT;
