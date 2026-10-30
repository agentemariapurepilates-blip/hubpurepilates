-- Data de gravação das tarefas (29/10/2026). Usada no setor Gravações, onde
-- a data em que o conteúdo é gravado é diferente do prazo de entrega.
-- Aplicada pela Management API (o histórico remoto de migrações está vazio;
-- nunca usar `supabase db push` neste projeto).
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS recording_date DATE;

COMMENT ON COLUMN public.demands.recording_date IS
  'Data em que a gravação acontece (setor Gravações). Diferente de deadline, que é o prazo de entrega.';
