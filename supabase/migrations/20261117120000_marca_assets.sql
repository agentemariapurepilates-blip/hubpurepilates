-- Assets de marca (17/11/2026): a biblioteca de logos e elementos da marca,
-- organizada por unidade de negócio, como os kits de marca do Canva.
--
-- QUEM VÊ: só o time (colaborador ou admin) lista e gerencia a biblioteca.
-- Franqueado não lê esta tabela: quem escolhe o logo de uma arte é o agente do
-- Pure Design (Edge Function, com service role), que devolve só o endereço do
-- logo escolhido. Por isso o bucket é público para LEITURA POR ENDEREÇO (a arte
-- do franqueado precisa mostrar o logo), mas não há política de listagem para
-- quem não é do time.

CREATE TABLE IF NOT EXISTS public.marca_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Unidade de negócio (a "pasta"): Pure Pilates, Pure Store, Pure Academy…
  unidade text NOT NULL,
  -- Subpasta opcional dentro da unidade (ex.: "Coleção Move" dentro de Pure Store).
  subpasta text,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'logo' CHECK (tipo IN ('logo', 'selo', 'grafismo', 'icone', 'outro')),
  -- Quando usar: é o que o agente lê para decidir qual asset entra na arte.
  descricao text NOT NULL DEFAULT '',
  arquivo_path text NOT NULL,
  url text NOT NULL,
  largura int,
  altura int,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marca_assets_unidade_idx ON public.marca_assets (unidade, subpasta);

ALTER TABLE public.marca_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Time le assets de marca" ON public.marca_assets FOR SELECT TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Time cria assets de marca" ON public.marca_assets FOR INSERT TO authenticated
  WITH CHECK (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Time edita assets de marca" ON public.marca_assets FOR UPDATE TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Time apaga assets de marca" ON public.marca_assets FOR DELETE TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.marca_assets_touch() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS marca_assets_touch ON public.marca_assets;
CREATE TRIGGER marca_assets_touch BEFORE UPDATE ON public.marca_assets
  FOR EACH ROW EXECUTE FUNCTION public.marca_assets_touch();

-- Bucket: leitura por endereço é pública (o logo aparece na arte de qualquer
-- unidade); enviar, trocar e apagar é só do time. Sem política de SELECT para
-- quem não é do time, a pasta não pode ser listada por franqueados.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('marca-assets', 'marca-assets', true, 20971520)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Time lista assets de marca" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'marca-assets' AND (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Time envia assets de marca" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marca-assets' AND (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Time troca assets de marca" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'marca-assets' AND (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Time apaga assets de marca" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'marca-assets' AND (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin')));
