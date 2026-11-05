-- Cover the partner foreign key used by OAuth state cleanup and isolation.
create index if not exists brand_social_oauth_states_partner_id_idx
  on public.brand_social_oauth_states (partner_id);
