-- 20260520000000_dpp_user_units_table.sql
-- Tabela de atribuição N-pra-N entre usuários do hub e unidades.
-- Substitui (no contexto do hub) o vínculo 1-pra-1 de dpp_profiles.unit_id,
-- que continua existindo pro projeto Dashboard Ads externo.

CREATE TABLE dpp_user_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES dpp_units(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, unit_id)
);

CREATE INDEX idx_dpp_user_units_user ON dpp_user_units(user_id);
CREATE INDEX idx_dpp_user_units_unit ON dpp_user_units(unit_id);

ALTER TABLE dpp_user_units ENABLE ROW LEVEL SECURITY;

-- Admin gerencia tudo (INSERT, UPDATE, DELETE, SELECT)
CREATE POLICY admin_manage_user_units ON dpp_user_units
  FOR ALL USING (dpp_is_admin()) WITH CHECK (dpp_is_admin());

-- Usuário comum só vê as próprias atribuições
CREATE POLICY user_select_own_assignments ON dpp_user_units
  FOR SELECT USING (user_id = auth.uid());

COMMENT ON TABLE dpp_user_units IS
  'Atribuições de acesso usuário do hub <-> unidade. Admin do hub gerencia. Usuário comum vê só as próprias linhas.';
