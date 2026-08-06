-- Cron do relatorio de clusters de aulas experimentais.
--
-- NAO APLICADA AINDA. Aplicar so DEPOIS de publicar a Edge Function
-- `experimentais-relatorio-mensal`.
--
-- POR QUE O AGENDAMENTO E DIARIO, e nao mensal:
-- o pedido e "penultimo dia do mes", que cai no 27, 28, 29 ou 30 conforme o mes
-- e o ano bissexto. O cron nao sabe expressar isso -- '0 6 28-30 * *'
-- dispararia TRES vezes em meses de 31 dias e nenhuma no dia certo em
-- fevereiro. Entao roda todo dia e a FUNCTION decide: ela calcula o penultimo
-- dia do mes corrente em Sao Paulo e sai logo no inicio se nao for hoje, sem
-- tocar em banco nenhum. Custa uma invocacao vazia por dia, que e barato perto
-- de mandar o relatorio na data errada.
--
-- 06:00 UTC = 03:00 EM SAO PAULO (UTC-3 o ano inteiro, sem horario de verao
-- desde 2019). A guarda da function usa a data de Sao Paulo, entao os dois
-- lados concordam sobre que dia e.

select cron.unschedule(jobid)
  from cron.job
 where jobname = 'experimentais-relatorio-mensal';

select cron.schedule(
  'experimentais-relatorio-mensal',
  '0 6 * * *',
  $cron$
  select net.http_post(
    url := 'https://evprrtvbvjnjixogjsmn.supabase.co/functions/v1/experimentais-relatorio-mensal',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'instagram_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
