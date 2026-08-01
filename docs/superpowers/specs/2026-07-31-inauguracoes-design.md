# Inaugurações — Design Spec

**Data:** 2026-07-31
**Status:** Decisões tomadas pelo Claude a pedido do usuário ("tudo será SIM, sem questionamentos")

---

## 1. Objetivo

Hoje, para montar campanha de inauguração de uma unidade, o colaborador precisa procurar o marketing e passar as informações por conversa. Esta tela substitui esse vaivém: o colaborador preenche um formulário com os dados da unidade, e o marketing recebe tudo estruturado, num lugar só.

## 2. Escopo

Uma tela `/inauguracoes` com **duas abas**:

1. **Nova solicitação** — formulário com: nome da unidade, ID da unidade, endereço, nome e e-mail do solicitante, data de inauguração.
2. **Solicitações** — lista. Colaborador vê só as suas; admin vê todas.

**Regra de alteração:**

| Quem | Quando pode editar/excluir |
|---|---|
| Colaborador | até **48 horas antes** da data de inauguração |
| Colaborador, dentro das 48h | não pode — a linha mostra *"Para alterar, entre em contato com o marketing."* |
| Admin | sempre |

**Somente colaboradores criam solicitações.** Franqueado não acessa a tela.

### Fora de escopo

- Fluxo de aprovação, status, notificação por e-mail ao marketing. A tela registra; avisar é outro assunto.
- Vínculo com a tabela `dpp_units` ou com o cadastro de unidades. O ID da unidade é texto livre — quem preenche sabe qual é.
- Anexos.

## 3. Decisões tomadas, e por quê

| Decisão | Escolha | Razão |
|---|---|---|
| Onde fica no menu | Item **"Inaugurações"** dentro da seção **Colaboradores** que já existe | É recurso exclusivo de colaborador, e a seção já tem exatamente essa trava. Criar uma seção de um item só repetiria o incômodo que já apareceu neste projeto. Virar seção própria é mudança de uma linha, se preferir. |
| Onde a regra das 48h é aplicada | **No banco (RLS) e na interface** | Só na interface seria decorativo: qualquer pessoa com o console do navegador aberto contorna. A regra protege o trabalho do marketing, então mora no banco. A interface repete a regra para explicar, não para proteger. |
| Fuso da data | Inauguração começa **00:00 em São Paulo**; o bloqueio é 48h antes disso | `data_inauguracao` é uma data, sem hora — o prazo precisa de um instante para existir. O Brasil não tem horário de verão desde 2019, então `-03:00` é fixo e a conta é a mesma nos dois lados. |
| Solicitante | Pré-preenchido com o usuário logado, **editável** | O caso comum é preencher para si; o caso real inclui preencher para outra pessoa. |
| Tabela | Nova, `inauguracao_requests`, espelhando `midia_adicional_requests` | O precedente existe, funciona e já tem RLS revisada. |
| Quem aplica a migration | **O usuário** | Ver §7. |

## 4. Modelo de dados

Migration nova em `supabase/migrations/`:

```sql
CREATE TABLE public.inauguracao_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  nome_unidade      text NOT NULL,
  unidade_id        text NOT NULL,
  endereco          text NOT NULL,
  solicitante_nome  text NOT NULL,
  solicitante_email text NOT NULL,
  data_inauguracao  date NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX inauguracao_requests_user_id_idx ON public.inauguracao_requests (user_id);
CREATE INDEX inauguracao_requests_data_idx    ON public.inauguracao_requests (data_inauguracao);

CREATE TRIGGER update_inauguracao_requests_updated_at
  BEFORE UPDATE ON public.inauguracao_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### RLS

Reusa as funções que já existem: `public.has_role(uuid, app_role)` e `public.is_colaborador(uuid)`.

```sql
ALTER TABLE public.inauguracao_requests ENABLE ROW LEVEL SECURITY;

-- Colaborador vê as suas; admin vê todas.
CREATE POLICY "Ve as proprias, admin ve todas"
  ON public.inauguracao_requests FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- Só colaborador (ou admin) cria, e sempre em seu próprio nome.
CREATE POLICY "Colaborador cria em seu nome"
  ON public.inauguracao_requests FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  );

-- A regra das 48h vive aqui.
CREATE POLICY "Edita ate 48h antes; admin sempre"
  ON public.inauguracao_requests FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      user_id = auth.uid()
      AND now() < (data_inauguracao::timestamp AT TIME ZONE 'America/Sao_Paulo') - interval '48 hours'
    )
  );

CREATE POLICY "Exclui ate 48h antes; admin sempre"
  ON public.inauguracao_requests FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      user_id = auth.uid()
      AND now() < (data_inauguracao::timestamp AT TIME ZONE 'America/Sao_Paulo') - interval '48 hours'
    )
  );
```

**Nota sobre a policy de UPDATE — corrigida após revisão.** A versão anterior deste spec afirmava que, sem `WITH CHECK`, a policy validaria apenas a linha antiga. Isso descreve mal o Postgres: **quando nenhum `WITH CHECK` é definido para UPDATE, a expressão do `USING` é reusada como `WITH CHECK`**. Deixar implícito teria dois efeitos:

- **Bom, e não previsto:** impede `UPDATE ... SET user_id = <outro>`, ou seja, transferir a solicitação para outra pessoa.
- **Ruim:** impediria o colaborador, mesmo dentro do prazo, de **antecipar** a data para dentro da janela de 48h — o banco recusaria enquanto a tela mostra o botão de editar.

**Decisão: antecipar é permitido.** Uma inauguração antecipada é justamente a informação que o marketing precisa receber depressa; bloquear obrigaria a pessoa a procurar o marketing, que é o que esta tela existe para eliminar. Quem está dentro do prazo no momento da edição pode editar, inclusive a data.

Por isso o `WITH CHECK` é **explícito**, exigindo só a propriedade — o que preserva o fechamento do buraco de transferência:

```sql
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR user_id = auth.uid()
  )
```

## 5. Frontend

```
src/features/colaborador/inauguracoes/
├── Inauguracoes.tsx                  tela com as 2 abas
├── components/
│   ├── NovaInauguracaoForm.tsx       formulário
│   └── ListaInauguracoes.tsx         lista + editar/excluir
├── hooks/useInauguracoes.ts          leitura e escrita
└── lib/prazo.ts                      a regra das 48h, isolada e testável
```

**`lib/prazo.ts`** é o coração da feature e o pedaço mais fácil de errar, então fica sozinho, puro e coberto por teste:

```ts
export const HORAS_DE_ANTECEDENCIA = 48;

/** Instante a partir do qual a solicitação trava para o colaborador. */
export function prazoDeAlteracao(dataInauguracao: string): Date;

/** Se o colaborador ainda pode mexer. Admin não passa por aqui. */
export function podeAlterar(dataInauguracao: string, agora?: Date): boolean;
```

A data chega como `YYYY-MM-DD`; o cálculo ancora em `-03:00` (§3).

**Rota:** `/inauguracoes`, via `lazy()`, com `<ProtectedRoute requireColaborador>`.

**Menu:** item `{ name: 'Inaugurações', href: '/inauguracoes', icon: PartyPopper }` no fim de `colaboradoresNavigation`.

**Rótulo da segunda aba:** "Minhas solicitações" para colaborador, "Todas as solicitações" para admin — o mesmo componente, texto conforme `isAdmin`.

## 6. Validação e casos de borda

| Situação | Comportamento |
|---|---|
| Campo vazio | Bloqueia o envio, com a mensagem no campo |
| E-mail malformado | Bloqueia o envio |
| Data no passado | Bloqueia — não se agenda inauguração para trás |
| Data a menos de 48h | **Permite criar.** A regra é sobre *alterar*, não sobre *criar*. A solicitação já nasce travada, e a lista explica isso. |
| Colaborador tenta editar fora do prazo | Botões não aparecem; a linha traz o aviso do marketing |
| Colaborador contorna a interface | O banco recusa (RLS). A tela mostra o erro. |
| Lista vazia | "Nenhuma solicitação ainda." + atalho para a primeira aba |
| **Tabela não existe ainda** | Erro claro dizendo que a migration precisa ser aplicada (§7) |

## 7. A migration não é aplicada por mim

Esta é a primeira parte do projeto que **grava** dados, e o Hub não tem banco local: o `npm run dev` conversa com o Supabase de produção.

Eu escrevo o arquivo da migration, mas **não a aplico** — não tenho o Supabase CLI nem chave de serviço do projeto do Hub, e aplicar seria alterar produção, o que está fora da regra de trabalho local que vale desde o início.

Para a tela funcionar, o usuário roda o SQL da migration no **SQL Editor** do painel do Supabase do Hub (`evprrtvbvjnjixogjsmn`). É uma criação de tabela nova: não altera nem apaga nada existente.

Enquanto não for aplicada, a tela carrega e mostra um erro explicando exatamente isso — não quebra o Hub.

## 8. Testes

- **`lib/prazo.ts`** — unitários cobrindo: bem antes do prazo, exatamente na virada das 48h, dentro da janela, depois da data, e a âncora de fuso (uma data deve dar o mesmo resultado independentemente do fuso da máquina que roda o teste).
- **Validação do formulário** — campo vazio, e-mail inválido, data no passado.
- **Lista** — colaborador dentro do prazo vê os botões; fora do prazo vê o aviso e nenhum botão; admin vê os botões sempre.
- `npm run lint`, `npm run build`, `npm run test:run` sem regressão.
- Validação visual no `npm run dev`, com a migration aplicada.

## 9. Riscos

| Risco | Tratamento |
|---|---|
| A regra das 48h divergir entre banco e interface | A mesma âncora (`-03:00`, 00:00) nos dois lados, escrita explicitamente no spec e no código. Testes fixam a interface; a RLS é a autoridade final. |
| Migration aplicada errado ou esquecida | A tela diz o que fazer em vez de falhar em silêncio |
| Escrita em produção a partir do localhost | É inerente: uma solicitação criada no `npm run dev` é uma linha real. Diferente das telas de indicadores, aqui isso é o propósito. Fica registrado para não surpreender. |
