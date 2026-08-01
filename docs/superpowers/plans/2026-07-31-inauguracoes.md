# Inaugurações — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Tela `/inauguracoes` com duas abas — uma para o colaborador registrar os dados de uma unidade que vai inaugurar, outra para acompanhar e alterar as solicitações — eliminando o vaivém com o marketing.

**Architecture:** Tabela nova `inauguracao_requests` no Supabase do Hub, espelhando o precedente `midia_adicional_requests`. A regra das 48 horas vive na RLS (autoridade) e é repetida na interface (explicação). Uma feature nova em `src/features/colaborador/inauguracoes/`, com a regra de prazo isolada num módulo puro e coberta por teste.

**Tech Stack:** Vite 5 · React 18 · TypeScript · React Router · @tanstack/react-query · shadcn/ui · Tailwind · Supabase · Vitest

**Spec:** [2026-07-31-inauguracoes-design.md](../specs/2026-07-31-inauguracoes-design.md)

## Global Constraints

- **Somente local.** Nunca `./deploy.sh`. Nunca `git push`.
- **A migration é escrita, NÃO aplicada.** Não rode nada que altere o banco. O usuário aplica pelo SQL Editor do Supabase.
- **Não editar `.env`** (versionado) nem `.env.local` (segredos do usuário).
- **Nenhuma dependência nova.** `date-fns`, `react-hook-form`, `zod`, `@hookform/resolvers` e os componentes shadcn já existem — confirme antes de usar; se algo faltar, resolva sem instalar.
- **A âncora de fuso é `-03:00`, meia-noite de São Paulo**, igual no SQL e no TypeScript. O Brasil não tem horário de verão desde 2019.
- Comentários e textos de UI em português.
- Ambiente Windows/PowerShell. `Set-Content -Encoding utf8` grava BOM no PowerShell 5.1 — remova se aparecer.
- Dev server já rodando em `http://localhost:8080`.
- Verificação: `npm run test:run`, `npx tsc --noEmit -p tsconfig.app.json` (~44 linhas de erros pré-existentes em outras features; critério é zero erros novos), `npm run lint` (baseline 106), `npm run build`.

## Estrutura de arquivos

**Criados:**

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/20260731120000_inauguracao_requests.sql` | Tabela, índices, trigger, RLS |
| `src/features/colaborador/inauguracoes/lib/prazo.ts` | A regra das 48h, pura |
| `src/features/colaborador/inauguracoes/lib/prazo.test.ts` | Testes da regra |
| `src/features/colaborador/inauguracoes/types.ts` | Tipo da solicitação |
| `src/features/colaborador/inauguracoes/hooks/useInauguracoes.ts` | Leitura e escrita |
| `src/features/colaborador/inauguracoes/components/NovaInauguracaoForm.tsx` | Formulário |
| `src/features/colaborador/inauguracoes/components/ListaInauguracoes.tsx` | Lista, editar, excluir |
| `src/features/colaborador/inauguracoes/Inauguracoes.tsx` | Tela com as 2 abas |

**Modificados:** `src/App.tsx` (import + rota), `src/components/layout/Sidebar.tsx` (item de menu).

---

### Task 1: A regra das 48h e a migration

O módulo de prazo é o coração da feature e o mais fácil de errar — por isso vem primeiro, por teste. A migration entra junto porque expressa a mesma regra do outro lado, e as duas precisam concordar.

**Files:**
- Create: `src/features/colaborador/inauguracoes/lib/prazo.ts`
- Create: `src/features/colaborador/inauguracoes/lib/prazo.test.ts`
- Create: `supabase/migrations/20260731120000_inauguracao_requests.sql`

**Interfaces:**
- Produces: `HORAS_DE_ANTECEDENCIA`, `prazoDeAlteracao(dataInauguracao: string): Date`, `podeAlterar(dataInauguracao: string, agora?: Date): boolean` — a Task 3 e a Task 4 importam de `'../lib/prazo'`.

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/features/colaborador/inauguracoes/lib/prazo.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { HORAS_DE_ANTECEDENCIA, prazoDeAlteracao, podeAlterar } from './prazo';

// A inauguração começa 00:00 em São Paulo (-03:00, sem horário de verão desde
// 2019). O prazo trava 48h antes disso. Ex.: inauguração em 20/08/2026 começa
// em 2026-08-20T03:00:00Z; o prazo fecha em 2026-08-18T03:00:00Z.
const INAUGURACAO = '2026-08-20';
const PRAZO = new Date('2026-08-18T03:00:00Z');

describe('prazoDeAlteracao', () => {
  it('trava 48h antes da meia-noite de São Paulo', () => {
    expect(prazoDeAlteracao(INAUGURACAO).toISOString()).toBe(PRAZO.toISOString());
  });

  it('são exatamente 48 horas', () => {
    expect(HORAS_DE_ANTECEDENCIA).toBe(48);
  });
});

describe('podeAlterar', () => {
  it('permite bem antes do prazo', () => {
    expect(podeAlterar(INAUGURACAO, new Date('2026-08-01T12:00:00Z'))).toBe(true);
  });

  it('permite um segundo antes da virada', () => {
    expect(podeAlterar(INAUGURACAO, new Date(PRAZO.getTime() - 1000))).toBe(true);
  });

  it('bloqueia exatamente na virada', () => {
    expect(podeAlterar(INAUGURACAO, PRAZO)).toBe(false);
  });

  it('bloqueia dentro da janela das 48h', () => {
    expect(podeAlterar(INAUGURACAO, new Date('2026-08-19T12:00:00Z'))).toBe(false);
  });

  it('bloqueia depois da data da inauguração', () => {
    expect(podeAlterar(INAUGURACAO, new Date('2026-09-01T12:00:00Z'))).toBe(false);
  });

  it('não depende do fuso da máquina — a âncora é a data, não o relógio local', () => {
    // Se o cálculo usasse `new Date('2026-08-20')` sem fuso explícito, ou
    // getFullYear()/getMonth() locais, este resultado mudaria conforme a
    // máquina. Ancorar em -03:00 mantém o mesmo instante em qualquer lugar.
    expect(prazoDeAlteracao('2026-01-15').toISOString()).toBe('2026-01-13T03:00:00.000Z');
    expect(prazoDeAlteracao('2026-07-15').toISOString()).toBe('2026-07-13T03:00:00.000Z');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm run test:run -- src/features/colaborador/inauguracoes/lib/prazo.test.ts`
Expected: FAIL — `Failed to resolve import "./prazo"`

- [ ] **Step 3: Implementar**

Criar `src/features/colaborador/inauguracoes/lib/prazo.ts`:

```ts
// Regra de alteração das solicitações de inauguração.
//
// A inauguração é uma data (sem hora), então o prazo precisa de uma âncora para
// virar um instante: consideramos que ela começa às 00:00 em São Paulo. O Brasil
// não tem horário de verão desde 2019, então o deslocamento é fixo em -03:00 e a
// conta dá o mesmo resultado em qualquer máquina.
//
// A MESMA regra está na RLS da tabela (ver a migration). O banco é a autoridade;
// isto aqui existe para a tela poder explicar antes de o usuário tentar.

export const HORAS_DE_ANTECEDENCIA = 48;

const FUSO_SAO_PAULO = '-03:00';

/** Instante a partir do qual a solicitação trava para o colaborador. */
export function prazoDeAlteracao(dataInauguracao: string): Date {
  const inicio = new Date(`${dataInauguracao}T00:00:00${FUSO_SAO_PAULO}`);
  return new Date(inicio.getTime() - HORAS_DE_ANTECEDENCIA * 60 * 60 * 1000);
}

/** Se o colaborador ainda pode editar ou excluir. Admin não passa por aqui. */
export function podeAlterar(dataInauguracao: string, agora: Date = new Date()): boolean {
  return agora.getTime() < prazoDeAlteracao(dataInauguracao).getTime();
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm run test:run -- src/features/colaborador/inauguracoes/lib/prazo.test.ts`
Expected: PASS — 8 testes

- [ ] **Step 5: Escrever a migration**

Criar `supabase/migrations/20260731120000_inauguracao_requests.sql` com exatamente o SQL da §4 do spec (tabela, 2 índices, trigger `update_updated_at_column`, `ENABLE ROW LEVEL SECURITY` e as 4 policies).

**Confira antes de escrever**, lendo `supabase/migrations/`, que as funções `public.has_role(uuid, app_role)`, `public.is_colaborador(uuid)` e `public.update_updated_at_column()` existem com essas assinaturas. Se alguma divergir, use a assinatura real e registre no relatório.

Comece o arquivo com um comentário explicando que a regra das 48h existe em dois lugares (aqui e em `lib/prazo.ts`) e que este é o autoritativo.

**NÃO aplique a migration.** Não rode `supabase db push`, `psql`, nem nada que toque o banco. O arquivo é o entregável.

- [ ] **Step 6: Verificar e commitar**

Run: `npm run test:run` — tudo verde.
Run: `npx tsc --noEmit -p tsconfig.app.json` — zero erros novos.

```bash
git add src/features/colaborador/inauguracoes/ supabase/migrations/20260731120000_inauguracao_requests.sql
git commit -m "feat(inauguracoes): regra das 48h e migration da tabela"
```

---

### Task 2: Tipos e hooks de dados

**Files:**
- Create: `src/features/colaborador/inauguracoes/types.ts`
- Create: `src/features/colaborador/inauguracoes/hooks/useInauguracoes.ts`

**Interfaces:**
- Consumes: `supabase` de `@/integrations/supabase/client` (é o banco do Hub — **não** o de indicadores), `useAuth` de `@/contexts/AuthContext`
- Produces: o tipo `InauguracaoRequest`; e os hooks `useInauguracoes()`, `useCriarInauguracao()`, `useEditarInauguracao()`, `useExcluirInauguracao()` — as Tasks 3 e 4 importam de `'../hooks/useInauguracoes'`

- [ ] **Step 1: Escrever `types.ts`**

```ts
export interface InauguracaoRequest {
  id: string;
  user_id: string;
  nome_unidade: string;
  unidade_id: string;
  endereco: string;
  solicitante_nome: string;
  solicitante_email: string;
  data_inauguracao: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

/** O que o formulário envia — o resto o banco preenche. */
export type NovaInauguracao = Omit<
  InauguracaoRequest,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;
```

- [ ] **Step 2: Escrever os hooks**

Em `hooks/useInauguracoes.ts`, seguindo o padrão de `src/features/geral/midia-adicional/MinhasSolicitacoes.tsx` (leia antes) e usando `@tanstack/react-query`:

- `useInauguracoes()` — `select('*').order('data_inauguracao', { ascending: true })`. **Não filtre por usuário no código**: a RLS já devolve só o que a pessoa pode ver, e filtrar de novo criaria duas fontes de verdade. Query key `['inauguracoes']`.
- `useCriarInauguracao()` — `insert`, preenchendo `user_id` com o id do usuário logado. Invalida `['inauguracoes']`.
- `useEditarInauguracao()` — `update` por `id`. Invalida.
- `useExcluirInauguracao()` — `delete` por `id`. Invalida.

Nos três de escrita, trate o erro do Supabase e mostre `toast.error` com mensagem em português. **Caso especial que precisa de mensagem própria:** se o erro indicar que a relação não existe (código `42P01` ou mensagem contendo `does not exist`), diga que a migration `20260731120000_inauguracao_requests.sql` ainda não foi aplicada no Supabase — senão o usuário vê um erro críptico. Trate o mesmo caso na leitura.

Quando a RLS recusar uma edição fora do prazo, o Supabase não devolve erro: devolve zero linhas afetadas. **Detecte isso** (peça `.select()` no update/delete e verifique o array vazio) e mostre "Fora do prazo de alteração. Entre em contato com o marketing."

- [ ] **Step 3: Verificar e commitar**

Run: `npx tsc --noEmit -p tsconfig.app.json` — zero erros novos.
Run: `npm run test:run` — verde.

```bash
git add src/features/colaborador/inauguracoes/
git commit -m "feat(inauguracoes): tipos e hooks de dados"
```

---

### Task 3: Formulário

**Files:**
- Create: `src/features/colaborador/inauguracoes/components/NovaInauguracaoForm.tsx`

**Interfaces:**
- Consumes: `useCriarInauguracao` (Task 2), `useAuth`
- Produces: `export function NovaInauguracaoForm({ aoSalvar }: { aoSalvar?: () => void })` — a Task 5 usa; `aoSalvar` serve para trocar de aba depois de enviar

- [ ] **Step 1: Escrever o formulário**

Seis campos, todos obrigatórios: **Nome da unidade**, **ID da unidade**, **Endereço**, **Nome do solicitante**, **E-mail do solicitante**, **Data de inauguração**.

- Nome e e-mail do solicitante começam preenchidos com os dados do usuário logado (`useAuth`), e continuam editáveis — às vezes se preenche para outra pessoa.
- Validação: nenhum campo vazio; e-mail com formato válido; **data não pode ser no passado**.
- Use os componentes que o Hub já tem (`Input`, `Label`, `Button`, `Card`). Para a data, confira o que outras telas usam (`CreateDemandDialog.tsx` usa `Calendar` + `Popover`) e siga o mesmo padrão.
- Ao salvar com sucesso: `toast.success`, limpa o formulário e chama `aoSalvar`.
- Enquanto salva: botão desabilitado com `Loader2`.

**Não bloqueie criar com data a menos de 48h** — a regra é sobre alterar, não sobre criar. A solicitação nasce travada, e a lista explica.

- [ ] **Step 2: Verificar e commitar**

Run: `npx tsc --noEmit -p tsconfig.app.json` e `npm run test:run` — zero erros novos, verde.

```bash
git add src/features/colaborador/inauguracoes/components/
git commit -m "feat(inauguracoes): formulario de nova solicitacao"
```

---

### Task 4: Lista

**Files:**
- Create: `src/features/colaborador/inauguracoes/components/ListaInauguracoes.tsx`

**Interfaces:**
- Consumes: `useInauguracoes`, `useEditarInauguracao`, `useExcluirInauguracao` (Task 2); `podeAlterar` de `'../lib/prazo'`; `useAuth` (para `isAdmin`)
- Produces: `export function ListaInauguracoes()`

- [ ] **Step 1: Escrever a lista**

Cada solicitação mostra: nome da unidade, ID, endereço, solicitante (nome e e-mail) e data de inauguração formatada em pt-BR.

**A regra de exibição dos controles:**

```
const liberado = isAdmin || podeAlterar(item.data_inauguracao);
```

- `liberado` → botões **Editar** e **Excluir**.
- não `liberado` → nenhum botão, e a frase: *"Para alterar, entre em contato com o marketing."*

Editar abre um `Dialog` com os mesmos campos do formulário. Excluir pede confirmação com `AlertDialog` (padrão do Hub).

Estados: carregando (`Loader2`), vazio ("Nenhuma solicitação ainda."), e o erro de tabela inexistente vindo do hook.

- [ ] **Step 2: Verificar e commitar**

Run: `npx tsc --noEmit -p tsconfig.app.json` e `npm run test:run`.

```bash
git add src/features/colaborador/inauguracoes/components/
git commit -m "feat(inauguracoes): lista com edicao e exclusao dentro do prazo"
```

---

### Task 5: Tela, rota e menu

**Files:**
- Create: `src/features/colaborador/inauguracoes/Inauguracoes.tsx`
- Modify: `src/App.tsx`, `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: A tela**

`Inauguracoes.tsx`, `export default`, dentro de `MainLayout` (import **sem** chaves — é default). Título "Inaugurações" e uma linha explicando para que serve.

`Tabs` com duas abas, iniciando na primeira:
- `nova` → **"Nova solicitação"** → `<NovaInauguracaoForm aoSalvar={() => setAba('solicitacoes')} />`
- `solicitacoes` → **"Minhas solicitações"**, ou **"Todas as solicitações"** se `isAdmin` → `<ListaInauguracoes />`

Como a aba muda por código depois de salvar, use `Tabs` controlado (`value` + `onValueChange`), não `defaultValue`.

- [ ] **Step 2: A rota**

Em `src/App.tsx`, junto dos outros imports de colaborador:

```tsx
const Inauguracoes = lazy(() => import("./features/colaborador/inauguracoes/Inauguracoes"));
```

E a rota, junto das outras de colaborador:

```tsx
<Route path="/inauguracoes" element={<ProtectedRoute requireColaborador><Inauguracoes /></ProtectedRoute>} />
```

- [ ] **Step 3: O menu**

Em `src/components/layout/Sidebar.tsx`, ao final de `colaboradoresNavigation`:

```ts
    { name: 'Inaugurações', href: '/inauguracoes', icon: PartyPopper },
```

Adicione `PartyPopper` ao import de `lucide-react` (confirme que esse ícone existe na versão instalada; se não, use `CalendarPlus`).

**Confira se `sectionFromPath` precisa mudar:** a lista de prefixos da seção `colaboradores` é explícita. Se `/inauguracoes` não estiver nela, a seção não abre sozinha ao entrar pela URL — acrescente o prefixo e cubra com asserção em `Sidebar.test.tsx`.

- [ ] **Step 4: Verificar**

Run: `npm run test:run`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run lint`, `npm run build`.

Confirme que compila pelo Vite:

```powershell
try { "HTTP $((Invoke-WebRequest 'http://localhost:8080/src/features/colaborador/inauguracoes/Inauguracoes.tsx' -UseBasicParsing -TimeoutSec 30).StatusCode)" } catch { "FALHOU" }
```

- [ ] **Step 5: Commitar**

```bash
git add src/App.tsx src/components/layout/Sidebar.tsx src/features/colaborador/inauguracoes/
git commit -m "feat(inauguracoes): tela com as duas abas, rota e item de menu"
```

---

### Task 6: Verificação final

- [ ] **Step 1:** `npm run test:run` — verde, com os testes de prazo.
- [ ] **Step 2:** `npm run build` — passa.
- [ ] **Step 3:** `npm run lint` — não aumentou em relação a 106.
- [ ] **Step 4:** Confirmar que a migration **não foi aplicada**: nenhum comando de banco foi executado, e o arquivo `.sql` existe.
- [ ] **Step 5:** Confirmar que nada vazou: `git status --short` limpo, `git log origin/main..HEAD` só com commits locais, `./deploy.sh` não executado.
- [ ] **Step 6:** Relatar: o que funciona, o que depende de o usuário aplicar a migration, e o que precisa de validação visual.

---

## Cobertura do spec

| Requisito | Onde |
|---|---|
| §2 duas abas | Task 5 |
| §2 seis campos | Task 3 |
| §2 colaborador vê as suas, admin vê todas | Task 2 (RLS decide) + Task 4 |
| §2 editar/excluir até 48h antes | Tasks 1, 2 e 4 |
| §2 mensagem do marketing fora do prazo | Task 4 |
| §2 só colaborador cria | Task 1 (RLS) + Task 5 (`requireColaborador`) |
| §4 tabela, índices, trigger, RLS | Task 1, Step 5 |
| §5 estrutura de arquivos | Tasks 1-5 |
| §6 validações e bordas | Tasks 2, 3 e 4 |
| §7 migration não aplicada | Global Constraints + Task 6, Step 4 |
| §8 testes | Task 1 + Task 6 |
