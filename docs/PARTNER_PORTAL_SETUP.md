# Bickri Service Agency — Partner portal setup

This release adds a partner directory, public profiles, application tracking, partner dashboards, referral links, click analytics, partner administration and an admin audit trail.

## Required GitHub Actions secrets

Configure these in **Repository → Settings → Secrets and variables → Actions**.

- `CLOUDFLARE_API_TOKEN`: account-scoped token for the correct Cloudflare account. Grant **Workers Scripts: Edit / Workers Scripts Write** for the account hosting the `bickriservice-agency` Worker and its assets. Do not paste the token into source files.
- `SUPABASE_SERVICE_ROLE_KEY`: the private Supabase `service_role` API key (the legacy JWT-style service-role key expected by the current Worker code). Never use the publishable/anon key here, and never commit the value to Git.

The Cloudflare deploy workflow copies `SUPABASE_SERVICE_ROLE_KEY` from the GitHub secret into the Worker secret store, then deploys the Worker and static assets. The Worker code depends on that secret for the private application store, admin authorization, referral analytics and member dashboards. If it is missing, routes such as `/api/partners` return a controlled configuration error and private routes return `PARTNER_AUTH_UNCONFIGURED`.

`CLOUDFLARE_ACCOUNT_ID` may be set as a repository Actions variable. If omitted, the workflow uses the account ID currently configured for this project.

## Supabase

Migrations in `supabase/migrations/` create the application, public-profile metadata, click tracking and private admin audit tables. These have already been applied to the linked project. The private applications, click events and audit log have Row Level Security enabled and are restricted to the Worker service role.

The public directory reads only active partner records. Admin authentication is checked against `public.profiles.role = 'admin'` (or the existing `public.bickri_admin_users` allow-list). Use an existing, authorized administrator account; partner users must not be given the admin role.

## Email delivery

The application is saved to Supabase before Bickri Mail is attempted, so an email delivery error should no longer discard a candidate's submission. The response includes an application code and an `emailStatus` field. Configure and verify Cloudflare Email Service for the sender address `partenaires@bickriservice-agency.org`, with destination `bickriserviceagency@gmail.com`. Check the Cloudflare Email Service logs if notifications remain marked `failed`.

## Routes

- `/partenaires/`: searchable partner directory, filters, public profiles, QR codes, sharing, application form and application status lookup.
- `/partenaires/profil/?slug=<slug>`: shareable public profile with social metadata and referral attribution.
- `/partenaires/espace/`: partner sign-in, applications, profile editing, QR/referral link and click statistics.
- `/partenaires/admin/`: admin-only application review, adding/managing partners, badge management, suspension/reactivation, and audit history.

The admin APIs re-check the administrator's role server-side; hiding the admin link in the public directory is only a UI choice, not an access-control mechanism.
