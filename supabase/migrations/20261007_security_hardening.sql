-- Bickri Service Agency security hardening
-- Public configuration/knowledge remain server-only.
revoke all on table public.agency_settings from anon, authenticated;
drop policy if exists agency_settings_public_read on public.agency_settings;

revoke all on table public.bickri_ai_knowledge from anon, authenticated;
drop policy if exists bickri_ai_knowledge_public_read on public.bickri_ai_knowledge;

-- Leads are not writable directly through public PostgREST.
revoke insert on table public.agency_leads from anon, authenticated;
drop policy if exists agency_leads_public_insert on public.agency_leads;

-- Defensive bounds on lead payloads.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'agency_leads_full_name_len') then
    alter table public.agency_leads add constraint agency_leads_full_name_len check (char_length(full_name) between 1 and 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agency_leads_message_len') then
    alter table public.agency_leads add constraint agency_leads_message_len check (char_length(message) between 5 and 5000);
  end if;
end $$;

-- Harden admin membership lookup without exposing a SECURITY DEFINER RPC.
alter table public.bickri_admin_users enable row level security;
drop policy if exists "bickri admin membership self read" on public.bickri_admin_users;
create policy "bickri admin membership self read"
  on public.bickri_admin_users
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.is_bickri_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $function$
  select exists(
    select 1 from public.bickri_admin_users
    where user_id = auth.uid()
  )
$function$;

revoke execute on function public.is_bickri_admin() from anon;
grant execute on function public.is_bickri_admin() to authenticated;
