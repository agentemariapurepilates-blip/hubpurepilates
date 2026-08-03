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
-- SOBRE O SEGREDO -- ler antes de mexer.
--
-- O pg_cron so consegue ler segredo do Vault. Hoje o Vault deste projeto tem UM
-- unico segredo: `instagram_cron_secret`. O `CRON_SECRET` que as outras functions
-- usam existe apenas como segredo das Edge Functions, NAO esta no Vault -- por
-- isso os crons `dpp-cron-*` foram agendados a mao, com o valor escrito literal
-- dentro do comando (veja `select command from cron.job`). Nao repetimos isso
-- aqui: seria versionar um segredo neste arquivo.
--
-- Entao reusamos `instagram_cron_secret`, que ja existe nos dois lados. A function
-- aceita `INAUGURACAO_CRON_SECRET` com prioridade e cai em `INSTAGRAM_CRON_SECRET`
-- como reserva, entao os dois convivem.
--
-- ISSO E UM COMPROMISSO, NAO UM DESENHO. Amarra este aviso a um segredo com nome
-- de outra funcionalidade: se alguem rotacionar o do Instagram, este cron passa a
-- responder 401 todo dia, em silencio -- o pg_cron nao reclama do que acontece do
-- outro lado. Para desamarrar, tres passos:
--
--   1. Edge Functions: criar o segredo INAUGURACAO_CRON_SECRET
--   2. Banco: select vault.create_secret('<mesmo valor>', 'inauguracao_cron_secret');
--   3. Aqui: trocar o name lido abaixo para 'inauguracao_cron_secret'
--
-- A function ja prefere o dedicado, entao o passo 3 e o unico que exige atencao.

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
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'instagram_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
