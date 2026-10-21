# CSP migration and safe rollout

## Current rollout status

- Production remains on the existing enforced policy in `worker.js`.
- A stricter candidate policy is sent only as `Content-Security-Policy-Report-Only`.
- Do not remove `'unsafe-inline'` from the enforced policy until the browser matrix below passes.
- The candidate intentionally reports inline scripts, inline style blocks/attributes, external images/media, and connections outside the known Supabase and Turnstile origins. These reports are expected during inventory; do not automatically allow every reported source.

## Safe rollout sequence

1. Preserve a known-good commit and inspect GitHub Actions before each release.
2. Deploy the Report-Only candidate to a preview Worker first. Never promote the preview automatically.
3. Open each page below in Chrome/Edge DevTools, clear Console, hard reload, then repeat all interactions. Record the exact directive, URL, action, and whether the source is legitimate.
4. Fix first-party inline JavaScript by moving it to external files and replacing inline event handlers with addEventListener. Preserve script order and any required global variables. Do not change business logic during extraction.
5. Move inline CSS and `style="..."` attributes to stylesheet classes in small batches. Check responsive layouts after each batch.
6. Inventory all external scripts, fonts, images, frames, media and API connections. Prefer self-hosted, version-pinned dependencies and optimized local WebP images. Allow external origins only when their use is verified.
7. Identify the exact analytics origin before removing the `*.onrender.com` exception from the enforced policy. Never guess the host.
8. Run automated checks and manual browser tests on preview. Confirm Supabase reads/auth, Bickri IA/OpenAI, optional Claude, Turnstile server verification, appointments, partner profiles, share/copy links and mobile navigation.
9. Only after zero unexplained violations and a successful preview, prepare a separate reviewed change to tighten the enforced CSP. Keep a rollback commit ready and check production immediately after deployment.
10. Remove the Report-Only policy only after the enforced policy has been stable and no longer needs observation.

## Browser matrix

Test on desktop Chrome/Edge and a narrow mobile viewport; where possible also test a real Android/iOS browser.

- Home: logo goes to `/`, desktop/mobile navigation, services, footer/legal links, images and fonts.
- Services: all cards, internal links, filters/actions, images and share/copy links.
- Partner directory: data load, logos, fallback logo, cards, profile links, social links and actions.
- Partner profiles: Egan BTP, Impact Afriq, SAS Entreprise, Sahelia Fresh, Tourisme au Niger, and generic profile; cover fallback, logo, About/Details/Activities, social links, share/copy, missing/empty data.
- Bickri IA: send/retry/new chat, API response/error states, history, no client-side API secrets; test OpenAI and test Claude only when a valid server-side secret is configured.
- Appointments/contact: required fields, autocomplete, telephone input, validation, accessible live error messages, valid submission and server errors.
- Turnstile: widget/script/frame loads, successful challenge, missing/invalid token rejected server-side, recovery from challenge errors.
- Offline page: actions work without inline handlers.
- Console/network: no unexplained CSP violations, failed JavaScript/CSS/font/image requests, CORS errors, 4xx/5xx API errors, or mixed-content warnings.

## CSP reporting notes

This initial implementation uses browser Console reports. No report collection endpoint is configured. Do not add a report endpoint without rate limiting, size limits, privacy review, and tests. Reports can include URLs and should be handled as potentially sensitive.

## Explicitly deferred until evidence exists

- Remove `style-src-attr 'unsafe-inline'` from the enforced policy only after inline styles are migrated.
- Replace the broad image/media origins only after all assets are inventoried and moved/approved.
- Replace the analytics wildcard only after the exact analytics endpoint is identified.
- Delete or align `vercel.json` only after checking both current production routing and repository verification workflows.
- Do not claim the Claude provider or visual profile redesign is browser-verified until real browser tests are completed.
