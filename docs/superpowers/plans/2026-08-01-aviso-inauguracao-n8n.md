# Aviso de inauguração por e-mail (N8N) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** No dia da inauguração, às 3h da manhã, o marketing recebe um e-mail para cada unidade que inaugura, com os dados preenchidos pelo colaborador.

**Architecture:** Um workflow no N8N que lê `inauguracao_requests` no Supabase do Hub com a chave de serviço, envia um e-mail por linha e marca a linha como avisada. Nada muda na tela de Inaugurações.

**Spec:** [2026-08-01-aviso-inauguracao-n8n-design.md](../specs/2026-08-01-aviso-inauguracao-n8n-design.md)

## Global Constraints

- **Somente local.** Nunca `./deploy.sh`. Nunca `git push`.
- **NÃO aplicar a migration.** Nenhum comando de banco. O usuário roda o SQL no Supabase.
- **NÃO tentar acessar o N8N.** Não temos credenciais nem URL de API da instância. O entregável é um arquivo JSON para o usuário importar.
- **Não editar `.env`/`.env.local`.** **Nenhuma dependência nova.**
- Comentários, documentação e textos de e-mail em português.
- **Fuso explícito:** o agendamento é 03:00 `America/Sao_Paulo`, e a data consultada vem de `$now.setZone('America/Sao_Paulo')`, não do fuso da instância.
- Verificação: `npm run test:run`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run lint`, `npm run build` — nada disto deve mudar, já que a mudança é SQL + JSON + markdown.

## Estrutura de arquivos

**Criados:**

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/20260801100000_inauguracao_email_enviado.sql` | Coluna `email_enviado_em` + índice parcial |
| `n8n/aviso-inauguracao.workflow.json` | Workflow importável |
| `n8n/README.md` | Como importar, configurar credenciais e destinatários |

A pasta `n8n/` é nova. Nenhum arquivo de código do Hub é modificado.

---

### Task 1: Migration e workflow

**Files:**
- Create: `supabase/migrations/20260801100000_inauguracao_email_enviado.sql`
- Create: `n8n/aviso-inauguracao.workflow.json`
- Create: `n8n/README.md`

- [ ] **Step 1: A migration**

Escreva exatamente o SQL da §4 do spec: `ADD COLUMN IF NOT EXISTS email_enviado_em timestamptz`, o `COMMENT ON COLUMN`, e o índice parcial `WHERE email_enviado_em IS NULL`.

Comece o arquivo com um comentário de cabeçalho explicando que a coluna existe para o workflow do N8N não reenviar aviso, e que ela é preenchida pelo workflow, não pela aplicação.

Use `supabase/migrations/20260731120000_inauguracao_requests.sql` como referência de estilo — é a migration da mesma tabela.

**NÃO aplique.**

- [ ] **Step 2: O workflow**

Crie `n8n/aviso-inauguracao.workflow.json` com quatro nós, na ordem da §5 do spec:

1. **Schedule Trigger** — diário, 03:00, `timezone: "America/Sao_Paulo"` declarado no nó.
2. **HTTP Request** GET para
   `={{ $env.SUPABASE_URL }}/rest/v1/inauguracao_requests?select=*&data_inauguracao=eq.{{ $now.setZone('America/Sao_Paulo').toFormat('yyyy-MM-dd') }}&email_enviado_em=is.null`
   com cabeçalhos `apikey` e `Authorization: Bearer` usando a chave de serviço.
3. **Send Email** — um por item retornado. Assunto `Inauguração hoje — {nome_unidade}`. Corpo com nome da unidade, ID, endereço, data em pt-BR e o solicitante (nome e e-mail).
4. **HTTP Request** PATCH para `.../inauguracao_requests?id=eq.{{ $json.id }}` gravando `{"email_enviado_em": "<agora em ISO>"}`.

**A ordem importa e está justificada no spec:** o e-mail vai **antes** da marcação. Não inverta.

**Sobre credenciais:** não invente valores. Use referências a credenciais/variáveis do N8N (`$env`, ou credenciais nomeadas) e deixe claro no README o que o usuário precisa preencher. **Nunca** coloque uma chave real no arquivo — ele vai para o git.

**Sobre o formato:** você não tem como testar contra uma instância N8N. O mínimo verificável é: o arquivo é **JSON válido** (rode `node -e "JSON.parse(require('fs').readFileSync('n8n/aviso-inauguracao.workflow.json','utf8')); console.log('json valido')"`), tem a estrutura que o N8N espera para importação (`name`, `nodes`, `connections`), cada nó tem `type`, `typeVersion`, `position`, `parameters`, e as `connections` ligam os quatro na ordem certa. Se você não tiver certeza do `typeVersion` correto de algum nó, use um valor conservador e **registre a incerteza no README e no relatório** — é melhor o usuário saber onde olhar do que descobrir com um erro de importação.

- [ ] **Step 3: O README**

`n8n/README.md`, em português, cobrindo:

- o que o workflow faz, em duas frases;
- **passo a passo de importação** no N8N;
- **o que preencher**: as credenciais do Supabase (URL e chave de serviço — dizendo onde pegar: Project Settings → API do projeto do Hub `evprrtvbvjnjixogjsmn`), a credencial de e-mail, e **a lista de destinatários do marketing**, com o caminho exato de onde editar no workflow;
- **o lembrete de que a migration precisa ser aplicada antes**, senão a consulta falha;
- as limitações da §8 do spec, para ninguém se surpreender: sem recuperação se o N8N cair, e solicitação criada depois das 3h do próprio dia não é avisada;
- como testar sem esperar até as 3h (executar o workflow manualmente).

- [ ] **Step 4: Verificar**

- `node -e "JSON.parse(...)"` no workflow → JSON válido.
- `npm run test:run`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run lint`, `npm run build` → **inalterados**, já que nenhum arquivo de código do Hub foi tocado. Se algum mudar, algo saiu do escopo.
- Confirme que **nenhuma chave real** aparece em `n8n/`: `grep -riE "eyJ|sb_secret|service_role.*=" n8n/` deve voltar vazio (fora menções em prosa no README).

- [ ] **Step 5: Commitar**

```bash
git add supabase/migrations/20260801100000_inauguracao_email_enviado.sql n8n/
git commit -m "feat(inauguracoes): aviso por email no dia da inauguracao via n8n"
```

---

### Task 2: Verificação final

- [ ] **Step 1:** Confirmar que a migration **não foi aplicada** e que nenhum comando de banco foi executado.
- [ ] **Step 2:** Confirmar que nada foi enviado: `git status --short` limpo, `git log origin/main..HEAD` só com commits locais.
- [ ] **Step 3:** Confirmar que nenhum segredo entrou no repositório.
- [ ] **Step 4:** Relatar ao usuário: o que ele precisa fazer (SQL + importar + configurar), e o que ficou como limitação conhecida.

---

## Cobertura do spec

| Requisito | Onde |
|---|---|
| §4 coluna e índice | Task 1, Step 1 |
| §5 os 4 nós, na ordem, com fuso explícito | Task 1, Step 2 |
| §5 e-mail antes da marcação | Task 1, Step 2 |
| §5 conteúdo do e-mail | Task 1, Step 2 |
| §7 o que depende do usuário | Task 1, Step 3 (README) |
| §8 limitações documentadas | Task 1, Step 3 |
| Nenhum segredo no repositório | Task 1, Step 4 |
