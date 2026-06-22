-- 0002_rls.sql — Row Level Security (spec §3, §14)
--
-- App single-user. Il client Expo usa la `anon key` + auth dell'utente (ruolo
-- `authenticated`) e può accedere SOLO alle proprie righe (user_id = auth.uid()).
--
-- La colonna `user_id` (con default auth.uid()) è già definita in 0001_init.sql,
-- così le INSERT del client la popolano automaticamente con l'utente corrente.
--
-- service_role: in Supabase la service_role BYPASSA per default tutte le RLS
-- (BYPASSRLS). Le scritture di pipeline (dispatch / generate / worker) usano la
-- service role lato server e quindi non sono vincolate da queste policy. Non
-- serve — e non va fatto — creare policy permissive per service_role.

-- ============================================================================
-- buckets
-- ============================================================================
alter table buckets enable row level security;
-- Difesa in profondità: forza la RLS anche per il proprietario della tabella.
alter table buckets force row level security;

create policy "buckets_select_own" on buckets
  for select to authenticated
  using (user_id = auth.uid());

create policy "buckets_insert_own" on buckets
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "buckets_update_own" on buckets
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "buckets_delete_own" on buckets
  for delete to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- items
-- ============================================================================
alter table items enable row level security;
alter table items force row level security;

create policy "items_select_own" on items
  for select to authenticated
  using (user_id = auth.uid());

create policy "items_insert_own" on items
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "items_update_own" on items
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "items_delete_own" on items
  for delete to authenticated
  using (user_id = auth.uid());
