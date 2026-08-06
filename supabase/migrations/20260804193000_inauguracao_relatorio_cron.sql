-- Cron do relatorio semanal de inauguracoes.
--
-- NAO APLICADA AINDA. Escrita a pedido do usuario para ficar pronta; aplicar
-- so depois de publicar a Edge Function `inauguracao-relatorio-semanal`.
-- Agendar antes faz o pg_cron bater numa function inexistente toda segunda, em
-- silencio -- ninguem descobre ate alguem cobrar o relatorio.
--
-- 10:00 UTC = 07:00 EM SAO PAULO, e o `1` e SEGUNDA-FEIRA.
-- O pg_cron agenda sempre em UTC e nao tem fuso; Sao Paulo e UTC-3 o ano
-- inteiro (sem horario de verao desde 2019), entao 07:00 local = 10:00 UTC,
-- fixo. Trocar por '0 7 * * 1' faria o relatorio sair as 04:00 da manha.
--
-- O dia da semana no UTC coincide com o de Sao Paulo neste horario: 10:00 UTC
-- de uma segunda ainda e segunda em Sao Paulo (07:00). Isso deixaria de valer
-- se alguem mudasse o horario para antes das 03:00 UTC.
--
-- SEGREDO: mesma heranca da function do aviso diario -- o pg_cron so le do
-- Vault, e `instagram_cron_secret` e o unico segredo presente nos dois lados.
-- Os tres passos para desamarrar estao no topo de
-- supabase/functions/inauguracao-aviso-diario/index.ts.

select cron.unschedule(jobid)
  from cron.job
 where jobname = 'inauguracao-relatorio-semanal';

select cron.schedule(
  'inauguracao-relatorio-semanal',
  '0 10 * * 1',
  $cron$
  select net.http_post(
    url := 'https://evprrtvbvjnjixogjsmn.supabase.co/functions/v1/inauguracao-relatorio-semanal',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'instagram_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
