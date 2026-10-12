-- Apply only after the server-side application version is deployed and verified.
-- Remove broad policies and direct table privileges only from this app's tables.
-- The XML NFSe tables, policies, functions, indexes and grants are intentionally untouched.
do $block$
declare
  v_table text;
  v_policy record;
begin
  foreach v_table in array array[
    'promocoes', 'entregas', 'configuracoes', 'admin_config',
    'admin_usuarios', 'admin_logs', 'uploads', 'visitas_log',
    'admin_sessions', 'admin_rate_limits', 'admin_import_jobs',
    'admin_import_batches'
  ] loop
    execute format('alter table public.%I enable row level security', v_table);

    for v_policy in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = v_table
    loop
      execute format('drop policy %I on public.%I', v_policy.policyname, v_table);
    end loop;

    execute format('revoke all on table public.%I from public, anon, authenticated', v_table);
    execute format('grant all on table public.%I to service_role', v_table);
  end loop;
end
$block$;

-- Public API access is mediated by server routes using the service-role key.
-- Keep only known Central de Promoções routines in scope. Do not affect functions
-- that another product may add to the shared public schema later.
do $block$
declare
  v_function record;
begin
  for v_function in
    select
      format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) as signature,
      p.proname,
      p.prosecdef as security_definer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.proname = any (array[
        'check_admin_login',
        'check_admin_setup_required',
        'commit_admin_import',
        'consume_admin_rate_limit',
        'deletar_promocao',
        'get_datas_disponiveis',
        'get_admin_by_username',
        'get_elite_lookup',
        'get_elite_months',
        'get_periodos_distintos',
        'get_pracas_distintas',
        'get_promocao_por_slug',
        'get_promocao_stats',
        'get_promocoes',
        'get_public_ranking',
        'get_ranking_por_promocao',
        'get_ranking_por_turno',
        'limpar_dados_promocao',
        'limpar_entregas',
        'register_first_admin',
        'reorder_promocoes_atomic',
        'stage_admin_import_batch',
        'upsert_entregas_batch',
        'update_updated_at_column'
      ])
  loop
    execute format('revoke all on function %s from public, anon, authenticated', v_function.signature);
    execute format('grant execute on function %s to service_role', v_function.signature);

    if v_function.security_definer then
      execute format('alter function %s set search_path = pg_catalog, public', v_function.signature);
    end if;
  end loop;
end
$block$;
