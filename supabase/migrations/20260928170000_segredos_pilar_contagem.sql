-- Número de visualizações por episódio, para o "olhinho" na tela.
--
-- Pedido do usuário em 28/09/2026: TODO MUNDO vê o número em cada episódio,
-- mas só colaborador/admin vê QUEM viu. A tabela segredos_pilar_views continua
-- fechada para o franqueado (RLS); esta função devolve apenas a contagem.
--
-- SECURITY DEFINER de propósito: é o que permite contar linhas que quem chama
-- não pode ler. Devolve só drive_id + total, nunca user_id.
--
-- Aplicar pelo SQL Editor ou pela Management API. Nunca `supabase db push`:
-- o histórico remoto de migrations está vazio.

CREATE OR REPLACE FUNCTION public.segredos_pilar_contagem()
RETURNS TABLE (drive_id text, total bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.drive_id, count(*)::bigint
  FROM public.segredos_pilar_views v
  GROUP BY v.drive_id
$$;

REVOKE ALL ON FUNCTION public.segredos_pilar_contagem() FROM public;
GRANT EXECUTE ON FUNCTION public.segredos_pilar_contagem() TO authenticated;
