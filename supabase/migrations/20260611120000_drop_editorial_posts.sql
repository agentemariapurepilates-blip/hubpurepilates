-- Remove a tabela de posts editoriais.
-- Os agentes de conteúdo Instagram/Facebook e TikTok foram descontinuados;
-- só o Agente de Design e o Monitoramento permanecem. Esta tabela era usada
-- exclusivamente pelos agentes editoriais (generate-editorial-plan,
-- generate-post-content, refine-editorial-post), todos removidos.
DROP TABLE IF EXISTS public.editorial_posts CASCADE;
