-- 20260519100050_relink_rpc.sql
-- Função que atomicamente troca o ad set vinculado a uma unidade.
-- Se o ad set já estava ligado a outra unidade, remove esse vínculo primeiro,
-- tudo na mesma transação.
-- Retorna a unidade de onde o ad set foi removido (NULL se não havia).

CREATE OR REPLACE FUNCTION dpp_relink_ad_set(
  p_unit_id uuid,
  p_ad_set_id uuid,
  p_actor uuid
) RETURNS TABLE (moved_from_unit_id uuid)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_existing_unit uuid;
BEGIN
  -- Quem hoje tem esse ad set?
  SELECT unit_id INTO v_existing_unit
  FROM dpp_unit_ad_set_link WHERE ad_set_id = p_ad_set_id;

  -- Se já está na mesma unidade, no-op
  IF v_existing_unit = p_unit_id THEN
    RETURN QUERY SELECT NULL::uuid;
    RETURN;
  END IF;

  -- Remove o vínculo antigo do ad set (se houver) e da unidade atual (se houver outro ad set)
  DELETE FROM dpp_unit_ad_set_link WHERE ad_set_id = p_ad_set_id;
  DELETE FROM dpp_unit_ad_set_link WHERE unit_id = p_unit_id;

  -- Cria o novo
  INSERT INTO dpp_unit_ad_set_link (unit_id, ad_set_id, created_by)
  VALUES (p_unit_id, p_ad_set_id, p_actor);

  RETURN QUERY SELECT v_existing_unit;
END;
$$;

REVOKE EXECUTE ON FUNCTION dpp_relink_ad_set FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION dpp_relink_ad_set TO service_role;
