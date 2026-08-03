-- Cron do aviso de inauguracao: dispara a Edge Function `inauguracao-aviso-diario`
-- uma vez por dia. Ela le as inauguracoes de hoje, chama o webhook do n8n e marca
-- so o que o n8n confirmou ter enviado.
--
-- 06:00 UTC = 03:00 EM SAO PAULO. NAO "CORRIJA" PARA 3.
-- O pg_cron agenda SEMPRE em UTC (o campo `schedule` do cron.job nao tem fuso).
-- Sao Paulo e UTC-3 o ano inteiro -- o Brasil nao tem horario de verao desde 2019
-- --, entao 03:00 local = 06:00 UTC, fixo, sem excecao no calendario. Trocar por
-- '0 3 * * *' faria o aviso sair a meia-noite de Sao Paulo, ou seja, no dia
-- ERRADO para quem cadastrou a inauguracao perto da virada.
--
-- O segredo vem do Vault, como no cron do feed do Instagram. O valor tem que ser
-- IDENTICO ao segredo `CRON_SECRET` das Edge Functions -- e ele que a function
-- compara no header Authorization. Cadastre uma vez, antes de rodar isto:
--
--   select vault.create_secret('<o mesmo valor de CRON_SECRET>', 'cron_secret');
--
-- Sem esse segredo no Vault o header sai como `Bearer ` e a function responde 401
-- todo dia, em silencio (o pg_cron nao reclama de um 200/401 do lado de la).

-- Unschedule defensivo: deixa a migration re-executavel. Diferente de
-- `select cron.unschedule('nome')`, esta forma nao estoura quando o job ainda nao
-- existe -- simplesmente nao casa nenhuma linha.
select cron.unschedule(jobid)
  from cron.job
 where jobname = 'inauguracao-aviso-diario';

select cron.schedule(
  'inauguracao-aviso-diario',
  '0 6 * * *',
  $cron$
  select net.http_post(
    url := 'https://evprrtvbvjnjixogjsmn.supabase.co/functions/v1/inauguracao-aviso-diario',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
