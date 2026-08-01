// Tipos da tela de Inaugurações. Espelham a tabela `inauguracao_requests`
// (ver `supabase/migrations/20260731120000_inauguracao_requests.sql`).

export interface InauguracaoRequest {
  id: string;
  user_id: string;
  nome_unidade: string;
  unidade_id: string;
  endereco: string;
  solicitante_nome: string;
  solicitante_email: string;
  data_inauguracao: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

/** O que o formulário envia — o resto o banco preenche. */
export type NovaInauguracao = Omit<
  InauguracaoRequest,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;
