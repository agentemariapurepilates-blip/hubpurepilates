-- Blog da Pure: artigos escritos com o Gemini dentro do Hub (seção Marketing).
--
-- POR QUE ESTA TABELA EXISTE (pedido de 05/11/2026): o time de marketing quer
-- criar artigos do blog (blog.purepilates.com.br, WordPress) a partir de uma
-- pauta, revisar, aprovar e, numa segunda etapa, publicar sozinho no WordPress.
-- Esta primeira versão cobre só a criação do texto e a aprovação.
--
-- O ciclo de um artigo:
--   rascunho      -> o Gemini escreveu, o time está editando
--   em_aprovacao  -> enviado para alguém aprovar
--   ajustes       -> quem revisou pediu mudanças (comentario_revisao diz quais)
--   aprovado      -> pronto para ir ao blog
--   publicado     -> reservado para a etapa de publicação automática
--
-- Quem VÊ a seção é decidido no Hub (src/features/marketing/equipe.ts). Aqui o
-- banco barra quem não é colaborador, que é a regra do resto da área interna.

CREATE TABLE IF NOT EXISTS public.blog_artigos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'rascunho'
    CHECK (status IN ('rascunho', 'em_aprovacao', 'ajustes', 'aprovado', 'publicado')),

  -- A pauta que gerou o texto: fica guardada para reescrever com o mesmo briefing.
  tema text NOT NULL CHECK (length(btrim(tema)) > 2),
  palavra_chave text NULL,
  categoria text NULL,
  publico text NOT NULL DEFAULT 'alunos',
  tamanho text NOT NULL DEFAULT 'medio',
  observacoes text NULL,

  -- O artigo em si. O conteúdo é HTML simples (h2, h3, p, listas, negrito).
  titulo text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  meta_descricao text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  conteudo_html text NOT NULL DEFAULT '',

  -- Aprovação.
  comentario_revisao text NULL,
  enviado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  enviado_em timestamptz NULL,
  revisado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  revisado_em timestamptz NULL,

  -- Publicação no WordPress (próxima etapa; ainda sem uso).
  wp_post_id bigint NULL,
  wp_url text NULL,
  publicado_em timestamptz NULL,

  criado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_artigos_status_idx ON public.blog_artigos (status, updated_at DESC);

DROP TRIGGER IF EXISTS update_blog_artigos_updated_at ON public.blog_artigos;
CREATE TRIGGER update_blog_artigos_updated_at
  BEFORE UPDATE ON public.blog_artigos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.blog_artigos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Colaborador ve os artigos do blog" ON public.blog_artigos;
CREATE POLICY "Colaborador ve os artigos do blog"
  ON public.blog_artigos FOR SELECT TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Colaborador mantem os artigos do blog" ON public.blog_artigos;
CREATE POLICY "Colaborador mantem os artigos do blog"
  ON public.blog_artigos FOR ALL TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_artigos TO authenticated;
GRANT ALL ON public.blog_artigos TO service_role;
