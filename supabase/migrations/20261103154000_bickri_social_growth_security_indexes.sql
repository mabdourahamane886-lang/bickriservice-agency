-- Explicit service-role-only RLS policies and indexes for Social Growth.
-- No browser role receives table privileges; the Worker uses the private service-role key.
do $$
declare t text;
begin
  foreach t in array array[
    'brand_social_preferences','brand_social_accounts','brand_social_oauth_states',
    'brand_social_content','brand_social_metrics','brand_social_recommendations','brand_social_audit_logs'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_service_role_only', t);
    execute format(
      'create policy %I on public.%I for all to service_role using (true) with check (true)',
      t || '_service_role_only', t
    );
  end loop;
end $$;

create index if not exists brand_social_oauth_states_user_id_idx
  on public.brand_social_oauth_states (user_id);
create index if not exists brand_social_audit_logs_user_id_idx
  on public.brand_social_audit_logs (user_id);
create index if not exists brand_social_content_created_by_idx
  on public.brand_social_content (created_by) where created_by is not null;
