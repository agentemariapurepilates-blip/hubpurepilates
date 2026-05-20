-- 20260519100200_rls_policies.sql
-- Ativa RLS e define policies.
-- Admin: SELECT em tudo.
-- Franqueado: SELECT apenas no que pertence à própria unidade.
-- INSERT/UPDATE/DELETE: somente via service_role (sem policies = bloqueado pro cliente).

ALTER TABLE dpp_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpp_ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpp_unit_ad_set_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpp_ad_set_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpp_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpp_sync_logs ENABLE ROW LEVEL SECURITY;

-- dpp_units
CREATE POLICY admin_select_units ON dpp_units FOR SELECT USING (dpp_is_admin());
CREATE POLICY franqueado_select_own_unit ON dpp_units FOR SELECT
  USING (id = dpp_user_unit_id());

-- dpp_campaigns: somente admin
CREATE POLICY admin_select_campaigns ON dpp_campaigns FOR SELECT USING (dpp_is_admin());

-- dpp_ad_sets
CREATE POLICY admin_select_ad_sets ON dpp_ad_sets FOR SELECT USING (dpp_is_admin());
CREATE POLICY franqueado_select_own_ad_set ON dpp_ad_sets FOR SELECT
  USING (id IN (SELECT ad_set_id FROM dpp_unit_ad_set_link WHERE unit_id = dpp_user_unit_id()));

-- dpp_unit_ad_set_link
CREATE POLICY admin_select_links ON dpp_unit_ad_set_link FOR SELECT USING (dpp_is_admin());
CREATE POLICY franqueado_select_own_link ON dpp_unit_ad_set_link FOR SELECT
  USING (unit_id = dpp_user_unit_id());

-- dpp_ad_set_daily_metrics
CREATE POLICY admin_select_metrics ON dpp_ad_set_daily_metrics FOR SELECT USING (dpp_is_admin());
CREATE POLICY franqueado_select_own_metrics ON dpp_ad_set_daily_metrics FOR SELECT
  USING (ad_set_id IN (SELECT ad_set_id FROM dpp_unit_ad_set_link WHERE unit_id = dpp_user_unit_id()));

-- dpp_profiles: vê só o próprio (admin vê todos)
CREATE POLICY admin_select_profiles ON dpp_profiles FOR SELECT USING (dpp_is_admin());
CREATE POLICY user_select_own_profile ON dpp_profiles FOR SELECT USING (id = auth.uid());

-- dpp_sync_logs: somente admin
CREATE POLICY admin_select_sync_logs ON dpp_sync_logs FOR SELECT USING (dpp_is_admin());
