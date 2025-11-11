BEGIN;

-- Activer la RLS sur les tables principales
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ==================================================================
-- Helpers
-- ==================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((current_setting('request.jwt.claims', true)::json->>'role'), '') = 'ADMIN';
$$;

CREATE OR REPLACE FUNCTION public.is_verified_organizer(organizer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizers o
    WHERE o.id = organizer_id
      AND o.user_id = auth.uid()
      AND o.verified = true
  );
$$;

-- ==================================================================
-- EVENTS
-- ==================================================================
DROP POLICY IF EXISTS "Public read events" ON public.events;
CREATE POLICY "Public read events"
ON public.events
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Organizers insert events" ON public.events;
CREATE POLICY "Organizers insert events"
ON public.events
FOR INSERT
WITH CHECK (
  public.is_admin() OR (
    NEW.organizer_id IS NOT NULL
    AND public.is_verified_organizer(NEW.organizer_id)
  )
);

DROP POLICY IF EXISTS "Organizers update events" ON public.events;
CREATE POLICY "Organizers update events"
ON public.events
FOR UPDATE
USING (
  public.is_admin() OR (
    events.organizer_id IS NOT NULL
    AND public.is_verified_organizer(events.organizer_id)
  )
)
WITH CHECK (
  public.is_admin() OR (
    events.organizer_id IS NOT NULL
    AND public.is_verified_organizer(events.organizer_id)
  )
);

DROP POLICY IF EXISTS "Organizers delete events" ON public.events;
CREATE POLICY "Organizers delete events"
ON public.events
FOR DELETE
USING (
  public.is_admin() OR (
    events.organizer_id IS NOT NULL
    AND public.is_verified_organizer(events.organizer_id)
  )
);

-- ==================================================================
-- ORGANIZERS
-- ==================================================================
DROP POLICY IF EXISTS "Public read organizers" ON public.organizers;
CREATE POLICY "Public read organizers"
ON public.organizers
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users manage own organizer" ON public.organizers;
CREATE POLICY "Users manage own organizer"
ON public.organizers
FOR ALL
USING (
  public.is_admin() OR auth.uid() = organizers.user_id
)
WITH CHECK (
  public.is_admin() OR auth.uid() = organizers.user_id
);

-- ==================================================================
-- USERS
-- ==================================================================
DROP POLICY IF EXISTS "Public read users" ON public.users;
CREATE POLICY "Public read users"
ON public.users
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users manage themselves" ON public.users;
CREATE POLICY "Users manage themselves"
ON public.users
FOR UPDATE
USING (
  public.is_admin() OR auth.uid() = users.id
)
WITH CHECK (
  public.is_admin() OR auth.uid() = users.id
);

DROP POLICY IF EXISTS "Users delete themselves" ON public.users;
CREATE POLICY "Users delete themselves"
ON public.users
FOR DELETE
USING (
  public.is_admin() OR auth.uid() = users.id
);

-- ==================================================================
-- INDEXES (exécuté une fois)
-- ==================================================================
CREATE INDEX IF NOT EXISTS idx_events_start_at_btree ON public.events USING BTREE (start_at);
CREATE INDEX IF NOT EXISTS idx_events_category_btree ON public.events USING BTREE (category);
CREATE INDEX IF NOT EXISTS idx_venues_lat_lon_gist ON public.venues USING GIST (POINT(lon, lat));

COMMIT;
