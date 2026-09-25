-- Bickri Service Agency: shareable publication URLs
alter table public.publications
  add column if not exists title text,
  add column if not exists slug text,
  add column if not exists excerpt text,
  add column if not exists content text,
  add column if not exists image_url text,
  add column if not exists video_url text,
  add column if not exists price numeric(12,2),
  add column if not exists currency text not null default 'XOF',
  add column if not exists category text,
  add column if not exists cta_label text,
  add column if not exists cta_url text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists publications_slug_unique_idx
  on public.publications(slug) where slug is not null;

create index if not exists publications_public_slug_idx
  on public.publications(slug) where status = 'published';

alter table public.publications enable row level security;

drop policy if exists "Public can read published publications" on public.publications;
create policy "Public can read published publications"
on public.publications for select to anon, authenticated
using (status = 'published');

drop policy if exists "Admins can read all publications" on public.publications;
create policy "Admins can read all publications"
on public.publications for select to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "Admins can insert publications" on public.publications;
create policy "Admins can insert publications"
on public.publications for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "Admins can update publications" on public.publications;
create policy "Admins can update publications"
on public.publications for update to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "Admins can delete publications" on public.publications;
create policy "Admins can delete publications"
on public.publications for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create or replace function public.touch_publications_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists publications_touch_updated_at on public.publications;
create trigger publications_touch_updated_at before update on public.publications
for each row execute function public.touch_publications_updated_at();
