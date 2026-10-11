-- Public-facing fields for partner directory profiles.
-- Private application messages remain private and are never copied into the public partner page.
alter table public.agency_partner_applications
  add column if not exists logo_url text,
  add column if not exists public_description text,
  add column if not exists public_mission text;

alter table public.agency_partner_applications
  drop constraint if exists agency_partner_applications_public_description_length,
  add constraint agency_partner_applications_public_description_length
    check (public_description is null or char_length(public_description) <= 500),
  drop constraint if exists agency_partner_applications_public_mission_length,
  add constraint agency_partner_applications_public_mission_length
    check (public_mission is null or char_length(public_mission) <= 1500),
  drop constraint if exists agency_partner_applications_logo_url_length,
  add constraint agency_partner_applications_logo_url_length
    check (logo_url is null or char_length(logo_url) <= 500);
