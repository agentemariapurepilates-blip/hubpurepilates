-- 20260519100150_fix_relink_rpc.sql
-- Corrige dpp_relink_ad_set para usar ON CONFLICT DO UPDATE em vez de
-- DELETE+INSERT, preservando o id e atendendo o spec
-- (docs/superpowers/specs/2026-05-19-dashboard-ads-unidades-design.md L135).
-- Também retorna was_noop para o caller distinguir o caso "já vinculado".
-- Precisa DROP antes pois mudamos a assinatura de retorno (TABLE com 2 colunas).

DROP FUNCTION IF EXISTS dpp_relink_ad_set(uuid, uuid, uuid);

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
  -- Lock the ad_set row (if any) and read its current unit
  SELECT unit_id INTO v_existing_unit
  FROM dpp_unit_ad_set_link
  WHERE ad_set_id = p_ad_set_id
  FOR UPDATE;

  -- No-op: ad set já está nesta unidade
  IF v_existing_unit = p_unit_id THEN
    RETURN QUERY SELECT NULL::uuid, true;
    RETURN;
  END IF;

  -- Se o ad set estava em outra unidade, libera lá deletando aquela linha
  -- (não temos como UPDATE ad_set_id para NULL porque NOT NULL impede)
  IF v_existing_unit IS NOT NULL THEN
    DELETE FROM dpp_unit_ad_set_link
    WHERE ad_set_id = p_ad_set_id AND unit_id = v_existing_unit;
  END IF;

  -- Upsert na unidade alvo: se ela já tinha um vínculo, ATUALIZA preservando id
  -- (apenas troca o ad_set_id e reseta created_at conforme spec). Se não tinha, INSERT.
  INSERT INTO dpp_unit_ad_set_link (unit_id, ad_set_id, created_by)
  VALUES (p_unit_id, p_ad_set_id, p_actor)
  ON CONFLICT (unit_id) DO UPDATE
    SET ad_set_id = EXCLUDED.ad_set_id,
        created_by = EXCLUDED.created_by,
        created_at = now();

  RETURN QUERY SELECT v_existing_unit, false;
END;
$$;

REVOKE EXECUTE ON FUNCTION dpp_relink_ad_set FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION dpp_relink_ad_set TO service_role;
