-- Bickri Service Agency partner portal, applications and referral analytics.
-- Sensitive application/click data is available only to the Worker service role.
create table if not exists public.agency_partner_applications (
  id uuid primary key default gen_random_uuid(),
  application_code text not null unique default ('BPA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  company_name text not null check (char_length(btrim(company_name)) between 2 and 160),
  website_url text,
  country text not null default 'Niger',
  city text,
  category text,
  partner_type text not null check (partner_type in ('technical','referral','integrator','other')),
  social_links jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links) = 'object'),
  message text not null check (char_length(btrim(message)) between 10 and 5000),
  referral_code text,
  status text not null default 'pending' check (status in ('pending','under_review','approved','rejected')),
  email_status text not null default 'pending' check (email_status in ('pending','sent','failed','not_configured')),
  email_error_code text,
  reviewer_notes text,
  owner_user_id uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agency_partner_applications_status_created_idx
  on public.agency_partner_applications (status, created_at desc);
create index if not exists agency_partner_applications_email_lower_idx
  on public.agency_partner_applications (lower(email));
create index if not exists agency_partner_applications_referral_code_idx
  on public.agency_partner_applications (referral_code);

alter table public.agency_partners
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists website_url text,
  add column if not exists city text,
  add column if not exists category text,
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists public_id text,
  add column if not exists referral_code text,
  add column if not exists application_id uuid references public.agency_partner_applications(id) on delete set null;

update public.agency_partners
set public_id = 'BSP-' || upper(substr(replace(id::text, '-', ''), 1, 8))
where public_id is null;
update public.agency_partners
set referral_code = 'BSA-' || upper(substr(replace(id::text, '-', ''), 1, 8))
where referral_code is null;

create unique index if not exists agency_partners_public_id_uidx
  on public.agency_partners (public_id) where public_id is not null;
create unique index if not exists agency_partners_referral_code_uidx
  on public.agency_partners (referral_code) where referral_code is not null;
create unique index if not exists agency_partners_application_id_uidx
  on public.agency_partners (application_id) where application_id is not null;
create index if not exists agency_partners_owner_user_id_idx
  on public.agency_partners (owner_user_id) where owner_user_id is not null;

create table if not exists public.agency_partner_clicks (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.agency_partners(id) on delete set null,
  referral_code text,
  event_type text not null default 'profile_view'
    check (event_type in ('profile_view','share_click','website_click','contact_click','lead','sale')),
  source text,
  medium text,
  campaign text,
  landing_path text,
  created_at timestamptz not null default now()
);
create index if not exists agency_partner_clicks_partner_created_idx
  on public.agency_partner_clicks (partner_id, created_at desc);
create index if not exists agency_partner_clicks_referral_created_idx
  on public.agency_partner_clicks (referral_code, created_at desc);
create index if not exists agency_partner_clicks_created_idx
  on public.agency_partner_clicks (created_at desc);

alter table public.agency_partner_applications enable row level security;
alter table public.agency_partner_clicks enable row level security;
revoke all on table public.agency_partner_applications from anon, authenticated;
revoke all on table public.agency_partner_clicks from anon, authenticated;
grant all on table public.agency_partner_applications to service_role;
grant all on table public.agency_partner_clicks to service_role;
grant all on table public.agency_partners to service_role;
