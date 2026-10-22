# Hub Pure Pilates — Regras do projeto

## Antes de começar QUALQUER alteração (regra fundamental)

**BLOQUEIO: o Claude NÃO faz nenhuma alteração local sem antes baixar a última versão do GitHub.** Vale pra QUALQUER usuário/máquina — a cópia local pode estar desatualizada (foi exatamente o que causou a reversão da produção). Antes de escrever qualquer linha de código ou tocar em arquivos:

1. `git fetch origin`
2. `git status` — working tree limpo / sem surpresas.
3. `git pull --rebase origin main` — trazer o mais recente pro local.
4. Confirmar que `git log HEAD..origin/main --oneline` está **vazio** (local == `origin/main`).
5. **Só então** começar a alterar — sempre em cima da última versão do `main`.

Se em qualquer passo o local estiver **atrás** do GitHub, PARE, sincronize, e só depois code. **Nunca edite arquivos a partir de um checkout desatualizado.** O `./deploy-rapido.sh` se recusa a publicar um checkout fora de sincronia, mas a edição acontece antes dele — e o `./deploy.sh` antigo não checa nada.

## Deploy

**Padrão: `./deploy-rapido.sh`** (desde 22/10/2026). Publica **sem tirar o Hub do ar** e sobe **só o que mudou**: guarda a última versão publicada numa pasta `deploy-staging` no servidor, fora do site, compara o hash de cada arquivo, envia a diferença e, dentro do servidor, troca o `index.html` por último. Deploy comum: 1 a 2 minutos, contra 10 a 55 com o Hub em 403 no antigo. No primeiro uso real, o Hub respondeu 200 em todas as 40 medições feitas durante o deploy.

- `./deploy-rapido.sh --simular` — mostra o que subiria e apagaria, **sem tocar no site**. Use quando estiver em dúvida.
- `./deploy-rapido.sh --voltar` — devolve o site à versão anterior em segundos.
- `./deploy-rapido.sh --destravar` — só deploy por vez; se um deploy morreu no meio e deixou a trava, isto libera.
- Ele **se recusa a publicar** se o local não estiver idêntico ao `origin/main` nos dois sentidos, ou se houver arquivo rastreado alterado sem commit (exceto o `deploy.sh`, que guarda a senha).
- No fim, confere no ar pelo conteúdo. Se a conferência falhar, ele diz e sugere o `--voltar`.

**Plano B: `./deploy.sh`** — o antigo. **Apaga o site inteiro antes de subir**, então o Hub fica em 403 do começo ao fim do upload. Só usar se o `deploy-rapido.sh` falhar. Depois de um uso dele, o próximo `deploy-rapido.sh` volta a funcionar normalmente (compara hash, não depende de histórico).

**Pasta em `public/` nunca pode ter o nome de uma rota do Hub.** O IIS acha a pasta antes da página, redireciona `/avisos` → `/avisos/` e responde 403 — foi o que aconteceu com `public/avisos` e `public/artes-prontas` até 22/10/2026. Arquivos estáticos de telas vão em `public/arquivos/<nome>/`.

**Regra obrigatória — antes de qualquer deploy (rápido ou antigo):**

1. **Subir o dev server local (`npm run dev`) e pedir a validação visual do usuário ANTES de deployar.** Especialmente em mudanças de UI / template / layout / estilo. Posicionamento, espaçamento, cor e tamanho frequentemente saem tortos na primeira tentativa, e ciclos de deploy só pra ajustar pixel são caros. Só pular essa etapa se o usuário pedir explicitamente.
2. `git status` — não pode haver mudanças não-commitadas do que vai pra produção (commitar antes).
3. `git fetch origin` e conferir o alinhamento com o GitHub nos **DOIS sentidos**:
   - `git log origin/main..HEAD --oneline` — se tiver algo, há **commits locais sem push** → fazer `git push origin main` antes.
   - `git log HEAD..origin/main --oneline` — se tiver algo, o local está **ATRASADO** → `git pull --rebase origin main` antes. **NUNCA deployar um checkout atrasado** (foi isso que reverteu a produção).
4. **Imediatamente antes de rodar o deploy, RE-CHECAR** (o `deploy-rapido.sh` faz isso sozinho; o `deploy.sh`, não) que `git log origin/main..HEAD` **E** `git log HEAD..origin/main` estão **os dois vazios** (local idêntico ao `origin/main`). Se qualquer um tiver conteúdo, ABORTAR o deploy e sincronizar primeiro. Havendo commits locais sem push, avisar o usuário:

   > "Existem commits locais que ainda não estão no GitHub `agentemariapurepilates-blip/hubpurepilates`. Antes de fazer deploy, é preciso fazer `git push origin main`. Quer que eu faça o push agora?"

5. Só com o local **100% igual** ao `origin/main`, rodar `./deploy-rapido.sh`.

**NUNCA fazer `git push --force` / `-f` no `main`.** Um push normal de um checkout atrasado é REJEITADO pelo git (non-fast-forward) — é essa rejeição que impede alguém de sobrescrever o GitHub com uma versão velha. Um force-push burla essa proteção e pode APAGAR trabalho no GitHub. Se um push for rejeitado, a resposta é SEMPRE `git pull --rebase`, nunca forçar.

Motivo: o deploy envia o build direto pro servidor, então é possível ter produção à frente do GitHub. Isso quebra o rastro de mudanças e atrapalha quem trabalha em outra máquina (que vai puxar do GitHub e não ter o código mais recente).

**NÃO alterar o `deploy.sh` nem o `deploy-rapido.sh` (com `publish/deploy/`) sem aprovação explícita do usuário.** O `deploy.sh` é o plano B validado. O `deploy-rapido.sh` foi feito com aprovação do responsável pelo deploy, em 22/10/2026 — tentativas anteriores de "modernizar" (lftp mirror, deploy incremental) já quebraram o Hub. As credenciais continuam só no `deploy.sh`; o rápido lê de lá.

## Pure Store — catálogo (lembrete de manutenção)

A aba **Pure Store** (`src/features/geral/pure-store/` — ver o `README.md` de lá) tem um **catálogo digital** cujos produtos vêm de `src/data/pureStoreCatalogo.ts`, uma lista **gerada a partir da loja oficial** (loja.purepilates.com.br, Nuvemshop) — **NÃO editar à mão**.

**Sempre que a conversa envolver a Pure Store ou o catálogo, LEMBRAR o usuário de que a lista pode estar desatualizada em relação ao site e PERGUNTAR se ele quer atualizar agora.** Recomendação: atualizar ~1x por semana. Para atualizar:

```bash
node scripts/gerar-catalogo-pure-store.mjs   # regenera src/data/pureStoreCatalogo.ts a partir do site
```

Depois: commit + `./deploy-rapido.sh` (seguindo o protocolo de deploy acima). Os links das unidades **não mudam** — todos passam a mostrar a lista nova automaticamente.

## Repositório

GitHub: https://github.com/agentemariapurepilates-blip/hubpurepilates (branch `main`)
