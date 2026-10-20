-- Registro das artes geradas no Pure GPT.
--
-- POR QUE EXISTE: é com isto que a rede enxerga o uso — quantas artes por dia,
-- quem está usando, o que está sendo pedido. O teto diário (a conversa de 19/10
-- falava em 217, uma por franqueado) NÃO está aplicado: a decisão foi medir
-- primeiro e escolher o número depois. Quando quiser ligar, a trava entra na
-- Edge Function, contando as linhas do dia desta tabela.
--
-- Aplicar pelo SQL Editor ou pela Management API. Nunca `supabase db push`.

CREATE TABLE IF NOT EXISTS public.pure_gpt_geracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Unidade que a pessoa escreveu na tela; não há cadastro de unidade no perfil.
  unidade text NULL,
  -- O que foi pedido ao gerador, já montado pelo agente.
  prompt text NOT NULL,
  proporcao text NOT NULL DEFAULT '1:1',
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- A consulta que o teto vai fazer é "quantas hoje": por data, e por pessoa.
-- Quantas tentativas a geração levou e se saiu aprovada. Entraram direto no
-- banco num ajuste de 19/10 e só depois vieram para cá: a Edge Function grava
-- nas duas, então sem elas aqui um banco recriado do repositório quebraria o
-- registro de uso. ADD COLUMN IF NOT EXISTS para rodar de novo sem erro.
ALTER TABLE public.pure_gpt_geracoes ADD COLUMN IF NOT EXISTS tentativas integer;
ALTER TABLE public.pure_gpt_geracoes ADD COLUMN IF NOT EXISTS aprovada boolean;

CREATE INDEX IF NOT EXISTS pure_gpt_geracoes_dia_idx ON public.pure_gpt_geracoes (criado_em DESC);
CREATE INDEX IF NOT EXISTS pure_gpt_geracoes_pessoa_idx ON public.pure_gpt_geracoes (user_id, criado_em DESC);

ALTER TABLE public.pure_gpt_geracoes ENABLE ROW LEVEL SECURITY;

-- Cada pessoa vê o que ela mesma gerou; quem cuida da rede vê tudo.
DROP POLICY IF EXISTS "Cada um ve as proprias geracoes" ON public.pure_gpt_geracoes;
CREATE POLICY "Cada um ve as proprias geracoes"
  ON public.pure_gpt_geracoes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Quem grava é a Edge Function, com a chave de serviço: não há policy de INSERT
-- de propósito, para ninguém inflar a contagem pelo navegador.

-- O dump da migração de abril não trouxe os GRANTs do schema public.
GRANT SELECT ON public.pure_gpt_geracoes TO authenticated;
GRANT ALL ON public.pure_gpt_geracoes TO service_role;
