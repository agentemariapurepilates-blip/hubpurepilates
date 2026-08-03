# Destinatários no Hub + workflow Gmail — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Admins gerenciam pelo Hub quem recebe o aviso de inauguração, e o workflow do N8N usa essa lista, enviando pelo Gmail.

**Architecture:** Tabela nova `inauguracao_email_recipients` (só admin), uma aba "Destinatários" na tela `/inauguracoes` visível apenas para admin, e o workflow reescrito para seis nós — buscando a lista do Hub e enviando pelo nó Gmail que a instância já usa.

**Spec:** [2026-08-01-aviso-inauguracao-n8n-design.md](../specs/2026-08-01-aviso-inauguracao-n8n-design.md) (§3.1, §3.2, §4.2, §5)

## Global Constraints

- **Somente local no código.** Nunca `./deploy.sh`. Nunca `git push`.
- **NÃO aplicar migrations.** Falta o token do Supabase. Escreva o `.sql`; quem aplica é outra etapa.
- **NÃO importar no N8N.** O controlador faz isso, com a chave de API. Você entrega o JSON.
- **Não editar `.env`/`.env.local`.** **Nenhuma dependência nova.**
- Comentários e textos em português.
- Verificação: `npm run test:run` (hoje 14 arquivos / 85 testes), `npx tsc --noEmit -p tsconfig.app.json` (~44 linhas pré-existentes; critério é zero novas), `npm run lint` (baseline 106), `npm run build`.

## Fatos apurados na instância do N8N (não são suposições)

- Nó de e-mail: `n8n-nodes-base.gmail`, `typeVersion 2.1`.
- Credencial: `gmailOAuth2` → `{ "id": "GfnvRU8IivJHJehE", "name": "Gmail account" }`. Usada por 5 workflows.
- Parâmetros do nó Gmail no precedente: `sendTo` (string, e-mails separados por vírgula), `subject`, `message` (HTML), `options.replyTo`. Expressões começam com `=`.
- **A resposta do nó Gmail tem `id`, `threadId`, `labelIds` — NÃO tem `messageId`.**

---

### Task 1: Tabela e aba de destinatários no Hub

**Files:**
- Create: `supabase/migrations/20260801140000_inauguracao_email_recipients.sql`
- Create: `src/features/colaborador/inauguracoes/hooks/useDestinatarios.ts`
- Create: `src/features/colaborador/inauguracoes/components/DestinatariosTab.tsx`
- Modify: `src/features/colaborador/inauguracoes/types.ts` (tipo novo)
- Modify: `src/features/colaborador/inauguracoes/Inauguracoes.tsx` (terceira aba)

- [ ] **Step 1: A migration**

Escreva o SQL da §4.2 do spec: tabela, `UNIQUE (email)`, trigger `update_updated_at_column`, `ENABLE ROW LEVEL SECURITY` e a policy `FOR ALL` de admin. Use `'admin'::app_role` com cast, como o resto do repo. Cabeçalho explicando que a lista alimenta o workflow do N8N e que só admin enxerga.

**NÃO aplique.**

- [ ] **Step 2: O tipo**

Em `types.ts`, acrescente:

```ts
export interface DestinatarioAviso {
  id: string;
  email: string;
  nome: string | null;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 3: Os hooks**

`hooks/useDestinatarios.ts`, seguindo o padrão de `hooks/useInauguracoes.ts` (leia antes — trata `42P01` para tabela inexistente e detecta recusa silenciosa da RLS em zero linhas; **faça igual**):

- `useDestinatarios()` — `select('*').order('email')`
- `useCriarDestinatario()` — insert com `created_by` do usuário logado
- `useAlternarDestinatario()` — update de `ativo`
- `useExcluirDestinatario()` — delete

Query keys com prefixo `inauguracao_destinatarios`. Trate o erro de e-mail duplicado (código `23505`) com mensagem própria: "Este e-mail já está na lista." — senão o admin vê um erro de banco cru.

- [ ] **Step 4: A aba**

`components/DestinatariosTab.tsx`, `export function DestinatariosTab()`, sem props.

- Campo de e-mail + campo de nome (opcional) + botão Adicionar. Valide formato de e-mail antes de enviar, reusando a mesma validação do formulário de inauguração se estiver acessível; se não estiver, replique.
- Lista dos cadastrados com o e-mail, o nome e um controle para ativar/desativar, mais botão de excluir com `AlertDialog`.
- Estado vazio: explique que **sem nenhum destinatário ativo o aviso não é enviado**, para o admin entender a consequência.
- Estados de carregando e de erro (inclusive o de tabela inexistente vindo do hook).

- [ ] **Step 5: Ligar a terceira aba**

Em `Inauguracoes.tsx`, acrescente a aba `destinatarios` com rótulo **"Destinatários"**, **visível apenas quando `isAdmin`**. Colaborador não deve ver nem a aba nem o conteúdo. As duas abas existentes não mudam.

- [ ] **Step 6: Verificar e commitar**

`npm run test:run`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run lint`, `npm run build` — zero erros novos.

```bash
git add supabase/migrations/20260801140000_inauguracao_email_recipients.sql src/features/colaborador/inauguracoes/
git commit -m "feat(inauguracoes): destinatarios do aviso gerenciados por admin no Hub"
```

---

### Task 2: Reescrever o workflow para Gmail e lista do Hub

**Files:**
- Modify: `n8n/aviso-inauguracao.workflow.json`
- Modify: `n8n/README.md`

- [ ] **Step 1: Reescrever o workflow para seis nós**

Ordem da §5 do spec:

1. **Schedule Trigger** — 03:00, `settings.timezone: "America/Sao_Paulo"` no workflow (o nó não tem esse parâmetro).
2. **HTTP Request** — inaugurações de hoje não avisadas.
3. **HTTP Request** — `.../inauguracao_email_recipients?select=email&ativo=is.true`.
4. **Gmail** (`n8n-nodes-base.gmail`, `typeVersion 2.1`) com `credentials.gmailOAuth2 = { "id": "GfnvRU8IivJHJehE", "name": "Gmail account" }`.
5. **Filter** — a trava.
6. **HTTP Request** — PATCH marcando `email_enviado_em`.

**Três pontos que decidem se funciona:**

**(a) A trava agora testa `threadId`, não `messageId`.** A resposta do Gmail não tem `messageId`; testar por ele bloquearia tudo. E **não** use `id`: as linhas do banco também têm `id`, então a trava passaria tudo — a falha silenciosa que ela existe para impedir. Atualize o `notes` do nó explicando isso, mantendo o "NÃO REMOVA ESTE NÓ".

**(b) A lista de destinatários vira uma string separada por vírgula** para o `sendTo`, e precisa estar disponível no nó 4 mesmo ele iterando as inaugurações. Use uma referência ao nó 3 que junte todos os itens (algo como `$('...').all().map(r => r.json.email).join(', ')`), não `.item`, que pareia um a um.

**(c) Lista vazia não pode marcar as linhas.** Se não houver destinatário ativo, não há para quem enviar; marcar seria perder o aviso em silêncio. Garanta que nesse caso o fluxo falhe ou não chegue ao nó 6 — e documente o comportamento escolhido.

O conteúdo do e-mail segue o padrão do precedente `Midia Adicional - Notificacao por email`: HTML com tabela, expressões com `=`. Campos: nome da unidade, ID, endereço, data por extenso em pt-BR, e o solicitante (nome e e-mail), com `replyTo` apontando para o solicitante.

- [ ] **Step 2: Atualizar o README**

Reescreva o que mudou: seis nós, Gmail em vez de SMTP (com o id da credencial já existente, então não é preciso criar nenhuma), a lista vindo do Hub (com o caminho: Inaugurações → aba Destinatários, só admin), a trava testando `threadId` e o porquê, e a nova migration na lista de pré-requisitos. Ajuste as conferências da primeira execução manual: o teste da credencial ausente continua válido, e acrescente um de lista vazia.

- [ ] **Step 3: Verificar e commitar**

JSON válido; `npm run test:run`/`lint`/`build` inalterados (nenhum código do Hub muda nesta task); nenhum segredo em `n8n/`.

```bash
git add n8n/
git commit -m "feat(inauguracoes): workflow usa Gmail e le destinatarios do Hub"
```

---

## Cobertura do spec

| Requisito | Onde |
|---|---|
| §3.1 lista gerenciada por admin no Hub | Task 1 |
| §3.2 Gmail e a trava por `threadId` | Task 2, Step 1(a) |
| §4.2 tabela e RLS de admin | Task 1, Step 1 |
| §5 os seis nós na ordem | Task 2, Step 1 |
| §5 lista vazia não marca | Task 2, Step 1(c) |
