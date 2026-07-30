import { createClient } from '@supabase/supabase-js';

// Cliente somente-leitura do banco do Painel de Indicadores.
// ATENÇÃO: é um projeto Supabase DIFERENTE do Hub (bweyyihedqnckbtzbkie).
// Nunca autentica: a autorização de quem pode ver essas telas é feita pela
// sessão do Hub (ProtectedRoute), e este cliente só lê tabelas com RLS pública.
//
// persistSession/autoRefreshToken em false e storageKey própria são
// OBRIGATÓRIOS: dois clientes supabase-js na mesma origem disputam o
// localStorage, e sem isolamento este aqui derruba o login do Hub.
export const INDICADORES_AUTH_OPTIONS = {
  persistSession: false,
  autoRefreshToken: false,
  storageKey: 'sb-indicadores-noauth',
} as const;

const url = import.meta.env.VITE_INDICADORES_SUPABASE_URL;
const anonKey = import.meta.env.VITE_INDICADORES_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'VITE_INDICADORES_SUPABASE_URL e VITE_INDICADORES_SUPABASE_ANON_KEY precisam estar no .env.local. ' +
      'Sem elas as telas de Dashboard não carregam. Use o .env.local.example como modelo.',
  );
}

export const supabaseIndicadores = createClient(url, anonKey, {
  auth: { ...INDICADORES_AUTH_OPTIONS },
});
