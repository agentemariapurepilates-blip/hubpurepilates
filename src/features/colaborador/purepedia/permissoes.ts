/**
 * PurePedia — Permissões por Funcionalidade (Pure System).
 *
 * TRANSCRIÇÃO FIEL do documento original (Drive: Purepedia - Artigos/Manuais).
 * Gerado a partir do texto do .docx, sem digitação manual: cada registro é uma
 * linha "<tela>: Perfis com acesso: ..." do documento, na ordem em que aparece.
 *
 * ATENÇÃO ao editar: 22 telas têm o MESMO NOME em seções diferentes, com listas
 * de acesso diferentes ("Receitas" e "Despesas" aparecem 4x cada). A chave é o
 * par (secao, tela) — nunca só o nome da tela.
 *
 * São PERFIS de acesso, não pessoas. Alguns trazem nome próprio no rótulo
 * ("Gerencial Full - Caroline Lo Duca"), mas não existe aqui uma lista de
 * usuários nominais.
 */

export type SecaoPermissao = 'Telas do Sistema' | 'Aba Academy' | 'Menu Franqueadora';

export interface RegistroPermissao {
  secao: SecaoPermissao;
  tela: string;
  perfis: string[];
}

/** Ordem das seções no documento. */
export const SECOES_PERMISSAO: SecaoPermissao[] = [
  'Telas do Sistema',
  'Aba Academy',
  'Menu Franqueadora',
];

export const PERMISSOES: RegistroPermissao[] = [
  {
    secao: 'Telas do Sistema',
    tela: 'Agenda',
    perfis: ['Academy - Gerencial', 'Acesso Academia com Financeiro', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquia - Gabriela Oliveira - Gerente', 'Franquia - Marco Shinoar - Gerente', 'Franquia - Sueli Shimamoto - Gerente', 'Franquias - Recepção', 'Franquias - Recepção - Bruno Paiva', 'Franquias - Recepção - Erica', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Pilates - Usuário Gerencial', 'Professor', 'Recursos Humanos', 'Somente agenda'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Clientes',
    perfis: ['Academy - Gerencial', 'Acesso Academia com Financeiro', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franqueadora e Academy - Comercial', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquia - Gabriela Oliveira - Gerente', 'Franquia - Marco Shinoar - Gerente', 'Franquia - Sueli Shimamoto - Gerente', 'Franquias - Recepção', 'Franquias - Recepção - Bruno Paiva', 'Franquias - Recepção - Erica', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Pilates - Usuário Gerencial', 'Professor'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'PurePass',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquia - Gabriela Oliveira - Gerente', 'Franquia - Marco Shinoar - Gerente', 'Franquia - Sueli Shimamoto - Gerente', 'Franquias - Recepção', 'Franquias - Recepção - Bruno Paiva', 'Franquias - Recepção - Erica', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Wellhub',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquia - Gabriela Oliveira - Gerente', 'Franquia - Marco Shinoar - Gerente', 'Franquia - Sueli Shimamoto - Gerente', 'Franquias - Recepção', 'Franquias - Recepção - Bruno Paiva', 'Franquias - Recepção - Erica', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Receitas',
    perfis: ['Academy - Gerencial', 'Acesso Academia com Financeiro', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquias - Recepção - Bruno Paiva', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Despesas',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Fechamento de Mês',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Cobranças',
    perfis: ['Academy - Gerencial', 'Acesso Academia com Financeiro', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquia - Gabriela Oliveira - Gerente', 'Franquia - Marco Shinoar - Gerente', 'Franquia - Sueli Shimamoto - Gerente', 'Franquias - Recepção', 'Gerencial Geral', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Formas de Pagamento',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Nota Fiscal',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Royalties / Taxa de Propaganda',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'ROI Marketing',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Chamados',
    perfis: ['Administrador', 'Administrador - TI', 'Customer Success', 'Customer Success - Supervisora', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Franquias - Recepção'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Unidades',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquia - Gabriela Oliveira - Gerente', 'Franquia - Marco Shinoar - Gerente', 'Franquia - Sueli Shimamoto - Gerente', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Área de Downloads',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca', 'Auxiliar Administrativo - Com Área de Downloads'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'NPS',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquia - Gabriela Oliveira - Gerente', 'Franquia - Marco Shinoar - Gerente', 'Franquia - Sueli Shimamoto - Gerente', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Pendências',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquias - Recepção', 'Franquias - Recepção - Bruno Paiva', 'Franquias - Recepção - Erica', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Convênios',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquia - Gabriela Oliveira - Gerente', 'Franquia - Marco Shinoar - Gerente', 'Franquia - Sueli Shimamoto - Gerente', 'Franquias - Recepção', 'Professor', 'Recursos Humanos'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Promoções',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Assinaturas',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquia - Gabriela Oliveira - Gerente', 'Franquia - Marco Shinoar - Gerente', 'Franquia - Sueli Shimamoto - Gerente', 'Gerencial Geral', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Pure Match',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Recursos Humanos', 'Marketing - Coordenador'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Pessoas',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franquias - Recepção', 'Franquias - Recepção - Bruno Paiva', 'Franquias - Recepção - Erica', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Franqueadora e Academy - Comercial', 'Recursos Humanos'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Histórico de Pessoas (Analítico)',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Franqueadora - Perfil Comercial', 'Franqueadora e Academy - Comercial', 'Recursos Humanos'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Recados',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franquias - Recepção', 'Franquias - Recepção - Bruno Paiva', 'Franquias - Recepção - Erica', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Franqueadora - Perfil Comercial', 'Franqueadora e Academy - Comercial', 'Recursos Humanos'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Aulas Experimentais',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquia - Gabriela Oliveira - Gerente', 'Franquia - Marco Shinoar - Gerente', 'Franquia - Sueli Shimamoto - Gerente', 'Franquias - Recepção', 'Franquias - Recepção - Bruno Paiva', 'Franquias - Recepção - Erica', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Pilates - Usuário Gerencial', 'Marketing - Coordenador'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Fila de Espera',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquia - Gabriela Oliveira - Gerente', 'Franquia - Marco Shinoar - Gerente', 'Franquia - Sueli Shimamoto - Gerente', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Central de Ações',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'E-mails Recebidos',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquia - Gabriela Oliveira - Gerente', 'Franquia - Marco Shinoar - Gerente', 'Franquia - Sueli Shimamoto - Gerente', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Franqueadora - Perfil Comercial', 'Gerencial Full - Caroline Lo Duca', 'Recursos Humanos'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Publicação dos Clientes',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Vídeos de Exercícios',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Dicas Nutricionais',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Monitor de Acompanhamento',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Visão de Clientes',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Visão de Unidades',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Desempenho do Professor',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Entradas e Saídas',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Consultas Gerais',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Gerencial Geral', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Pure Excellence',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Professores Top da Pure',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca', 'Pilates - Usuário Gerencial'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Professores Contratados',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca', 'Recursos Humanos'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Rede de Professores',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca', 'Recursos Humanos'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Usuários',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca', 'Recursos Humanos'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Mensagens',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Auxiliar Administrativo', 'Auxiliar Administrativo - Com Área de Downloads', 'Auxiliar Administrativo - Sem Financeiro', 'Customer Success', 'Customer Success - Supervisora', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquia - Bruno / Renata - Gerente sem financeiro', 'Franquia - Gabriela Oliveira - Gerente', 'Franquia - Marco Shinoar - Gerente', 'Franquia - Sueli Shimamoto - Gerente', 'Franquias - Recepção', 'Franquias - Recepção - Bruno Paiva', 'Franquias - Recepção - Erica', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial - Sociedade Carol Loduca', 'Gerencial Full - Caroline Lo Duca', 'Gerencial Geral', 'Marketing', 'Marketing - Coordenador', 'Recursos Humanos'],
  },
  {
    secao: 'Telas do Sistema',
    tela: 'Gestão de Mensagens',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Auxiliar Administrativo', 'Franquia - Bruno / Renata - Gerente com financeiro', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Gerencial Full - Caroline Lo Duca', 'Marketing - Coordenador', 'Recursos Humanos'],
  },
  {
    secao: 'Aba Academy',
    tela: 'Pessoas',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Franqueadora e Academy - Comercial'],
  },
  {
    secao: 'Aba Academy',
    tela: 'Histórico de Pessoas (Analítico)',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Franqueadora e Academy - Comercial'],
  },
  {
    secao: 'Aba Academy',
    tela: 'Recados',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Franqueadora e Academy - Comercial'],
  },
  {
    secao: 'Aba Academy',
    tela: 'Financeiro',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Aba Academy',
    tela: 'Receitas',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Aba Academy',
    tela: 'Despesas',
    perfis: ['Academy - Gerencial', 'Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Rede',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success - Supervisora', 'Implantação - Assistente', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Assinaturas',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franqueadora - Perfil Comercial', 'Implantação - Assistente', 'Loja'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Implantação',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success - Supervisora', 'Implantação - Assistente'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Planos e Preços',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Pessoas',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franqueadora - Perfil Comercial', 'Franqueadora e Academy - Comercial', 'Implantação - Assistente', 'Loja', 'Recursos Humanos'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Histórico de Pessoas (Analítico)',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franqueadora - Perfil Comercial', 'Franqueadora e Academy - Comercial', 'Implantação - Assistente', 'Loja', 'Recursos Humanos'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Recados',
    perfis: ['Admin - Sociedade Carol Loduca', 'Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franqueadora - Perfil Comercial', 'Franqueadora e Academy - Comercial', 'Implantação - Assistente', 'Loja', 'Recursos Humanos'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Chamados',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franqueadora - Perfil Comercial', 'Implantação - Assistente'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Afiliados',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Franqueadora - Perfil Comercial'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Aceite de Contratos',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Franqueadora - Perfil Comercial'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Mensageria',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Marketing - Coordenador', 'Franqueadora - Perfil Comercial'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Conteúdo Aplicativo',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success - Supervisora', 'Marketing - Coordenador', 'Implantação - Assistente'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Área de Downloads',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success - Supervisora', 'Marketing - Coordenador', 'Implantação - Assistente', 'Loja', 'Recursos Humanos'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Influencers',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success - Supervisora', 'Marketing - Coordenador'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Pure Pilates TV',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success - Supervisora', 'Marketing - Coordenador'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Cupons de Desconto',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success - Supervisora', 'Marketing - Coordenador'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Eventos Pure Pilates',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success - Supervisora', 'Marketing - Coordenador', 'Franqueadora - Perfil Comercial'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Qrcode',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success - Supervisora', 'Franqueadora - Perfil Comercial', 'Franqueadora e Academy - Comercial', 'Implantação - Assistente', 'Loja', 'Marketing - Coordenador', 'Recursos Humanos'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'PureGPT',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success - Supervisora', 'Franqueadora - Perfil Comercial', 'Franqueadora e Academy - Comercial', 'Implantação - Assistente', 'Loja', 'Recursos Humanos', 'Marketing - Coordenador'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'PureGPT Nerd',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'PurePass',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Franqueadora - Perfil Comercial'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'ClassPass',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Franqueadora - Perfil Comercial'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'TotalPass',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Franqueadora - Perfil Comercial'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Wellhub',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franqueadora - Perfil Comercial'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Agenda',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Franqueadora - Perfil Comercial'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Aulas Experimentais',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franqueadora - Perfil Comercial', 'Marketing - Coordenador', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Receitas',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Despesas',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Receitas e Despesas',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Fechamento de Mês',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'RPS',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Receitas',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Despesas',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Royalties / Taxa de Propaganda',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Monitor de Acompanhamento',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Visão de Clientes',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Visão de Unidades',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Visão de Consultoras',
    perfis: ['Customer Success', 'Customer Success - Supervisora', 'Marketing - Coordenador'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Entradas e Saídas',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'NPS',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Marketing - Coordenador'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Pure Excellence',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Marketing - Coordenador'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Professores Top da Pure',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Marketing - Coordenador'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'ROI Marketing',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2', 'Customer Success', 'Customer Success - Supervisora', 'Franquias Fora de São Paulo - Gestor - 2023 em diante', 'Franquias São Paulo - Gestor - 2023 em diante', 'Marketing - Coordenador'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Parâmetros Gerais',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Funcionalidades',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Tipos de Usuário',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Robô - Scheduler',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Sistemas Integrados',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Origem do Contato',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Ações',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Tipos de Aula',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Tipos de Histórico de Contato',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Patologias',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Interesses',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Frases de Notificação',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
  {
    secao: 'Menu Franqueadora',
    tela: 'Internacionalização',
    perfis: ['Administrador', 'Administrador - TI', 'Administrador 2'],
  },
];

/** Todos os perfis citados no documento, em ordem alfabética. */
export const PERFIS: string[] = [
  'Academy - Gerencial',
  'Acesso Academia com Financeiro',
  'Admin - Sociedade Carol Loduca',
  'Administrador',
  'Administrador - TI',
  'Administrador 2',
  'Auxiliar Administrativo',
  'Auxiliar Administrativo - Com Área de Downloads',
  'Auxiliar Administrativo - Sem Financeiro',
  'Customer Success',
  'Customer Success - Supervisora',
  'Franqueadora - Perfil Comercial',
  'Franqueadora e Academy - Comercial',
  'Franquia - Bruno / Renata - Gerente com financeiro',
  'Franquia - Bruno / Renata - Gerente sem financeiro',
  'Franquia - Gabriela Oliveira - Gerente',
  'Franquia - Marco Shinoar - Gerente',
  'Franquia - Sueli Shimamoto - Gerente',
  'Franquias - Recepção',
  'Franquias - Recepção - Bruno Paiva',
  'Franquias - Recepção - Erica',
  'Franquias Fora de São Paulo - Gestor - 2023 em diante',
  'Franquias São Paulo - Gestor - 2023 em diante',
  'Gerencial - Sociedade Carol Loduca',
  'Gerencial Full - Caroline Lo Duca',
  'Gerencial Geral',
  'Implantação - Assistente',
  'Loja',
  'Marketing',
  'Marketing - Coordenador',
  'Pilates - Usuário Gerencial',
  'Professor',
  'Recursos Humanos',
  'Somente agenda',
];
