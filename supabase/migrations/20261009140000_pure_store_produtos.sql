-- Lista de produtos do GERADOR DE PEDIDOS (lado interno da Pure Store).
--
-- POR QUE ESTA TABELA EXISTE (pedido da usuária em 09/10/2026):
-- até aqui o gerador de pedidos e o catálogo do franqueado liam o MESMO arquivo
-- (src/data/pureStoreCatalogo.ts, gerado da loja). Eram a mesma lista, então
-- mexer num mexia no outro: produto B2B aparecia para o aluno e item interno só
-- entrava se existisse na loja. São coisas diferentes e passam a viver separadas.
--
-- O catálogo do franqueado continua vindo da loja, pelo script de sempre.
-- Esta lista é só do pedido interno e quem mantém é o próprio colaborador, pela
-- aba Produtos em /colaborador/pure-store/produtos — sem depender de deploy.
--
-- O preço daqui entra preenchido no pedido, mas continua editável na tela:
-- campanha e tabela do franqueado mudam de preço sem a lista mudar.

CREATE TABLE IF NOT EXISTS public.pure_store_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL CHECK (length(btrim(nome)) > 1),
  preco numeric(10,2) NOT NULL CHECK (preco >= 0),
  grupo text NOT NULL DEFAULT 'Outros',
  -- Desliga o item na busca sem apagar o histórico de quem já pediu.
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  criado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Nome é a identidade do produto na busca e no pedido: não pode repetir.
  CONSTRAINT pure_store_produtos_nome_unico UNIQUE (nome)
);

DROP TRIGGER IF EXISTS update_pure_store_produtos_updated_at ON public.pure_store_produtos;
CREATE TRIGGER update_pure_store_produtos_updated_at
  BEFORE UPDATE ON public.pure_store_produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.pure_store_produtos ENABLE ROW LEVEL SECURITY;

-- Mesma regra do resto do gerador de pedidos: é ferramenta de colaborador.
DROP POLICY IF EXISTS "Colaborador ve os produtos" ON public.pure_store_produtos;
CREATE POLICY "Colaborador ve os produtos"
  ON public.pure_store_produtos FOR SELECT TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Colaborador mantem os produtos" ON public.pure_store_produtos;
CREATE POLICY "Colaborador mantem os produtos"
  ON public.pure_store_produtos FOR ALL TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- O dump da migração de abril não trouxe os GRANTs do schema public.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pure_store_produtos TO authenticated;
GRANT ALL ON public.pure_store_produtos TO service_role;

-- Semente: a lista como ela estava no gerador (uniformes + catálogo publicado)
-- mais os 12 itens enviados em 09/10/2026, com o nome e o preço que vieram no
-- pedido. ON CONFLICT para a migração poder rodar duas vezes sem estragar nada.
INSERT INTO public.pure_store_produtos (nome, preco, grupo) VALUES
  ('Camiseta Manga Curta', 60.00, 'Uniformes'),
  ('Camiseta Manga Longa', 65.00, 'Uniformes'),
  ('Polo Adm', 70.00, 'Uniformes'),
  ('Canga Pure Pilates - Farm', 109.90, 'Acessórios'),
  ('Bolsa de Praia Pure - Farm', 152.90, 'Acessórios'),
  ('Copo Térmico Pure Flow — Cinza', 84.90, 'Acessórios'),
  ('Meia Natal - Rena', 39.90, 'Meias'),
  ('Meia Natal - Papai Noel Pilateiro', 39.90, 'Meias'),
  ('Sapatilhas Natalinas', 44.90, 'Meias'),
  ('Meia Stripes', 44.90, 'Meias'),
  ('Nécessaire Pure Pilates Duo — Cinza Escuro', 69.90, 'Acessórios'),
  ('Bolsa de Praia Pure - Summer', 152.90, 'Acessórios'),
  ('Canga Pure — Summer Pilates', 109.90, 'Acessórios'),
  ('Kit Inauguração Arara de Vendas', 1999.00, 'Pure Box'),
  ('Kit Inauguração Brindes', 199.90, 'Pure Box'),
  ('Body Baby Pure Pilates - Infantil', 49.90, 'Outros'),
  ('Bolsa Esportiva Pure Pilates 2 em 1 - 33L Impermeável', 199.90, 'Acessórios'),
  ('Boné Techfit - Preto', 59.90, 'Acessórios'),
  ('Calça Legging Feminina Cós Alto Burgundy - Boneco Lateral - Zero Transparência', 159.90, 'Lançamentos'),
  ('Camiseta Feminina Dry Fit - Boa Ideia', 89.90, 'Camisetas'),
  ('Camiseta Feminina Dry Fit - Coração Pilateiro', 89.90, 'Camisetas'),
  ('Camiseta Feminina Dry Fit - Logo Dourado Oversized - Burgundy', 134.90, 'Camisetas'),
  ('Camiseta Feminina Dry Fit - Pilates Lateral', 89.90, 'Camisetas'),
  ('Camiseta Masculina Dry Fit - Aparelhos', 89.90, 'Camisetas'),
  ('Camiseta Cinza Masculina Dry Fit - Coleção Verão 2025 | Conforto e Estilo Casual', 89.90, 'Camisetas'),
  ('Camiseta Masculina Dry Fit - Pilates Lateral', 89.90, 'Camisetas'),
  ('Eco Bag - Melhor hora do seu Dia', 22.90, 'Acessórios'),
  ('Garrafa Térmica Aço Inox Prata 750ml - "A Mente Que Esculpe O Corpo"', 49.90, 'Acessórios'),
  ('Garrafa Térmica Aço Inox Preta 750ml - "A Mente Que Esculpe O Corpo"', 49.90, 'Acessórios'),
  ('Macaquinho Fitness Curto - Burgundy Costas Trançadas', 189.90, 'Lançamentos'),
  ('Top Fitness Feminino Nadador Pure Pilates - Burgundy - Alta Sustentação', 109.90, 'Lançamentos'),
  ('Bolsa Térmica Cinza - Pure Pilates', 69.90, 'Acessórios'),
  ('Bolsa Térmica Preta - Pure Pilates', 69.90, 'Acessórios'),
  ('Moletom Feminino Flanelado Canguru - A Melhor Hora do Seu Dia', 169.90, 'Moletons'),
  ('Moletom Masculino Flanelado Canguru Pure Pilates - A Melhor Hora do Seu Dia', 169.90, 'Moletons'),
  ('Regata Feminina Posições - Leve e Secagem Rápida', 84.90, 'Camisetas'),
  ('Regata Feminina Palavras - Leve e Secagem Rápida', 84.90, 'Camisetas'),
  ('Regata Feminina Batidas - Leve e Secagem Rápida', 84.90, 'Camisetas'),
  ('Meia Antiderrapante Boneco - Cano Curto Cinza', 39.90, 'Acessórios'),
  ('Meia Antiderrapante Boneco - Cano Curto Preta', 39.90, 'Acessórios'),
  ('Meia Antiderrapante Logo - Cano Curto Cinza', 39.90, 'Acessórios'),
  ('Meia Antiderrapante Logo - Cano Curto Preta', 39.90, 'Acessórios'),
  ('Meia Feminina Sapatilha Boneco - Soquete Preta', 44.90, 'Acessórios'),
  ('Meia Feminina Sapatilha Logo - Soquete Preta', 44.90, 'Acessórios'),
  ('Viseira Esportiva Pure Pilates Preta com Logo Emborrachado', 54.90, 'Acessórios'),
  ('Corta Vento Feminino Impermeável com Capuz', 259.90, 'Lançamentos'),
  ('Legging Fitness Alta Compressão com Recortes Anatômicos', 179.90, 'Lançamentos'),
  ('Jaqueta Fitness em Poliamida', 239.90, 'Lançamentos'),
  ('Top Fitness em Poliamida com Sustentação', 109.90, 'Lançamentos'),
  ('Corta Vento Feminino Cinza com Capuz', 259.90, 'Lançamentos'),
  ('Camiseta Fitness Feminina Cinza', 99.90, 'Camisetas'),
  ('Jaqueta de Moletom Preta Masculina', 249.90, 'Moletons'),
  ('Calça de Moletom Preta Masculina', 209.90, 'Moletons'),
  ('Camiseta Fitness Preta Masculina', 99.90, 'Lançamentos'),
  ('Conjunto Fitness Feminino (Top + Legging)', 269.90, 'Legging'),
  ('Moletom Feminino Pure Pilates - Capuz e Bolso Canguru', 169.90, 'Moletons'),
  ('Moletom Masculino Pure Pilates - Essencial para sua rotina', 169.90, 'Moletons'),
  ('Tapete Premium Pure Pilates em TPE Ecológico com Bolsa de Transporte', 149.90, 'Acessórios'),
  ('Sapatilha Preta Antiderrapante Pure Pilates Love – Estabilidade para sua Prática', 44.90, 'Acessórios'),
  ('Sapatilha Cinza Antiderrapante Pure Pilates Love – Estabilidade para sua Prática', 44.90, 'Acessórios'),
  ('Camiseta Feminina Smile - Conforto e Estilo para o Dia a Dia', 99.90, 'Camisetas'),
  ('Camiseta Feminina Mais Café - Conforto para Todos os Momentos', 99.90, 'Camisetas'),
  ('Camiseta Feminina Pure Pilates Estampa Lateral - Minimalista e Atemporal', 99.90, 'Camisetas'),
  ('Camiseta Feminina Pure Pilates Não Pira, Respira - Conforto e Bem-Estar', 99.90, 'Camisetas'),
  ('Camiseta Masculina Pilates Lateral - Conforto e Estilo para o Movimento', 99.90, 'Camisetas'),
  ('Camiseta Masculina Pure Pilates Find Your Balance - Vista Seu Equilíbrio', 99.90, 'Camisetas'),
  ('Bolsa Térmica Pure Cinza 10L - Funcionalidade para uma Rotina em Movimento', 84.90, 'Acessórios'),
  ('Bolsa Térmica Pure 8L - Leve Suas Refeições com Mais Estilo', 79.90, 'Acessórios'),
  ('Garrafa Pure Pilates Essencial 800ML — Cinza Claro', 64.90, 'Acessórios'),
  ('Garrafa Térmica 800ML Pure Pilates — Preta', 84.90, 'Acessórios'),
  ('Garrafa Pure Pilates Essencial — Cinza Escuro', 64.90, 'Acessórios')
ON CONFLICT (nome) DO NOTHING;
