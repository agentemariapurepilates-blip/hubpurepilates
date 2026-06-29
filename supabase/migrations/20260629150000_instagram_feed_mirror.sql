-- Espelho (read-only) do Instagram oficial: tudo que JÁ foi publicado
-- (posts, reels, carrossel) + stories ativos. Populado pela Edge Function
-- `instagram-feed-sync`, que baixa a mídia para o nosso Storage (a URL do CDN
-- do Instagram expira). Visível a todos os usuários autenticados (inclui franqueados).

CREATE TABLE public.instagram_feed (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ig_media_id        TEXT UNIQUE NOT NULL,           -- id do post/story no Instagram (dedupe)
  kind               TEXT NOT NULL DEFAULT 'post',   -- 'post' | 'story'
  media_type         TEXT,                           -- IMAGE | VIDEO | CAROUSEL_ALBUM
  caption            TEXT,
  permalink          TEXT,                           -- link permanente do post
  ig_timestamp       TIMESTAMPTZ,                    -- data/hora de publicação
  media_url          TEXT,                           -- nossa cópia no Storage (mídia principal)
  thumbnail_url      TEXT,                           -- nossa cópia da thumb (vídeo)
  children           JSONB NOT NULL DEFAULT '[]',    -- carrossel: [{media_type, media_url}] no Storage
  original_media_url TEXT,                           -- URL original do IG (fallback/diagnóstico)
  synced_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX instagram_feed_timestamp_idx ON public.instagram_feed (ig_timestamp DESC);
CREATE INDEX instagram_feed_kind_idx ON public.instagram_feed (kind);

ALTER TABLE public.instagram_feed ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado vê (espelho é para todos). Escrita só via service role (o sync).
CREATE POLICY "Authenticated can view instagram feed"
ON public.instagram_feed
FOR SELECT TO authenticated
USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.instagram_feed;
