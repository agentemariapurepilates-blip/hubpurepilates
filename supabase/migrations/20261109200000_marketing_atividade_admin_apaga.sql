-- Projetos do marketing: admin pode apagar linhas do histórico de alterações, para
-- não poluir a coluna de comentários (pedido de 09/11/2026). Só o histórico; os
-- comentários continuam com a regra de cada autor apagar o seu.
DROP POLICY IF EXISTS "Admin apaga o historico de marketing" ON public.marketing_atividade;
CREATE POLICY "Admin apaga o historico de marketing" ON public.marketing_atividade FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
GRANT DELETE ON public.marketing_atividade TO authenticated;
