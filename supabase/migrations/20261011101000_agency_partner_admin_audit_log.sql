-- Private audit history for partner administration actions.
create table if not exists public.agency_partner_admin_events (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in (
    'application_under_review','application_approved','application_rejected',
    'partner_created','partner_suspended','partner_activated','partner_badge_updated'
  )),
  application_id uuid references public.agency_partner_applications(id) on delete set null,
  partner_id uuid references public.agency_partners(id) on delete set null,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details)='object'),
  created_at timestamptz not null default now()
);
create index if not exists agency_partner_admin_events_created_idx
  on public.agency_partner_admin_events(created_at desc);
create index if not exists agency_partner_admin_events_partner_idx
  on public.agency_partner_admin_events(partner_id, created_at desc);
alter table public.agency_partner_admin_events enable row level security;
revoke all on table public.agency_partner_admin_events from anon, authenticated;
grant all on table public.agency_partner_admin_events to service_role;
