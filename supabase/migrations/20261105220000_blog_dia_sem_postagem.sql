-- Blog da Pure: excluir uma sugestão deixa o dia SEM POSTAGEM (pedido de
-- 05/11/2026). A linha fica com status 'descartada' e só a data: "Gerar
-- sugestões" vê o dia ocupado e não o preenche de novo. "Desfazer" apaga a
-- linha e o dia volta a ficar livre.
ALTER TABLE public.blog_artigos DROP CONSTRAINT IF EXISTS blog_artigos_status_check;
ALTER TABLE public.blog_artigos ADD CONSTRAINT blog_artigos_status_check
  CHECK (status IN (
    'sugestao', 'descartada', 'na_fila', 'gerando', 'falhou',
    'rascunho', 'em_aprovacao', 'ajustes', 'aprovado', 'publicado'
  ));
