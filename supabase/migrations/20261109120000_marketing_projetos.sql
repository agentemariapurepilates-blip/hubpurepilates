-- Projetos do time de marketing (seção Marketing → Projetos), no modelo do ClickUp.
--
-- POR QUE ESTAS TABELAS EXISTEM (pedido de 09/11/2026): o time de marketing quer
-- organizar o trabalho por frentes (Social Media, Endomarketing, Performance,
-- Design, Inbound Marketing). Qualquer pessoa do time abre um projeto e, ao
-- configurá-lo, já informa os prazos das quatro etapas: pré-planejamento,
-- planejamento, produção e no ar. O projeto tem visões de lista, quadro, linha do
-- tempo e calendário; a tarefa é completa como no ClickUp: vários responsáveis,
-- início e entrega, prioridade, etiquetas, estimativa, descrição, subtarefas,
-- checklist, links, dependências e comentários.
--
-- A lista de frentes fica no Hub (src/features/marketing/projetos/projetos.ts);
-- aqui é texto livre, para incluir uma frente nova sem mexer no banco.
--
-- Quem VÊ a seção é decidido no Hub (src/features/marketing/equipe.ts). Aqui o
-- banco barra quem não é colaborador, a mesma regra do Blog da Pure.

CREATE TABLE IF NOT EXISTS public.marketing_projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL CHECK (length(btrim(titulo)) > 1),
  descricao text NULL,
  frente text NOT NULL,
  responsavel_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Início do projeto e os prazos de cada etapa (definidos na criação, editáveis).
  data_inicio date NULL,
  prazo_pre_planejamento date NULL,
  prazo_planejamento date NULL,
  prazo_producao date NULL,
  prazo_no_ar date NULL,

  concluido boolean NOT NULL DEFAULT false,
  arquivado boolean NOT NULL DEFAULT false,

  criado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_projetos_frente_idx ON public.marketing_projetos (frente, prazo_no_ar);

CREATE TABLE IF NOT EXISTS public.marketing_tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.marketing_projetos(id) ON DELETE CASCADE,
  -- Subtarefa: aponta para a tarefa-mãe. Nulo = tarefa do projeto.
  tarefa_mae_id uuid NULL REFERENCES public.marketing_tarefas(id) ON DELETE CASCADE,
  titulo text NOT NULL CHECK (length(btrim(titulo)) > 0),
  descricao text NULL, -- HTML do editor de texto
  status text NOT NULL DEFAULT 'a_fazer'
    CHECK (status IN ('a_fazer', 'em_andamento', 'em_revisao', 'concluida')),
  prioridade text NULL
    CHECK (prioridade IN ('urgente', 'alta', 'normal', 'baixa')),
  -- Em qual etapa do projeto a tarefa entra (opcional).
  etapa text NULL
    CHECK (etapa IN ('pre_planejamento', 'planejamento', 'producao', 'no_ar')),
  responsaveis uuid[] NOT NULL DEFAULT '{}',
  data_inicio date NULL,
  prazo date NULL,
  estimativa_horas numeric(6, 1) NULL,
  etiquetas text[] NOT NULL DEFAULT '{}',
  -- Links de referência e entregáveis: [{ "nome": "...", "url": "..." }]
  links jsonb NOT NULL DEFAULT '[]',
  -- Tarefas do mesmo projeto que precisam terminar antes desta começar.
  aguardando uuid[] NOT NULL DEFAULT '{}',
  ordem integer NOT NULL DEFAULT 0,
  concluida_em timestamptz NULL,

  criado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (data_inicio IS NULL OR prazo IS NULL OR data_inicio <= prazo)
);

CREATE INDEX IF NOT EXISTS marketing_tarefas_projeto_idx ON public.marketing_tarefas (projeto_id, tarefa_mae_id, ordem);

-- Checklist: passos simples dentro de uma tarefa (sem responsável nem data).
CREATE TABLE IF NOT EXISTS public.marketing_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id uuid NOT NULL REFERENCES public.marketing_tarefas(id) ON DELETE CASCADE,
  texto text NOT NULL CHECK (length(btrim(texto)) > 0),
  feito boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_checklist_tarefa_idx ON public.marketing_checklist (tarefa_id, ordem);

-- Comentários do time na tarefa.
CREATE TABLE IF NOT EXISTS public.marketing_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id uuid NOT NULL REFERENCES public.marketing_tarefas(id) ON DELETE CASCADE,
  autor_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  texto text NOT NULL CHECK (length(btrim(texto)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_comentarios_tarefa_idx ON public.marketing_comentarios (tarefa_id, created_at);

DROP TRIGGER IF EXISTS update_marketing_projetos_updated_at ON public.marketing_projetos;
CREATE TRIGGER update_marketing_projetos_updated_at
  BEFORE UPDATE ON public.marketing_projetos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_tarefas_updated_at ON public.marketing_tarefas;
CREATE TRIGGER update_marketing_tarefas_updated_at
  BEFORE UPDATE ON public.marketing_tarefas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Guarda quando a tarefa foi concluída (e limpa se for reaberta).
CREATE OR REPLACE FUNCTION public.marketing_tarefa_concluida_em()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'concluida' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'concluida') THEN
    NEW.concluida_em := now();
  ELSIF NEW.status <> 'concluida' THEN
    NEW.concluida_em := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS marketing_tarefa_concluida_em ON public.marketing_tarefas;
CREATE TRIGGER marketing_tarefa_concluida_em
  BEFORE INSERT OR UPDATE OF status ON public.marketing_tarefas
  FOR EACH ROW EXECUTE FUNCTION public.marketing_tarefa_concluida_em();

ALTER TABLE public.marketing_projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_comentarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Colaborador ve e mantem os projetos de marketing" ON public.marketing_projetos;
CREATE POLICY "Colaborador ve e mantem os projetos de marketing"
  ON public.marketing_projetos FOR ALL TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Colaborador ve e mantem as tarefas de marketing" ON public.marketing_tarefas;
CREATE POLICY "Colaborador ve e mantem as tarefas de marketing"
  ON public.marketing_tarefas FOR ALL TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Colaborador ve e mantem o checklist de marketing" ON public.marketing_checklist;
CREATE POLICY "Colaborador ve e mantem o checklist de marketing"
  ON public.marketing_checklist FOR ALL TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Comentário: todo colaborador lê e escreve; só o autor (ou admin) apaga ou edita.
DROP POLICY IF EXISTS "Colaborador le comentarios de marketing" ON public.marketing_comentarios;
CREATE POLICY "Colaborador le comentarios de marketing"
  ON public.marketing_comentarios FOR SELECT TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Colaborador comenta em marketing" ON public.marketing_comentarios;
CREATE POLICY "Colaborador comenta em marketing"
  ON public.marketing_comentarios FOR INSERT TO authenticated
  WITH CHECK ((public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin')) AND autor_id = auth.uid());
DROP POLICY IF EXISTS "Autor mexe no proprio comentario" ON public.marketing_comentarios;
CREATE POLICY "Autor mexe no proprio comentario"
  ON public.marketing_comentarios FOR UPDATE TO authenticated
  USING (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Autor apaga o proprio comentario" ON public.marketing_comentarios;
CREATE POLICY "Autor apaga o proprio comentario"
  ON public.marketing_comentarios FOR DELETE TO authenticated
  USING (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- O dump não traz os GRANTs do schema public (ver memória da migração): explícitos aqui.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_projetos, public.marketing_tarefas,
  public.marketing_checklist, public.marketing_comentarios TO authenticated;
GRANT ALL ON public.marketing_projetos, public.marketing_tarefas,
  public.marketing_checklist, public.marketing_comentarios TO service_role;

-- Atualiza a tela de quem está com o projeto aberto quando outra pessoa mexe.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['marketing_projetos', 'marketing_tarefas', 'marketing_checklist', 'marketing_comentarios'] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;
