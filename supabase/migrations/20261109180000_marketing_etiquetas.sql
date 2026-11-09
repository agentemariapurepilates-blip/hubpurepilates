-- Etiquetas dos Projetos do marketing (pedido de 09/11/2026): uma lista única do
-- time, com cor, para criar, recolorir e excluir — como no ClickUp. O item guarda
-- só os nomes (marketing_itens.etiquetas); excluir uma etiqueta tira ela de todos
-- os itens.

CREATE TABLE IF NOT EXISTS public.marketing_etiquetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE CHECK (length(btrim(nome)) > 0),
  cor text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_etiquetas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colaborador mantem etiquetas de marketing" ON public.marketing_etiquetas;
CREATE POLICY "Colaborador mantem etiquetas de marketing" ON public.marketing_etiquetas FOR ALL TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_etiquetas TO authenticated;
GRANT ALL ON public.marketing_etiquetas TO service_role;

-- As etiquetas que já estão em uso entram na lista.
INSERT INTO public.marketing_etiquetas (nome)
SELECT DISTINCT unnest(etiquetas) FROM public.marketing_itens
ON CONFLICT (nome) DO NOTHING;

-- Exclui a etiqueta da lista e de todos os itens. Roda com a permissão de quem
-- chama (a RLS das duas tabelas vale normalmente).
CREATE OR REPLACE FUNCTION public.marketing_excluir_etiqueta(p_nome text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  UPDATE marketing_itens SET etiquetas = array_remove(etiquetas, p_nome) WHERE p_nome = ANY (etiquetas);
  DELETE FROM marketing_etiquetas WHERE nome = p_nome;
$$;
GRANT EXECUTE ON FUNCTION public.marketing_excluir_etiqueta(text) TO authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_etiquetas;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
