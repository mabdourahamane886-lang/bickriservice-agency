-- Security hardening for shared profiles table.
-- Prevent users from setting their own role/account_code and remove anonymous writes.
-- This project is shared by multiple Bickri apps: review all profile-edit flows before applying.

revoke insert, update, truncate on table public.profiles from anon;
revoke insert, update, truncate on table public.profiles from authenticated;

-- Clear column-level grants too; table-level REVOKE alone does not remove those grants.
revoke insert (id, email, full_name, avatar_url, provider, created_at, updated_at, role, account_code, phone, learning_path)
  on table public.profiles from anon, authenticated;
revoke update (id, email, full_name, avatar_url, provider, created_at, updated_at, role, account_code, phone, learning_path)
  on table public.profiles from anon, authenticated;

-- Users can create their own basic profile; role and account_code retain database defaults.
grant insert (id, email, full_name, avatar_url, provider, phone, learning_path)
  on table public.profiles to authenticated;

-- Users can edit only ordinary profile fields, never role, account_code, identity or timestamps.
grant update (full_name, avatar_url, phone, learning_path)
  on table public.profiles to authenticated;
