// Edições da Entre Molas. O menu lateral lê esta lista (por isso ela não
// importa as páginas — só nome e endereço). Nova edição: acrescente aqui,
// crie a pasta edicao-N/ e registre as páginas em EntreMolas.tsx.

export interface EdicaoEntreMolas {
  slug: string;
  nome: string;
}

export const EDICOES_ENTRE_MOLAS: EdicaoEntreMolas[] = [{ slug: 'edicao-1', nome: 'Edição 1' }];

export const EDICAO_MAIS_RECENTE = EDICOES_ENTRE_MOLAS[EDICOES_ENTRE_MOLAS.length - 1];
