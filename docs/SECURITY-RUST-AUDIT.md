# Bickri Service Agency — Security and Rust Hardening Audit

Date: 2026-10-12
Base branch: `main`
Working branch: `security/rust-hardening-audit`

## Scope and non-regression rules

This audit and its tests are isolated on a separate branch. No production deployment, database policy change, UI change, service catalog change, or existing endpoint implementation is included in this branch. The test suite is additive. Do not merge or deploy until the test suite and application build have been run against the full project checkout.

## Confirmed observations

1. `vercel.json` already configures `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, HSTS, `Permissions-Policy`, CSP, COOP and CORP.
2. The CSP permits inline scripts and styles (`'unsafe-inline'`). This may be required by current pages. Tightening it requires testing all pages and third-party integrations first.
3. `api/service.js` renders HTML for short service links. It escapes HTML text and attribute values, uses a static service catalog and returns 400/404/503 for missing/unknown/unavailable service cases.
4. `api/service.js` uses CommonJS (`require`, `module.exports`) while `package.json` declares `"type": "module"`. This is a potential runtime/module-format incompatibility and must be checked against actual Vercel runtime logs before a code change.
5. `package.json` had no scripts or dependency declarations in the fetched version. This branch adds a dependency-free Node test command only.
6. `services-share.json` contains 37 entries in the audited branch.
7. `supabase/schema.sql` enables RLS for agency tables and the Bickri AI tables. It grants public insert on `agency_leads`, but the inspected schema contains no explicit INSERT policy for that table; with RLS enabled, anonymous lead submissions may be denied unless a policy exists elsewhere. Verify against the live database before changing policy.
8. `agency_settings` has public privileges revoked. Public reads for active services, projects, FAQs and testimonials are scoped to active records.
9. The inspected schema enables RLS and revokes access to `bickri_ai_knowledge`; memory and conversation tables also have RLS enabled. No public policies were found for those AI tables in the inspected schema. This is fail-closed, but server-side AI routes and service-role use must be audited from the full repository.
10. The publishable Supabase key in `api/service.js` is not a service-role key by name. Publishable keys are designed for client use; protection depends on RLS, grants and database policies. Never expose a service-role/secret key.

## Live Supabase checks (read-only, 2026-10-12)

The connected Supabase project `okdohokhlkxrmxpevees` is active and shared by multiple Bickri applications. Read-only inspection of the live database and Supabase security advisor returned these findings:

1. **High priority — profile role self-escalation risk:** `public.profiles` has an authenticated policy allowing users to update their own row, and the `authenticated` role currently has table-level and column-level UPDATE privileges on `role`. The same role can also INSERT a profile row with the `role` column because it has broad INSERT privileges and the own-row INSERT policy checks only `id = auth.uid()`. No trigger on `profiles` was found that blocks a user changing `role`. This combination may allow an authenticated user to self-assign `admin`. Treat this as a high-priority privilege-escalation risk until verified and remediated.
2. A branch-only migration was added at `supabase/migrations/20261012170000_harden_profile_role_and_public_profile_grants.sql`. It removes broad profile INSERT/UPDATE/TRUNCATE grants and allows authenticated users to insert basic profile fields and update only `full_name`, `avatar_url`, `phone` and `learning_path`. **It has not been applied to the live database.** Because `profiles` is shared by several apps, test sign-up, profile editing, OAuth/social login and admin workflows before applying.
3. Supabase's security advisor reports RLS-enabled tables without policies: `agency_leads`, `agency_partner_admin_events`, `agency_partner_applications`, `agency_partner_clicks`, `agency_settings`, `bickri_ai_knowledge` and `impact_afriq_contact_messages`. No-policy RLS is default-deny, so this is not by itself evidence of public exposure; it may intentionally block direct client access. Confirm each table's intended server-side access before adding any policy.
4. Supabase Auth reports leaked-password protection is disabled. Enable it in Auth password security settings after assessing the effect on sign-up/password flows across all apps sharing this project.
5. The public/authenticated roles have broad table grants on several agency content tables, including mutation privileges, while the visible RLS policies only allow active-row SELECT. RLS should block those mutations, but excess grants (especially TRUNCATE) should be reduced after confirming no existing admin flow relies on direct client writes.
6. Supabase's performance advisor reports 87 foreign keys without covering indexes across the shared database. This is a broad performance backlog, not a reason to add indexes indiscriminately; prioritize hot tables and verify query plans.

Relevant Supabase guidance:
- RLS advisor: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- Leaked password protection: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Priority checks and remediation

- Obtain the full repository tree and identify all API routes, admin flows, dependency manifests, build entry points and runtime configuration.
- Confirm production's actual connected repository and deployed commit.
- Review every endpoint for method allowlists, schema validation, payload limits, rate limiting, safe error handling, authorization and cache controls.
- Verify live Supabase policies/privileges for leads, admin-managed data and Bickri AI memory/conversation data. Do not apply a migration based only on an incomplete schema view.
- Verify admin authorization on the server, not just hidden UI controls.
- Run the added tests with `npm run test:security`, then run the project's actual production build and manual smoke tests.
- Review dependency vulnerabilities and secret scanning without printing secret values.

## Rust decision

No Rust service is wired into production in this change. The visible short-link handler performs a small static catalog lookup and HTML rendering; there is no evidence yet of a CPU-bound workload or a security boundary that requires a separate Rust process. Introducing an unused Rust microservice would add deployment, monitoring and authentication complexity without an established benefit.

Revisit Rust for a concrete component such as a future isolated code-execution engine, high-throughput parser or measured CPU-bound service. If introduced, keep it behind an authenticated API contract with strict timeouts, resource limits, least privilege, network restrictions and rollback capability. Rust does not replace authorization, RLS or sandboxing.

## Test coverage and limitations

`tests/security.test.mjs` checks catalog integrity, HTTPS image URLs, presence of existing HTTP security headers, HTML escaping markers, RLS declarations in the checked-in schema and the short-link rewrite. These are static regression checks, not a penetration test and not proof of live database state or deployed runtime behavior.

## Exit criteria

- All 37 services and their share links continue to work.
- Existing pages, admin workflows, AI, contact and mobile layouts behave as before.
- Security tests and the actual production build pass.
- Live Supabase policies are verified and any required migrations are reviewed separately.
- Changes are reviewed and reversible; no production deploy before validation.
