-- Importacao antiga aceitava e preservava rótulos de período personalizados.
-- Mantém essa compatibilidade sem limitar os valores aos seis turnos padrão.
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
       or length(btrim(coalesce(row_data.value->>'periodo', ''))) = 0
       or length(btrim(coalesce(row_data.value->>'periodo', ''))) > 80
       or coalesce(row_data.value->>'id_da_pessoa_entregadora', '') = ''
       or length(btrim(coalesce(row_data.value->>'pessoa_entregadora', ''))) = 0
       or length(btrim(coalesce(row_data.value->>'pessoa_entregadora', ''))) > 300
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

revoke all on function public.stage_admin_import_batch(uuid, uuid, integer, integer, text, jsonb) from public, anon, authenticated;
grant execute on function public.stage_admin_import_batch(uuid, uuid, integer, integer, text, jsonb) to service_role;
