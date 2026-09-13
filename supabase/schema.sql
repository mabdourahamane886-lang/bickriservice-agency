-- Bickri Service Agency platform schema
-- Production project: okdohokhlkxrmxpevees

create extension if not exists pgcrypto;

create table if not exists public.agency_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.agency_services (
  id uuid primary key default gen_random_uuid(), slug text not null unique,
  name text not null, category text not null, short_description text not null,
  description text not null, icon text, image_url text,
  features jsonb not null default '[]'::jsonb,
  process_steps jsonb not null default '[]'::jsonb,
  price_note text, cta_label text default 'Demander un devis', whatsapp_message text,
  sort_order int not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.agency_projects (
  id uuid primary key default gen_random_uuid(), slug text not null unique,
  name text not null, category text not null, short_description text not null,
  description text not null, image_url text,
  technologies jsonb not null default '[]'::jsonb, results jsonb not null default '[]'::jsonb,
  link_url text, sort_order int not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.agency_faqs (
  id uuid primary key default gen_random_uuid(), question text not null, answer text not null,
  sort_order int not null default 0, active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.agency_testimonials (
  id uuid primary key default gen_random_uuid(), name text not null, role text,
  quote text not null, avatar_url text, rating int not null default 5 check (rating between 1 and 5),
  active boolean not null default true, sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.agency_leads (
  id uuid primary key default gen_random_uuid(), full_name text not null, phone text,
  email text, company text, service_slug text, budget text, message text not null,
  source text default 'website',
  status text not null default 'new' check (status in ('new','contacted','qualified','won','lost')),
  created_at timestamptz not null default now()
);

create index if not exists agency_services_active_order_idx on public.agency_services(active, sort_order);
create index if not exists agency_projects_active_order_idx on public.agency_projects(active, sort_order);
create index if not exists agency_faqs_active_order_idx on public.agency_faqs(active, sort_order);
create index if not exists agency_testimonials_active_order_idx on public.agency_testimonials(active, sort_order);
create index if not exists agency_leads_created_idx on public.agency_leads(created_at desc);

alter table public.agency_settings enable row level security;
alter table public.agency_services enable row level security;
alter table public.agency_projects enable row level security;
alter table public.agency_faqs enable row level security;
alter table public.agency_testimonials enable row level security;
alter table public.agency_leads enable row level security;

drop policy if exists agency_settings_public_read on public.agency_settings;
create policy agency_settings_public_read on public.agency_settings for select to anon, authenticated using (true);
drop policy if exists agency_services_public_read on public.agency_services;
create policy agency_services_public_read on public.agency_services for select to anon, authenticated using (active = true);
drop policy if exists agency_projects_public_read on public.agency_projects;
create policy agency_projects_public_read on public.agency_projects for select to anon, authenticated using (active = true);
drop policy if exists agency_faqs_public_read on public.agency_faqs;
create policy agency_faqs_public_read on public.agency_faqs for select to anon, authenticated using (active = true);
drop policy if exists agency_testimonials_public_read on public.agency_testimonials;
create policy agency_testimonials_public_read on public.agency_testimonials for select to anon, authenticated using (active = true);
drop policy if exists agency_leads_public_insert on public.agency_leads;
create policy agency_leads_public_insert on public.agency_leads for insert to anon, authenticated with check (length(trim(message)) >= 5);

grant select on public.agency_settings, public.agency_services, public.agency_projects, public.agency_faqs, public.agency_testimonials to anon, authenticated;
grant insert on public.agency_leads to anon, authenticated;
