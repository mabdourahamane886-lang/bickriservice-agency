# Production remediation — Bickri Service Agency

This change set is intentionally prepared on a review branch. It does not deploy to production and does not change Cloudflare zone settings or secrets.

## Applied in code
- Added an IP-based attempt limiter to `GET /api/partner/status` (8 attempts per 15 minutes per Worker isolate).
- The limiter uses the existing Worker helper and returns HTTP 429 with `Retry-After`.

## Important limitation
The in-memory limiter is isolate-local and is not a global distributed rate limiter. Before production release, add a Cloudflare Rate Limiting rule for:
- Host: `bickriservice-agency.org`
- Path: `/api/partner/status`
- Method: `GET`
- Suggested threshold: 8 requests per 15 minutes per source IP (adjust after observing legitimate traffic).
Do not rely on the in-memory limiter as the only abuse control.

## Required operator actions — credentials
These values cannot safely be generated or inferred by code. Add them as Worker secrets in the correct Cloudflare account/environment:
- `OPENAI_API_KEY` — valid API key for the configured OpenAI Responses API endpoint.
- `SUPABASE_SERVICE_ROLE_KEY` — service-role secret for the Supabase project already referenced by the Worker. Never expose it in browser code, Git, build logs, or `NEXT_PUBLIC_*` variables.

Keep `TURNSTILE_SECRET_KEY` as a Worker secret and verify that the public Turnstile site key matches the secret's widget and authorized hostnames. Never paste secret values into a pull request.

## Cloudflare production settings to verify/apply
- Set minimum TLS version to `1.2`.
- Enable `Always Use HTTPS`.
- Keep HSTS only after confirming every covered subdomain supports HTTPS. The Worker currently emits `Strict-Transport-Security: max-age=31536000; includeSubDomains`; do not enable preload without a separate domain/subdomain review.
- Add the `www` DNS record only after selecting and verifying the intended canonical target. Do not guess an origin IP or CNAME target.
- Confirm the Cloudflare SSL/TLS encryption mode is `Full (strict)` and the origin certificate is valid.

## Verification required before merge/deploy
1. Run the repository's actual build/test commands (the root `package.json` currently declares no scripts).
2. Test the partner status endpoint: valid request, invalid input, missing record, and repeated requests crossing the threshold.
3. Confirm partner submission, partner login/dashboard, admin review, partner directory, Bickri IA with real provider credentials, and Turnstile.
4. Inspect live response headers and redirect behavior on the canonical domain and all active subdomains.
5. Run Lighthouse/PageSpeed on mobile and desktop; record LCP, INP, CLS, accessibility, and SEO scores.
6. Check Supabase RLS/security advisors before changing database policies.

## Not changed
- No production deployment.
- No DNS record or Cloudflare zone setting changed.
- No Worker secret or Supabase key changed.
- No database schema or RLS policy changed.


## Additional audit corrections in this review branch
- Rewrote the audience, deliverable and purpose fields for all 37 service entries in `services-share.json` to remove the repeated generic descriptions.
- Added all 37 service detail URLs to `sitemap.xml` (67 unique URLs total after the addition).
- Updated the Cloudflare deployment workflow to load `OPENAI_API_KEY` from the GitHub Actions secret store when configured. If it is absent, the workflow emits a warning and Bickri IA continues to use its local fallback.
- The production Cloudflare zone currently reports SSL mode `Full`, not `Full (strict)`. Do not switch it until the Worker/custom-domain certificate and any origin path have been validated. The `www` DNS record is currently absent; do not create it without confirming the canonical host target.
