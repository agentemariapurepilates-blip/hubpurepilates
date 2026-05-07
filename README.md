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

## Estrutura

- `src/pages/` — páginas da aplicação
- `src/components/` — componentes reutilizáveis (UI shadcn em `src/components/ui/`)
- `src/integrations/supabase/` — cliente Supabase auto-gerado
- `supabase/functions/` — Edge Functions (Deno)
- `supabase/migrations/` — migrações SQL
- `public/` — assets estáticos servidos diretamente
