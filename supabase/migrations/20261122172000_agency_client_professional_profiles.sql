-- Bickri Service Agency: separate, private client professional profiles.
-- No changes to the shared public.profiles table or other applications.
create table if not exists public.agency_client_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  professional_title text not null default '' check (char_length(professional_title) <= 140),
  company_name text not null default '' check (char_length(company_name) <= 160),
  country text not null default 'Niger' check (char_length(country) <= 100),
  biography text not null default '' check (char_length(biography) <= 1200),
  avatar_path text check (avatar_path is null or (
    char_length(avatar_path) <= 220
    and split_part(avatar_path,'/',1) = user_id::text
    and avatar_path ~ ('^' || user_id::text || '/avatar-[0-9]{10,15}[.](jpg|jpeg|png|webp)$')
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.agency_client_profiles enable row level security;
grant select, insert, update on public.agency_client_profiles to authenticated;
revoke all on public.agency_client_profiles from anon;
drop policy if exists "client_profile_read_self" on public.agency_client_profiles;
create policy "client_profile_read_self" on public.agency_client_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "client_profile_create_self" on public.agency_client_profiles;
create policy "client_profile_create_self" on public.agency_client_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "client_profile_update_self" on public.agency_client_profiles;
create policy "client_profile_update_self" on public.agency_client_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- Only private avatar media; stored paths are scoped by the authenticated user ID.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('agency-client-avatars','agency-client-avatars',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=2097152,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "agency_client_avatar_read" on storage.objects;
create policy "agency_client_avatar_read" on storage.objects for select to authenticated
  using (bucket_id='agency-client-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "agency_client_avatar_insert" on storage.objects;
create policy "agency_client_avatar_insert" on storage.objects for insert to authenticated
  with check (bucket_id='agency-client-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "agency_client_avatar_delete" on storage.objects;
create policy "agency_client_avatar_delete" on storage.objects for delete to authenticated
  using (bucket_id='agency-client-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
