-- 20260520000010_dpp_user_units_rls.sql
-- Substitui as policies de SELECT pra "franqueado" (1-pra-1 via dpp_user_unit_id())
-- por policies baseadas em dpp_user_units (N-pra-N).
-- Admin (dpp_is_admin()) continua vendo tudo como antes.

-- dpp_units
DROP POLICY IF EXISTS franqueado_select_own_unit ON dpp_units;
CREATE POLICY user_select_assigned_unit ON dpp_units FOR SELECT
  USING (id IN (SELECT unit_id FROM dpp_user_units WHERE user_id = auth.uid()));

-- dpp_ad_sets
DROP POLICY IF EXISTS franqueado_select_own_ad_set ON dpp_ad_sets;
CREATE POLICY user_select_assigned_ad_sets ON dpp_ad_sets FOR SELECT
  USING (id IN (
    SELECT l.ad_set_id
    FROM dpp_unit_ad_set_link l
    JOIN dpp_user_units uu ON uu.unit_id = l.unit_id
    WHERE uu.user_id = auth.uid()
  ));

-- dpp_unit_ad_set_link
DROP POLICY IF EXISTS franqueado_select_own_link ON dpp_unit_ad_set_link;
CREATE POLICY user_select_assigned_links ON dpp_unit_ad_set_link FOR SELECT
  USING (unit_id IN (SELECT unit_id FROM dpp_user_units WHERE user_id = auth.uid()));

-- dpp_ad_set_daily_metrics
DROP POLICY IF EXISTS franqueado_select_own_metrics ON dpp_ad_set_daily_metrics;
CREATE POLICY user_select_assigned_metrics ON dpp_ad_set_daily_metrics FOR SELECT
  USING (ad_set_id IN (
    SELECT l.ad_set_id
    FROM dpp_unit_ad_set_link l
    JOIN dpp_user_units uu ON uu.unit_id = l.unit_id
    WHERE uu.user_id = auth.uid()
  ));
