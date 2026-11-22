-- Espace client Bickri Service Agency — tables isolées et privées.
-- Aucune modification des tables, services, couleurs ou pages existants.
create extension if not exists pgcrypto;

create table if not exists public.agency_client_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('devis', 'rendezvous')),
  full_name text not null check (char_length(full_name) between 2 and 120),
  company text not null default '' check (char_length(company) <= 150),
  phone text not null default '' check (char_length(phone) <= 40),
  service_slug text not null check (char_length(service_slug) between 2 and 100),
  budget text not null default '' check (char_length(budget) <= 100),
  description text not null check (char_length(description) between 10 and 5000),
  preferred_at timestamptz,
  payment_preference text not null default '' check (char_length(payment_preference) <= 50),
  status text not null default 'new' check (status in ('new','reviewing','quoted','in_progress','completed','cancelled')),
  quote_amount_xof bigint check (quote_amount_xof is null or quote_amount_xof between 0 and 1000000000),
  admin_message text not null default '' check (char_length(admin_message) <= 2500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agency_client_requests_user_idx on public.agency_client_requests(user_id, created_at desc);
create index if not exists agency_client_requests_admin_idx on public.agency_client_requests(status, created_at desc);

create table if not exists public.agency_client_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid references public.agency_client_requests(id) on delete cascade,
  title text not null check (char_length(title) <= 150),
  message text not null check (char_length(message) <= 1000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists agency_client_notifications_user_idx on public.agency_client_notifications(user_id, created_at desc);
alter table public.agency_client_requests enable row level security;
alter table public.agency_client_notifications enable row level security;
-- Accès exclusivement via le Worker authentifié : un jeton client ne peut
-- ni modifier un statut, ni lire les demandes d'autres clients en direct.
revoke all on public.agency_client_requests from anon, authenticated;
revoke all on public.agency_client_notifications from anon, authenticated;
grant all on public.agency_client_requests to service_role;
grant all on public.agency_client_notifications to service_role;
