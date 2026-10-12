-- Scope: Central de Promoções public schema only. Never alter xml_nfse.

create table if not exists public.admin_sessions (
  session_hash text primary key check (session_hash ~ '^[a-f0-9]{64}$'),
  username text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_sessions_active_username_idx
  on public.admin_sessions (username, expires_at)
  where revoked_at is null;

create table if not exists public.admin_rate_limits (
  fingerprint text primary key check (fingerprint ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null,
  attempts integer not null check (attempts > 0),
  updated_at timestamptz not null default now()
);

create index if not exists admin_rate_limits_updated_at_idx
  on public.admin_rate_limits (updated_at);

alter table public.admin_sessions enable row level security;
alter table public.admin_rate_limits enable row level security;
revoke all on table public.admin_sessions, public.admin_rate_limits from public, anon, authenticated;
grant all on table public.admin_sessions, public.admin_rate_limits to service_role;

create or replace function public.consume_admin_rate_limit(
  p_fingerprint text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_attempts integer;
begin
  delete from public.admin_rate_limits where updated_at < now() - interval '1 day';

  if p_fingerprint !~ '^[a-f0-9]{64}$'
     or p_limit < 1 or p_limit > 100
     or p_window_seconds < 1 or p_window_seconds > 3600 then
    return false;
  end if;

  insert into public.admin_rate_limits (fingerprint, window_started_at, attempts, updated_at)
  values (p_fingerprint, now(), 1, now())
  on conflict (fingerprint) do update
    set window_started_at = case
          when public.admin_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
            then now()
          else public.admin_rate_limits.window_started_at
        end,
        attempts = case
          when public.admin_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
            then 1
          else public.admin_rate_limits.attempts + 1
        end,
        updated_at = now()
  returning attempts into v_attempts;

  return v_attempts <= p_limit;
end;
$function$;

create or replace function public.get_public_ranking(
  p_promocao_id uuid,
  p_periodo text default null,
  p_busca text default null,
  p_limite integer default 20,
  p_offset integer default 0
)
returns table (
  posicao bigint,
  periodo text,
  pessoa_entregadora text,
  praca text,
  total_soma_taxas numeric,
  total_corridas_completadas numeric,
  total_corridas_aceitas numeric,
  total_pedidos_concluidos numeric,
  total_pontos numeric,
  total_registros bigint
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_metrica text;
  v_agrupamento text;
  v_tipo_calculo text;
begin
  if p_periodo is not null and p_periodo not in ('GERAL', 'CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA') then
    raise exception 'Período inválido.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.promocoes p
    where p.id = p_promocao_id
      and p.status in ('ativa', 'encerrada')
      and p.tipo = 'ranking_turno'
      and p.config_regras->'elite_internal' is distinct from 'true'::jsonb
  ) then
    return;
  end if;

  select
    coalesce(p.config_regras->'mecanica'->>'metrica', 'faturamento_taxas'),
    coalesce(p.config_regras->'mecanica'->>'agrupamento', 'turno'),
    coalesce(p.config_regras->'mecanica'->>'tipo_calculo', 'ranking')
  into v_metrica, v_agrupamento, v_tipo_calculo
  from public.promocoes p
  where p.id = p_promocao_id;

  return query
  with agregados as materialized (
    select
      case when v_agrupamento = 'turno' then e.periodo else 'GERAL' end as periodo,
      max(e.pessoa_entregadora) as pessoa_entregadora,
      max(e.praca) as praca,
      sum(e.soma_das_taxas_das_corridas_aceitas) as total_soma_taxas,
      sum(e.numero_de_corridas_completadas)::numeric as total_corridas_completadas,
      sum(e.numero_de_corridas_aceitas)::numeric as total_corridas_aceitas,
      sum(e.numero_de_pedidos_aceitos_e_concluidos)::numeric as total_pedidos_concluidos,
      coalesce(sum(e.pontos), 0)::numeric as total_pontos
    from public.entregas e
    where e.promocao_id = p_promocao_id
      and (p_periodo is null or p_periodo = 'GERAL' or e.periodo = p_periodo)
    group by case when v_agrupamento = 'turno' then e.periodo else 'GERAL' end,
             e.id_da_pessoa_entregadora
    having case
      when v_metrica = 'faturamento_taxas' then sum(e.soma_das_taxas_das_corridas_aceitas) > 0
      when v_metrica = 'pontos' then coalesce(sum(e.pontos), 0) > 0
      else sum(e.numero_de_corridas_completadas) > 0
    end
  ),
  ranqueados as materialized (
    select
      row_number() over (
        order by case
          when v_metrica = 'faturamento_taxas' then a.total_soma_taxas
          when v_metrica = 'pontos' then a.total_pontos
          else a.total_corridas_completadas
        end desc,
        a.total_soma_taxas desc,
        a.pessoa_entregadora asc
      ) as posicao,
      a.*
    from agregados a
  ),
  filtrados as materialized (
    select r.*
    from ranqueados r
    where coalesce(p_busca, '') = ''
       or strpos(lower(coalesce(r.pessoa_entregadora, '')), lower(p_busca)) > 0
  )
  select
    f.posicao,
    f.periodo,
    f.pessoa_entregadora,
    f.praca,
    f.total_soma_taxas,
    f.total_corridas_completadas,
    f.total_corridas_aceitas,
    f.total_pedidos_concluidos,
    f.total_pontos,
    count(*) over ()
  from filtrados f
  order by f.posicao
  limit least(greatest(coalesce(p_limite, 20), 1), 100)
  offset least(greatest(coalesce(p_offset, 0), 0), 100000);
end;
$function$;

create or replace function public.get_elite_months(p_promocao_id uuid)
returns table (month_key text)
language sql
security definer
set search_path = pg_catalog, public
as $function$
  select distinct to_char(date_trunc('month', e.data_do_periodo)::date, 'YYYY-MM') as month_key
  from public.entregas e
  where e.promocao_id = p_promocao_id
    and e.data_do_periodo is not null
    and exists (
      select 1 from public.promocoes p
      where p.id = p_promocao_id
        and p.config_regras->'elite_internal' = 'true'::jsonb
    )
  order by month_key desc;
$function$;

create or replace function public.get_elite_lookup(
  p_promocao_id uuid,
  p_data_inicio date,
  p_data_fim date,
  p_busca text,
  p_limite integer default 12
)
returns table (
  nome text,
  praca text,
  total_pedidos numeric
)
language sql
security definer
set search_path = pg_catalog, public
as $function$
  select
    coalesce(e.pessoa_entregadora, 'Entregador') as nome,
    coalesce(e.praca, 'Praça não informada') as praca,
    sum(coalesce(e.numero_de_pedidos_aceitos_e_concluidos, 0))::numeric as total_pedidos
  from public.entregas e
  where e.promocao_id = p_promocao_id
    and e.data_do_periodo >= p_data_inicio
    and e.data_do_periodo <= p_data_fim
    and exists (
      select 1 from public.promocoes p
      where p.id = p_promocao_id
        and p.config_regras->'elite_internal' = 'true'::jsonb
    )
    and strpos(lower(coalesce(e.pessoa_entregadora, '')), lower(p_busca)) > 0
  group by e.id_da_pessoa_entregadora, e.pessoa_entregadora, e.praca
  order by total_pedidos desc, nome asc
  limit least(greatest(coalesce(p_limite, 12), 1), 12);
$function$;

create or replace function public.reorder_promocoes_atomic(p_updates jsonb)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_expected integer;
  v_updated integer;
begin
  if jsonb_typeof(p_updates) <> 'array' or jsonb_array_length(p_updates) > 100 then
    raise exception 'Lista de reordenação inválida.' using errcode = '22023';
  end if;

  select count(*)::integer into v_expected
  from jsonb_to_recordset(p_updates) as row_data(id uuid, config_regras jsonb);

  if v_expected = 0 or (
    select count(distinct id)
    from jsonb_to_recordset(p_updates) as row_data(id uuid, config_regras jsonb)
  ) <> v_expected then
    raise exception 'Lista de reordenação vazia ou com IDs repetidos.' using errcode = '22023';
  end if;

  update public.promocoes p
  set config_regras = u.config_regras,
      updated_at = now()
  from jsonb_to_recordset(p_updates) as u(id uuid, config_regras jsonb)
  where p.id = u.id;

  get diagnostics v_updated = row_count;
  if v_updated <> v_expected then
    raise exception 'Uma ou mais campanhas não foram encontradas.' using errcode = 'P0002';
  end if;

  return v_updated;
end;
$function$;

create table if not exists public.admin_import_jobs (
  id uuid primary key,
  promocao_id uuid not null references public.promocoes(id) on delete cascade,
  arquivo_nome text not null,
  total_lotes integer not null check (total_lotes between 1 and 200),
  status text not null default 'recebendo' check (status in ('recebendo', 'concluida')),
  inseridos integer not null default 0,
  atualizados integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_import_jobs_created_at_idx
  on public.admin_import_jobs (created_at);

create table if not exists public.admin_import_batches (
  import_id uuid not null references public.admin_import_jobs(id) on delete cascade,
  batch_index integer not null check (batch_index between 1 and 200),
  registros jsonb not null check (jsonb_typeof(registros) = 'array'),
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{32}$'),
  created_at timestamptz not null default now(),
  primary key (import_id, batch_index)
);

alter table public.admin_import_jobs enable row level security;
alter table public.admin_import_batches enable row level security;
revoke all on table public.admin_import_jobs, public.admin_import_batches from public, anon, authenticated;
grant all on table public.admin_import_jobs, public.admin_import_batches to service_role;

create or replace function public.stage_admin_import_batch(
  p_import_id uuid,
  p_promocao_id uuid,
  p_batch_index integer,
  p_total_batches integer,
  p_arquivo_nome text,
  p_registros jsonb
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_job public.admin_import_jobs%rowtype;
  v_hash text;
  v_existing_hash text;
begin
  if p_import_id is null or p_promocao_id is null
     or p_batch_index is null or p_total_batches is null
     or p_batch_index < 1 or p_total_batches < 1 or p_total_batches > 200
     or p_batch_index > p_total_batches
     or p_arquivo_nome is null or length(p_arquivo_nome) < 1 or length(p_arquivo_nome) > 255
     or p_registros is null
     or jsonb_typeof(p_registros) <> 'array'
     or jsonb_array_length(p_registros) < 1 or jsonb_array_length(p_registros) > 500 then
    raise exception 'Lote de importação inválido.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.promocoes p where p.id = p_promocao_id) then
    raise exception 'Campanha não encontrada.' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_registros) as row_data(value)
    where jsonb_typeof(row_data.value) <> 'object'
       or row_data.value->>'promocao_id' is distinct from p_promocao_id::text
       or coalesce(row_data.value->>'data_do_periodo', '') !~ '^\d{4}-\d{2}-\d{2}$'
       or coalesce(row_data.value->>'periodo', '') not in ('GERAL', 'CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA')
       or coalesce(row_data.value->>'id_da_pessoa_entregadora', '') = ''
  ) then
    raise exception 'O lote contém linhas inválidas ou de outra campanha.' using errcode = '22023';
  end if;

  delete from public.admin_import_jobs where created_at < now() - interval '14 days';

  insert into public.admin_import_jobs (id, promocao_id, arquivo_nome, total_lotes)
  values (p_import_id, p_promocao_id, p_arquivo_nome, p_total_batches)
  on conflict (id) do nothing;

  select * into v_job
  from public.admin_import_jobs j
  where j.id = p_import_id
  for update;

  if v_job.promocao_id <> p_promocao_id
     or v_job.total_lotes <> p_total_batches
     or v_job.arquivo_nome <> p_arquivo_nome then
    raise exception 'O identificador já pertence a outra importação.' using errcode = '22023';
  end if;

  v_hash := md5(p_registros::text);
  insert into public.admin_import_batches (import_id, batch_index, registros, payload_hash)
  values (p_import_id, p_batch_index, p_registros, v_hash)
  on conflict (import_id, batch_index) do nothing;

  select b.payload_hash into v_existing_hash
  from public.admin_import_batches b
  where b.import_id = p_import_id and b.batch_index = p_batch_index;

  if v_existing_hash <> v_hash then
    raise exception 'O lote já foi recebido com conteúdo diferente.' using errcode = '22023';
  end if;

  update public.admin_import_jobs set updated_at = now() where id = p_import_id;
  return true;
end;
$function$;

create or replace function public.commit_admin_import(p_import_id uuid)
returns table (inseridos integer, atualizados integer)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_job public.admin_import_jobs%rowtype;
  v_batch record;
  v_inserted integer;
  v_updated integer;
  v_total_inserted integer := 0;
  v_total_updated integer := 0;
begin
  if p_import_id is null then
    raise exception 'Importação inválida.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_import_id::text, 0));
  select * into v_job from public.admin_import_jobs j where j.id = p_import_id for update;
  if not found then
    raise exception 'Importação não encontrada.' using errcode = 'P0002';
  end if;

  if v_job.status = 'concluida' then
    return query select v_job.inseridos, v_job.atualizados;
    return;
  end if;

  if (select count(*) from public.admin_import_batches b where b.import_id = p_import_id) <> v_job.total_lotes then
    raise exception 'Ainda faltam lotes para concluir a importação.' using errcode = '22023';
  end if;

  for v_batch in
    select b.batch_index, b.registros
    from public.admin_import_batches b
    where b.import_id = p_import_id
    order by b.batch_index
  loop
    select result.inseridos, result.atualizados
    into v_inserted, v_updated
    from public.upsert_entregas_batch(v_batch.registros) as result;
    v_total_inserted := v_total_inserted + coalesce(v_inserted, 0);
    v_total_updated := v_total_updated + coalesce(v_updated, 0);
  end loop;

  update public.admin_import_jobs
  set status = 'concluida', inseridos = v_total_inserted,
      atualizados = v_total_updated, updated_at = now()
  where id = p_import_id;

  return query select v_total_inserted, v_total_updated;
end;
$function$;

create index if not exists idx_entregas_promo_periodo_entregador
  on public.entregas (promocao_id, periodo, id_da_pessoa_entregadora);

create index if not exists idx_entregas_promo_data
  on public.entregas (promocao_id, data_do_periodo);

-- The unique slug index already serves lookups; this non-unique copy is redundant.
drop index if exists public.idx_promocoes_slug;

-- Serialize first-admin setup so two concurrent requests cannot both register.
create or replace function public.register_first_admin(p_usuario text, p_senha_hash text, p_nome text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  perform pg_advisory_xact_lock(hashtextextended('central-promocoes-first-admin', 0));
  if exists (select 1 from public.admin_usuarios limit 1) then
    return false;
  end if;

  insert into public.admin_usuarios (usuario, senha, nome)
  values (p_usuario, p_senha_hash, p_nome);
  return true;
end;
$function$;

revoke all on function public.register_first_admin(text, text, text) from public, anon, authenticated;
grant execute on function public.register_first_admin(text, text, text) to service_role;

-- The additive functions are private even before the later app-table lockdown.
revoke all on function public.consume_admin_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_admin_rate_limit(text, integer, integer) to service_role;
revoke all on function public.get_public_ranking(uuid, text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.get_public_ranking(uuid, text, text, integer, integer) to service_role;
revoke all on function public.get_elite_months(uuid) from public, anon, authenticated;
grant execute on function public.get_elite_months(uuid) to service_role;
revoke all on function public.get_elite_lookup(uuid, date, date, text, integer) from public, anon, authenticated;
grant execute on function public.get_elite_lookup(uuid, date, date, text, integer) to service_role;
revoke all on function public.reorder_promocoes_atomic(jsonb) from public, anon, authenticated;
grant execute on function public.reorder_promocoes_atomic(jsonb) to service_role;
revoke all on function public.stage_admin_import_batch(uuid, uuid, integer, integer, text, jsonb) from public, anon, authenticated;
grant execute on function public.stage_admin_import_batch(uuid, uuid, integer, integer, text, jsonb) to service_role;
revoke all on function public.commit_admin_import(uuid) from public, anon, authenticated;
grant execute on function public.commit_admin_import(uuid) to service_role;
