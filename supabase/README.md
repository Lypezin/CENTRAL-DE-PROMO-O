# Banco de dados

As migrações em `migrations/` correspondem às alterações desta revisão e aos registros aplicados no projeto Supabase conectado. As migrações históricas anteriores a outubro de 2026 já existiam no projeto remoto, mas seus arquivos de origem não estavam neste repositório.

Antes de criar um banco novo ou executar `supabase db reset`, recupere e versione o histórico ou snapshot anterior. A migração em `deferred/` só deve entrar em `migrations/` após a publicação e a verificação das rotas server-side descritas no próprio arquivo.
