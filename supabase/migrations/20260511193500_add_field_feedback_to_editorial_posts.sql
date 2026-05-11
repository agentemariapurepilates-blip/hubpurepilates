-- Feedback granular por campo do post editorial.
-- Estrutura: { legenda: { status: 'approved'|'rejected', motivo?: string, at: string },
--             roteiro: { ... }, texto_arte: { ... }, briefing_arte: { ... } }
ALTER TABLE editorial_posts
  ADD COLUMN IF NOT EXISTS field_feedback jsonb;

COMMENT ON COLUMN editorial_posts.field_feedback IS 'Feedback granular por campo (legenda, roteiro, texto_arte, briefing_arte). Cada chave guarda status + motivo + timestamp.';

-- Tambem permite versao_editada armazenar briefing_arte (back-compat: jsonb ja aceita campo novo).
COMMENT ON COLUMN editorial_posts.versao_editada IS 'Versao editada manualmente pela usuaria. Chaves: legenda, roteiro, texto_arte, briefing_arte.';
