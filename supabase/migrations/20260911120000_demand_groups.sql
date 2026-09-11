-- Grupos de elementos por área de atuação na Solicitação de Demandas.
--
-- Cada área (o `to_department` da demanda, que a tela chama de quadro) passa a
-- ter seus próprios grupos, renomeáveis. Eles substituem o status fixo como
-- forma de organizar as demandas. A coluna `status` NÃO é apagada: continua
-- existindo para permitir voltar atrás, e é mantida em sincronia quando a
-- demanda vai para um grupo que nasceu de um status (ver `legacy_status`).
--
-- Aplicar pelo SQL Editor ou pela Management API. Nunca `supabase db push`:
-- o histórico remoto de migrations está vazio.

-- 1. Tabela de grupos -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.demand_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#579BFC',
  position integer NOT NULL DEFAULT 0,
  -- Grupos em que o alerta de prazo não faz sentido (concluído, cancelado,
  -- esperando aprovação ou informação). Substitui a regra que olhava o status.
  pauses_deadline boolean NOT NULL DEFAULT false,
  -- De qual status o grupo nasceu na migração. Nulo nos grupos criados depois.
  legacy_status public.demand_status NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demand_groups_department_idx
  ON public.demand_groups (department, position);

-- 2. Ligação da demanda com o grupo ------------------------------------------
-- ON DELETE SET NULL: excluir um grupo nunca apaga demanda. Ela vai para
-- "Sem grupo" na tela.
ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS group_id uuid NULL
  REFERENCES public.demand_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS demands_group_id_idx ON public.demands (group_id);

-- 3. RLS: mesmas regras de quem mexe em demandas -----------------------------
ALTER TABLE public.demand_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Colaboradores can view demand groups" ON public.demand_groups;
CREATE POLICY "Colaboradores can view demand groups"
  ON public.demand_groups FOR SELECT
  USING (public.is_colaborador(auth.uid()));

DROP POLICY IF EXISTS "Colaboradores can create demand groups" ON public.demand_groups;
CREATE POLICY "Colaboradores can create demand groups"
  ON public.demand_groups FOR INSERT
  WITH CHECK (public.is_colaborador(auth.uid()));

DROP POLICY IF EXISTS "Colaboradores can update demand groups" ON public.demand_groups;
CREATE POLICY "Colaboradores can update demand groups"
  ON public.demand_groups FOR UPDATE
  USING (public.is_colaborador(auth.uid()));

DROP POLICY IF EXISTS "Colaboradores can delete demand groups" ON public.demand_groups;
CREATE POLICY "Colaboradores can delete demand groups"
  ON public.demand_groups FOR DELETE
  USING (public.is_colaborador(auth.uid()));

-- O dump da migração de abril não trouxe os GRANTs do schema public. Sem isto
-- a tabela nova fica invisível para o app mesmo com as políticas acima.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demand_groups TO authenticated;
GRANT ALL ON public.demand_groups TO service_role;

-- 4. Semente: os status atuais viram os grupos iniciais ----------------------
-- Só para as áreas que já têm demandas. Área sem demanda começa em branco.
-- Idempotente: rodar de novo não duplica grupo.
INSERT INTO public.demand_groups (department, name, color, position, pauses_deadline, legacy_status)
SELECT d.department, s.name, s.color, s.position, s.pauses_deadline, s.status
FROM (SELECT DISTINCT to_department AS department FROM public.demands) AS d
CROSS JOIN (VALUES
  ('pending'::public.demand_status,      'Pendente',           '#EAB308', 0, false),
  ('in_progress'::public.demand_status,  'Em Andamento',       '#3B82F6', 1, false),
  ('missing_info'::public.demand_status, 'Faltam Informações', '#F59E0B', 2, true),
  ('in_approval'::public.demand_status,  'Em Aprovação',       '#A855F7', 3, true),
  ('completed'::public.demand_status,    'Concluído',          '#22C55E', 4, true),
  ('cancelled'::public.demand_status,    'Cancelado',          '#EF4444', 5, true)
) AS s(status, name, color, position, pauses_deadline)
WHERE NOT EXISTS (
  SELECT 1 FROM public.demand_groups g
  WHERE g.department = d.department AND g.legacy_status = s.status
);

-- 5. Cada demanda vai para o grupo do seu status -----------------------------
-- Pode (e deve) rodar de novo logo depois do deploy da tela nova: entre aplicar
-- esta migração e publicar o frontend, a tela antiga continua mudando só o
-- `status`, e o grupo ficaria para trás. Aqui a demanda volta ao grupo do seu
-- status atual quando está sem grupo ou num grupo que nasceu de um status.
-- Demanda em grupo criado pela equipe (legacy_status nulo) não é tocada.
UPDATE public.demands AS dm
SET group_id = g.id
FROM public.demand_groups AS g
WHERE g.department = dm.to_department
  AND g.legacy_status = dm.status
  AND dm.group_id IS DISTINCT FROM g.id
  AND (
    dm.group_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.demand_groups AS atual
      WHERE atual.id = dm.group_id AND atual.legacy_status IS NOT NULL
    )
  );

-- 6. Realtime ----------------------------------------------------------------
-- demand_groups: grupo criado ou renomeado aparece para todos sem recarregar.
-- demand_comments / demands / demand_assignees: a tela já assina esses eventos,
-- mas eles não chegavam — por isso o comentário novo só aparecia ao reabrir a
-- demanda para quem estava com ela aberta.
DO $$
DECLARE
  tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY['demand_groups', 'demand_comments', 'demands', 'demand_assignees']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tabela
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tabela);
    END IF;
  END LOOP;
END $$;
