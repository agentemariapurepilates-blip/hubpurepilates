// Camada de busca das abas Relatório e Integração.
//
// POR QUE NÃO USA O CLIENTE SUPABASE
// As tabelas report_recipients, report_settings e integration_logs exigem
// sessão de administrador do projeto de indicadores (RLS com has_role). Lidas
// de forma anônima elas voltam com zero linhas — sem erro e sem aviso. A única
// leitura possível é com a chave de serviço, e chave de serviço não pode ir
// para o navegador. Por isso o dado vem do proxy do servidor de
// desenvolvimento (plugin `indicadores-dev-proxy`, em vite.config.ts), que
// consulta o banco no processo Node e devolve só o JSON já pronto.
//
// SOMENTE GET. O proxy recusa qualquer outro método, coerente com a garantia
// de somente-consulta da área de Dashboard.

const BASE_DO_PROXY = '/api-dev/indicadores';

/** Erro de leitura do proxy, com o código HTTP para a tela decidir o que dizer. */
export interface ErroDoProxy extends Error {
  /** Código HTTP da resposta. 0 quando nem houve resposta (rede/servidor fora). */
  status: number;
}

function erroDoProxy(status: number, mensagem: string): ErroDoProxy {
  return Object.assign(new Error(mensagem), { status });
}

export function ehErroDoProxy(erro: unknown): erro is ErroDoProxy {
  return erro instanceof Error && typeof (erro as ErroDoProxy).status === 'number';
}

/**
 * O proxy está de pé, mas a chave de serviço não foi configurada (HTTP 503).
 * É um estado de configuração, não uma falha — a tela precisa distinguir os
 * dois para poder dizer o que a pessoa tem que fazer.
 */
export function ehChaveNaoConfigurada(erro: unknown): boolean {
  return ehErroDoProxy(erro) && erro.status === 503;
}

/** Mensagem legível de qualquer erro, para mostrar na tela. */
export function mensagemDoErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) return erro.message;
  return 'Falha desconhecida ao ler o banco de indicadores.';
}

async function corpoJson(resposta: Response): Promise<unknown> {
  try {
    return await resposta.json();
  } catch {
    return null;
  }
}

interface OpcoesDeLeitura {
  /** Ordenação no formato aceito pelo proxy: `coluna.asc` ou `coluna.desc`. */
  order?: string;
  /** Teto de linhas. O proxy só aceita até 4 dígitos. */
  limit?: number;
}

/**
 * Lê uma das tabelas liberadas no proxy e devolve as linhas.
 * Lança ErroDoProxy — nunca devolve lista vazia para disfarçar uma falha,
 * senão "sem dados" e "não deu para ler" ficam indistinguíveis na tela.
 */
export async function lerTabelaDeIndicadores<T>(
  tabela: string,
  opcoes: OpcoesDeLeitura = {},
): Promise<T[]> {
  const consulta = new URLSearchParams();
  if (opcoes.order) consulta.set('order', opcoes.order);
  if (opcoes.limit !== undefined) consulta.set('limit', String(opcoes.limit));
  const sufixo = consulta.toString() ? `?${consulta}` : '';

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE_DO_PROXY}/${tabela}${sufixo}`);
  } catch (e) {
    throw erroDoProxy(0, `Não foi possível falar com o servidor: ${(e as Error).message}`);
  }

  if (!resposta.ok) {
    const corpo = await corpoJson(resposta);
    const erroDoCorpo = (corpo as { erro?: unknown } | null)?.erro;
    const mensagem =
      typeof erroDoCorpo === 'string' && erroDoCorpo
        ? erroDoCorpo
        : `O servidor respondeu ${resposta.status} ao ler "${tabela}".`;
    throw erroDoProxy(resposta.status, mensagem);
  }

  const corpo = await corpoJson(resposta);

  // Fora do `npm run dev` o proxy não existe (apply: 'serve'), então esta URL
  // cai no index.html da SPA: HTTP 200 com HTML. Sem esta checagem viraria um
  // erro de sintaxe de JSON, que não explica nada a quem está olhando.
  if (!Array.isArray(corpo)) {
    throw erroDoProxy(
      resposta.status,
      'O proxy de indicadores não respondeu com dados. Ele só existe no servidor de ' +
        'desenvolvimento (npm run dev).',
    );
  }

  return corpo as T[];
}

/**
 * Opções comuns das consultas ao proxy. Sem repetição de tentativa: 503 (falta
 * a chave) e 404 (tabela fora da lista) são determinísticos — insistir só
 * atrasa a mensagem de erro em três vezes.
 */
export const OPCOES_DE_CONSULTA = { retry: false } as const;
