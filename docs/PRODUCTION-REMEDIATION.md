# Production remediation — Bickri Service Agency

Updated: 2026-11-07

## Corrections prepared in this pull request

- Added application-level attempt limiting to `GET /api/partner/status`: 8 attempts per 15 minutes per Worker isolate, returning HTTP 429 and `Retry-After`.
- Rewrote the audience, deliverable and purpose copy for all 37 service entries in `services-share.json`.
- Added all 37 service detail URLs to `sitemap.xml`; the sitemap contains 67 unique URLs.
- Added dependency-free `npm run check` validation for Worker syntax, service catalog fields, duplicate slugs/codes/copy, HTTPS image URLs and sitemap coverage.
- Added `.github/workflows/validate-pr.yml` to run the validation automatically on pull requests and pushes to this remediation branch.
- Updated the Cloudflare deployment workflow to load `OPENAI_API_KEY` from GitHub Actions secrets when configured. If absent, the workflow emits a warning and Bickri IA uses its local fallback.

## Cloudflare zone configuration already applied separately

These are live zone-level changes and are separate from this GitHub branch:

- `Always Use HTTPS`: enabled.
- Minimum TLS version: `1.2`.
- A Cloudflare zone rate-limiting ruleset was created for `GET /api/partner/status` on `bickriservice-agency.org`: 10 requests per 10 seconds per source IP and Cloudflare colo, with a 10-second block.
- The Cloudflare rate limit uses `ip.src` and `cf.colo.id`. Counters are evaluated per Cloudflare location; this is not one globally aggregated counter across all locations.
- Current SSL/TLS mode is `Full`, not `Full (strict)`. Do not change it until the certificate path and origin requirements are confirmed.
- The `www` DNS record is absent. Do not create it until the canonical hostname target is confirmed.

## Credentials still required

The following secrets were not available to inspect or create through the connected tools. Configure them directly in the correct Cloudflare Worker environment or GitHub Actions secrets as appropriate:

- `OPENAI_API_KEY`: valid key for the configured OpenAI API endpoint.
- `SUPABASE_SERVICE_ROLE_KEY`: service-role key for the Supabase project used by the Worker. Keep it server-side only.
- Verify that `TURNSTILE_SECRET_KEY` matches the public Turnstile site key and the authorized hostnames.

Never commit secret values, paste them into pull requests, expose them in browser code, or use `NEXT_PUBLIC_*` for private credentials.

## Verification still required before production release

1. Pull-request validation workflow: PASS (Node.js syntax check and 37-service/sitemap validation completed successfully on commit `7a4e5c8d6a146acb751c639d8aea3cd2e0b6f273`).
2. Resolve the current Vercel preview build quota failure (`build-rate-limit`) and obtain a fresh preview build. This is separate from the passing GitHub Actions validation.
3. Test partner application submission, status lookup (valid and invalid inputs), partner authentication/dashboard and admin review using authorized test accounts.
4. Verify Bickri IA with a valid provider key and confirm fallback behavior when the key is unavailable.
5. Verify Turnstile end-to-end.
6. Run Lighthouse/PageSpeed on mobile and desktop; record LCP, INP, CLS, accessibility and SEO results.
7. Verify redirects, response headers, canonical host and active subdomains.
8. Review Supabase RLS and database security before changing database policies.

## Release status

- This branch is open for review in PR #14 and has not been merged.
- No Worker production deployment has been initiated.
- The Cloudflare zone settings and rate-limit ruleset above are live configuration changes; they do not deploy the updated Worker code.
- The new validation workflow and catalog changes are not yet active on the production branch until merge.


## Latest automated checks
- `Validate Bickri Service Agency`: PASS.
- `Verify Bickri Service Agency`: PASS.
- `CodeQL Security Scan`: still running at the time of this update; do not treat it as passed until GitHub reports completion.
- Vercel preview checks: blocked by the project's `build-rate-limit` quota response.
