// Tabela de preços da Pure Store — dados de referência (planilha "Tabela de preços store - 08.2026").
// Valores em R$. Os preços variam conforme campanha; sempre confirmar a tabela
// vigente com a equipe da Pure Store. Para atualizar: substituir a lista abaixo.

export interface PrecoStore {
  produto: string;
  /** Preço no site / revenda. */
  revenda: number;
  /** Preço com 20% de desconto (franqueado). */
  off20: number;
  /** Preço com 25% de desconto (franqueado). */
  off25: number;
  /** Preço com 30% de desconto (franqueado). */
  off30: number;
  /** Situação opcional, ex.: "Esgotado". */
  status?: string;
}

/** Mês de referência da tabela (exibido como aviso). */
export const PRECOS_REFERENCIA = "Agosto / 2026";

export const precosStore: PrecoStore[] = [
  { produto: "Legging Pure Bold - Burgundy", revenda: 154.9, off20: 123.92, off25: 116.18, off30: 108.43 },
  { produto: "Top Pure Bold - Burgundy", revenda: 104.9, off20: 83.92, off25: 78.68, off30: 73.43 },
  { produto: "Camiseta Fem. Pure Bold - Burgundy", revenda: 134.9, off20: 107.92, off25: 101.18, off30: 94.43 },
  { produto: "Camiseta Feminina - Pilates Lateral", revenda: 89.9, off20: 71.92, off25: 67.43, off30: 62.93 },
  { produto: "Camiseta Feminina - Coração Pilateiro", revenda: 89.9, off20: 71.92, off25: 67.43, off30: 62.93 },
  { produto: "Camiseta Feminina - Pilates é sempre uma Boa Ideia", revenda: 89.9, off20: 71.92, off25: 67.43, off30: 62.93 },
  { produto: "Camiseta Feminina - Todo dia é um bom para fazer Pilates", revenda: 89.9, off20: 71.92, off25: 67.43, off30: 62.93 },
  { produto: "Camiseta Masculina - Pilates Lateral", revenda: 89.9, off20: 71.92, off25: 67.43, off30: 62.93 },
  { produto: "Camiseta Masculina - Aparelhos", revenda: 89.9, off20: 71.92, off25: 67.43, off30: 62.93 },
  { produto: "Regata Feminina - Posições", revenda: 84.9, off20: 67.92, off25: 63.68, off30: 59.43 },
  { produto: "Regata Feminina - Palavras", revenda: 84.9, off20: 67.92, off25: 63.68, off30: 59.43 },
  { produto: "Regata Feminina - Batidas", revenda: 84.9, off20: 67.92, off25: 63.68, off30: 59.43 },
  { produto: "Macaquinho Pure Bold - Burgundy", revenda: 189.9, off20: 151.92, off25: 142.43, off30: 132.93 },
  { produto: "Camiseta Fitness Feminina Cinza", revenda: 99.9, off20: 79.92, off25: 74.93, off30: 69.93 },
  { produto: "Camiseta Fitness Preta Masculina", revenda: 99.9, off20: 79.92, off25: 74.93, off30: 69.93 },
  { produto: "Legging Fitness Alta Compressão com Recortes", revenda: 179.9, off20: 143.92, off25: 134.93, off30: 125.93 },
  { produto: "Corta Vento Feminino Impermeável com Capuz", revenda: 259.9, off20: 207.92, off25: 194.92, off30: 181.93 },
  { produto: "Conjunto Fitness Feminino (Top + Legging)", revenda: 269.9, off20: 215.92, off25: 202.42, off30: 188.93 },
  { produto: "Corta Vento Feminino Cinza com Capuz", revenda: 259.9, off20: 207.92, off25: 194.92, off30: 181.93 },
  { produto: "Jaqueta Fitness em Poliamida", revenda: 239.9, off20: 191.92, off25: 179.93, off30: 167.93 },
  { produto: "Jaqueta de Moletom Preta Masculina", revenda: 249.9, off20: 199.92, off25: 187.43, off30: 174.93 },
  { produto: "Camiseta Fem. Smile - Everyday", revenda: 99.9, off20: 79.92, off25: 74.93, off30: 69.93 },
  { produto: "Camiseta Fem. Mais Café - Everyday", revenda: 99.9, off20: 79.92, off25: 74.93, off30: 69.93 },
  { produto: "Camiseta Fem. Pira - Everyday", revenda: 99.9, off20: 79.92, off25: 74.93, off30: 69.93 },
  { produto: "Camiseta Masc. Find Your - Everyday", revenda: 99.9, off20: 79.92, off25: 74.93, off30: 69.93 },
  { produto: "Camiseta Fem. Pilates Lateral - Everyday", revenda: 99.9, off20: 79.92, off25: 74.93, off30: 69.93 },
  { produto: "Camiseta Masc. Pilates Lateral - Everyday", revenda: 99.9, off20: 79.92, off25: 74.93, off30: 69.93 },
  { produto: "Lancheira Cinza – 2 andares – 10L", revenda: 84.9, off20: 67.92, off25: 63.68, off30: 59.43 },
  { produto: "Lancheira Preta – 2 andares – 8L", revenda: 79.9, off20: 63.92, off25: 59.93, off30: 55.93 },
  { produto: "Lancheira Cinza – 2 andares – 8L", revenda: 79.9, off20: 63.92, off25: 59.93, off30: 55.93 },
  { produto: "Garrafa Preta Térmica - 900ML", revenda: 84.9, off20: 67.92, off25: 63.68, off30: 59.43 },
  { produto: "Garrafa Cinza Claro - 800ML", revenda: 64.9, off20: 51.92, off25: 48.68, off30: 45.43 },
  { produto: "Garrafa Cinza Escuro - 800ML", revenda: 64.9, off20: 51.92, off25: 48.68, off30: 45.43 },
  { produto: "Garrafa Prata - A mente - 700ML", revenda: 49.9, off20: 39.92, off25: 37.42, off30: 34.93 },
  { produto: "Garrafa Preta - A mente - 700ML", revenda: 49.9, off20: 39.92, off25: 37.42, off30: 34.93 },
  { produto: "Lancheira Cinza - Pure Pilates", revenda: 59.9, off20: 47.92, off25: 44.92, off30: 41.93 },
  { produto: "Lancheira Preta - Pure Pilates", revenda: 59.9, off20: 47.92, off25: 44.92, off30: 41.93 },
  { produto: "Meia Preta - Logo/Boneco", revenda: 39.9, off20: 31.92, off25: 29.92, off30: 27.93 },
  { produto: "Meia Cinza - Logo/Boneco", revenda: 39.9, off20: 31.92, off25: 29.92, off30: 27.93 },
  { produto: "Sapatilha - Logo/Boneco", revenda: 44.9, off20: 35.92, off25: 33.67, off30: 31.43 },
  { produto: "Sapatilha Corações - Preta e Cinza", revenda: 44.9, off20: 35.92, off25: 33.67, off30: 31.43 },
  { produto: "Boné Preto", revenda: 59.9, off20: 47.92, off25: 44.92, off30: 41.93 },
  { produto: "Viseira", revenda: 54.9, off20: 43.92, off25: 41.18, off30: 38.43 },
  { produto: "Moletom Pure Pilates", revenda: 169.9, off20: 135.92, off25: 127.43, off30: 118.93 },
  { produto: "Moletom A Melhor Hora do seu Dia", revenda: 169.9, off20: 135.92, off25: 127.43, off30: 118.93 },
  { produto: "Eco Bag", revenda: 22.9, off20: 18.32, off25: 17.18, off30: 16.03 },
  { produto: "Sacola de TNT", revenda: 14.9, off20: 11.92, off25: 11.18, off30: 10.43, status: "Esgotado" },
];
