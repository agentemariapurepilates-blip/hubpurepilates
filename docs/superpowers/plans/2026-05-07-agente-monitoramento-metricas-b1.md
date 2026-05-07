# Métricas B1: Conexão de Contas Sociais — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que admins do hub conectem (via OAuth) as contas oficiais da Pure Pilates no Instagram, Facebook e TikTok, e ver o número atual de seguidores em tempo real para cada uma.

**Architecture:** Frontend React/Vite redireciona o usuário para o fluxo OAuth de cada provedor; callback retorna ao hub e dispara Edge Function Supabase que troca o código por token de longa duração, cifra o token com pgsodium e grava em `social_connections`. Componente de dashboard chama outra Edge Function que decifra o token e consulta a API externa para retornar os seguidores.

**Tech Stack:** React 18 · Vite · TypeScript · Tailwind · shadcn/ui · Supabase (Postgres + Edge Functions Deno + pgsodium) · Meta Graph API v19.0 · TikTok Display API v2.

**Spec de referência:** [docs/superpowers/specs/2026-05-07-agente-monitoramento-metricas-design.md](../specs/2026-05-07-agente-monitoramento-metricas-design.md)

---

## Pré-requisitos externos (não-código)

Antes da Task 1 começar, o usuário precisa providenciar:

1. **Meta App** criado em developers.facebook.com (modo Development já basta para B1):
   - Permissões solicitadas: `instagram_basic`, `instagram_manage_insights`, `pages_read_engagement`, `pages_show_list`, `read_insights`
   - Redirect URI cadastrado: `https://[domínio-do-hub]/auth/callback/meta` e `http://localhost:8081/auth/callback/meta` para testes
   - Conta `@purepilatesbr` (Instagram Business) e Página `/pure.pilates.br` (Facebook) anexadas a um Meta Business Manager verificado
   - **Credenciais necessárias:** `META_APP_ID` (público) + `META_APP_SECRET` (secreto)

2. **TikTok App** criado em developers.tiktok.com (modo Sandbox já basta para B1):
   - Scopes solicitados: `user.info.basic`, `user.info.stats`, `video.list`
   - Redirect URI cadastrado: idem ao da Meta
   - Conta `@purepilatesbr` no TikTok For Business
   - **Credenciais necessárias:** `TIKTOK_CLIENT_KEY` (público) + `TIKTOK_CLIENT_SECRET` (secreto)

3. **Variável de ambiente do frontend** (Vite usa prefixo `VITE_`):
   - Criar `.env.local` na raiz do projeto com:
     ```
     VITE_META_APP_ID=...
     VITE_TIKTOK_CLIENT_KEY=...
     ```

4. **Secrets do Supabase** (para Edge Functions):
   - `META_APP_ID`, `META_APP_SECRET`
   - `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
   - Configurados via `supabase secrets set NAME=value`

---

## File Structure

**Arquivos novos:**

| Caminho | Responsabilidade |
|---|---|
| `src/data/social-networks.ts` | Constantes de cada rede (id, label, ícone, scopes, URL de OAuth) |
| `src/lib/social-status.ts` | Helpers puros: `getStatusLabel`, `getStatusColor` |
| `src/lib/oauth-url-builder.ts` | Helper puro que monta a URL de autorização OAuth com state |
| `src/lib/social-status.test.ts` | Testes unitários do social-status |
| `src/lib/oauth-url-builder.test.ts` | Testes unitários do oauth-url-builder |
| `src/components/monitoring/ConnectionCard.tsx` | Card visual de uma rede (3 estados: desconectado, conectado, erro) |
| `src/components/monitoring/ConnectionCard.test.tsx` | Testes do componente |
| `src/pages/AgenteMonitoramentoMetricas.tsx` | Página principal, layout dos 3 cards |
| `src/pages/AuthCallbackMeta.tsx` | Recebe callback OAuth Meta, valida state, chama Edge Function |
| `src/pages/AuthCallbackTikTok.tsx` | Idem para TikTok |
| `supabase/migrations/20260507120000_social_connections.sql` | Schema da tabela + RLS + tipos enum |
| `supabase/functions/_shared/cors.ts` | Headers CORS reutilizáveis |
| `supabase/functions/_shared/auth.ts` | Helper para validar que o caller é admin |
| `supabase/functions/_shared/encryption.ts` | Wrapper sobre pgsodium para cifrar/decifrar tokens |
| `supabase/functions/oauth-exchange-meta/index.ts` | Recebe code, troca por token, salva |
| `supabase/functions/oauth-exchange-tiktok/index.ts` | Idem para TikTok |
| `supabase/functions/fetch-followers-live/index.ts` | Busca followers ao vivo da API |
| `vitest.config.ts` | Configuração do test runner |
| `src/test/setup.ts` | Setup global do vitest (jest-dom matchers) |

**Arquivos modificados:**

| Caminho | Modificação |
|---|---|
| `package.json` | Adicionar deps de teste e script `test` |
| `src/App.tsx` | Adicionar 3 rotas |
| `src/components/layout/Sidebar.tsx` | Adicionar nova seção "Agente Monitoramento" |
| `.gitignore` | Adicionar `.env.local` |

---

## Task 1: Setup de testes (vitest + RTL + jsdom)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Instalar dependências de teste**

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected: instala sem erros, `package.json` ganha as deps em `devDependencies`.

- [ ] **Step 2: Adicionar script `test` ao package.json**

Modify `package.json`, na seção `"scripts"`, adicionar:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 3: Criar `vitest.config.ts` na raiz do projeto**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 4: Criar `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Adicionar `.env.local` ao .gitignore**

Modify `.gitignore`, adicionar uma linha:

```
.env.local
```

- [ ] **Step 6: Verificar que vitest roda sem testes**

Run: `npm run test:run`
Expected: "No test files found" — sem erros de configuração.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts .gitignore
git commit -m "chore: setup vitest + RTL + jsdom"
```

---

## Task 2: Migration social_connections + RLS

**Files:**
- Create: `supabase/migrations/20260507120000_social_connections.sql`

- [ ] **Step 1: Criar migration**

```sql
-- Habilita pgsodium se ainda não estiver
CREATE EXTENSION IF NOT EXISTS pgsodium WITH SCHEMA pgsodium;

-- Enums
CREATE TYPE social_network AS ENUM ('instagram', 'facebook', 'tiktok');
CREATE TYPE connection_status AS ENUM ('active', 'expired', 'revoked');

-- Tabela
CREATE TABLE social_connections (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network                  social_network NOT NULL,
  account_handle           text NOT NULL,
  account_id               text NOT NULL,
  access_token_encrypted   text NOT NULL,
  refresh_token_encrypted  text,
  token_expires_at         timestamptz NOT NULL,
  connected_by             uuid REFERENCES auth.users(id),
  connected_at             timestamptz NOT NULL DEFAULT now(),
  last_sync_at             timestamptz,
  status                   connection_status NOT NULL DEFAULT 'active',
  CONSTRAINT social_connections_one_per_network UNIQUE (network)
);

-- Index para queries por status
CREATE INDEX idx_social_connections_status ON social_connections(status);

-- RLS
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage social connections" ON social_connections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Comentários documentais
COMMENT ON TABLE social_connections IS 'Conexões OAuth com redes sociais. Apenas 1 conta por rede na Fase 1.';
COMMENT ON COLUMN social_connections.access_token_encrypted IS 'Token cifrado via pgsodium. Decifrar apenas dentro de Edge Functions.';
```

- [ ] **Step 2: Aplicar migration localmente**

Run:
```bash
cd hubpurepilates
npx supabase db reset
```

Expected: migration roda sem erros. Tabela `social_connections` aparece no esquema `public`.

> Nota: se o projeto usa Supabase Cloud direto (sem CLI local), aplicar via dashboard: SQL Editor → cola e executa.

- [ ] **Step 3: Verificar tabela criada**

Run no SQL Editor (cloud) ou `npx supabase db query`:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'social_connections';
```

Expected: lista 11 colunas conforme migration.

- [ ] **Step 4: Verificar RLS bloqueia leitura sem role admin**

Run:
```sql
SELECT * FROM social_connections;
```

Expected: 0 linhas (RLS bloqueia se não for admin) ou erro de permissão.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260507120000_social_connections.sql
git commit -m "feat(db): add social_connections table with RLS"
```

---

## Task 3: Constantes das redes sociais

**Files:**
- Create: `src/data/social-networks.ts`

- [ ] **Step 1: Criar o arquivo de constantes**

```ts
import { Instagram, Facebook, Music2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SocialNetworkId = 'instagram' | 'facebook' | 'tiktok';

export interface SocialNetworkConfig {
  id: SocialNetworkId;
  label: string;
  handle: string;
  icon: LucideIcon;
  brandColor: string;          // tailwind color usado em borda/texto
  oauthAuthorizeUrl: string;   // URL base do provider
  scopes: string[];
  appIdEnv: string;            // nome da var VITE_*
}

export const SOCIAL_NETWORKS: SocialNetworkConfig[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    handle: '@purepilatesbr',
    icon: Instagram,
    brandColor: 'text-pink-600 border-pink-600',
    oauthAuthorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    scopes: [
      'instagram_basic',
      'instagram_manage_insights',
      'pages_read_engagement',
      'pages_show_list',
    ],
    appIdEnv: 'VITE_META_APP_ID',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    handle: '/pure.pilates.br',
    icon: Facebook,
    brandColor: 'text-blue-600 border-blue-600',
    oauthAuthorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    scopes: [
      'pages_read_engagement',
      'pages_show_list',
      'read_insights',
    ],
    appIdEnv: 'VITE_META_APP_ID',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    handle: '@purepilatesbr',
    icon: Music2,
    brandColor: 'text-zinc-900 border-zinc-900',
    oauthAuthorizeUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    scopes: ['user.info.basic', 'user.info.stats', 'video.list'],
    appIdEnv: 'VITE_TIKTOK_CLIENT_KEY',
  },
];

export function getNetwork(id: SocialNetworkId): SocialNetworkConfig {
  const network = SOCIAL_NETWORKS.find((n) => n.id === id);
  if (!network) throw new Error(`Unknown social network: ${id}`);
  return network;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/social-networks.ts
git commit -m "feat(monitoring): add social networks constants"
```

---

## Task 4: Helper puro `social-status` (TDD)

**Files:**
- Create: `src/lib/social-status.test.ts`
- Create: `src/lib/social-status.ts`

- [ ] **Step 1: Escrever os testes (failing)**

```ts
// src/lib/social-status.test.ts
import { describe, it, expect } from 'vitest';
import { getStatusLabel, getStatusBadgeColor } from './social-status';

describe('getStatusLabel', () => {
  it('retorna "Conectado" para status active', () => {
    expect(getStatusLabel('active')).toBe('Conectado');
  });

  it('retorna "Token expirado" para status expired', () => {
    expect(getStatusLabel('expired')).toBe('Token expirado');
  });

  it('retorna "Acesso revogado" para status revoked', () => {
    expect(getStatusLabel('revoked')).toBe('Acesso revogado');
  });

  it('retorna "Não conectado" para null/undefined', () => {
    expect(getStatusLabel(null)).toBe('Não conectado');
    expect(getStatusLabel(undefined)).toBe('Não conectado');
  });
});

describe('getStatusBadgeColor', () => {
  it('retorna verde para active', () => {
    expect(getStatusBadgeColor('active')).toBe('bg-emerald-500 text-white');
  });

  it('retorna amarelo para expired', () => {
    expect(getStatusBadgeColor('expired')).toBe('bg-amber-400 text-slate-900');
  });

  it('retorna vermelho para revoked', () => {
    expect(getStatusBadgeColor('revoked')).toBe('bg-red-500 text-white');
  });

  it('retorna cinza para null/undefined', () => {
    expect(getStatusBadgeColor(null)).toBe('bg-slate-200 text-slate-700');
  });
});
```

- [ ] **Step 2: Rodar testes para verificar que falham**

Run: `npm run test:run -- src/lib/social-status.test.ts`
Expected: FAIL — `Cannot find module './social-status'`.

- [ ] **Step 3: Implementar o helper**

```ts
// src/lib/social-status.ts
export type ConnectionStatus = 'active' | 'expired' | 'revoked';

export function getStatusLabel(status: ConnectionStatus | null | undefined): string {
  if (!status) return 'Não conectado';
  switch (status) {
    case 'active': return 'Conectado';
    case 'expired': return 'Token expirado';
    case 'revoked': return 'Acesso revogado';
  }
}

export function getStatusBadgeColor(status: ConnectionStatus | null | undefined): string {
  if (!status) return 'bg-slate-200 text-slate-700';
  switch (status) {
    case 'active': return 'bg-emerald-500 text-white';
    case 'expired': return 'bg-amber-400 text-slate-900';
    case 'revoked': return 'bg-red-500 text-white';
  }
}
```

- [ ] **Step 4: Rodar testes para verificar que passam**

Run: `npm run test:run -- src/lib/social-status.test.ts`
Expected: PASS — 8 testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/lib/social-status.ts src/lib/social-status.test.ts
git commit -m "feat(monitoring): add social-status helpers with tests"
```

---

## Task 5: Helper puro `oauth-url-builder` (TDD)

**Files:**
- Create: `src/lib/oauth-url-builder.test.ts`
- Create: `src/lib/oauth-url-builder.ts`

- [ ] **Step 1: Escrever os testes**

```ts
// src/lib/oauth-url-builder.test.ts
import { describe, it, expect } from 'vitest';
import { buildOAuthUrl, generateState } from './oauth-url-builder';

describe('buildOAuthUrl', () => {
  it('monta URL Meta com parâmetros corretos', () => {
    const url = buildOAuthUrl({
      authorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
      clientId: 'test_app_id',
      redirectUri: 'https://example.com/auth/callback/meta',
      scopes: ['instagram_basic', 'pages_show_list'],
      state: 'abc-123',
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe('https://www.facebook.com/v19.0/dialog/oauth');
    expect(parsed.searchParams.get('client_id')).toBe('test_app_id');
    expect(parsed.searchParams.get('redirect_uri')).toBe('https://example.com/auth/callback/meta');
    expect(parsed.searchParams.get('scope')).toBe('instagram_basic,pages_show_list');
    expect(parsed.searchParams.get('state')).toBe('abc-123');
    expect(parsed.searchParams.get('response_type')).toBe('code');
  });

  it('codifica caracteres especiais corretamente', () => {
    const url = buildOAuthUrl({
      authorizeUrl: 'https://www.tiktok.com/v2/auth/authorize/',
      clientId: 'aw_abc',
      redirectUri: 'https://example.com/auth/callback/tiktok',
      scopes: ['user.info.basic'],
      state: 'with spaces',
    });

    expect(url).toContain('state=with+spaces');
  });
});

describe('generateState', () => {
  it('gera string única e suficientemente longa', () => {
    const a = generateState();
    const b = generateState();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });
});
```

- [ ] **Step 2: Rodar testes (devem falhar)**

Run: `npm run test:run -- src/lib/oauth-url-builder.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar o helper**

```ts
// src/lib/oauth-url-builder.ts
export interface OAuthUrlParams {
  authorizeUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
}

export function buildOAuthUrl(params: OAuthUrlParams): string {
  const url = new URL(params.authorizeUrl);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('scope', params.scopes.join(','));
  url.searchParams.set('state', params.state);
  url.searchParams.set('response_type', 'code');
  return url.toString();
}

export function generateState(): string {
  // 32 bytes hex = 64 chars; usa crypto.randomUUID() que gera 36 chars já
  // mas concatenamos para garantir entropia
  const a = crypto.randomUUID();
  const b = crypto.randomUUID();
  return (a + b).replace(/-/g, '');
}
```

- [ ] **Step 4: Rodar testes (devem passar)**

Run: `npm run test:run -- src/lib/oauth-url-builder.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/oauth-url-builder.ts src/lib/oauth-url-builder.test.ts
git commit -m "feat(monitoring): add OAuth URL builder with tests"
```

---

## Task 6: Edge Function shared helpers (cors, auth, encryption)

**Files:**
- Create: `supabase/functions/_shared/cors.ts`
- Create: `supabase/functions/_shared/auth.ts`
- Create: `supabase/functions/_shared/encryption.ts`

- [ ] **Step 1: Criar `cors.ts`**

```ts
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}
```

- [ ] **Step 2: Criar `auth.ts`**

```ts
// supabase/functions/_shared/auth.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

export interface AuthContext {
  userId: string;
  isAdmin: boolean;
  supabaseAdmin: ReturnType<typeof createClient>;
}

export async function requireAdmin(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing Authorization header');

  // Cliente com a service_role para queries admin
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  // Cliente com o JWT do usuário para validar identidade
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !userData.user) throw new Error('Invalid token');

  const userId = userData.user.id;

  // Verifica role admin
  const { data: roleData } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (!roleData) throw new Error('Forbidden: admin role required');

  return { userId, isAdmin: true, supabaseAdmin };
}
```

- [ ] **Step 3: Criar `encryption.ts`**

```ts
// supabase/functions/_shared/encryption.ts
//
// Wrapper sobre pgsodium para cifrar/decifrar tokens de OAuth.
// Usa crypto_secretbox: simétrico, autenticado.
//
// A chave vem de Deno.env.get('PG_ENCRYPT_KEY') — string base64 de 32 bytes.
// Gerada uma vez via:
//   openssl rand -base64 32
// e armazenada como secret do Supabase: supabase secrets set PG_ENCRYPT_KEY=...

import { encode as encodeB64, decode as decodeB64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';

const KEY_BYTES = 32;
const NONCE_BYTES = 24;

function getKey(): Uint8Array {
  const keyB64 = Deno.env.get('PG_ENCRYPT_KEY');
  if (!keyB64) throw new Error('PG_ENCRYPT_KEY not set');
  const key = decodeB64(keyB64);
  if (key.length !== KEY_BYTES) {
    throw new Error(`PG_ENCRYPT_KEY must be ${KEY_BYTES} bytes (base64)`);
  }
  return key;
}

// Para B1 simplificamos com Web Crypto AES-GCM (Deno suporta nativamente).
// Quando passar a usar pgsodium nativo do Postgres, refazemos.
export async function encryptToken(plaintext: string): Promise<string> {
  const key = getKey();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    new TextEncoder().encode(plaintext)
  );
  // Concatena iv + ciphertext em base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return encodeB64(combined);
}

export async function decryptToken(ciphertextB64: string): Promise<string> {
  const key = getKey();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  const combined = decodeB64(ciphertextB64);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}
```

- [ ] **Step 4: Gerar e salvar a chave de criptografia**

Run no terminal local:
```bash
openssl rand -base64 32
```

Copie a saída e salve como secret do Supabase:
```bash
npx supabase secrets set PG_ENCRYPT_KEY="<output>"
```

> Se rodando contra cloud direto: dashboard → Project Settings → Edge Functions → Secrets → adicionar `PG_ENCRYPT_KEY`.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared
git commit -m "feat(edge): add shared helpers (cors, auth, encryption)"
```

---

## Task 7: Edge Function `oauth-exchange-meta`

**Files:**
- Create: `supabase/functions/oauth-exchange-meta/index.ts`

- [ ] **Step 1: Criar a função**

```ts
// supabase/functions/oauth-exchange-meta/index.ts
import { handleCorsPreflight, corsHeaders } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { encryptToken } from '../_shared/encryption.ts';

interface ExchangeRequest {
  code: string;
  redirectUri: string;
  network: 'instagram' | 'facebook';
}

interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface MetaLongLivedResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    const { userId, supabaseAdmin } = await requireAdmin(req);

    const body: ExchangeRequest = await req.json();
    const { code, redirectUri, network } = body;
    if (!code || !redirectUri || !network) {
      return jsonResponse({ error: 'Missing parameters' }, 400);
    }

    const appId = Deno.env.get('META_APP_ID');
    const appSecret = Deno.env.get('META_APP_SECRET');
    if (!appId || !appSecret) {
      return jsonResponse({ error: 'Server misconfigured: META_APP_ID/SECRET missing' }, 500);
    }

    // 1. Troca code por short-lived token
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const shortRes = await fetch(tokenUrl.toString());
    if (!shortRes.ok) {
      const text = await shortRes.text();
      return jsonResponse({ error: 'Meta short token failed', detail: text }, 502);
    }
    const shortData: MetaTokenResponse = await shortRes.json();

    // 2. Troca short-lived por long-lived (60 dias)
    const longUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    longUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longUrl.searchParams.set('client_id', appId);
    longUrl.searchParams.set('client_secret', appSecret);
    longUrl.searchParams.set('fb_exchange_token', shortData.access_token);

    const longRes = await fetch(longUrl.toString());
    if (!longRes.ok) {
      const text = await longRes.text();
      return jsonResponse({ error: 'Meta long token failed', detail: text }, 502);
    }
    const longData: MetaLongLivedResponse = await longRes.json();

    // 3. Descobre account_id e handle
    let accountId: string;
    let accountHandle: string;

    if (network === 'instagram') {
      // GET /me/accounts → lista de páginas, cada uma tem instagram_business_account
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${longData.access_token}`
      );
      const pagesData = await pagesRes.json();
      const pageWithIg = pagesData.data?.find((p: any) => p.instagram_business_account);
      if (!pageWithIg) {
        return jsonResponse({ error: 'No Instagram Business Account linked' }, 400);
      }
      accountId = pageWithIg.instagram_business_account.id;
      accountHandle = '@' + pageWithIg.instagram_business_account.username;
    } else {
      // facebook: usa primeira página gerenciada
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=id,name&access_token=${longData.access_token}`
      );
      const pagesData = await pagesRes.json();
      const page = pagesData.data?.[0];
      if (!page) {
        return jsonResponse({ error: 'No Facebook Page available' }, 400);
      }
      accountId = page.id;
      accountHandle = '/' + (page.name as string).toLowerCase().replace(/\s+/g, '.');
    }

    // 4. Cifra o token e grava
    const encryptedToken = await encryptToken(longData.access_token);
    const expiresAt = new Date(Date.now() + longData.expires_in * 1000).toISOString();

    const { error: upsertError } = await supabaseAdmin
      .from('social_connections')
      .upsert({
        network,
        account_handle: accountHandle,
        account_id: accountId,
        access_token_encrypted: encryptedToken,
        token_expires_at: expiresAt,
        connected_by: userId,
        connected_at: new Date().toISOString(),
        status: 'active',
      }, { onConflict: 'network' });

    if (upsertError) {
      return jsonResponse({ error: 'Database error', detail: upsertError.message }, 500);
    }

    return jsonResponse({ ok: true, network, accountHandle });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const status = msg.includes('Forbidden') ? 403 : msg.includes('Invalid') ? 401 : 500;
    return jsonResponse({ error: msg }, status);
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Deploy local da função**

Run:
```bash
npx supabase functions deploy oauth-exchange-meta
```

Expected: deploy bem-sucedido.

- [ ] **Step 3: Smoke test manual via curl**

Use um JWT de admin (pode pegar logado no hub via DevTools → Application → Local Storage → `sb-...-auth-token`).

Run:
```bash
curl -X POST "https://<seu-projeto>.supabase.co/functions/v1/oauth-exchange-meta" \
  -H "Authorization: Bearer <JWT-admin>" \
  -H "Content-Type: application/json" \
  -d '{"code":"fake","redirectUri":"http://localhost:8081/auth/callback/meta","network":"instagram"}'
```

Expected: erro `Meta short token failed` (porque code é falso) — confirma que a função roda mas falha no exchange real, que é o esperado nessa fase.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/oauth-exchange-meta
git commit -m "feat(edge): add oauth-exchange-meta function"
```

---

## Task 8: Edge Function `oauth-exchange-tiktok`

**Files:**
- Create: `supabase/functions/oauth-exchange-tiktok/index.ts`

- [ ] **Step 1: Criar a função**

```ts
// supabase/functions/oauth-exchange-tiktok/index.ts
import { handleCorsPreflight, corsHeaders } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { encryptToken } from '../_shared/encryption.ts';

interface ExchangeRequest {
  code: string;
  redirectUri: string;
}

interface TikTokTokenResponse {
  access_token: string;
  expires_in: number;
  open_id: string;
  refresh_token: string;
  refresh_expires_in: number;
  scope: string;
  token_type: string;
}

interface TikTokUserInfo {
  data: {
    user: {
      open_id: string;
      union_id: string;
      avatar_url: string;
      display_name: string;
      username?: string;
    };
  };
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    const { userId, supabaseAdmin } = await requireAdmin(req);

    const body: ExchangeRequest = await req.json();
    const { code, redirectUri } = body;
    if (!code || !redirectUri) {
      return jsonResponse({ error: 'Missing parameters' }, 400);
    }

    const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY');
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');
    if (!clientKey || !clientSecret) {
      return jsonResponse({ error: 'Server misconfigured: TIKTOK_* missing' }, 500);
    }

    // 1. Troca code por token
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return jsonResponse({ error: 'TikTok token exchange failed', detail: text }, 502);
    }
    const tokenData: TikTokTokenResponse = await tokenRes.json();

    // 2. Busca user info
    const userInfoRes = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username',
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    if (!userInfoRes.ok) {
      const text = await userInfoRes.text();
      return jsonResponse({ error: 'TikTok user info failed', detail: text }, 502);
    }
    const userInfo: TikTokUserInfo = await userInfoRes.json();

    const accountId = userInfo.data.user.open_id;
    const accountHandle = '@' + (userInfo.data.user.username || userInfo.data.user.display_name);

    // 3. Cifra tokens
    const encryptedAccess = await encryptToken(tokenData.access_token);
    const encryptedRefresh = await encryptToken(tokenData.refresh_token);
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    const { error: upsertError } = await supabaseAdmin
      .from('social_connections')
      .upsert({
        network: 'tiktok',
        account_handle: accountHandle,
        account_id: accountId,
        access_token_encrypted: encryptedAccess,
        refresh_token_encrypted: encryptedRefresh,
        token_expires_at: expiresAt,
        connected_by: userId,
        connected_at: new Date().toISOString(),
        status: 'active',
      }, { onConflict: 'network' });

    if (upsertError) {
      return jsonResponse({ error: 'Database error', detail: upsertError.message }, 500);
    }

    return jsonResponse({ ok: true, network: 'tiktok', accountHandle });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const status = msg.includes('Forbidden') ? 403 : msg.includes('Invalid') ? 401 : 500;
    return jsonResponse({ error: msg }, status);
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Deploy**

Run:
```bash
npx supabase functions deploy oauth-exchange-tiktok
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/oauth-exchange-tiktok
git commit -m "feat(edge): add oauth-exchange-tiktok function"
```

---

## Task 9: Edge Function `fetch-followers-live`

**Files:**
- Create: `supabase/functions/fetch-followers-live/index.ts`

- [ ] **Step 1: Criar a função**

```ts
// supabase/functions/fetch-followers-live/index.ts
import { handleCorsPreflight, corsHeaders } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { decryptToken } from '../_shared/encryption.ts';

interface FollowersResponse {
  network: string;
  followers: number;
  account_handle: string;
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    const { supabaseAdmin } = await requireAdmin(req);

    const { data: connections, error: connError } = await supabaseAdmin
      .from('social_connections')
      .select('network, account_id, account_handle, access_token_encrypted, status')
      .eq('status', 'active');

    if (connError) {
      return jsonResponse({ error: connError.message }, 500);
    }

    const results: FollowersResponse[] = [];

    for (const conn of connections ?? []) {
      try {
        const token = await decryptToken(conn.access_token_encrypted);
        let followers = 0;

        if (conn.network === 'instagram') {
          // GET /{ig-user-id}?fields=followers_count
          const res = await fetch(
            `https://graph.facebook.com/v19.0/${conn.account_id}?fields=followers_count&access_token=${token}`
          );
          const data = await res.json();
          followers = data.followers_count ?? 0;
        } else if (conn.network === 'facebook') {
          // GET /{page-id}?fields=fan_count
          const res = await fetch(
            `https://graph.facebook.com/v19.0/${conn.account_id}?fields=fan_count&access_token=${token}`
          );
          const data = await res.json();
          followers = data.fan_count ?? 0;
        } else if (conn.network === 'tiktok') {
          // GET /v2/user/info/?fields=follower_count
          const res = await fetch(
            'https://open.tiktokapis.com/v2/user/info/?fields=follower_count',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          followers = data.data?.user?.follower_count ?? 0;
        }

        results.push({
          network: conn.network,
          account_handle: conn.account_handle,
          followers,
        });
      } catch (e) {
        // se um falhar, retorna 0 e segue para os outros
        results.push({
          network: conn.network,
          account_handle: conn.account_handle,
          followers: 0,
        });
      }
    }

    return jsonResponse({ ok: true, results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const status = msg.includes('Forbidden') ? 403 : msg.includes('Invalid') ? 401 : 500;
    return jsonResponse({ error: msg }, status);
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Deploy**

Run:
```bash
npx supabase functions deploy fetch-followers-live
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/fetch-followers-live
git commit -m "feat(edge): add fetch-followers-live function"
```

---

## Task 10: Componente `ConnectionCard`

**Files:**
- Create: `src/components/monitoring/ConnectionCard.tsx`
- Create: `src/components/monitoring/ConnectionCard.test.tsx`

- [ ] **Step 1: Escrever o teste do componente**

```tsx
// src/components/monitoring/ConnectionCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionCard } from './ConnectionCard';
import { SOCIAL_NETWORKS } from '@/data/social-networks';

const igConfig = SOCIAL_NETWORKS[0];

describe('ConnectionCard', () => {
  it('renderiza estado "Não conectado" sem connection', () => {
    render(<ConnectionCard config={igConfig} connection={null} followers={null} loading={false} onConnect={() => {}} onDisconnect={() => {}} />);
    expect(screen.getByText(/Não conectado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Conectar/i })).toBeInTheDocument();
  });

  it('renderiza handle e seguidores quando conectado', () => {
    render(
      <ConnectionCard
        config={igConfig}
        connection={{ status: 'active', account_handle: '@purepilatesbr' }}
        followers={124567}
        loading={false}
        onConnect={() => {}}
        onDisconnect={() => {}}
      />
    );
    expect(screen.getByText('@purepilatesbr')).toBeInTheDocument();
    expect(screen.getByText('124.567')).toBeInTheDocument();
  });

  it('chama onConnect ao clicar em Conectar', () => {
    const onConnect = vi.fn();
    render(<ConnectionCard config={igConfig} connection={null} followers={null} loading={false} onConnect={onConnect} onDisconnect={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Conectar/i }));
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it('chama onDisconnect ao clicar em Desconectar', () => {
    const onDisconnect = vi.fn();
    render(
      <ConnectionCard
        config={igConfig}
        connection={{ status: 'active', account_handle: '@purepilatesbr' }}
        followers={1000}
        loading={false}
        onConnect={() => {}}
        onDisconnect={onDisconnect}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Desconectar/i }));
    expect(onDisconnect).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Rodar (deve falhar)**

Run: `npm run test:run -- src/components/monitoring/ConnectionCard.test.tsx`
Expected: FAIL — `Cannot find module './ConnectionCard'`.

- [ ] **Step 3: Implementar o componente**

```tsx
// src/components/monitoring/ConnectionCard.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { SocialNetworkConfig } from '@/data/social-networks';
import type { ConnectionStatus } from '@/lib/social-status';
import { getStatusLabel, getStatusBadgeColor } from '@/lib/social-status';

export interface ConnectionInfo {
  status: ConnectionStatus;
  account_handle: string;
}

interface ConnectionCardProps {
  config: SocialNetworkConfig;
  connection: ConnectionInfo | null;
  followers: number | null;
  loading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionCard({
  config,
  connection,
  followers,
  loading,
  onConnect,
  onDisconnect,
}: ConnectionCardProps) {
  const Icon = config.icon;
  const statusLabel = getStatusLabel(connection?.status ?? null);
  const badgeColor = getStatusBadgeColor(connection?.status ?? null);
  const isConnected = connection?.status === 'active';

  return (
    <Card className={`border-t-4 ${config.brandColor.split(' ').filter((c) => c.startsWith('border-')).join(' ')}`}>
      <CardHeader className="flex flex-row items-center gap-3">
        <Icon className={`h-6 w-6 ${config.brandColor.split(' ').filter((c) => c.startsWith('text-')).join(' ')}`} />
        <div>
          <h3 className="font-semibold">{config.label}</h3>
          {connection?.account_handle ? (
            <p className="text-xs text-muted-foreground">{connection.account_handle}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{config.handle}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badgeColor}`}>
          {statusLabel}
        </span>

        {isConnected && (
          <div>
            <p className="text-xs text-muted-foreground">Seguidores</p>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">
                {followers !== null ? followers.toLocaleString('pt-BR') : '--'}
              </p>
            )}
          </div>
        )}

        {!isConnected ? (
          <Button onClick={onConnect} className="w-full" size="sm">
            Conectar
          </Button>
        ) : (
          <Button onClick={onDisconnect} variant="outline" className="w-full" size="sm">
            Desconectar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Rodar testes (devem passar)**

Run: `npm run test:run -- src/components/monitoring/ConnectionCard.test.tsx`
Expected: PASS — 4 testes.

- [ ] **Step 5: Commit**

```bash
git add src/components/monitoring/ConnectionCard.tsx src/components/monitoring/ConnectionCard.test.tsx
git commit -m "feat(monitoring): add ConnectionCard component with tests"
```

---

## Task 11: Página `AuthCallbackMeta`

**Files:**
- Create: `src/pages/AuthCallbackMeta.tsx`

- [ ] **Step 1: Criar a página**

```tsx
// src/pages/AuthCallbackMeta.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackMeta() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`Provedor retornou erro: ${errorParam}`);
      return;
    }

    if (!code || !state) {
      setError('Parâmetros inválidos no callback');
      return;
    }

    // Pega rede e state esperados do sessionStorage
    const expectedState = sessionStorage.getItem('oauth_state_meta');
    const network = sessionStorage.getItem('oauth_network_meta');
    sessionStorage.removeItem('oauth_state_meta');
    sessionStorage.removeItem('oauth_network_meta');

    if (!expectedState || expectedState !== state) {
      setError('State inválido — possível ataque CSRF');
      return;
    }

    if (network !== 'instagram' && network !== 'facebook') {
      setError('Rede inválida');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback/meta`;

    supabase.functions
      .invoke('oauth-exchange-meta', {
        body: { code, redirectUri, network },
      })
      .then(({ data, error: invokeError }) => {
        if (invokeError || data?.error) {
          setError(invokeError?.message || data?.error || 'Falha na troca de token');
          return;
        }
        navigate('/agente-monitoramento/metricas');
      });
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-xl font-semibold text-red-600">Falha na conexão</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate('/agente-monitoramento/metricas')}
            className="text-sm underline"
          >
            Voltar para Métricas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p>Conectando…</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AuthCallbackMeta.tsx
git commit -m "feat(monitoring): add AuthCallbackMeta page"
```

---

## Task 12: Página `AuthCallbackTikTok`

**Files:**
- Create: `src/pages/AuthCallbackTikTok.tsx`

- [ ] **Step 1: Criar a página**

```tsx
// src/pages/AuthCallbackTikTok.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackTikTok() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`TikTok retornou erro: ${errorParam}`);
      return;
    }

    if (!code || !state) {
      setError('Parâmetros inválidos no callback');
      return;
    }

    const expectedState = sessionStorage.getItem('oauth_state_tiktok');
    sessionStorage.removeItem('oauth_state_tiktok');

    if (!expectedState || expectedState !== state) {
      setError('State inválido');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback/tiktok`;

    supabase.functions
      .invoke('oauth-exchange-tiktok', {
        body: { code, redirectUri },
      })
      .then(({ data, error: invokeError }) => {
        if (invokeError || data?.error) {
          setError(invokeError?.message || data?.error || 'Falha na troca de token');
          return;
        }
        navigate('/agente-monitoramento/metricas');
      });
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-xl font-semibold text-red-600">Falha na conexão</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate('/agente-monitoramento/metricas')}
            className="text-sm underline"
          >
            Voltar para Métricas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p>Conectando…</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AuthCallbackTikTok.tsx
git commit -m "feat(monitoring): add AuthCallbackTikTok page"
```

---

## Task 13: Página `AgenteMonitoramentoMetricas`

**Files:**
- Create: `src/pages/AgenteMonitoramentoMetricas.tsx`

- [ ] **Step 1: Criar a página**

```tsx
// src/pages/AgenteMonitoramentoMetricas.tsx
import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { ConnectionCard, type ConnectionInfo } from '@/components/monitoring/ConnectionCard';
import { SOCIAL_NETWORKS, type SocialNetworkId } from '@/data/social-networks';
import { buildOAuthUrl, generateState } from '@/lib/oauth-url-builder';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3 } from 'lucide-react';

interface FollowersResult {
  network: string;
  followers: number;
}

export default function AgenteMonitoramentoMetricas() {
  const [connections, setConnections] = useState<Record<SocialNetworkId, ConnectionInfo | null>>({
    instagram: null,
    facebook: null,
    tiktok: null,
  });
  const [followers, setFollowers] = useState<Record<SocialNetworkId, number | null>>({
    instagram: null,
    facebook: null,
    tiktok: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadConnections();
  }, []);

  async function loadConnections() {
    setLoading(true);

    const { data: rows } = await supabase
      .from('social_connections')
      .select('network, status, account_handle');

    const next: Record<SocialNetworkId, ConnectionInfo | null> = {
      instagram: null,
      facebook: null,
      tiktok: null,
    };

    rows?.forEach((row) => {
      next[row.network as SocialNetworkId] = {
        status: row.status as ConnectionInfo['status'],
        account_handle: row.account_handle,
      };
    });

    setConnections(next);

    // Se há pelo menos 1 conexão ativa, busca followers
    const hasActive = rows?.some((r) => r.status === 'active');
    if (hasActive) {
      const { data: followersData } = await supabase.functions.invoke('fetch-followers-live');
      const map: Record<SocialNetworkId, number | null> = {
        instagram: null,
        facebook: null,
        tiktok: null,
      };
      (followersData?.results as FollowersResult[] | undefined)?.forEach((r) => {
        map[r.network as SocialNetworkId] = r.followers;
      });
      setFollowers(map);
    }

    setLoading(false);
  }

  function handleConnect(networkId: SocialNetworkId) {
    const config = SOCIAL_NETWORKS.find((n) => n.id === networkId);
    if (!config) return;

    const appId = import.meta.env[config.appIdEnv] as string | undefined;
    if (!appId) {
      alert(`Variável ${config.appIdEnv} não configurada no .env.local`);
      return;
    }

    const state = generateState();
    const isMeta = networkId === 'instagram' || networkId === 'facebook';
    const callbackPath = isMeta ? '/auth/callback/meta' : '/auth/callback/tiktok';
    const redirectUri = `${window.location.origin}${callbackPath}`;

    if (isMeta) {
      sessionStorage.setItem('oauth_state_meta', state);
      sessionStorage.setItem('oauth_network_meta', networkId);
    } else {
      sessionStorage.setItem('oauth_state_tiktok', state);
    }

    const url = buildOAuthUrl({
      authorizeUrl: config.oauthAuthorizeUrl,
      clientId: appId,
      redirectUri,
      scopes: config.scopes,
      state,
    });

    window.location.href = url;
  }

  async function handleDisconnect(networkId: SocialNetworkId) {
    if (!confirm(`Desconectar ${networkId}?`)) return;

    await supabase
      .from('social_connections')
      .delete()
      .eq('network', networkId);

    void loadConnections();
  }

  const anyConnected = Object.values(connections).some((c) => c?.status === 'active');

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Métricas</h1>
            <p className="text-muted-foreground">Monitoramento de redes sociais · @purepilatesbr</p>
          </div>
        </div>

        {!anyConnected && !loading && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⚠ Conecte ao menos uma conta para começar a ver métricas.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {SOCIAL_NETWORKS.map((config) => (
            <ConnectionCard
              key={config.id}
              config={config}
              connection={connections[config.id]}
              followers={followers[config.id]}
              loading={loading}
              onConnect={() => handleConnect(config.id)}
              onDisconnect={() => handleDisconnect(config.id)}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AgenteMonitoramentoMetricas.tsx
git commit -m "feat(monitoring): add main Metricas page (B1 connection-only)"
```

---

## Task 14: Adicionar rotas no `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Importar as 3 páginas**

Localize o bloco de imports no topo de `src/App.tsx` (perto da linha 27 onde já tem `import AgentePlanejamentoEditorial`). Adicione:

```tsx
import AgenteMonitoramentoMetricas from "./pages/AgenteMonitoramentoMetricas";
import AuthCallbackMeta from "./pages/AuthCallbackMeta";
import AuthCallbackTikTok from "./pages/AuthCallbackTikTok";
```

- [ ] **Step 2: Adicionar as 3 rotas**

Localize a `<Routes>` (perto da linha 39). Antes da rota `path="*"` final, adicione:

```tsx
<Route
  path="/agente-monitoramento/metricas"
  element={<ProtectedRoute requireAdmin><AgenteMonitoramentoMetricas /></ProtectedRoute>}
/>
<Route path="/auth/callback/meta" element={<AuthCallbackMeta />} />
<Route path="/auth/callback/tiktok" element={<AuthCallbackTikTok />} />
```

> Nota: as rotas de callback **não** ficam dentro de ProtectedRoute porque o usuário pode chegar nelas após login externo, mas a Edge Function exige JWT. Garantir que `supabase.functions.invoke` envia o JWT atual automaticamente.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(routing): add monitoramento + auth callback routes"
```

---

## Task 15: Adicionar nova seção "Agente Monitoramento" no Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Importar ícones novos**

Localize o bloco de imports do `lucide-react` em `src/components/layout/Sidebar.tsx`. Adicione `BarChart3` e `Heart`:

```tsx
import {
  // ... ícones existentes,
  BarChart3,
  Heart,
} from 'lucide-react';
```

- [ ] **Step 2: Adicionar a configuração de navegação**

Logo após a definição de `socialMediaNavigation` (linha ~86), adicione:

```tsx
// Agente Monitoramento section - only for admins
const monitoramentoNavigation = [
  { name: 'Métricas', href: '/agente-monitoramento/metricas', icon: BarChart3, disabled: false },
  { name: 'Saúde de marca', href: '#', icon: Heart, disabled: true },
];
```

- [ ] **Step 3: Renderizar a nova seção**

Logo após o bloco `{/* Agente Social Media - Studios Section */}` (que termina por volta da linha 183), adicione:

```tsx
{/* Agente Monitoramento Section - Only for admins */}
{isAdmin && (
  <>
    <div className="pt-4 pb-2">
      <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <BarChart3 className="h-3.5 w-3.5" />
        Agente Monitoramento
      </p>
    </div>
    {monitoramentoNavigation.map((item) => (
      item.disabled ? (
        <div
          key={item.name}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
        >
          <item.icon className="h-5 w-5" />
          {item.name}
          <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">Em breve</Badge>
        </div>
      ) : (
        <NavLink
          key={item.name}
          to={item.href}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            )
          }
        >
          <item.icon className="h-5 w-5" />
          {item.name}
        </NavLink>
      )
    ))}
  </>
)}
```

- [ ] **Step 4: Verificar visualmente**

Run: `npm run dev`
Abra http://localhost:8081, logue com user admin. Sidebar deve mostrar a nova seção "Agente Monitoramento" com:
- ✓ Métricas (clicável)
- Saúde de marca · Em breve (desabilitado)

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(layout): add Agente Monitoramento sidebar section"
```

---

## Task 16: Testes de smoke end-to-end manual

**Files:**
- (nenhum — apenas verificação)

- [ ] **Step 1: Configurar `.env.local`**

Na raiz do projeto, criar arquivo `.env.local`:

```
VITE_META_APP_ID=<seu-meta-app-id>
VITE_TIKTOK_CLIENT_KEY=<seu-tiktok-client-key>
```

- [ ] **Step 2: Subir dev server**

Run: `npm run dev`
Abra http://localhost:8081/agente-monitoramento/metricas (logado como admin).

Expected: vê 3 cards (IG, FB, TikTok) com status "Não conectado" e botão "Conectar".

- [ ] **Step 3: Testar fluxo Instagram**

- Clicar em "Conectar" no card Instagram
- Browser redireciona para Meta
- Logar com a conta `@purepilatesbr` e autorizar permissões
- Browser volta para `/auth/callback/meta?code=...&state=...`
- Página mostra "Conectando…"
- Após 1–2s, redireciona pra `/agente-monitoramento/metricas`
- Card Instagram agora mostra "✓ Conectado" + handle + número de seguidores

Expected: tudo acima funciona sem erros no console.

- [ ] **Step 4: Testar fluxo Facebook (mesmo Meta App)**

- Idem ao passo 3, mas no card Facebook
- Como compartilha o mesmo Meta App, o login provavelmente é skippado e só pede autorização de scopes adicionais

Expected: card Facebook também mostra "✓ Conectado" + fan count.

- [ ] **Step 5: Testar fluxo TikTok**

- Clicar em "Conectar" no card TikTok
- Browser redireciona para TikTok
- Logar com `@purepilatesbr` e autorizar
- Volta para `/auth/callback/tiktok`
- Card TikTok mostra "✓ Conectado" + handle + follower count

- [ ] **Step 6: Testar Desconectar**

- Clicar em "Desconectar" em qualquer card conectado
- Confirmar prompt
- Card volta para "Não conectado"

- [ ] **Step 7: Verificar dados no Supabase**

Run no SQL Editor:
```sql
SELECT network, account_handle, status, connected_at, token_expires_at
FROM social_connections;
```

Expected: até 3 linhas (uma por rede conectada). Tokens não aparecem em texto puro (só `access_token_encrypted` cifrado).

- [ ] **Step 8: Commit final do B1**

Se houver ajustes durante o smoke test, comitar individualmente. Por fim:

```bash
git tag -a "metricas-b1" -m "B1 (conexão de contas) entregue"
```

---

## Self-Review

Esta seção é uma checklist do próprio plano contra o spec. Revisar e corrigir inline antes de iniciar execução.

**1. Cobertura do spec:**

- [✓] Migration `social_connections` (Spec §7) → Task 2
- [✓] RLS de admin → Task 2
- [✓] Tokens cifrados → Task 6 + Task 7/8
- [✓] OAuth IG → Task 7 + Task 11 + Task 13
- [✓] OAuth FB → Task 7 + Task 11 + Task 13 (mesmo Meta App)
- [✓] OAuth TikTok → Task 8 + Task 12 + Task 13
- [✓] Fetch followers ao vivo → Task 9 + Task 13
- [✓] Página Métricas (B1 — só conexão) → Task 13
- [✓] Sidebar nova seção "Agente Monitoramento" → Task 15
- [✓] Item "Saúde de marca · Em breve" no sidebar → Task 15
- [✓] Rotas em App.tsx → Task 14
- [✓] Restrição admin (ProtectedRoute requireAdmin) → Task 14
- [✓] State CSRF protection no OAuth → Task 13 (sessionStorage) + Task 11/12 (validação)

**Itens do spec que ficam para B2/B3 (não cobertos aqui):**
- Métricas além de followers (alcance, engajamento, etc.) — B2
- Semáforo 🟢🟡🔴 contra metas editoriais — B2
- Seletor de período 7d/28d/90d — B2
- Refresh manual button — B2
- `editorial-kpis.ts` — B2
- Refresh-tokens cron — B2
- Sync diário + snapshots — B3
- Gráfico de tendência — B3
- Top posts — B3

**2. Placeholders:** revisado — sem TBD/TODO. Todos os snippets de código estão completos.

**3. Consistência de tipos:**
- `ConnectionStatus` definido em `social-status.ts` Task 4 → usado em `ConnectionCard.tsx` Task 10 → consistente.
- `SocialNetworkId` definido em `social-networks.ts` Task 3 → usado em `AgenteMonitoramentoMetricas.tsx` Task 13 → consistente.
- `ConnectionInfo` definido em `ConnectionCard.tsx` Task 10 → usado em Task 13 → consistente.
- Edge Functions usam mesma chave `PG_ENCRYPT_KEY` → consistente.

**4. Decisões implícitas que valem destacar pro engenheiro:**

- **Fluxo OAuth Meta unificado:** o mesmo Meta App e mesma rota `/auth/callback/meta` servem tanto Instagram quanto Facebook. O frontend marca em sessionStorage qual rede iniciou o fluxo, e a Edge Function recebe `network` no body para distinguir.
- **Sem refresh de token em B1:** o token Meta dura 60 dias. Se expirar nesse intervalo, o admin reconecta manualmente. Refresh automático fica para B2.
- **Pgsodium foi simplificado para AES-GCM via Web Crypto:** no plano final usamos AES-GCM nativo do Deno, não a extensão pgsodium do Postgres. Funcionalmente equivalente para B1 (cifragem simétrica autenticada). Se em B2/B3 preferir pgsodium nativo, é uma refatoração local em `_shared/encryption.ts`.

---

## Execução

Plano completo. Recomendação: executar via **subagent-driven-development** — um subagente fresco por task, com revisão entre tasks. Para tasks pequenas (4–7) pode-se rodar em batch via `executing-plans`.

A primeira coisa a verificar antes de começar é se os pré-requisitos externos (Meta App, TikTok App, secrets do Supabase) já estão prontos — sem eles o smoke test final (Task 16) falha mesmo com todo o código correto.
