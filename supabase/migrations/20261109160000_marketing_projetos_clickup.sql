-- Projetos do marketing no modelo do ClickUp (pedido de 09/11/2026, segunda versão).
--
-- A primeira versão (20261109120000) separava projeto (com uma frente só) de
-- tarefa. A equipe explicou que um projeto engloba o marketing todo e funciona
-- como no ClickUp: abre-se só com o título; dentro, numa página grande, ficam
-- descrição (com PDF, Word, fotos e vídeos), datas de início e vencimento,
-- vários responsáveis, prioridade, etiquetas, frentes envolvidas, os prazos das
-- etapas, subtarefas (que têm as próprias subtarefas), comentários e o histórico
-- de alterações. Por isso projeto e subtarefa viram o mesmo ITEM, um dentro do
-- outro. As tabelas da primeira versão estavam vazias e saem aqui.
--
-- Quem VÊ a seção é decidido no Hub (src/features/marketing/equipe.ts). O banco
-- barra quem não é colaborador, a mesma regra do Blog da Pure.

DROP TABLE IF EXISTS public.marketing_comentarios, public.marketing_checklist, public.marketing_tarefas, public.marketing_projetos CASCADE;
DROP FUNCTION IF EXISTS public.marketing_tarefa_concluida_em() CASCADE;

CREATE TABLE public.marketing_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- O item acima deste (nulo = é um projeto) e o projeto a que pertence (nulo no
  -- próprio projeto). projeto_id é preenchido pelo trigger e permite buscar o
  -- projeto inteiro numa consulta só.
  item_pai_id uuid NULL REFERENCES public.marketing_itens(id) ON DELETE CASCADE,
  projeto_id uuid NULL REFERENCES public.marketing_itens(id) ON DELETE CASCADE,

  titulo text NOT NULL CHECK (length(btrim(titulo)) > 0),
  descricao text NULL, -- HTML do editor de texto
  status text NOT NULL DEFAULT 'a_fazer'
    CHECK (status IN ('a_fazer', 'em_andamento', 'em_revisao', 'em_aprovacao', 'concluida')),
  prioridade text NULL CHECK (prioridade IN ('urgente', 'alta', 'normal', 'baixa')),
  responsaveis uuid[] NOT NULL DEFAULT '{}',
  data_inicio date NULL,
  prazo date NULL, -- vencimento
  estimativa_horas numeric(6, 1) NULL,
  etiquetas text[] NOT NULL DEFAULT '{}',
  frentes text[] NOT NULL DEFAULT '{}', -- Social Media, Endomarketing, Performance, Design, Inbound...

  -- Prazos das etapas (usados no projeto; opcionais).
  prazo_pre_planejamento date NULL,
  prazo_planejamento date NULL,
  prazo_producao date NULL,
  prazo_no_ar date NULL,

  links jsonb NOT NULL DEFAULT '[]', -- [{ "nome": "...", "url": "..." }]
  aguardando uuid[] NOT NULL DEFAULT '{}', -- itens que precisam terminar antes
  ordem integer NOT NULL DEFAULT 0,
  concluida_em timestamptz NULL,
  arquivado boolean NOT NULL DEFAULT false,

  criado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (data_inicio IS NULL OR prazo IS NULL OR data_inicio <= prazo)
);

CREATE INDEX marketing_itens_projeto_idx ON public.marketing_itens (projeto_id, item_pai_id, ordem);
CREATE INDEX marketing_itens_raiz_idx ON public.marketing_itens (prazo) WHERE item_pai_id IS NULL;

-- Arquivos da descrição (PDF, Word, fotos, vídeos...), no bucket marketing-anexos.
CREATE TABLE public.marketing_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.marketing_itens(id) ON DELETE CASCADE,
  nome text NOT NULL,
  caminho text NOT NULL, -- caminho no bucket
  tipo text NULL, -- mime
  tamanho bigint NULL,
  enviado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX marketing_anexos_item_idx ON public.marketing_anexos (item_id, created_at);

CREATE TABLE public.marketing_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.marketing_itens(id) ON DELETE CASCADE,
  texto text NOT NULL CHECK (length(btrim(texto)) > 0),
  feito boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX marketing_checklist_item_idx ON public.marketing_checklist (item_id, ordem);

CREATE TABLE public.marketing_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.marketing_itens(id) ON DELETE CASCADE,
  autor_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  texto text NOT NULL CHECK (length(btrim(texto)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX marketing_comentarios_item_idx ON public.marketing_comentarios (item_id, created_at);

-- Histórico de alterações, como no ClickUp ("fulano alterou a data de início...").
-- Preenchido pelos triggers abaixo; ninguém escreve direto.
CREATE TABLE public.marketing_atividade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.marketing_itens(id) ON DELETE CASCADE,
  autor_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  campo text NOT NULL, -- criou | status | data_inicio | prazo | responsaveis | prioridade | titulo | anexo | subtarefa
  de text NULL,
  para text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX marketing_atividade_item_idx ON public.marketing_atividade (item_id, created_at);

-- projeto_id e concluida_em, antes de gravar.
CREATE OR REPLACE FUNCTION public.marketing_itens_antes()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.item_pai_id IS NULL THEN
    NEW.projeto_id := NULL;
  ELSE
    SELECT COALESCE(p.projeto_id, p.id) INTO NEW.projeto_id FROM public.marketing_itens p WHERE p.id = NEW.item_pai_id;
  END IF;
  IF NEW.status = 'concluida' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'concluida') THEN
    NEW.concluida_em := now();
  ELSIF NEW.status <> 'concluida' THEN
    NEW.concluida_em := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER marketing_itens_antes
  BEFORE INSERT OR UPDATE ON public.marketing_itens
  FOR EACH ROW EXECUTE FUNCTION public.marketing_itens_antes();

-- Registra no histórico o que mudou.
CREATE OR REPLACE FUNCTION public.marketing_itens_historico()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE quem uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO marketing_atividade (item_id, autor_id, campo, para) VALUES (NEW.id, quem, 'criou', NEW.titulo);
    IF NEW.item_pai_id IS NOT NULL THEN
      INSERT INTO marketing_atividade (item_id, autor_id, campo, para) VALUES (NEW.item_pai_id, quem, 'subtarefa', NEW.titulo);
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO marketing_atividade (item_id, autor_id, campo, de, para) VALUES (NEW.id, quem, 'status', OLD.status, NEW.status);
  END IF;
  IF NEW.data_inicio IS DISTINCT FROM OLD.data_inicio THEN
    INSERT INTO marketing_atividade (item_id, autor_id, campo, de, para) VALUES (NEW.id, quem, 'data_inicio', OLD.data_inicio::text, NEW.data_inicio::text);
  END IF;
  IF NEW.prazo IS DISTINCT FROM OLD.prazo THEN
    INSERT INTO marketing_atividade (item_id, autor_id, campo, de, para) VALUES (NEW.id, quem, 'prazo', OLD.prazo::text, NEW.prazo::text);
  END IF;
  IF NEW.responsaveis IS DISTINCT FROM OLD.responsaveis THEN
    INSERT INTO marketing_atividade (item_id, autor_id, campo, de, para)
    VALUES (NEW.id, quem, 'responsaveis', array_to_string(OLD.responsaveis, ','), array_to_string(NEW.responsaveis, ','));
  END IF;
  IF NEW.prioridade IS DISTINCT FROM OLD.prioridade THEN
    INSERT INTO marketing_atividade (item_id, autor_id, campo, de, para) VALUES (NEW.id, quem, 'prioridade', OLD.prioridade, NEW.prioridade);
  END IF;
  IF NEW.titulo IS DISTINCT FROM OLD.titulo THEN
    INSERT INTO marketing_atividade (item_id, autor_id, campo, de, para) VALUES (NEW.id, quem, 'titulo', OLD.titulo, NEW.titulo);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER marketing_itens_historico
  AFTER INSERT OR UPDATE ON public.marketing_itens
  FOR EACH ROW EXECUTE FUNCTION public.marketing_itens_historico();

CREATE OR REPLACE FUNCTION public.marketing_anexos_historico()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO marketing_atividade (item_id, autor_id, campo, para) VALUES (NEW.item_id, auth.uid(), 'anexo', NEW.nome);
  RETURN NEW;
END $$;

CREATE TRIGGER marketing_anexos_historico
  AFTER INSERT ON public.marketing_anexos
  FOR EACH ROW EXECUTE FUNCTION public.marketing_anexos_historico();

-- Acesso: colaborador ou admin (a tela restringe ao time de marketing).
ALTER TABLE public.marketing_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_atividade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaborador mantem itens de marketing" ON public.marketing_itens FOR ALL TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Colaborador mantem anexos de marketing" ON public.marketing_anexos FOR ALL TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Colaborador mantem checklist de marketing" ON public.marketing_checklist FOR ALL TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Colaborador le comentarios de marketing" ON public.marketing_comentarios FOR SELECT TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Colaborador comenta em marketing" ON public.marketing_comentarios FOR INSERT TO authenticated
  WITH CHECK ((public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin')) AND autor_id = auth.uid());
CREATE POLICY "Autor apaga o proprio comentario" ON public.marketing_comentarios FOR DELETE TO authenticated
  USING (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Colaborador le o historico de marketing" ON public.marketing_atividade FOR SELECT TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_itens, public.marketing_anexos, public.marketing_checklist, public.marketing_comentarios TO authenticated;
GRANT SELECT ON public.marketing_atividade TO authenticated;
GRANT ALL ON public.marketing_itens, public.marketing_anexos, public.marketing_checklist, public.marketing_comentarios, public.marketing_atividade TO service_role;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['marketing_itens', 'marketing_anexos', 'marketing_checklist', 'marketing_comentarios', 'marketing_atividade'] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- Bucket privado dos anexos. O limite por arquivo do bucket é 500 MB, mas vale o
-- menor entre ele e o limite global do projeto (50 MB em 09/11/2026).
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('marketing-anexos', 'marketing-anexos', false, 524288000)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Colaborador le anexos de marketing" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'marketing-anexos' AND (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Colaborador envia anexos de marketing" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marketing-anexos' AND (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Colaborador apaga anexos de marketing" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'marketing-anexos' AND (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin')));
