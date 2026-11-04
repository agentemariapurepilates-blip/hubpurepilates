-- 20261104170000_dpp_varios_conjuntos_por_unidade.sql
-- Uma unidade pode ter MAIS DE UM conjunto de anúncio vinculado, e o relatório dela soma todos.
-- Motivo: um mesmo pedido de mídia adicional pode rodar em mais de uma campanha (ex.: São Gonçalo Alcântara, pedido de
-- 23/09/2026: começou num conjunto próprio e depois foi para a DCO das apartadas). Cada conjunto continua em UMA unidade
-- só (UNIQUE ad_set_id).
--
-- origem = 'calculado': conjunto que não existe na Meta, com as métricas calculadas a partir de outro (a parte de uma
-- unidade dentro de uma DCO de várias unidades, pelos itens do catálogo dela). As rotinas de sincronização pulam esses.

ALTER TABLE dpp_unit_ad_set_link DROP CONSTRAINT IF EXISTS dpp_unit_ad_set_link_unit_id_key;
CREATE INDEX IF NOT EXISTS idx_dpp_unit_ad_set_link_unit ON dpp_unit_ad_set_link(unit_id);

ALTER TABLE dpp_ad_sets ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'meta';
DO $$ BEGIN
  ALTER TABLE dpp_ad_sets ADD CONSTRAINT dpp_ad_sets_origem_check CHECK (origem IN ('meta', 'calculado'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Vincular agora ADICIONA o conjunto à unidade (antes trocava o que ela tinha). Se o conjunto estava em outra unidade,
-- sai de lá. Mesma assinatura e mesmo retorno, então a Edge Function dpp-admin-relink-ad-set não muda.
CREATE OR REPLACE FUNCTION dpp_relink_ad_set(
  p_unit_id uuid,
  p_ad_set_id uuid,
  p_actor uuid
) RETURNS TABLE (moved_from_unit_id uuid, was_noop boolean)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_existing_unit uuid;
BEGIN
  SELECT unit_id INTO v_existing_unit
  FROM dpp_unit_ad_set_link
  WHERE ad_set_id = p_ad_set_id
  FOR UPDATE;

  -- No-op: ad set já está nesta unidade
  IF v_existing_unit = p_unit_id THEN
    RETURN QUERY SELECT NULL::uuid, true;
    RETURN;
  END IF;

  IF v_existing_unit IS NOT NULL THEN
    DELETE FROM dpp_unit_ad_set_link
    WHERE ad_set_id = p_ad_set_id AND unit_id = v_existing_unit;
  END IF;

  INSERT INTO dpp_unit_ad_set_link (unit_id, ad_set_id, created_by)
  VALUES (p_unit_id, p_ad_set_id, p_actor);

  RETURN QUERY SELECT v_existing_unit, false;
END;
$$;

-- PUBLIC também: a função foi criada com o EXECUTE padrão do Postgres para PUBLIC, e o REVOKE de anon/authenticated
-- não tirava esse. Só a Edge Function (service_role) chama.
REVOKE EXECUTE ON FUNCTION dpp_relink_ad_set FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION dpp_relink_ad_set TO service_role;

-- O PostgREST passa a devolver dpp_unit_ad_set_link como lista (não mais objeto único).
NOTIFY pgrst, 'reload schema';
