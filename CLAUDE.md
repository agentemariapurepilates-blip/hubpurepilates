# Hub Pure Pilates — Regras do projeto

## Deploy

O deploy é manual via `./deploy.sh` (faz upload via SFTP direto pro servidor de produção `hub.purepilates.com.br`, independente do git).

**Regra obrigatória — antes de qualquer `./deploy.sh`:**

1. Rodar `git status` para garantir que não há mudanças não-commitadas.
2. Rodar `git fetch origin && git log origin/main..HEAD --oneline` para checar se há commits locais ainda não enviados ao GitHub.
3. **Se houver commits locais sem push**, NÃO rodar o deploy. Em vez disso, dizer ao usuário:

   > "Existem commits locais que ainda não estão no GitHub `agentemariapurepilates-blip/hubpurepilates`. Antes de fazer deploy, é preciso fazer `git push origin main`. Quer que eu faça o push agora?"

4. Só depois do push (ou da confirmação de que está tudo sincronizado), rodar `./deploy.sh`.

Motivo: o `deploy.sh` envia o build direto por SFTP, então é possível ter produção à frente do GitHub. Isso quebra o rastro de mudanças e atrapalha quem trabalha em outra máquina (que vai puxar do GitHub e não ter o código mais recente).

## Repositório

GitHub: https://github.com/agentemariapurepilates-blip/hubpurepilates (branch `main`)
