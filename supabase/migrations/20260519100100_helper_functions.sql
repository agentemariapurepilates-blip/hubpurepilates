-- 20260519100100_helper_functions.sql
-- Funções SECURITY DEFINER usadas pelas policies RLS.

CREATE OR REPLACE FUNCTION dpp_is_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM dpp_profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION dpp_user_unit_id() RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT unit_id FROM dpp_profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION dpp_is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION dpp_user_unit_id() TO anon, authenticated;
