CREATE TABLE public.ludo_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_id text NOT NULL,
  status text NOT NULL DEFAULT 'lobby',
  seats jsonb NOT NULL DEFAULT '[]'::jsonb,
  state jsonb,
  rev integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.ludo_rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ludo_rooms TO authenticated;
GRANT ALL ON public.ludo_rooms TO service_role;

ALTER TABLE public.ludo_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read rooms" ON public.ludo_rooms FOR SELECT USING (true);
CREATE POLICY "anyone can create rooms" ON public.ludo_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update rooms" ON public.ludo_rooms FOR UPDATE USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_ludo_rooms()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER ludo_rooms_touch BEFORE UPDATE ON public.ludo_rooms
FOR EACH ROW EXECUTE FUNCTION public.touch_ludo_rooms();

ALTER TABLE public.ludo_rooms REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ludo_rooms;