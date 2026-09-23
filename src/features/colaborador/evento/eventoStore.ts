// Confirmação de presença no evento dos colaboradores, com sorteio de turma.
//
// O sorteio NÃO acontece aqui: quem sorteia é a função confirmar_presenca_evento()
// no banco (ver supabase/migrations/20260923200000_evento_confirmacoes.sql). Se
// fosse no navegador, a pessoa poderia escolher a própria turma e duas
// confirmações ao mesmo tempo leriam a mesma contagem.

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

/**
 * Os dados do evento. É o único lugar para editar: a tela inteira lê daqui e
 * campo vazio simplesmente não aparece na página.
 */
export const EVENTO = {
  /** Identifica o evento no banco. Mudar isto começa uma lista nova, do zero. */
  chave: 'jornada-do-franqueado-2026-09-24',
  titulo: 'Jornada do Franqueado',
  /** Uma linha logo abaixo do título. */
  subtitulo: 'Uma missão de equipe: escapar, resolver os mistérios e sair com a resposta.',
  data: '24 de setembro de 2026',
  horario: '9h30 — a porta será aberta apenas 1 vez',
  local: 'Escape 60 · R. Serra de Bragança, 658 — Tatuapé, São Paulo - SP',
  /** Texto de boas-vindas, antes do formulário. */
  convite:
    'Confirme sua presença para a gente organizar as salas. A sua turma é sorteada na hora, assim que você confirmar.',
};
export type Turma = 'A' | 'B';

export type Confirmacao = {
  id: string;
  userId: string;
  nome: string;
  whatsapp: string;
  turma: Turma;
  criadoEm: string;
};

type Linha = Database['public']['Tables']['evento_confirmacoes']['Row'];

/** `turma` chega como texto livre do banco; aqui vira 'A' ou 'B'. */
const paraConfirmacao = (linha: Linha): Confirmacao => ({
  id: linha.id,
  userId: linha.user_id,
  nome: linha.nome,
  whatsapp: linha.whatsapp,
  turma: linha.turma === 'B' ? 'B' : 'A',
  criadoEm: linha.criado_em,
});

/** A confirmação de quem está logado, ou null se ainda não confirmou. */
export async function buscarMinhaConfirmacao(userId: string): Promise<Confirmacao | null> {
  const { data, error } = await supabase
    .from('evento_confirmacoes')
    .select('*')
    .eq('evento', EVENTO.chave)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? paraConfirmacao(data) : null;
}

/** Todo mundo que já confirmou, do primeiro para o último. */
export async function listarConfirmacoes(): Promise<Confirmacao[]> {
  const { data, error } = await supabase
    .from('evento_confirmacoes')
    .select('*')
    .eq('evento', EVENTO.chave)
    .order('criado_em', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(paraConfirmacao);
}

/**
 * Confirma e devolve a turma sorteada. Chamar de novo não re-sorteia: o banco
 * devolve a confirmação que já existe.
 */
export async function confirmarPresenca(nome: string, whatsapp: string): Promise<Confirmacao> {
  const { data, error } = await supabase.rpc('confirmar_presenca_evento', {
    _evento: EVENTO.chave,
    _nome: nome,
    _whatsapp: whatsapp,
  });

  if (error) throw error;
  return paraConfirmacao(data as Linha);
}

/** (11) 98888-7777 enquanto a pessoa digita. */
export function formatarWhatsapp(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

/** Aceita fixo (10 dígitos) e celular (11). */
export function whatsappValido(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '');
  return digitos.length === 10 || digitos.length === 11;
}

/** Quantas pessoas em cada turma — o rodapé da tela e a conferência do dia. */
export function contarPorTurma(lista: Confirmacao[]): { A: number; B: number; total: number } {
  const A = lista.filter((c) => c.turma === 'A').length;
  return { A, B: lista.length - A, total: lista.length };
}
