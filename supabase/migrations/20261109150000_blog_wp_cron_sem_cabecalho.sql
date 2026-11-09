-- Blog da Pure: o aviso de hora em hora ao WP-Cron (job blog-wp-cron, minuto 2)
-- recebia "HTTP 400 Bad Request" do servidor do blog (IIS) em TODAS as chamadas:
-- o IIS recusa a requisição do pg_net quando ela leva cabeçalho personalizado
-- (testado em 09/11/2026: com qualquer header -> 400; sem header -> 200). Sem esse
-- aviso o WordPress perdia agendamentos (o post de 09/11 não saiu às 9h). O aviso
-- passa a ir sem cabeçalho. Autorizado pela Renata em 09/11/2026.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'blog-wp-cron';
SELECT cron.schedule(
  'blog-wp-cron',
  '2 * * * *',
  $cron$ SELECT net.http_get(url := 'https://blog.purepilates.com.br/wp-cron.php?doing_wp_cron'); $cron$
);
