-- Prevent concurrent imports for one campaign from producing inaccurate counts.
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
  select * into v_job
  from public.admin_import_jobs j
  where j.id = p_import_id
  for update;
  if not found then
    raise exception 'Importação não encontrada.' using errcode = 'P0002';
  end if;

  if v_job.status = 'concluida' then
    return query select v_job.inseridos, v_job.atualizados;
    return;
  end if;

  if (
    select count(*)
    from public.admin_import_batches b
    where b.import_id = p_import_id
  ) <> v_job.total_lotes then
    raise exception 'Ainda faltam lotes para concluir a importação.' using errcode = '22023';
  end if;

  -- The upsert helper calculates inserted/updated counts before writing. Serialize
  -- commits for the same campaign so competing imports see one another's writes.
  perform pg_advisory_xact_lock(hashtextextended(v_job.promocao_id::text, 1));

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
  set status = 'concluida',
      inseridos = v_total_inserted,
      atualizados = v_total_updated,
      updated_at = now()
  where id = p_import_id;

  return query select v_total_inserted, v_total_updated;
end;
$function$;
