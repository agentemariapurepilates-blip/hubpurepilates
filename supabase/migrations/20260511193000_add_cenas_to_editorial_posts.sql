-- Adiciona coluna cenas para roteiros estruturados de video
ALTER TABLE editorial_posts
  ADD COLUMN IF NOT EXISTS cenas jsonb;

COMMENT ON COLUMN editorial_posts.cenas IS 'Array de cenas do roteiro de video. Cada cena: { numero, tempo, fala, textoTela, imagem }';
