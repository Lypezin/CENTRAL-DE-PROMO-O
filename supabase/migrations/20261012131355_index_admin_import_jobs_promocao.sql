-- Cover the promotion foreign key used to clean up import jobs on campaign deletion.
create index if not exists admin_import_jobs_promocao_id_idx
  on public.admin_import_jobs (promocao_id);
