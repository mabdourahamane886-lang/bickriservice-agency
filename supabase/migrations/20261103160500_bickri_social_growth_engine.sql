-- Bickri Social Growth Engine: isolated partner social growth data.
-- Existing agency_partners, public profiles, cards and applications are intentionally untouched.
create table if not exists public.brand_social_preferences (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null unique references public.agency_partners(id) on delete cascade,
  selected_platforms text[] not null default '{}'::text[] check (selected_platforms <@ array['facebook','x','instagram','youtube','tiktok']::text[]),
  growth_goals text[] not null default array['visibility']::text[] check (growth_goals <@ array['visibility','engagement','audience','leads','sales']::text[]),
  target_audience jsonb not null default '{}'::jsonb check (jsonb_typeof(target_audience) = 'object'::text),
  timezone text not null default 'Africa/Niamey',
  weekly_post_target integer not null default 4 check (weekly_post_target between 0 and 50),
  approval_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.brand_social_accounts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.agency_partners(id) on delete cascade,
  platform text not null check (platform in ('facebook','x','instagram','youtube','tiktok')),
  platform_account_id text not null,
  account_name text not null,
  account_type text,
  scopes text[] not null default '{}'::text[],
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  connection_status text not null default 'connected' check (connection_status in ('connected','expired','revoked','error')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'::text),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, platform, platform_account_id)
);
create index if not exists brand_social_accounts_partner_platform_idx on public.brand_social_accounts (partner_id, platform, connection_status);
create table if not exists public.brand_social_oauth_states (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.agency_partners(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('facebook','x','instagram','youtube','tiktok')),
  state_hash text not null unique,
  code_verifier text,
  redirect_uri text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists brand_social_oauth_states_expiry_idx on public.brand_social_oauth_states (expires_at);
create table if not exists public.brand_social_content (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.agency_partners(id) on delete cascade,
  platform text not null check (platform in ('facebook','x','instagram','youtube','tiktok')),
  title text,
  caption text not null default '',
  content_type text not null default 'post' check (content_type in ('post','reel','story','short','video','thread','carousel')),
  media_urls jsonb not null default '[]'::jsonb check (jsonb_typeof(media_urls) = 'array'::text),
  hashtags text[] not null default '{}'::text[],
  status text not null default 'draft' check (status in ('draft','scheduled','publishing','published','failed','cancelled')),
  scheduled_at timestamptz,
  published_at timestamptz,
  external_post_id text,
  created_by uuid references auth.users(id) on delete set null,
  error_code text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'::text),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists brand_social_content_partner_schedule_idx on public.brand_social_content (partner_id, scheduled_at desc);
create index if not exists brand_social_content_status_schedule_idx on public.brand_social_content (status, scheduled_at) where status = 'scheduled';
create table if not exists public.brand_social_metrics (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.agency_partners(id) on delete cascade,
  social_account_id uuid not null references public.brand_social_accounts(id) on delete cascade,
  metric_date date not null,
  followers_count bigint check (followers_count is null or followers_count >= 0),
  impressions bigint check (impressions is null or impressions >= 0),
  reach bigint check (reach is null or reach >= 0),
  engagements bigint check (engagements is null or engagements >= 0),
  video_views bigint check (video_views is null or video_views >= 0),
  profile_visits bigint check (profile_visits is null or profile_visits >= 0),
  clicks bigint check (clicks is null or clicks >= 0),
  conversions bigint check (conversions is null or conversions >= 0),
  source_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(source_payload) = 'object'::text),
  created_at timestamptz not null default now(),
  unique (social_account_id, metric_date)
);
create index if not exists brand_social_metrics_partner_date_idx on public.brand_social_metrics (partner_id, metric_date desc);
create table if not exists public.brand_social_recommendations (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.agency_partners(id) on delete cascade,
  platform text check (platform is null or platform in ('facebook','x','instagram','youtube','tiktok')),
  category text not null check (category in ('content','timing','audience','engagement','conversion','profile')),
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  title text not null,
  body text not null,
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'::text),
  status text not null default 'open' check (status in ('open','accepted','dismissed','completed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists brand_social_recommendations_partner_status_idx on public.brand_social_recommendations (partner_id, status, created_at desc);
create table if not exists public.brand_social_audit_logs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.agency_partners(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  platform text check (platform is null or platform in ('facebook','x','instagram','youtube','tiktok')),
  action text not null,
  outcome text not null check (outcome in ('success','failure','blocked')),
  error_code text,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'::text),
  created_at timestamptz not null default now()
);
create index if not exists brand_social_audit_logs_partner_created_idx on public.brand_social_audit_logs (partner_id, created_at desc);
do $$
declare t text;
begin
  foreach t in array array[
    'brand_social_preferences','brand_social_accounts','brand_social_oauth_states',
    'brand_social_content','brand_social_metrics','brand_social_recommendations','brand_social_audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;
