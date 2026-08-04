-- Duas mudanças de regra pedidas em 04/08/2026, ambas na RLS porque o banco é
-- a autoridade — a tela só explica antes de o usuário tentar.
--
-- 1. PRAZO DE ALTERAÇÃO: era "48h antes da data", passa a ser "até as 23:59 do
--    dia anterior", ou seja, trava na meia-noite que inicia o dia da
--    inauguração. Travar dois dias antes impedia ajustes de véspera que não
--    atrapalham ninguém: o aviso ao marketing só sai às 03:00 do próprio dia,
--    então qualquer edição feita até a meia-noite ainda chega a tempo.
--
-- 2. AGENDAMENTO: a data não pode ser o mesmo dia da solicitação. Uma
--    inauguração criada hoje para hoje nasceria sem aviso — o e-mail das 03:00
--    daquele dia já teria passado — e o marketing nunca saberia. Esta regra NÃO
--    existia no banco: a política de INSERT não validava data nenhuma, então a
--    checagem era só de tela e dava para contornar chamando a API direto.
--
-- Sobre `(data_inauguracao)::timestamp AT TIME ZONE 'America/Sao_Paulo'`: a
-- coluna é `date`; o cast dá 00:00 daquele dia e o AT TIME ZONE interpreta esse
-- horário como sendo de São Paulo, devolvendo o timestamptz correspondente. É a
-- mesma âncora usada no lib/prazo.ts do front.

-- ---------------------------------------------------------------- UPDATE ----
drop policy if exists "Edita ate 48h antes; admin sempre" on public.inauguracao_requests;
drop policy if exists "Edita ate a vespera; admin sempre" on public.inauguracao_requests;

create policy "Edita ate a vespera; admin sempre"
  on public.inauguracao_requests
  for update
  using (
    has_role(auth.uid(), 'admin'::app_role)
    or (
      user_id = auth.uid()
      and now() < ((data_inauguracao)::timestamp at time zone 'America/Sao_Paulo')
    )
  )
  -- O WITH CHECK avalia a linha DEPOIS da alteração: é aqui que se impede mover
  -- uma solicitação para hoje (ou para trás). Sem ele, a checagem do USING
  -- olharia só a data antiga e a nova passaria sem validação.
  with check (
    has_role(auth.uid(), 'admin'::app_role)
    or (
      user_id = auth.uid()
      and data_inauguracao > (now() at time zone 'America/Sao_Paulo')::date
    )
  );

-- ---------------------------------------------------------------- DELETE ----
drop policy if exists "Exclui ate 48h antes; admin sempre" on public.inauguracao_requests;
drop policy if exists "Exclui ate a vespera; admin sempre" on public.inauguracao_requests;

create policy "Exclui ate a vespera; admin sempre"
  on public.inauguracao_requests
  for delete
  using (
    has_role(auth.uid(), 'admin'::app_role)
    or (
      user_id = auth.uid()
      and now() < ((data_inauguracao)::timestamp at time zone 'America/Sao_Paulo')
    )
  );

-- ---------------------------------------------------------------- INSERT ----
drop policy if exists "Colaborador cria em seu nome" on public.inauguracao_requests;

create policy "Colaborador cria em seu nome, a partir de amanha"
  on public.inauguracao_requests
  for insert
  with check (
    user_id = auth.uid()
    and (is_colaborador(auth.uid()) or has_role(auth.uid(), 'admin'::app_role))
    -- Vale inclusive para admin: uma solicitação para hoje ficaria sem aviso
    -- independentemente de quem a criou. Admin que precise disso avisa o
    -- marketing direto, que é o caminho que já existia antes desta tela.
    and data_inauguracao > (now() at time zone 'America/Sao_Paulo')::date
  );
