-- 20260519100000_create_dpp_tables.sql
-- Cria todas as tabelas com prefixo dpp_ (Dash Pure Pilates).
-- Não conflita com outro dashboard que já usa este Supabase.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS dpp_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE NOT NULL,
  nome text NOT NULL,
  cidade text,
  bairro text,
  uf char(2),
  latitude numeric,
  longitude numeric,
  ativa_dashboard boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  removed_from_source boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dpp_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_campaign_id text UNIQUE NOT NULL,
  nome text NOT NULL,
  objetivo text,
  status text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dpp_ad_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_ad_set_id text UNIQUE NOT NULL,
  campaign_id uuid REFERENCES dpp_campaigns(id) ON DELETE SET NULL,
  nome text NOT NULL,
  status text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dpp_ad_sets_campaign ON dpp_ad_sets(campaign_id);

CREATE TABLE IF NOT EXISTS dpp_unit_ad_set_link (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL UNIQUE REFERENCES dpp_units(id) ON DELETE CASCADE,
  ad_set_id uuid NOT NULL UNIQUE REFERENCES dpp_ad_sets(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dpp_ad_set_daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_set_id uuid NOT NULL REFERENCES dpp_ad_sets(id) ON DELETE CASCADE,
  date date NOT NULL,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  spend numeric(12,2) NOT NULL DEFAULT 0,
  results integer NOT NULL DEFAULT 0,
  reach bigint NOT NULL DEFAULT 0,
  cpm numeric(10,2),
  cpc numeric(10,2),
  cost_per_result numeric(10,2),
  is_partial boolean NOT NULL DEFAULT false,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ad_set_id, date)
);
CREATE INDEX IF NOT EXISTS idx_dpp_metrics_date ON dpp_ad_set_daily_metrics(date);

CREATE TABLE IF NOT EXISTS dpp_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'franqueado')),
  unit_id uuid REFERENCES dpp_units(id) ON DELETE RESTRICT,
  nome text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT role_unit_consistency CHECK (
    (role = 'admin' AND unit_id IS NULL) OR
    (role = 'franqueado' AND unit_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_dpp_profiles_unit ON dpp_profiles(unit_id);
CREATE INDEX IF NOT EXISTS idx_dpp_profiles_email ON dpp_profiles(email);

CREATE TABLE IF NOT EXISTS dpp_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('units', 'ad_sets_catalog', 'meta', 'backfill')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL CHECK (status IN ('running', 'success', 'partial', 'error')),
  summary jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_dpp_sync_logs_kind ON dpp_sync_logs(kind, started_at DESC);

-- trigger genérico de updated_at
CREATE OR REPLACE FUNCTION dpp_set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_dpp_units_updated_at BEFORE UPDATE ON dpp_units
    FOR EACH ROW EXECUTE FUNCTION dpp_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_dpp_campaigns_updated_at BEFORE UPDATE ON dpp_campaigns
    FOR EACH ROW EXECUTE FUNCTION dpp_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_dpp_ad_sets_updated_at BEFORE UPDATE ON dpp_ad_sets
    FOR EACH ROW EXECUTE FUNCTION dpp_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
