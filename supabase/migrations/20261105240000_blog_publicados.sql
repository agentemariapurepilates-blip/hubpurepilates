-- Blog da Pure: etapa Publicados (pedido de 05/11/2026). De hora em hora, e só
-- quando há agendado com a hora vencida, a function blog-conferir-publicados
-- pergunta ao WordPress se o post já entrou no ar e marca 'publicado' no Hub.
-- Roda aos 15 minutos de cada hora: depois do aviso ao WP-Cron (minuto 2), que
-- é o que faz o WordPress publicar os agendados.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'blog-conferir-publicados';
SELECT cron.schedule(
  'blog-conferir-publicados',
  '15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://evprrtvbvjnjixogjsmn.supabase.co/functions/v1/blog-conferir-publicados',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'instagram_cron_secret')
    ),
    body := '{}'::jsonb
  )
  WHERE EXISTS (
    SELECT 1 FROM public.blog_artigos
     WHERE status = 'agendado' AND wp_post_id IS NOT NULL AND agendado_para <= now()
  );
  $cron$
);
