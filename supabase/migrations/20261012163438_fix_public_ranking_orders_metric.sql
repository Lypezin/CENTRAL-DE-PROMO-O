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
      e.id_da_pessoa_entregadora,
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
      when v_metrica = 'pedidos_aceitos_e_concluidos' then sum(e.numero_de_pedidos_aceitos_e_concluidos) > 0
      else sum(e.numero_de_corridas_completadas) > 0
    end
  ),
  ranqueados as materialized (
    select
      row_number() over (
        order by case
          when v_metrica = 'faturamento_taxas' then a.total_soma_taxas
          when v_metrica = 'pontos' then a.total_pontos
          when v_metrica = 'pedidos_aceitos_e_concluidos' then a.total_pedidos_concluidos
          else a.total_corridas_completadas
        end desc,
        a.total_soma_taxas desc,
        a.pessoa_entregadora asc,
        a.id_da_pessoa_entregadora asc,
        a.periodo asc
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
  limit least(greatest(coalesce(p_limite, 20), 1), 1000)
  offset least(greatest(coalesce(p_offset, 0), 0), 100000);
end;
$function$;
