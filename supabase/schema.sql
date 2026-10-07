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
  reference_code text unique, share_url text, og_title text, og_description text, og_image text,\n  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
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
revoke all on table public.agency_settings from anon, authenticated;

drop policy if exists agency_services_public_read on public.agency_services;
create policy agency_services_public_read on public.agency_services for select to anon, authenticated using (active = true);
drop policy if exists agency_projects_public_read on public.agency_projects;
create policy agency_projects_public_read on public.agency_projects for select to anon, authenticated using (active = true);
drop policy if exists agency_faqs_public_read on public.agency_faqs;
create policy agency_faqs_public_read on public.agency_faqs for select to anon, authenticated using (active = true);
drop policy if exists agency_testimonials_public_read on public.agency_testimonials;
create policy agency_testimonials_public_read on public.agency_testimonials for select to anon, authenticated using (active = true);

revoke all on public.agency_settings from anon, authenticated;
grant select on public.agency_services, public.agency_projects, public.agency_faqs, public.agency_testimonials to anon, authenticated;
grant insert on public.agency_leads to anon, authenticated;


-- Bickri AI persistent knowledge/memory
create table if not exists public.bickri_ai_knowledge (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'general',
  title text not null,
  content text not null,
  keywords text[] not null default '{}',
  priority int not null default 50,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bickri_ai_memory (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  memory_key text not null,
  memory_value text not null,
  source text not null default 'conversation',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, memory_key)
);

create table if not exists public.bickri_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.bickri_ai_knowledge enable row level security;
alter table public.bickri_ai_memory enable row level security;
alter table public.bickri_ai_conversations enable row level security;

drop policy if exists bickri_ai_knowledge_public_read on public.bickri_ai_knowledge;
revoke all on public.bickri_ai_knowledge from anon, authenticated;
