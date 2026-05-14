-- Saude de Marca: relatorios mensais de NPS adaptado (Buzz Monitor) por plataforma.
-- Populado pelo workflow n8n; consumido pela pagina Saude de Marca no Hub.

CREATE TABLE public.brand_health_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  period_year int NOT NULL CHECK (period_year BETWEEN 2024 AND 2100),
  period_month int NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'total')),

  comments_total int NOT NULL DEFAULT 0 CHECK (comments_total >= 0),
  promoters_count int NOT NULL DEFAULT 0 CHECK (promoters_count >= 0),
  promoters_pct numeric(5,2) NOT NULL DEFAULT 0 CHECK (promoters_pct BETWEEN 0 AND 100),
  neutrals_count int NOT NULL DEFAULT 0 CHECK (neutrals_count >= 0),
  neutrals_pct numeric(5,2) NOT NULL DEFAULT 0 CHECK (neutrals_pct BETWEEN 0 AND 100),
  detractors_count int NOT NULL DEFAULT 0 CHECK (detractors_count >= 0),
  detractors_pct numeric(5,2) NOT NULL DEFAULT 0 CHECK (detractors_pct BETWEEN 0 AND 100),
  excluded_count int NOT NULL DEFAULT 0 CHECK (excluded_count >= 0),

  health_score numeric(5,2) GENERATED ALWAYS AS (((promoters_pct - detractors_pct) + 100) / 2) STORED,
  net_sentiment numeric(6,2) GENERATED ALWAYS AS (promoters_pct - detractors_pct) STORED,

  volume_index numeric(6,3),
  engagement_weighted_sentiment numeric(6,2),

  top_themes_positive jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_themes_negative jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_units_positive jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_units_negative jsonb NOT NULL DEFAULT '[]'::jsonb,
  critical_alerts jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,

  limitations text,
  raw_report_md text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (period_year, period_month, platform)
);

CREATE INDEX brand_health_reports_period_idx
  ON public.brand_health_reports (period_year DESC, period_month DESC, platform);

COMMENT ON TABLE public.brand_health_reports IS
  'Relatorios mensais de Saude de Marca (NPS adaptado). Uma linha por mes/plataforma. Populado pelo n8n.';
COMMENT ON COLUMN public.brand_health_reports.platform IS
  'instagram | tiktok | total (linha agregada das duas plataformas)';
COMMENT ON COLUMN public.brand_health_reports.health_score IS
  'Calculado: ((promoters_pct - detractors_pct) + 100) / 2. Escala 0-100.';
COMMENT ON COLUMN public.brand_health_reports.top_themes_positive IS
  'Array: [{ tema: string, volume: int, citacao: string }]';
COMMENT ON COLUMN public.brand_health_reports.recommendations IS
  'Array: [{ o_que: string, por_que: string, quem: string, prazo: string, prioridade: "alta"|"media"|"baixa" }]';

CREATE TRIGGER brand_health_reports_set_updated_at
  BEFORE UPDATE ON public.brand_health_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.brand_health_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view brand health reports"
  ON public.brand_health_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert brand health reports"
  ON public.brand_health_reports FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update brand health reports"
  ON public.brand_health_reports FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete brand health reports"
  ON public.brand_health_reports FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
