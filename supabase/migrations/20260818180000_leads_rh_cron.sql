-- Atualização diária dos leads de RH.
--
-- NÃO APLICADA. Modo local. Para aplicar:
--   supabase db push --project-ref evprrtvbvjnjixogjsmn
--
-- Depende de `20260818140000_leads_rh.sql` (as tabelas) e da função de borda
-- `rh-leads-sync` publicada.
--
-- ────────────────────────────────────────────────────────────────────────────
-- POR QUE 06:00 UTC
-- ────────────────────────────────────────────────────────────────────────────
-- O pg_cron trabalha em UTC. São Paulo é UTC−3 o ano todo (não há mais horário
-- de verão desde 2019), então 06:00 UTC = 03:00 em São Paulo. De madrugada: a
-- carga percorre os formulários da Graph API, e o limite de requisições por
-- hora do Meta é compartilhado com a sincronização de mídia — rodar no meio do
-- dia faria as duas disputarem a mesma cota.
--
-- ────────────────────────────────────────────────────────────────────────────
-- POR QUE A FUNÇÃO BUSCA TUDO, E NÃO SÓ O DIA ANTERIOR
-- ────────────────────────────────────────────────────────────────────────────
-- `rh-leads-sync` lê os formulários inteiros e grava com `on_conflict=id`. Isso
-- é de propósito: um lead pode ser corrigido pelo Meta depois de criado, e a
-- API não oferece filtro confiável por data de atualização. Como são centenas
-- de leads, e não milhões, reprocessar tudo custa segundos e evita a classe de
-- bug em que uma correção nunca chega.

select cron.unschedule('rh-leads-diario')
where exists (select 1 from cron.job where jobname = 'rh-leads-diario');

select cron.schedule(
  'rh-leads-diario',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://evprrtvbvjnjixogjsmn.supabase.co/functions/v1/rh-leads-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'instagram_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
