alter table public.agency_partners
  add column if not exists company_about text;

alter table public.agency_partner_applications
  add column if not exists public_about text;

alter table public.agency_partners
  drop constraint if exists agency_partners_company_about_length;
alter table public.agency_partners
  add constraint agency_partners_company_about_length
  check (company_about is null or char_length(company_about) <= 5000);

alter table public.agency_partner_applications
  drop constraint if exists agency_partner_applications_public_about_length;
alter table public.agency_partner_applications
  add constraint agency_partner_applications_public_about_length
  check (public_about is null or char_length(public_about) <= 5000);

comment on column public.agency_partners.company_about is 'Présentation détaillée publique de l’organisation, limitée à 5000 caractères.';
comment on column public.agency_partner_applications.public_about is 'Présentation détaillée proposée pour le profil public, limitée à 5000 caractères.';
