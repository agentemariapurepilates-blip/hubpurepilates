# Hub Pure Pilates — Regras do projeto

## Deploy

O deploy é manual via `./deploy.sh` (faz upload via SFTP direto pro servidor de produção `hub.purepilates.com.br`, independente do git).

**Regra obrigatória — antes de qualquer `./deploy.sh`:**

1. **Subir o dev server local (`npm run dev`) e pedir a validação visual do usuário ANTES de deployar.** Especialmente em mudanças de UI / template / layout / estilo. Posicionamento, espaçamento, cor e tamanho frequentemente saem tortos na primeira tentativa, e ciclos de deploy só pra ajustar pixel são caros. Só pular essa etapa se o usuário pedir explicitamente.
2. Rodar `git status` para garantir que não há mudanças não-commitadas.
3. Rodar `git fetch origin && git log origin/main..HEAD --oneline` para checar se há commits locais ainda não enviados ao GitHub.
4. **Se houver commits locais sem push**, NÃO rodar o deploy. Em vez disso, dizer ao usuário:

   > "Existem commits locais que ainda não estão no GitHub `agentemariapurepilates-blip/hubpurepilates`. Antes de fazer deploy, é preciso fazer `git push origin main`. Quer que eu faça o push agora?"

5. Só depois do push (ou da confirmação de que está tudo sincronizado), rodar `./deploy.sh`.

Motivo: o `deploy.sh` envia o build direto por SFTP, então é possível ter produção à frente do GitHub. Isso quebra o rastro de mudanças e atrapalha quem trabalha em outra máquina (que vai puxar do GitHub e não ter o código mais recente).

**NÃO alterar o `deploy.sh`.** É a versão estável e validada em produção. Tentativas de "modernizar" (lftp mirror, deploy incremental, etc.) já quebraram o hub no passado. Qualquer mudança no `deploy.sh` requer aprovação explícita do usuário antes de implementar.

## Repositório

GitHub: https://github.com/agentemariapurepilates-blip/hubpurepilates (branch `main`)
