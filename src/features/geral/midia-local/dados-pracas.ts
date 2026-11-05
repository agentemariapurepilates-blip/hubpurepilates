// Quanto custa a TV Globo em cada praça, para a página "Marketing local · TV Globo".
//
// FONTE: planilha "Plano de Mídia Franquias Geral com todas as praças", da Globo,
// TABELA DE SETEMBRO/2026 (enviada pela Renata Ramos em 04/11/2026). As linhas
// abaixo foram geradas da planilha, não digitadas. As abas TT, MAI, JUN, JUL e
// AUDIÊNCIAS são de outro cliente e não entram.
//
// O valor é o INVESTIMENTO BRUTO NEGOCIADO (não o líquido, que desconta os 20%
// de comissão de agência). Preços sujeitos a reajuste pela data de veiculação e
// à disponibilidade de espaço, como diz a própria planilha. Ao atualizar a
// tabela, troque as linhas e rode os testes: eles refazem a conta de cada uma.

export interface PracaTv {
  /** A aba da planilha: SP Interior reúne várias cidades. */
  grupo: string;
  cidade: string;
  formato: '10"' | '15"';
  periodo: string;
  impactos: number;
  /** CPM bruto negociado, em reais. */
  cpm: number;
  /** TV Globo sozinha, investimento bruto em reais. */
  investimento: number;
}

export const DATA_DA_TABELA = 'setembro/2026';

export const PRACAS_TV: PracaTv[] = [
  { grupo: "SP Interior", cidade: "Bauru", formato: '10"', periodo: "11 a 28 dias", impactos: 1040000, cpm: 10.98, investimento: 11419.2 },
  { grupo: "SP Interior", cidade: "Itapetininga", formato: '10"', periodo: "11 a 28 dias", impactos: 390000, cpm: 9.54, investimento: 3720.6 },
  { grupo: "SP Interior", cidade: "Ribeirão Preto", formato: '10"', periodo: "11 a 28 dias", impactos: 820000, cpm: 12.19, investimento: 9995.8 },
  { grupo: "SP Interior", cidade: "São Carlos", formato: '10"', periodo: "11 a 28 dias", impactos: 320000, cpm: 8.01, investimento: 2563.2 },
  { grupo: "SP Interior", cidade: "São José do Rio Preto", formato: '10"', periodo: "11 a 28 dias", impactos: 770000, cpm: 10.66, investimento: 8208.2 },
  { grupo: "SP Interior", cidade: "São José dos Campos", formato: '10"', periodo: "11 a 28 dias", impactos: 510000, cpm: 14.85, investimento: 7573.5 },
  { grupo: "SP Interior", cidade: "Sorocaba", formato: '10"', periodo: "11 a 28 dias", impactos: 780000, cpm: 10.53, investimento: 8213.4 },
  { grupo: "SP Interior", cidade: "Taubaté", formato: '10"', periodo: "11 a 28 dias", impactos: 430000, cpm: 10.89, investimento: 4682.7 },
  { grupo: "SP Interior", cidade: "Campinas", formato: '15"', periodo: "7 a 10 dias", impactos: 780000, cpm: 14.85, investimento: 11583 },
  { grupo: "Mogi das Cruzes e Santos", cidade: "Mogi das Cruzes", formato: '10"', periodo: "11 a 28 dias", impactos: 430000, cpm: 7.2, investimento: 3096 },
  { grupo: "Mogi das Cruzes e Santos", cidade: "Santos", formato: '10"', periodo: "11 a 28 dias", impactos: 560000, cpm: 14.85, investimento: 8316 },
  { grupo: "Salvador", cidade: "Salvador", formato: '15"', periodo: "7 a 10 dias", impactos: 1200000, cpm: 10.39, investimento: 12468 },
  { grupo: "Rio de Janeiro", cidade: "Rio de Janeiro", formato: '15"', periodo: "7 a 10 dias", impactos: 4200000, cpm: 10.5, investimento: 44100 },
  { grupo: "Fortaleza", cidade: "Fortaleza", formato: '15"', periodo: "7 a 10 dias", impactos: 1200000, cpm: 8.96, investimento: 10752 },
  { grupo: "Florianópolis", cidade: "Florianópolis", formato: '15"', periodo: "7 a 10 dias", impactos: 300000, cpm: 14.57, investimento: 4371 },
  { grupo: "Porto Alegre", cidade: "Porto Alegre", formato: '15"', periodo: "7 a 10 dias", impactos: 1200000, cpm: 10.89, investimento: 13068 },
];

/**
 * As telas da GAMA (prédios residenciais e shoppings) e o anúncio no celular de
 * quem passou perto delas. O mesmo valor em todas as praças da planilha.
 * O DOOH é plano customizável: o impacto (1,39 milhão) é ESTIMADO e a rede muda
 * conforme a disponibilidade, e a proposta final sai depois do briefing.
 */
export const GAMA = {
  dooh: { investimento: 50000, impactosEstimados: 1388889, cpmEstimado: 36 },
  geofence: { investimento: 4000, impactos: 200000, cpm: 20 },
} as const;

/** TV Globo da praça + telas da GAMA + anúncio por geolocalização. */
export function pacoteCompleto(investimentoTv: number): number {
  return investimentoTv + GAMA.dooh.investimento + GAMA.geofence.investimento;
}

export interface ExemploDeCidade {
  cidade: string;
  uf: string;
  tvMaisDigital: { investimento: number; impactos: string };
  nearLive: { investimento: number; insercoes: string };
}

/**
 * Exemplos do PDF "Como conhecer os diferentes Brasis pode ajudar as Franquias"
 * (Globo, 2026). São de cidades que não estão na planilha acima.
 */
export const EXEMPLOS_DO_PDF: ExemploDeCidade[] = [
  {
    cidade: 'Bragança Paulista', uf: 'SP',
    tvMaisDigital: { investimento: 10793.53, impactos: 'cerca de 586 mil' },
    nearLive: { investimento: 7896.5, insercoes: '2 inserções: Ana Maria e Sessão da Tarde' },
  },
  {
    cidade: 'Blumenau', uf: 'SC',
    tvMaisDigital: { investimento: 10000, impactos: 'mais de 1 milhão' },
    nearLive: { investimento: 8300, insercoes: '2 inserções: Ana Maria e Sessão da Tarde' },
  },
  {
    cidade: 'Uberlândia', uf: 'MG',
    tvMaisDigital: { investimento: 16973, impactos: 'mais de 1,3 milhão' },
    nearLive: { investimento: 8447.5, insercoes: '2 inserções: Ana Maria e Sessão da Tarde' },
  },
];

/** 11419.2 -> "R$ 11.419,20". Sem Intl: o ICU do navegador e o do Deno divergem no espaço. */
export function reais(valor: number): string {
  const [inteiro, centavos] = valor.toFixed(2).split('.');
  return `R$ ${inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${centavos}`;
}

/** 1040000 -> "1.040.000". */
export function milhares(valor: number): string {
  return String(valor).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
