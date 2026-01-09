-- Adicionar tipo de post para diferenciar Feed da Sede de Novidades do Mês
ALTER TABLE posts ADD COLUMN post_type text DEFAULT 'feed';

-- Criar index para performance
CREATE INDEX idx_posts_post_type ON posts(post_type);

-- Garantir que posts existentes são do tipo 'feed'
UPDATE posts SET post_type = 'feed' WHERE post_type IS NULL;