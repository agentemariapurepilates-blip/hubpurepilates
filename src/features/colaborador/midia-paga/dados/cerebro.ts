/**
 * CÉREBRO DAS CAMPANHAS — Meta Ads e Google Ads
 *
 * Este arquivo é o manual. Ele existe para que uma IA (e qualquer pessoa nova
 * na mídia) entenda COMO as campanhas da Pure Pilates deveriam funcionar antes
 * de olhar para qualquer número.
 *
 * Ele é a fonte única de três coisas:
 *   1. a tela `Cérebro` do Hub, que mostra o manual para as pessoas;
 *   2. o prompt enviado à IA em `lib/prompt-da-ia.ts`;
 *   3. as regras que o diagnóstico determinístico confere em `lib/analise.ts`.
 *
 * Manter isso num só lugar é proposital: quando a operação mudar, o texto, o
 * prompt e as verificações mudam juntos. Um manual em PDF solto sempre acaba
 * descrevendo uma operação que não existe mais.
 *
 * COMO EDITAR: mexa aqui, não na tela nem no prompt. Os testes em
 * `lib/nomenclatura.test.ts` cobrem os padrões de nome declarados abaixo.
 */

export type Plataforma = 'meta' | 'google-ads' | 'ga4';

export type Kpi = 'cpl' | 'cpa' | 'cpm' | 'ctr' | 'alcance';

/** Quem responde por um número, quando ele sai da faixa. */
export type Responsavel = 'sede' | 'agencia' | 'unidade';

export interface FaixaDeReferencia {
  /** Até este valor, está bom. */
  bom: number;
  /** Acima de `bom` e até aqui, merece olhar. Acima disto, está ruim. */
  atencao: number;
  /** De onde saiu o número. Nunca deixe isto vazio. */
  origem: string;
}

export interface Frente {
  id: string;
  nome: string;
  /** Por que esta campanha existe. Uma frase, sem jargão. */
  objetivo: string;
  plataformas: Plataforma[];
  /** Trechos que identificam a frente no nome da campanha ou do conjunto. */
  marcadores: string[];
  publico: string;
  /** O que o Meta/Google contabiliza como "resultado" nesta frente. */
  resultado: string;
  kpi: Kpi;
  /**
   * Faixa de referência do KPI. `null` quando a sede ainda não definiu a meta —
   * nesse caso o diagnóstico usa a mediana do próprio histórico e diz isso na
   * tela, em vez de comparar com um número inventado.
   */
  faixa: FaixaDeReferencia | null;
  responsavel: Responsavel;
  /** A frente só faz sentido amarrada a uma unidade (o resultado é da unidade). */
  exigeUnidade: boolean;
  /** Como a frente deve rodar no dia a dia. */
  regras: string[];
  /** O que costuma dar errado nela. */
  errosComuns: string[];
}

export interface Eixo {
  id: string;
  nome: string;
  /** O que a rede ganha com este eixo, em uma frase. */
  proposito: string;
  frentes: Frente[];
}

/**
 * Os três eixos da mídia paga.
 *
 * A ordem é a do funil: primeiro trazer gente para a aula experimental, depois
 * captar leads que não são aluno (RH e Academy), e por fim vender produto.
 */
export const EIXOS: Eixo[] = [
  {
    id: 'aula-experimental',
    nome: 'Aula experimental',
    proposito:
      'Encher a agenda de aula experimental das unidades. É o topo do funil da rede: ' +
      'quem faz a experimental é quem vira matrícula.',
    frentes: [
      {
        id: 'agendamento-de-aula',
        nome: 'Agendamento de aula',
        objetivo:
          'Levar quem mora perto de uma unidade a marcar a primeira aula, com dia e hora.',
        plataformas: ['meta', 'google-ads'],
        // "advantage" NÃO entra aqui, embora apareça em quase todo conjunto de
        // aquisição. É o nome da segmentação automática do Meta, e ela é usada
        // dentro de qualquer frente — inclusive nas campanhas da Academy, onde
        // os conjuntos se chamam "belenzinho | sao-paulo | advantage | ...".
        // Usá-la como marcador jogaria a verba da Academy no eixo de aula
        // experimental.
        marcadores: ['agendamento'],
        publico: 'Aberto por região da unidade, faixa de idade definida no conjunto.',
        resultado: 'Agendamento concluído (lead com data de aula escolhida).',
        kpi: 'cpl',
        faixa: null,
        responsavel: 'agencia',
        exigeUnidade: true,
        regras: [
          'Em 17/08/2026 esta frente não tinha nenhuma campanha própria na conta. Quando for ' +
          'criada, o público no nome é "agendamento" — é assim que o relatório vai reconhecê-la.',
          'Cada conjunto atende UMA unidade e o nome traz a unidade e a região.',
          'A faixa de idade fica explícita no nome do conjunto (ex.: aberto-21-a-40-anos).',
          'Unidade sem agenda aberta não deve ter conjunto ativo — o lead chega e não tem onde marcar.',
        ],
        errosComuns: [
          'Conjunto continua ativo depois da unidade lotar a agenda.',
          'Duas versões do mesmo conjunto rodando ao mesmo tempo, dividindo o aprendizado.',
        ],
      },
      {
        id: 'dco',
        nome: 'DCO',
        objetivo:
          'Deixar o Meta montar a peça combinando criativos, para cobrir muitas unidades ' +
          'sem precisar de uma arte por unidade.',
        plataformas: ['meta'],
        marcadores: ['dco'],
        publico: 'Interesses, recortado por unidade (leads) ou por estado (venda).',
        resultado: 'Lead de aula experimental.',
        kpi: 'cpl',
        faixa: null,
        responsavel: 'agencia',
        exigeUnidade: true,
        regras: [
          'Todo conjunto de DCO precisa estar vinculado a uma unidade no Hub — sem o vínculo, ' +
          'o gasto não aparece no painel da unidade e ninguém cobra o resultado.',
          'O nome do conjunto termina com a unidade (leads) ou com o estado (venda).',
          'DCO é o formato padrão da rede: quando existir DCO e conjunto manual para a mesma ' +
          'unidade, o manual é a exceção e precisa de justificativa.',
        ],
        errosComuns: [
          'Conjunto de DCO sem vínculo com unidade: gasta e não é medido.',
          'Criativos de unidades diferentes no mesmo conjunto.',
        ],
      },
      {
        id: 'remarketing',
        nome: 'Remarketing',
        objetivo:
          'Voltar em quem já demonstrou interesse — visitou o site, viu o vídeo, começou o ' +
          'formulário — e não terminou.',
        plataformas: ['meta', 'google-ads'],
        marcadores: ['rmkt', 'remarketing', 'visitantes', 'engajados'],
        publico: 'Públicos de origem: tráfego do site, engajamento, base de leads.',
        resultado: 'Lead ou agendamento recuperado.',
        kpi: 'cpl',
        faixa: null,
        responsavel: 'agencia',
        exigeUnidade: false,
        regras: [
          'Só faz sentido rodar com público de origem sendo alimentado — se a campanha de topo ' +
          'parar, o remarketing seca em poucos dias.',
          'O custo por lead do remarketing tem que ser MENOR que o da prospecção. Se estiver ' +
          'maior, o público está pequeno demais ou saturado.',
          'Frequência acima de 4 no período é sinal de saturação.',
        ],
        errosComuns: [
          'Remarketing rodando sozinho, sem campanha de topo alimentando o público.',
          'Mesma peça da prospecção — quem já viu vê de novo e ignora.',
        ],
      },
      {
        id: 'apartadas',
        nome: 'Apartadas',
        objetivo:
          'Verba separada por unidade, fora do bolo da rede, para unidade que precisa de ' +
          'reforço (inauguração, agenda vazia, praça nova).',
        plataformas: ['meta'],
        marcadores: ['apartadas'],
        publico: 'Interesses no raio da unidade.',
        resultado: 'Lead de aula experimental da unidade que pagou.',
        kpi: 'cpl',
        faixa: null,
        responsavel: 'sede',
        exigeUnidade: true,
        regras: [
          'Uma unidade por conjunto, sempre. É verba da unidade, então o resultado é dela.',
          'Tem começo e fim: apartada que roda meses seguidos virou verba fixa e deveria ' +
          'estar no orçamento da rede.',
          'O custo por lead é comparado com o das outras unidades do mesmo período, não com ' +
          'o histórico da própria unidade — praça nova sempre começa cara.',
        ],
        errosComuns: [
          'Conjunto apartado esquecido ligado depois do período contratado.',
          'Unidade sem vínculo no Hub: o franqueado paga e não vê o número.',
        ],
      },
    ],
  },
  {
    id: 'leads',
    nome: 'Leads',
    proposito:
      'Captar gente que não é aluno: instrutor para as vagas das unidades e aluno para os ' +
      'cursos da Academy.',
    frentes: [
      {
        id: 'rh',
        nome: 'Campanhas de RH',
        objetivo: 'Preencher vaga de instrutor de pilates numa unidade específica.',
        plataformas: ['meta'],
        marcadores: ['cargos', 'rh-instrutor', 'instrutor-pilates'],
        publico: 'Cargo e formação, no raio da unidade.',
        resultado: 'Candidatura (lead com currículo ou contato).',
        kpi: 'cpl',
        faixa: null,
        responsavel: 'sede',
        exigeUnidade: true,
        regras: [
          'A campanha existe enquanto a vaga existe. Vaga preenchida, conjunto desligado — ' +
          'é o erro mais caro e mais comum desta frente.',
          'O nome do conjunto traz unidade, região e o cargo.',
          'Volume importa mais que custo: é melhor 40 candidatos a R$ 12 que 8 a R$ 6.',
        ],
        errosComuns: [
          'Conjunto ativo semanas depois da vaga fechada.',
          'Conjunto duplicado por causa de cópia manual (nomes com "— Cópia").',
        ],
      },
      {
        id: 'academy',
        nome: 'Academy',
        objetivo: 'Vender curso e workshop da Pure Pilates Academy.',
        plataformas: ['meta', 'google-ads'],
        marcadores: ['academy', 'academy-workshop'],
        publico: 'Instrutores e estudantes de pilates, nacional.',
        resultado: 'Lead de curso (formulário) ou inscrição no workshop.',
        kpi: 'cpl',
        faixa: null,
        responsavel: 'sede',
        exigeUnidade: false,
        regras: [
          'Workshop tem data: a campanha sobe com antecedência combinada e desce no dia do evento.',
          'Curso contínuo (lead-ad e lead-site) roda always-on e é avaliado por mês.',
          'lead-ad (formulário dentro do Meta) e lead-site (formulário no site) são comparados ' +
          'entre si: o formulário nativo costuma ser mais barato e converter menos.',
        ],
        errosComuns: [
          'Campanha de workshop rodando depois do evento.',
          'Comparar o custo de lead-ad com o de lead-site sem olhar a conversão em matrícula.',
        ],
      },
    ],
  },
  {
    id: 'venda',
    nome: 'Venda',
    proposito: 'Vender produto digital e físico direto, sem passar pela unidade.',
    frentes: [
      {
        id: 'pilates-play',
        nome: 'Pilates Play',
        objetivo: 'Vender assinatura do Pilates Play.',
        plataformas: ['meta', 'google-ads'],
        marcadores: ['pilates play', 'pilates-play'],
        publico: 'Interesses, nacional, e remarketing de visitantes.',
        resultado: 'Assinatura paga.',
        kpi: 'cpa',
        faixa: null,
        responsavel: 'sede',
        exigeUnidade: false,
        regras: [
          'Custo por aquisição é comparado com o ticket da assinatura, não com o CPL das ' +
          'outras frentes — é venda, não lead.',
          'Precisa de conversão rastreada de ponta a ponta: sem o evento de compra chegando ao ' +
          'Meta e ao GA4, o número do painel é chute.',
          'Prospecção e remarketing são lidos juntos: o remarketing rouba crédito da prospecção.',
        ],
        errosComuns: [
          'Ler resultado do Meta e do GA4 como se fossem a mesma conta — as janelas de ' +
          'atribuição são diferentes e nunca vão bater.',
          'Otimizar por clique em vez de compra.',
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------------- */
/* Nomenclatura                                                              */
/* ------------------------------------------------------------------------- */

export interface FormatoDeNome {
  id: string;
  onde: 'campanha' | 'conjunto';
  modelo: string;
  exemplo: string;
  explicacao: string;
}

/**
 * Os formatos de nome em uso hoje, lidos da conta.
 *
 * Não é um ideal: é o que existe. O parser em `lib/nomenclatura.ts` reconhece
 * exatamente estes formatos, e o que não casar com nenhum aparece no
 * diagnóstico como "fora do padrão" — que é o sinal para renomear ou para
 * acrescentar um formato aqui, conscientemente.
 */
export const FORMATOS: FormatoDeNome[] = [
  {
    id: 'campanha',
    onde: 'campanha',
    modelo: '[marca] tipo | contexto | público',
    exemplo: '[Rise] dco | always-on | apartadas',
    explicacao:
      'Tipo é o formato de compra (dco, lead-ad, lead-site, venda, pure-pass, black-friday). ' +
      'Contexto diz se é always-on, de vendas ou de unidades. Público é a frente atendida.',
  },
  {
    id: 'conjunto-dco',
    onde: 'conjunto',
    modelo: 'dco | interesses | objetivo | destino',
    exemplo: 'dco | interesses | leads | sacoma',
    explicacao:
      'Objetivo é leads ou venda. Destino é a unidade (quando leads) ou o estado (quando venda).',
  },
  {
    id: 'conjunto-unidade',
    onde: 'conjunto',
    modelo: 'unidade | região | segmento | público',
    exemplo: 'penha | sao-paulo | cargos | instrutor-pilates',
    explicacao:
      'Segmento separa RH (cargos) de aula experimental (advantage). O público detalha o recorte.',
  },
  {
    id: 'conjunto-produto',
    onde: 'conjunto',
    modelo: 'contexto | produto | público',
    exemplo: 'always-on | pilates play | interesses',
    explicacao: 'Usado nas frentes que vendem produto e não têm unidade.',
  },
];

/* ------------------------------------------------------------------------- */
/* Fontes de dados                                                           */
/* ------------------------------------------------------------------------- */

export interface Fonte {
  id: Plataforma;
  nome: string;
  /** A pergunta que só esta fonte responde. */
  responde: string;
  /** O que ela NÃO responde, e as pessoas acham que responde. */
  naoResponde: string;
  /** Onde o dado mora no Hub, quando existe. */
  ondeMora: string;
}

export const FONTES: Fonte[] = [
  {
    id: 'meta',
    nome: 'Meta Ads',
    responde: 'Quanto custou cada lead, por conjunto e por unidade, e quanto foi gasto por dia.',
    naoResponde:
      'Se o lead virou matrícula. O Meta só sabe o que aconteceu dentro do anúncio e do pixel.',
    ondeMora: 'Tabelas dpp_campaigns, dpp_ad_sets e dpp_ad_set_daily_metrics, no banco do Hub.',
  },
  {
    id: 'google-ads',
    nome: 'Google Ads',
    responde: 'Quanto custou a busca por marca e por termo genérico, e a fatia de impressões.',
    naoResponde: 'Comportamento depois do clique — isso é o GA4.',
    ondeMora: 'Ainda não integrado ao Hub.',
  },
  {
    id: 'ga4',
    nome: 'Google Analytics 4',
    responde:
      'O que a pessoa fez depois do clique: página, tempo, caminho até o agendamento, e por ' +
      'qual canal ela chegou.',
    naoResponde: 'Custo. GA4 não sabe quanto foi pago pelo clique.',
    ondeMora: 'Ainda não integrado ao Hub.',
  },
];

/* ------------------------------------------------------------------------- */
/* Regras que o diagnóstico confere                                          */
/* ------------------------------------------------------------------------- */

export type Gravidade = 'alta' | 'media' | 'baixa';

export interface Regra {
  id: string;
  titulo: string;
  /** O que a regra quer garantir, na língua de quem opera. */
  porque: string;
  gravidade: Gravidade;
}

/**
 * Cada regra aqui tem uma verificação correspondente em `lib/analise.ts`, com
 * o mesmo `id`. Um teste garante que nenhuma das duas listas cresça sozinha.
 */
export const REGRAS: Regra[] = [
  {
    id: 'conjunto-sem-unidade',
    titulo: 'Conjunto com gasto e sem unidade vinculada',
    porque:
      'O gasto não aparece no painel de nenhuma unidade. O franqueado não vê, e ninguém cobra ' +
      'o resultado.',
    gravidade: 'alta',
  },
  {
    id: 'gasto-sem-resultado',
    titulo: 'Conjunto gastando sem gerar resultado',
    porque:
      'Depois de impressão suficiente para o Meta aprender, zero resultado não é azar: é ' +
      'público, oferta ou formulário quebrado.',
    gravidade: 'alta',
  },
  {
    id: 'custo-fora-da-faixa',
    titulo: 'Custo por resultado muito acima dos pares',
    porque:
      'Comparado com os outros conjuntos da MESMA frente e do MESMO período. Comparar com o ' +
      'histórico da própria unidade esconde a piora da rede inteira.',
    gravidade: 'media',
  },
  {
    id: 'nome-fora-do-padrao',
    titulo: 'Nome fora dos formatos declarados',
    porque:
      'Nome que não casa com nenhum formato não entra em nenhum agrupamento — some do relatório ' +
      'sem ninguém perceber.',
    gravidade: 'media',
  },
  {
    id: 'conjunto-duplicado',
    titulo: 'Conjuntos ativos com o mesmo nome',
    porque:
      'Dois conjuntos iguais dividem verba e aprendizado, e cada um aprende metade. Quase sempre ' +
      'é cópia manual esquecida.',
    gravidade: 'media',
  },
  {
    id: 'frente-sem-dado',
    titulo: 'Frente do manual sem nenhum dado no período',
    porque:
      'Ou a frente parou de rodar, ou o dado não está chegando ao Hub. As duas coisas precisam ' +
      'de resposta, e nenhuma delas aparece num relatório que só soma o que existe.',
    gravidade: 'alta',
  },
  {
    id: 'fonte-ausente',
    titulo: 'Fonte de dados prevista e não conectada',
    porque:
      'Análise que se diz completa usando uma fonte de três leva a decisão errada com a ' +
      'confiança de quem viu tudo.',
    gravidade: 'alta',
  },
];

/* ------------------------------------------------------------------------- */
/* Parâmetros do diagnóstico                                                 */
/* ------------------------------------------------------------------------- */

/**
 * Os números que o diagnóstico usa. Ficam aqui, juntos e nomeados, porque são
 * escolha da operação e não verdade universal — e porque um limiar escondido no
 * meio do código é um limiar que ninguém revisa.
 */
export const PARAMETROS = {
  /** Impressões a partir das quais "zero resultado" deixa de ser normal. */
  impressoesParaCobrarResultado: 5000,
  /** Quanto acima da mediana da frente o custo precisa estar para virar alerta. */
  vezesAcimaDaMediana: 1.5,
  /** Gasto mínimo no período para o conjunto entrar na comparação de custo. */
  gastoMinimoParaComparar: 100,
} as const;

/** Toda frente do manual, achatada, com o eixo de origem junto. */
export const FRENTES: Array<Frente & { eixoId: string; eixoNome: string }> = EIXOS.flatMap((eixo) =>
  eixo.frentes.map((frente) => ({ ...frente, eixoId: eixo.id, eixoNome: eixo.nome })),
);
