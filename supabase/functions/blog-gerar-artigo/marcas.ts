// As três marcas do Blog da Pure e o revezamento do calendário. Sem dependência
// do Deno: a tela do Hub importa este mesmo arquivo, então o dia de cada marca
// é calculado igual nos dois lados.

export type Marca = 'studios' | 'academy' | 'franchising'

export const ORDEM_DAS_MARCAS: Marca[] = ['studios', 'academy', 'franchising']

export const MARCAS: Record<Marca, { nome: string; publico: string; categorias: string[] }> = {
  studios: {
    nome: 'Studios',
    publico:
      'Pessoas que fazem ou querem fazer Pilates: alunos e possíveis alunos. Linguagem simples, foco em bem-estar, corpo e rotina.',
    categorias: ['Pilates', 'Dicas Gerais', 'Exercícios', 'Saúde e beleza', 'Patologias', 'Alimentação', 'Novidades'],
  },
  academy: {
    nome: 'Academy',
    publico:
      'Instrutores, fisioterapeutas, profissionais e estudantes de Educação Física, interessados na formação da Pure Pilates Academy. Pode usar termos técnicos do método, explicando quando preciso.',
    categorias: ['Formação'],
  },
  franchising: {
    nome: 'Franchising',
    publico:
      'Pessoas avaliando investir numa franquia Pure Pilates. Tom de negócio, claro e sóbrio. Nunca prometa faturamento, retorno ou prazo de retorno.',
    categorias: ['Seja um Franqueado', 'Negócios'],
  },
}

export const ehMarca = (valor: unknown): valor is Marca => ORDEM_DAS_MARCAS.includes(valor as Marca)

/**
 * A marca de cada dia do mês: dia 1 Studios, dia 2 Academy, dia 3 Franchising,
 * e assim por diante. Recomeça no dia 1 de cada mês.
 */
export const marcaDoDia = (data: string): Marca => {
  const dia = Number(data.slice(8, 10))
  return ORDEM_DAS_MARCAS[(dia - 1) % ORDEM_DAS_MARCAS.length]
}

/** Todos os dias de um mês ('2026-11') no formato '2026-11-01'. */
export const diasDoMes = (mes: string): string[] => {
  const [ano, m] = mes.split('-').map(Number)
  const total = new Date(Date.UTC(ano, m, 0)).getUTCDate()
  return Array.from({ length: total }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`)
}

/**
 * A data de hoje em São Paulo ('2026-11-05'). O servidor do Supabase roda em
 * UTC: sem o fuso, depois das 21h ele já acharia que é o dia seguinte.
 */
export const hojeEmSaoPaulo = (agora: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora)

/**
 * Os dias do mês que ainda podem receber pauta: de hoje em diante (pedido de
 * 05/11/2026: no dia 5, não faz sentido sugerir os dias 1 a 4). Mês passado
 * não tem nenhum; mês futuro tem todos.
 */
export const diasPlanejaveis = (mes: string, hoje: string = hojeEmSaoPaulo()): string[] =>
  diasDoMes(mes).filter((d) => d >= hoje)
