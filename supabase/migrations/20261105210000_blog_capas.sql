-- Blog da Pure: capa automática (foto ilustrativa + título).
--
-- PEDIDO DE 05/11/2026: ao aprovar o lote de títulos, cada artigo sai da
-- produção com o texto E a capa. A capa tem duas partes:
--   - a FOTO, gerada pelo Gemini no servidor e guardada no bucket blog-capas;
--   - o TÍTULO, escrito por cima pelo Hub (src/features/marketing/blog/CapaBlog.tsx),
--     no modelo aprovado: pétala, Montserrat e a paleta de cada marca.
-- O título nunca é escrito pela IA, então não sai letra errada.
--
-- A foto entra na mesma fila do texto (function blog-produzir): quando não há
-- texto para escrever, a chamada gera a próxima foto pendente.

ALTER TABLE public.blog_artigos
  ADD COLUMN IF NOT EXISTS foto_url text NULL,
  -- A cena da foto, em inglês, escrita pelo Gemini junto com o artigo.
  ADD COLUMN IF NOT EXISTS cena_foto text NULL,
  ADD COLUMN IF NOT EXISTS capa_status text NULL,
  ADD COLUMN IF NOT EXISTS capa_erro text NULL,
  ADD COLUMN IF NOT EXISTS capa_tentativas integer NOT NULL DEFAULT 0;

ALTER TABLE public.blog_artigos DROP CONSTRAINT IF EXISTS blog_artigos_capa_status_check;
ALTER TABLE public.blog_artigos ADD CONSTRAINT blog_artigos_capa_status_check
  CHECK (capa_status IS NULL OR capa_status IN ('pendente', 'gerando', 'pronta', 'falhou'));

CREATE INDEX IF NOT EXISTS blog_artigos_capa_status_idx ON public.blog_artigos (capa_status) WHERE capa_status = 'pendente';

-- Artigo que já tem texto e ainda não tem foto entra na fila das capas.
UPDATE public.blog_artigos
   SET capa_status = 'pendente'
 WHERE capa_status IS NULL
   AND foto_url IS NULL
   AND status IN ('rascunho', 'em_aprovacao', 'ajustes', 'aprovado');

-- Bucket público: a capa vai para o blog, que é público. Só o servidor grava.
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-capas', 'blog-capas', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Pega a próxima foto pendente e marca como 'gerando', numa operação só.
-- Antes, devolve à fila a foto que ficou presa em 'gerando'.
CREATE OR REPLACE FUNCTION public.blog_pegar_proxima_capa()
RETURNS SETOF public.blog_artigos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_artigos
     SET capa_status = CASE WHEN capa_tentativas >= 3 THEN 'falhou' ELSE 'pendente' END,
         capa_erro = COALESCE(capa_erro, 'a geração da foto parou no meio')
   WHERE capa_status = 'gerando' AND updated_at < now() - interval '10 minutes';

  RETURN QUERY
  UPDATE public.blog_artigos a
     SET capa_status = 'gerando', capa_tentativas = a.capa_tentativas + 1
   WHERE a.id = (
     SELECT id FROM public.blog_artigos
      WHERE capa_status = 'pendente'
        AND status IN ('rascunho', 'em_aprovacao', 'ajustes', 'aprovado')
      ORDER BY data_prevista NULLS LAST, created_at
      LIMIT 1
      FOR UPDATE SKIP LOCKED
   )
  RETURNING a.*;
END;
$$;

REVOKE ALL ON FUNCTION public.blog_pegar_proxima_capa() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.blog_pegar_proxima_capa() TO service_role;

-- O cron agora também acorda para foto pendente, e não só para texto na fila.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'blog-produzir';
SELECT cron.schedule(
  'blog-produzir',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://evprrtvbvjnjixogjsmn.supabase.co/functions/v1/blog-produzir',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'instagram_cron_secret')
    ),
    body := '{}'::jsonb
  )
  WHERE EXISTS (
    SELECT 1 FROM public.blog_artigos
     WHERE status = 'na_fila'
        OR (capa_status = 'pendente' AND status IN ('rascunho', 'em_aprovacao', 'ajustes', 'aprovado'))
  );
  $cron$
);
