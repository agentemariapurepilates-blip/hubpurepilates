# Hub Pure Pilates — Regras do projeto

## Antes de começar QUALQUER alteração (regra fundamental)

**BLOQUEIO: o Claude NÃO faz nenhuma alteração local sem antes baixar a última versão do GitHub.** Vale pra QUALQUER usuário/máquina — a cópia local pode estar desatualizada (foi exatamente o que causou a reversão da produção). Antes de escrever qualquer linha de código ou tocar em arquivos:

1. `git fetch origin`
2. `git status` — working tree limpo / sem surpresas.
3. `git pull --rebase origin main` — trazer o mais recente pro local.
4. Confirmar que `git log HEAD..origin/main --oneline` está **vazio** (local == `origin/main`).
5. **Só então** começar a alterar — sempre em cima da última versão do `main`.

Se em qualquer passo o local estiver **atrás** do GitHub, PARE, sincronize, e só depois code. **Nunca edite arquivos a partir de um checkout desatualizado.** Como o `./deploy.sh` NÃO checa o git (é upload SFTP puro), essa disciplina é a única proteção — a ferramenta não impõe nada.

## Deploy

O deploy é manual via `./deploy.sh` (faz upload via SFTP direto pro servidor de produção `hub.purepilates.com.br`, independente do git).

**Regra obrigatória — antes de qualquer `./deploy.sh`:**

1. **Subir o dev server local (`npm run dev`) e pedir a validação visual do usuário ANTES de deployar.** Especialmente em mudanças de UI / template / layout / estilo. Posicionamento, espaçamento, cor e tamanho frequentemente saem tortos na primeira tentativa, e ciclos de deploy só pra ajustar pixel são caros. Só pular essa etapa se o usuário pedir explicitamente.
2. `git status` — não pode haver mudanças não-commitadas do que vai pra produção (commitar antes).
3. `git fetch origin` e conferir o alinhamento com o GitHub nos **DOIS sentidos**:
   - `git log origin/main..HEAD --oneline` — se tiver algo, há **commits locais sem push** → fazer `git push origin main` antes.
   - `git log HEAD..origin/main --oneline` — se tiver algo, o local está **ATRASADO** → `git pull --rebase origin main` antes. **NUNCA deployar um checkout atrasado** (foi isso que reverteu a produção).
4. **Imediatamente antes de rodar `./deploy.sh`, RE-CHECAR** que `git log origin/main..HEAD` **E** `git log HEAD..origin/main` estão **os dois vazios** (local idêntico ao `origin/main`). Se qualquer um tiver conteúdo, ABORTAR o deploy e sincronizar primeiro. Havendo commits locais sem push, avisar o usuário:

   > "Existem commits locais que ainda não estão no GitHub `agentemariapurepilates-blip/hubpurepilates`. Antes de fazer deploy, é preciso fazer `git push origin main`. Quer que eu faça o push agora?"

5. Só com o local **100% igual** ao `origin/main`, rodar `./deploy.sh`.

**NUNCA fazer `git push --force` / `-f` no `main`.** Um push normal de um checkout atrasado é REJEITADO pelo git (non-fast-forward) — é essa rejeição que impede alguém de sobrescrever o GitHub com uma versão velha. Um force-push burla essa proteção e pode APAGAR trabalho no GitHub. Se um push for rejeitado, a resposta é SEMPRE `git pull --rebase`, nunca forçar.

Motivo: o `deploy.sh` envia o build direto por SFTP, então é possível ter produção à frente do GitHub. Isso quebra o rastro de mudanças e atrapalha quem trabalha em outra máquina (que vai puxar do GitHub e não ter o código mais recente).

**NÃO alterar o `deploy.sh`.** É a versão estável e validada em produção. Tentativas de "modernizar" (lftp mirror, deploy incremental, etc.) já quebraram o hub no passado. Qualquer mudança no `deploy.sh` requer aprovação explícita do usuário antes de implementar.

## Pure Store — catálogo (lembrete de manutenção)

A aba **Pure Store** (`src/features/geral/pure-store/` — ver o `README.md` de lá) tem um **catálogo digital** cujos produtos vêm de `src/data/pureStoreCatalogo.ts`, uma lista **gerada a partir da loja oficial** (loja.purepilates.com.br, Nuvemshop) — **NÃO editar à mão**.

**Sempre que a conversa envolver a Pure Store ou o catálogo, LEMBRAR o usuário de que a lista pode estar desatualizada em relação ao site e PERGUNTAR se ele quer atualizar agora.** Recomendação: atualizar ~1x por semana. Para atualizar:

```bash
node scripts/gerar-catalogo-pure-store.mjs   # regenera src/data/pureStoreCatalogo.ts a partir do site
```

Depois: commit + `./deploy.sh` (seguindo o protocolo de deploy acima). Os links das unidades **não mudam** — todos passam a mostrar a lista nova automaticamente.

## Repositório

GitHub: https://github.com/agentemariapurepilates-blip/hubpurepilates (branch `main`)
