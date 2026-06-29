-- Cron do espelho do Instagram oficial: roda o sync a cada 30 min.
-- Segredo vem do Vault (name='instagram_cron_secret'), igual ao cron de publicação.

select cron.schedule(
  'instagram-feed-sync',
  '*/30 * * * *',
  $cron$
  select net.http_post(
    url := 'https://evprrtvbvjnjixogjsmn.supabase.co/functions/v1/instagram-feed-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'instagram_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
