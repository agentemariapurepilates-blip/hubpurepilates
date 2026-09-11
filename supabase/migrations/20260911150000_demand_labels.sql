-- Etiquetas coloridas das demandas.
--
-- Dois tipos:
--   * frente — Frente de negócio (Pilates Play, Academy, Studios...). Lista
--     única do Hub inteiro: Academy é Academy em qualquer setor, e renomear
--     num lugar muda em todos.
--   * status — Status por etiqueta. Lista própria de cada setor. Serve para os
--     setores cujo fluxo não cabe nos grupos (hoje, Gravações); os demais já
--     usam os grupos como status.
--
-- Cada setor liga as colunas que usa em demand_board_settings. Onde não está
-- ligada, a coluna não aparece. Tudo aqui só acrescenta; nada é apagado.
--
-- Aplicar pelo SQL Editor ou pela Management API. Nunca `supabase db push`:
-- o histórico remoto de migrations está vazio.

-- 1. Etiquetas -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.demand_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('status', 'frente')),
  department text NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#579BFC',
  position integer NOT NULL DEFAULT 0,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Frente é do Hub inteiro (sem setor); Status é sempre de um setor.
  CONSTRAINT demand_labels_escopo CHECK (
    (kind = 'frente' AND department IS NULL) OR (kind = 'status' AND department IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS demand_labels_kind_department_idx
  ON public.demand_labels (kind, department, position);

-- 2. Etiqueta escolhida em cada demanda ---------------------------------------
-- ON DELETE SET NULL: excluir uma etiqueta só a tira das demandas.
ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS status_label_id uuid NULL
    REFERENCES public.demand_labels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS frente_label_id uuid NULL
    REFERENCES public.demand_labels(id) ON DELETE SET NULL;

-- 3. Colunas que cada setor usa ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.demand_board_settings (
  department text PRIMARY KEY,
  show_status_labels boolean NOT NULL DEFAULT false,
  show_frente boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. RLS e permissões: as mesmas regras de quem mexe em demandas -------------
ALTER TABLE public.demand_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_board_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Colaboradores can view demand labels" ON public.demand_labels;
CREATE POLICY "Colaboradores can view demand labels"
  ON public.demand_labels FOR SELECT USING (public.is_colaborador(auth.uid()));
DROP POLICY IF EXISTS "Colaboradores can create demand labels" ON public.demand_labels;
CREATE POLICY "Colaboradores can create demand labels"
  ON public.demand_labels FOR INSERT WITH CHECK (public.is_colaborador(auth.uid()));
DROP POLICY IF EXISTS "Colaboradores can update demand labels" ON public.demand_labels;
CREATE POLICY "Colaboradores can update demand labels"
  ON public.demand_labels FOR UPDATE USING (public.is_colaborador(auth.uid()));
DROP POLICY IF EXISTS "Colaboradores can delete demand labels" ON public.demand_labels;
CREATE POLICY "Colaboradores can delete demand labels"
  ON public.demand_labels FOR DELETE USING (public.is_colaborador(auth.uid()));

DROP POLICY IF EXISTS "Colaboradores can view board settings" ON public.demand_board_settings;
CREATE POLICY "Colaboradores can view board settings"
  ON public.demand_board_settings FOR SELECT USING (public.is_colaborador(auth.uid()));
DROP POLICY IF EXISTS "Colaboradores can create board settings" ON public.demand_board_settings;
CREATE POLICY "Colaboradores can create board settings"
  ON public.demand_board_settings FOR INSERT WITH CHECK (public.is_colaborador(auth.uid()));
DROP POLICY IF EXISTS "Colaboradores can update board settings" ON public.demand_board_settings;
CREATE POLICY "Colaboradores can update board settings"
  ON public.demand_board_settings FOR UPDATE USING (public.is_colaborador(auth.uid()));
DROP POLICY IF EXISTS "Colaboradores can delete board settings" ON public.demand_board_settings;
CREATE POLICY "Colaboradores can delete board settings"
  ON public.demand_board_settings FOR DELETE USING (public.is_colaborador(auth.uid()));

-- O dump da migração de abril não trouxe os GRANTs do schema public.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demand_labels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demand_board_settings TO authenticated;
GRANT ALL ON public.demand_labels TO service_role;
GRANT ALL ON public.demand_board_settings TO service_role;

-- 5. Sementes (idempotentes) --------------------------------------------------
-- Frentes: as do quadro de Gravações no Monday, com as mesmas cores.
INSERT INTO public.demand_labels (kind, department, name, color, position)
SELECT 'frente', NULL, v.name, v.color, v.pos
FROM (VALUES
  ('FRANCHISING',         '#9D99B9', 0),
  ('OK',                  '#EFAE56', 1),
  ('STUDIO',              '#333333', 2),
  ('Pilates Play',        '#C4C4C4', 3),
  ('ACADEMY',             '#777777', 4),
  ('STUDIO TV',           '#BAA68A', 5),
  ('DESAFIO DA SEMANA',   '#3B7E55', 6),
  ('EDUCACIONAL ACADEMY', '#C9424E', 7),
  ('STORE',               '#EAA6EE', 8)
) AS v(name, color, pos)
WHERE NOT EXISTS (
  SELECT 1 FROM public.demand_labels l WHERE l.kind = 'frente' AND l.name = v.name
);

-- Status de Gravações: os do quadro que a equipe usa hoje no Monday, com as
-- mesmas cores, menos as etiquetas de mês (ABR 26, JUN 26...). Renomeáveis,
-- recoloríveis e excluíveis na própria tela.
INSERT INTO public.demand_labels (kind, department, name, color, position)
SELECT 'status', 'Gravações', v.name, v.color, v.pos
FROM (VALUES
  ('BRIEFING',            '#E8784A', 0),
  ('Criar roteiro',       '#F5CC47', 1),
  ('Para aprovar',        '#333333', 2),
  ('Para gravar',         '#6A9DF5', 3),
  ('Para editar',         '#3C7BB0', 4),
  ('Entregue',            '#5EC47B', 5),
  ('Aprovado',            '#3B7E55', 6),
  ('Concluído',           '#C4C4C4', 7),
  ('Para ajuste',         '#9558D6', 8),
  ('PARADO',              '#C9424E', 9),
  ('PUBLICADO',           '#A8D14A', 10),
  ('Programado',          '#7A5347', 11),
  ('Não usar',            '#A83F55', 12),
  ('Montando calendário', '#EAA6EE', 13),
  ('Gerar Imagens IA',    '#5859DA', 14),
  ('Falta arte',          '#553F3F', 15)
) AS v(name, color, pos)
WHERE NOT EXISTS (
  SELECT 1 FROM public.demand_labels l
  WHERE l.kind = 'status' AND l.department = 'Gravações' AND l.name = v.name
);

INSERT INTO public.demand_board_settings (department, show_status_labels, show_frente)
VALUES ('Gravações', true, true)
ON CONFLICT (department) DO NOTHING;

-- 6. Realtime -----------------------------------------------------------------
DO $$
DECLARE
  tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY['demand_labels', 'demand_board_settings']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tabela
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tabela);
    END IF;
  END LOOP;
END $$;
