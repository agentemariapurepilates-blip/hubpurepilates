-- Blog da Pure: aprovado vai direto para a agenda do WordPress (pedido de
-- 05/11/2026). A function blog-agendar cria o post "agendado" no blog para o
-- dia previsto, às 9h de Brasília, e o artigo passa a 'agendado' no Hub.

ALTER TABLE public.blog_artigos
  ADD COLUMN IF NOT EXISTS agendado_para timestamptz NULL,
  ADD COLUMN IF NOT EXISTS wp_media_id bigint NULL,
  ADD COLUMN IF NOT EXISTS wp_erro text NULL;

ALTER TABLE public.blog_artigos DROP CONSTRAINT IF EXISTS blog_artigos_status_check;
ALTER TABLE public.blog_artigos ADD CONSTRAINT blog_artigos_status_check
  CHECK (status IN (
    'sugestao', 'descartada', 'na_fila', 'gerando', 'falhou',
    'rascunho', 'em_aprovacao', 'ajustes', 'aprovado', 'agendado', 'publicado'
  ));

-- O WordPress só publica um post agendado quando alguém visita o blog (é o
-- "WP-Cron"). Em dia de pouco acesso, o post sairia atrasado. Este aviso de
-- hora em hora faz o WordPress conferir a agenda. O User-Agent é obrigatório:
-- o Cloudflare do blog barra chamada sem identificação.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'blog-wp-cron';
SELECT cron.schedule(
  'blog-wp-cron',
  '2 * * * *',
  $cron$
  SELECT net.http_get(
    url := 'https://blog.purepilates.com.br/wp-cron.php?doing_wp_cron',
    headers := '{"User-Agent": "HubPurePilates/1.0 (+https://hub.purepilates.com.br)"}'::jsonb
  );
  $cron$
);
