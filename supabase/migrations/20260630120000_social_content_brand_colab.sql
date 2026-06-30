-- Calendários de planejamento por marca na área de Colaboradores
-- (Studios / Academy / Franchising), reaproveitando social_media_content.
--   brand IS NULL  = planejamento geral (visível a todos, como hoje)
--   brand preenchido = calendário de marca (só colaboradores/admins)

ALTER TABLE public.social_media_content ADD COLUMN IF NOT EXISTS brand text;

ALTER TABLE public.social_media_content DROP CONSTRAINT IF EXISTS social_media_content_brand_check;
ALTER TABLE public.social_media_content ADD CONSTRAINT social_media_content_brand_check
  CHECK (brand IS NULL OR brand IN ('studios','academy','franchising'));

CREATE INDEX IF NOT EXISTS social_media_content_brand_idx ON public.social_media_content (brand);

-- Leitura: linhas gerais (brand NULL) continuam visíveis a todos; linhas de marca
-- só aparecem para colaboradores/admins (franqueado não vê).
DROP POLICY IF EXISTS "Content viewable by authenticated" ON public.social_media_content;
CREATE POLICY "Content viewable by authenticated"
ON public.social_media_content
FOR SELECT TO authenticated
USING (brand IS NULL OR public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
