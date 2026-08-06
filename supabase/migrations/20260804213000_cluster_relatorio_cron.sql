-- Cron do relatorio mensal de clusters de matriculados.
--
-- NAO APLICADA AINDA. Aplicar so DEPOIS de publicar a Edge Function
-- `cluster-relatorio-mensal`: agendar antes faz o pg_cron bater numa function
-- inexistente todo dia 1, em silencio, e ninguem descobre ate alguem cobrar o
-- relatorio.
--
-- '0 6 1 * *' = 06:00 UTC DO DIA 1 = 03:00 EM SAO PAULO.
-- O pg_cron agenda sempre em UTC e nao tem fuso; Sao Paulo e UTC-3 o ano
-- inteiro (sem horario de verao desde 2019), entao 03:00 local = 06:00 UTC.
--
-- ATENCAO AO DIA: as 06:00 UTC do dia 1, em Sao Paulo ainda e dia 1 (03:00).
-- Isso deixaria de valer se alguem antecipasse o horario para antes das 03:00
-- UTC -- ai o disparo cairia no ultimo dia do mes anterior, e a function
-- calcularia o mes errado.
--
-- SEGREDO: mesma heranca das outras functions de cron -- o pg_cron so le do
-- Vault, e `instagram_cron_secret` e o unico segredo presente nos dois lados.
-- Os tres passos para desamarrar estao no topo de
-- supabase/functions/inauguracao-aviso-diario/index.ts.

select cron.unschedule(jobid)
  from cron.job
 where jobname = 'cluster-relatorio-mensal';

select cron.schedule(
  'cluster-relatorio-mensal',
  '0 6 1 * *',
  $cron$
  select net.http_post(
    url := 'https://evprrtvbvjnjixogjsmn.supabase.co/functions/v1/cluster-relatorio-mensal',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'instagram_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
