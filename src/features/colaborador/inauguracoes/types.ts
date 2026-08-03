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

// Espelha `inauguracao_email_recipients` (ver
// supabase/migrations/20260801140000_inauguracao_email_recipients.sql). Lista
// de quem recebe o aviso de inauguração por e-mail, gerenciada só por admin.
export interface DestinatarioAviso {
  id: string;
  email: string;
  nome: string | null;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
