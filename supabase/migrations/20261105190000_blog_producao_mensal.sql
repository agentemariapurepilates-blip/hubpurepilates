-- Blog da Pure: produção mensal automática, contexto por marca e aprendizado.
--
-- PEDIDO DE 05/11/2026: pelo menos 30 artigos por mês, um por dia, revezando
-- Studios, Academy e Franchising. O time gera as sugestões do mês, exclui,
-- acrescenta ou edita, aprova o lote, e todas vão para produção de uma vez.
-- Cada artigo pronto é aprovado individualmente depois.
--
-- Como funciona:
--   1. Sugestão: uma linha em blog_artigos com status 'sugestao' e só a pauta.
--   2. Aprovar o lote muda todas para 'na_fila'.
--   3. O pg_cron chama a function blog-produzir a cada minuto enquanto houver
--      fila. Cada chamada pega UM artigo (blog_pegar_proximo), escreve com o
--      Gemini e devolve como 'em_aprovacao' (ou 'rascunho', se faltou SEO).
--   4. Falhou três vezes: 'falhou', e o time vê o motivo em erro_geracao.
--
-- "Memória" do Gemini: ele não aprende sozinho. A cada geração a function envia
-- o contexto da marca (blog_contextos, editável no Hub), os aprendizados do time
-- (blog_aprendizados, salvos a cada pedido de ajuste) e os últimos artigos
-- aprovados da mesma marca como exemplo.

-- ── Artigos: colunas da produção ───────────────────────────────────────────
ALTER TABLE public.blog_artigos
  ADD COLUMN IF NOT EXISTS marca text NOT NULL DEFAULT 'studios',
  ADD COLUMN IF NOT EXISTS data_prevista date NULL,
  ADD COLUMN IF NOT EXISTS avisos_seo text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS erro_geracao text NULL,
  ADD COLUMN IF NOT EXISTS tentativas integer NOT NULL DEFAULT 0;

ALTER TABLE public.blog_artigos DROP CONSTRAINT IF EXISTS blog_artigos_marca_check;
ALTER TABLE public.blog_artigos ADD CONSTRAINT blog_artigos_marca_check
  CHECK (marca IN ('studios', 'academy', 'franchising'));

ALTER TABLE public.blog_artigos DROP CONSTRAINT IF EXISTS blog_artigos_status_check;
ALTER TABLE public.blog_artigos ADD CONSTRAINT blog_artigos_status_check
  CHECK (status IN (
    'sugestao', 'na_fila', 'gerando', 'falhou',
    'rascunho', 'em_aprovacao', 'ajustes', 'aprovado', 'publicado'
  ));

CREATE INDEX IF NOT EXISTS blog_artigos_data_prevista_idx ON public.blog_artigos (data_prevista);

-- ── Contexto por marca (o "projeto" do Gemini) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_contextos (
  chave text PRIMARY KEY CHECK (chave IN ('geral', 'studios', 'academy', 'franchising')),
  conteudo text NOT NULL DEFAULT '',
  atualizado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_blog_contextos_updated_at ON public.blog_contextos;
CREATE TRIGGER update_blog_contextos_updated_at
  BEFORE UPDATE ON public.blog_contextos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.blog_contextos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colaborador ve o contexto do blog" ON public.blog_contextos;
CREATE POLICY "Colaborador ve o contexto do blog"
  ON public.blog_contextos FOR SELECT TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Colaborador edita o contexto do blog" ON public.blog_contextos;
CREATE POLICY "Colaborador edita o contexto do blog"
  ON public.blog_contextos FOR UPDATE TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
GRANT SELECT, UPDATE ON public.blog_contextos TO authenticated;
GRANT ALL ON public.blog_contextos TO service_role;

-- Semente: só o que os canais oficiais da Pure já publicaram (site e blog,
-- conferidos em 05/11/2026). O que não foi possível confirmar fica marcado
-- "A PREENCHER" para o time, e as regras proíbem o Gemini de inventar.
-- ON CONFLICT DO NOTHING: rodar de novo não apaga o que o time já editou.
INSERT INTO public.blog_contextos (chave, conteudo) VALUES
('geral', $ctx$# Pure Pilates: o que vale para todas as marcas

## Fatos que podem ser citados
- O site oficial apresenta a Pure Pilates como "a maior rede de Pilates da América Latina".
- Nos studios, as aulas são de Pilates com aparelhos e duram 55 minutos (site oficial).
- Os alunos têm um aplicativo exclusivo da Pure Pilates para agendar aulas.
- A Pure Pilates comemorou 15 anos em 2024 (blog oficial).
- A Pure Pilates tem parceria com o Wellhub (blog oficial).

## A PREENCHER PELO TIME
- Número atual de unidades e de estados em que a rede está.
- Outros fatos oficiais que o blog pode usar.

Enquanto um item estiver em "A PREENCHER", não fale sobre ele.$ctx$),

('studios', $ctx$# Studios Pure Pilates: artigos para alunos

## Para quem
Pessoas que fazem ou querem fazer Pilates: alunos e possíveis alunos de todas as idades.

## O que mostrar
- Bem-estar, corpo, postura, dores do dia a dia, rotina e qualidade de vida.
- O formato da Pure: Pilates em studio, com aparelhos (Reformer, Cadillac, Chair e Barrel) e o acompanhamento de um instrutor.

## Chamada no fim do artigo
Convide para conhecer a unidade Pure Pilates mais próxima e agendar uma aula experimental. Nunca fale em preço nem em aula grátis.

## A PREENCHER PELO TIME
- Campanhas ou temas que o marketing quer reforçar neste mês.$ctx$),

('academy', $ctx$# Pure Pilates Academy: artigos para profissionais

## Para quem
Instrutores de Pilates, fisioterapeutas, profissionais e estudantes de Educação Física.

## Objetivo
Passar autoridade no mundo do Pilates: conteúdo técnico, bem explicado, que mostra a Pure Pilates Academy como referência na formação de instrutores.

## Fatos que podem ser citados (blog oficial, 2024)
- A Pure Pilates Academy oferece o Curso de Formação em Pilates.
- A formação une teoria e muita prática supervisionada.
- O conteúdo vai de anatomia e fisiologia até técnicas de instrução.
- Os cursos estão no catálogo do site da Academy (academy.purepilates.com.br).

## Pesquisa
Pesquise no Google por "Pure Pilates Academy" para conferir os cursos. Use só o que vier de páginas oficiais da Pure (domínio purepilates.com.br). Se houver conflito, este contexto manda.

## Chamada no fim do artigo
Convide a conhecer os cursos da Pure Pilates Academy.

## A PREENCHER PELO TIME
- Nome de cada curso, formato (presencial ou online), carga horária e para quem é.
- Diferenciais da formação e da certificação.
- Professores ou especialistas que podem ser citados pelo nome.

Enquanto um item estiver em "A PREENCHER", fale da formação de forma geral, sem inventar detalhes.$ctx$),

('franchising', $ctx$# Franquia Pure Pilates: artigos para quem quer investir

## Para quem
Empreendedores, investidores, donos de studio de Pilates e profissionais da saúde que pensam em abrir um negócio.

## Fatos que podem ser citados (blog oficial, 2024)
- O franqueado recebe suporte contínuo, treinamento para ele e para a equipe e marketing centralizado.
- O modelo de negócio já foi testado em diversos mercados.
- Quem já tem um studio pode convertê-lo em franquia Pure Pilates.
- A parceria com o Wellhub leva alunos aos studios da rede.

## Nunca
Faturamento, lucro, retorno, prazo de retorno, valor de investimento ou taxa de franquia.

## Chamada no fim do artigo
Convide a conhecer a franquia Pure Pilates e falar com o time de expansão.

## A PREENCHER PELO TIME
- Diferenciais atuais da franquia.
- Perfil de franqueado que a Pure procura.$ctx$)
ON CONFLICT (chave) DO NOTHING;

-- ── Aprendizados do time (a "memória") ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_aprendizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL vale para todas as marcas.
  marca text NULL CHECK (marca IS NULL OR marca IN ('studios', 'academy', 'franchising')),
  texto text NOT NULL CHECK (length(btrim(texto)) > 2),
  origem text NOT NULL DEFAULT 'manual' CHECK (origem IN ('revisao', 'ajuste_gemini', 'manual')),
  artigo_id uuid NULL REFERENCES public.blog_artigos(id) ON DELETE SET NULL,
  criado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS blog_aprendizados_marca_idx ON public.blog_aprendizados (marca, created_at DESC);

ALTER TABLE public.blog_aprendizados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colaborador ve e mantem os aprendizados do blog" ON public.blog_aprendizados;
CREATE POLICY "Colaborador ve e mantem os aprendizados do blog"
  ON public.blog_aprendizados FOR ALL TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_aprendizados TO authenticated;
GRANT ALL ON public.blog_aprendizados TO service_role;

-- ── Fila de produção ───────────────────────────────────────────────────────
-- Pega o próximo artigo da fila e marca como 'gerando', numa operação só, para
-- duas chamadas ao mesmo tempo nunca escreverem o mesmo artigo. Antes, devolve
-- à fila o que ficou preso em 'gerando' (function que caiu no meio).
CREATE OR REPLACE FUNCTION public.blog_pegar_proximo()
RETURNS SETOF public.blog_artigos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_artigos
     SET status = CASE WHEN tentativas >= 3 THEN 'falhou' ELSE 'na_fila' END,
         erro_geracao = COALESCE(erro_geracao, 'a geração parou no meio')
   WHERE status = 'gerando' AND updated_at < now() - interval '10 minutes';

  RETURN QUERY
  UPDATE public.blog_artigos a
     SET status = 'gerando', tentativas = a.tentativas + 1
   WHERE a.id = (
     SELECT id FROM public.blog_artigos
      WHERE status = 'na_fila'
      ORDER BY data_prevista NULLS LAST, created_at
      LIMIT 1
      FOR UPDATE SKIP LOCKED
   )
  RETURNING a.*;
END;
$$;

REVOKE ALL ON FUNCTION public.blog_pegar_proximo() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.blog_pegar_proximo() TO service_role;

-- A cada minuto, SÓ se houver fila: sem artigo esperando, nada é chamado.
-- O segredo é o mesmo dos outros crons do Hub (vault 'instagram_cron_secret',
-- conferido na function contra INSTAGRAM_CRON_SECRET).
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
  WHERE EXISTS (SELECT 1 FROM public.blog_artigos WHERE status = 'na_fila');
  $cron$
);
