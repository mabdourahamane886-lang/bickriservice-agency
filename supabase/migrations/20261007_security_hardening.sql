-- Bickri Service Agency security hardening
-- Public clients must not be able to read internal configuration/AI knowledge
-- or write leads directly through the Supabase REST API.

revoke all on table public.agency_settings from anon, authenticated;
drop policy if exists agency_settings_public_read on public.agency_settings;

revoke all on table public.bickri_ai_knowledge from anon, authenticated;
drop policy if exists bickri_ai_knowledge_public_read on public.bickri_ai_knowledge;

-- Lead creation is handled by trusted server-side flows protected by anti-abuse controls.
-- Do not expose a direct anonymous INSERT surface through PostgREST.
revoke insert on table public.agency_leads from anon, authenticated;
drop policy if exists agency_leads_public_insert on public.agency_leads;

-- Defensive input bounds for records written by trusted server-side code.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'agency_leads_full_name_len') then
    alter table public.agency_leads add constraint agency_leads_full_name_len check (char_length(full_name) between 1 and 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agency_leads_phone_len') then
    alter table public.agency_leads add constraint agency_leads_phone_len check (phone is null or char_length(phone) <= 40);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agency_leads_email_len') then
    alter table public.agency_leads add constraint agency_leads_email_len check (email is null or char_length(email) <= 254);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agency_leads_company_len') then
    alter table public.agency_leads add constraint agency_leads_company_len check (company is null or char_length(company) <= 160);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agency_leads_service_len') then
    alter table public.agency_leads add constraint agency_leads_service_len check (service_slug is null or char_length(service_slug) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agency_leads_budget_len') then
    alter table public.agency_leads add constraint agency_leads_budget_len check (budget is null or char_length(budget) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agency_leads_message_len') then
    alter table public.agency_leads add constraint agency_leads_message_len check (char_length(message) between 5 and 5000);
  end if;
end $$;
