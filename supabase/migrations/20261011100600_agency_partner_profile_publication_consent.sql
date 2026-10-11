-- Record the applicant's explicit consent before publishing company/profile information.
alter table public.agency_partner_applications
  add column if not exists public_profile_consent boolean not null default false,
  add column if not exists public_profile_consented_at timestamptz;
