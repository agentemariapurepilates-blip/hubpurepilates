/**
 * Prévia local do módulo Leads RH.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE ISTO EXISTE
 * ────────────────────────────────────────────────────────────────────────────
 * As tabelas do módulo ainda não foram criadas (modo local), então em `npm run
 * dev` a tela mostraria só o aviso "ainda não instalado" — e não dá para
 * avaliar um módulo por um aviso. Este arquivo alimenta a tela com os dados
 * REAIS da conta, capturados da Graph API, para a prévia ser fiel.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * AS DUAS TRAVAS QUE IMPEDEM ISTO DE VAZAR PARA PRODUÇÃO
 * ────────────────────────────────────────────────────────────────────────────
 * 1. `import.meta.env.DEV` — em produção a função devolve `null` antes de
 *    qualquer coisa.
 * 2. O `import()` é dinâmico e só acontece dentro desse `if`. Como o Vite faz
 *    tree-shaking por `import.meta.env.DEV`, os JSONs nem entram no bundle
 *    final. Um `import` no topo do arquivo colocaria 250 KB de dado em
 *    produção mesmo sem ninguém usar.
 *
 * A tela SEMPRE marca a origem: quando o dado vem daqui, aparece um selo de
 * prévia com a data da captura. Dado de prévia sem etiqueta vira dado de
 * verdade na cabeça de quem olha.
 *
 * O arquivo capturado tem DADO PESSOAL de candidato (nome, e-mail, telefone) e
 * por isso está no .gitignore — ver o teste ao lado, que trava isso.
 */

import { normalizarLead, type LeadBruto, type LeadRH } from '../lib/leads';

export interface PreviaDeLeads {
  leads: LeadRH[];
  capturadoEm: string;
  /** Há agendamento diário nesta máquina (a tarefa do Windows). */
  automatica: boolean;
}

export async function carregarPreviaDeLeads(): Promise<PreviaDeLeads | null> {
  if (!import.meta.env.DEV) return null;

  // `import.meta.glob` em vez de `import()` direto: o arquivo está no
  // .gitignore por conter dado pessoal de candidato, então quem clonar o
  // repositório não o terá — e um `import()` de arquivo ausente quebra o
  // build inteiro, não só esta função.
  const modulos = import.meta.glob<{
    default: { geradoEm: string; automatica?: boolean; leads: LeadBruto[] };
  }>(
    './leads-rh.json',
  );
  const carregar = modulos['./leads-rh.json'];
  if (!carregar) return null;

  const arquivo = (await carregar()).default;

  return {
    capturadoEm: arquivo.geradoEm,
    automatica: Boolean(arquivo.automatica),
    leads: arquivo.leads.map(normalizarLead),
  };
}
