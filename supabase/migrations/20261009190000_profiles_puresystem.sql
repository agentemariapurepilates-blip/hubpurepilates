-- Liga a pessoa do PureSystem ao perfil do Hub.
--
-- O guia de integração manda usar o `idUsuario` do PureSystem como chave da
-- pessoa, nunca o nome nem o login (regra 5): login e nome mudam, o id não.
--
-- A ligação é EXPLÍCITA: quem já tem conta no Hub entra uma vez pelo caminho de
-- sempre e vincula o PureSystem. O PureSystem não devolve e-mail, só id, nome e
-- login, então casar automaticamente com um perfil existente seria adivinhação
-- — e adivinhar errado entrega a conta de outra pessoa.
--
-- Aplicar pelo SQL Editor ou pela Management API. Nunca `supabase db push`.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS puresystem_id text NULL;

-- Um id do PureSystem pertence a um único perfil.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_puresystem_id_unico
  ON public.profiles (puresystem_id)
  WHERE puresystem_id IS NOT NULL;

COMMENT ON COLUMN public.profiles.puresystem_id IS
  'idUsuario no PureSystem. Preenchido quando a pessoa vincula a conta; é por ele que o login do PureSystem encontra o perfil. Nulo em quem nunca vinculou.';
