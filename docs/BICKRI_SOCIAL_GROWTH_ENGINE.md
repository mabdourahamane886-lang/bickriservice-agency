# BICKRI SOCIAL GROWTH ENGINE — Implementation notes

## Integration boundary
- Repository: mabdourahamane886-lang/bickriservice-agency
- Production runtime: Cloudflare Worker bickriservice-agency
- Partner ownership: agency_partners.owner_user_id
- Existing partner API: /api/partner/me
- Existing partner token is held in sessionStorage under bsa_partner_access_token.
- Existing partner cards, public profiles, badges, logos and application flows must remain unchanged.

## Platforms
Internal IDs: facebook, x, instagram, youtube, tiktok. Facebook and Instagram are separate user-facing connections even where they share Meta OAuth infrastructure.
All access and publishing use official provider APIs and explicit partner consent.

## Cloudflare Worker secrets required before live OAuth
Set these as Cloudflare Worker Secrets, never plaintext vars and never commit values:
- SOCIAL_TOKEN_ENCRYPTION_KEY (32-byte base64 AES-GCM key)
- META_APP_ID, META_APP_SECRET, META_GRAPH_API_VERSION
- X_CLIENT_ID, X_CLIENT_SECRET
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET
- SOCIAL_GROWTH_BASE_URL (canonical HTTPS origin, normally https://bickriservice-agency.org)

OAuth redirect URIs to register:
- https://bickriservice-agency.org/api/social-growth/oauth/callback/facebook
- https://bickriservice-agency.org/api/social-growth/oauth/callback/instagram
- https://bickriservice-agency.org/api/social-growth/oauth/callback/x
- https://bickriservice-agency.org/api/social-growth/oauth/callback/youtube
- https://bickriservice-agency.org/api/social-growth/oauth/callback/tiktok

Each provider app must be created, products/scopes enabled, and required reviews completed. Do not enable live publishing before approval.

## Database
Migration: supabase/migrations/20261103160500_bickri_social_growth_engine.sql
It adds only brand_social_* tables and does not alter partner tables. All social tables have RLS enabled and direct browser access revoked. The Cloudflare Worker authenticates the partner, resolves agency_partners.owner_user_id, then accesses rows with the existing private Supabase service-role secret.

## Delivery gates
1. UI preview may run without provider secrets; unconfigured providers show Configuration requise.
2. OAuth callback validates one-time state, redirect URI, expiry and provider identity.
3. Provider tokens are encrypted before persistence and never returned to the browser.
4. Initial OAuth asks only for identity/analytics scopes; add publishing scopes later through incremental consent after the publishing module is ready.
5. Publishing requires partner approval by default, uses provider APIs and records provider IDs/status.
6. Test RLS, partner isolation, CSRF/state, token encryption, OAuth errors, API quotas and mobile layout.
7. Production deployment waits for credentials, provider app approvals, migration verification and smoke tests.

## Provider constraints and references
- TikTok Content Posting API requires creator information and explicit consent; unaudited clients can be restricted to private posts: https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post
- YouTube Analytics requires OAuth and the yt-analytics.readonly scope: https://developers.google.com/youtube/analytics/reference/reports/query
- X OAuth 2.0 user context uses granular scopes including tweet.read, tweet.write, users.read and offline.access; access tiers and quotas affect endpoints.
- Meta Page and Instagram publishing require eligible professional accounts, app permissions and applicable review.

## Non-goals
- No fake followers, likes, comments, automated follows, scraping behind login, spam or engagement manipulation.
- No guaranteed reach, virality, follower counts or sales.
- No modification of existing partner cards, profiles, badges, logos or application flows.

## Publishing queue and automation (November 2026)
- Partners can schedule a post from the Social Growth workspace. Scheduling is an explicit approval action and records the approving user.
- Cloudflare Worker Cron runs every five minutes and atomically claims due queue rows before attempting delivery.
- The queue records published/failed state, provider post ID, timestamps and audit events. Provider/API failures are not silently retried; the partner can review the error and reschedule after fixing permissions or media.
- Text publishing is implemented for Facebook Pages and X; Instagram requires a public HTTPS image/video URL; TikTok requires a public video URL accepted by TikTok's PULL_FROM_URL rules; YouTube uses a resumable video upload from a public HTTPS video URL.
- OAuth now requests publishing scopes in addition to read scopes. Existing connected accounts must reconnect and grant the new permissions before publishing.
- YouTube uploads are public by default in this initial queue implementation. Partners must only schedule content they have rights to publish.
- Media URLs must be HTTPS, public and accessible to the provider. The server does not upload media files from the partner's device in this iteration.
- The scheduler needs the existing Supabase service role and token encryption secrets plus provider credentials. The Cloudflare Cron trigger is versioned in wrangler.jsonc.
- Provider app review, account eligibility, rate limits, media format constraints and domain verification remain controlled by each platform. A successful queue attempt is not a guarantee of reach or engagement.
