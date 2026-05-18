# Hub Pure Pilates

Plataforma interna de comunicação da Pure Pilates — suporte a colaboradores e franqueados das 425+ unidades pelo Brasil.

**Produção**: https://hub.purepilates.com.br

## Tecnologias

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Auth, Database, Storage, Edge Functions)

## Desenvolvimento local

Requisitos: Node.js + npm.

```sh
# Clonar o repo
git clone https://github.com/agentemariapurepilates-blip/hubpurepilates.git
cd hubpurepilates

# Instalar dependências
npm install --legacy-peer-deps

# Rodar dev server (porta 8080)
npm run dev
```

## Deploy em produção

O frontend é servido via IIS no servidor Pure Pilates. Para fazer deploy:

```sh
./deploy.sh
```

O script roda `npm run build`, copia o `web.config` para SPA routing e envia os arquivos para o servidor.

### Regra obrigatória — antes de qualquer `./deploy.sh`

O deploy é manual via SFTP direto pro servidor de produção, **independente do Git**. Isso significa que dá pra colocar produção à frente do GitHub — e quebra o rastro de mudanças pra quem trabalha em outra máquina.

Antes de rodar `./deploy.sh`:

1. `git status` — garantir que não há mudanças não-commitadas.
2. `git fetch origin && git log origin/main..HEAD --oneline` — checar se há commits locais ainda não enviados ao GitHub.
3. **Se houver commits locais sem push**, fazer `git push origin main` antes do deploy. Sem exceção.
4. Só então rodar `./deploy.sh`.

(Mesma regra documentada em [CLAUDE.md](CLAUDE.md).)

## Estrutura

```
src/
├── features/                  # páginas organizadas por público
│   ├── geral/                 # todo mundo vê (franqueado + colab + admin)
│   ├── colaborador/           # colab + admin
│   └── admin/                 # só admin
├── components/                # componentes reutilizáveis (UI shadcn em ui/)
├── pages/                     # páginas de sistema (NotFound)
├── contexts/                  # React contexts (Auth)
├── hooks/                     # hooks compartilhados
├── lib/                       # utils
├── data/                      # dados estáticos compartilhados
└── integrations/supabase/     # cliente Supabase auto-gerado

supabase/
├── functions/                 # Edge Functions (Deno)
└── migrations/                # migrações SQL

public/                        # assets estáticos servidos diretamente
```

**Regra de feature folder:** uma feature só importa de `components/ui`, `components/layout`, `contexts`, `hooks`, `lib`, `integrations` e `data`. Nunca de outra feature. Se duas features precisam compartilhar algo, sobe pra `components/` ou `lib/`.

**Controle de acesso ≠ pasta:** a pasta `colaborador/` ou `admin/` é só organização. O controle real está em `<ProtectedRoute>` em `App.tsx` e na sidebar.
