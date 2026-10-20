-- Apresentação em PDF no aviso (20/10/2026).
--
-- O aviso já aceitava uma imagem de capa ou um vídeo do Drive. Faltava o caso
-- mais comum da rede: a apresentação de uma reunião, que hoje circula como link
-- solto de Drive e se perde.
--
-- SÃO DUAS COLUNAS, E A SEGUNDA NÃO É ENFEITE: `pdf_nome` guarda o nome do
-- arquivo como ele foi enviado. O caminho no storage é um carimbo de tempo
-- (`avisos/<user>/172…​.pdf`), então sem isto o botão de baixar ofereceria um
-- arquivo chamado "1792458800.pdf" — e quem baixa não saberia o que é.
--
-- Aplicar pelo SQL Editor ou pela Management API. Nunca `supabase db push`:
-- o histórico remoto de migrations está vazio.

ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS pdf_nome text;

COMMENT ON COLUMN public.avisos.pdf_url IS
  'URL pública do PDF no bucket post-images. O Hub renderiza as páginas com pdf.js, não embute o arquivo.';
COMMENT ON COLUMN public.avisos.pdf_nome IS
  'Nome original do arquivo enviado, para o botão de baixar entregar algo reconhecível.';
