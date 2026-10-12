# Bickri Service Agency — Security and Rust Hardening Audit

Date: 2026-10-12
Base branch: `main`
Working branch: `security/rust-hardening-audit`

## Scope and non-regression rules

This is an initial, read-only audit record. No production code, UI, service catalog, database, secrets, or deployment configuration has been changed by this audit. All remediation must preserve existing user-facing behavior and be reviewed before production deployment.

## Confirmed observations

1. `vercel.json` already configures several HTTP security headers: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, HSTS, `Permissions-Policy`, CSP, COOP and CORP.
2. The CSP currently permits inline scripts and styles (`'unsafe-inline'`). This may be needed by existing pages; do not remove it until all routes and third-party integrations have been tested.
3. `api/service.js` renders HTML for short service links and uses an escaping helper for text/attribute values. It reads service metadata from `services-share.json` and exposes a Supabase publishable key constant. Publishable keys are not service-role secrets, but database permissions/RLS must be verified separately.
4. `package.json` currently contains project metadata and `"type": "module"`, but no scripts or dependency declarations in the fetched file.
5. The inspected `api/service.js` uses CommonJS constructs (`require` and `module.exports`) while the package declares `"type": "module"`. This is a potential Node.js module-format incompatibility and must be checked against actual Vercel runtime/build logs before changing anything.
6. `.gitignore` excludes `.env`, `.env.*` (except `.env.example`), development vars and common generated folders.

## Priority checks before remediation

- Obtain the full repository tree and identify every page, API endpoint, build/runtime entry point and dependency manifest.
- Confirm the production deployment's actual source repository and latest deployed commit.
- Check Vercel build/runtime logs for the short-link API and confirm `/s/:code` behavior before and after any change.
- Audit every API route for method checks, input length/format validation, rate limits, safe error handling and appropriate cache/security headers.
- Verify Supabase Row Level Security policies and least-privilege access. Never place a service-role key in browser code or public repository files.
- Verify admin authorization on the server; do not rely on hidden UI controls.
- Add automated regression tests for the existing service catalog, share URLs, metadata previews, contact flows, authentication and AI integration before remediation.
- Review dependencies and secret-scanning results without printing secret values.

## Rust integration principle

Do not rewrite the existing application in Rust. First establish a stable baseline. If the audit identifies a component that benefits from Rust, add it as an isolated service behind an explicit API contract, with resource limits, authentication, timeouts and rollback capability. Rust does not replace application-level authorization, database policies, or sandboxing.

## Exit criteria

- Existing pages and all service links behave as before.
- Tests and production-like build pass.
- Security changes are reviewed and reversible.
- No production deployment occurs until validation is complete.
