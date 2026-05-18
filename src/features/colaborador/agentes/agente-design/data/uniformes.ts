// Catálogo de uniformes Pure Pilates (baseado nos arquivos baixados do Drive).
// Designer escolhe 1+ peças visuais; a UI envia APENAS as imagens como referência
// visual pro Nano Banana (sem descrição textual — o modelo entende melhor pela foto).

export type UniformeCategoria = 'colecao-nova' | 'feminino';

export type Uniforme = {
  id: string;
  nome: string;
  categoria: UniformeCategoria;
  referencias: string[]; // primeira é a thumb
};

export const UNIFORMES: Uniforme[] = [
  // — COLEÇÃO NOVA ——————————————————————————————————
  {
    id: 'tshirt-logo-p',
    nome: 'T-shirt Logo P',
    categoria: 'colecao-nova',
    referencias: [
      '/images/uniformes/colecao-nova/tshirt-logo-p/01.jpeg',
      '/images/uniformes/colecao-nova/tshirt-logo-p/02.jpeg',
    ],
  },
  {
    id: 'top-logo-p',
    nome: 'Top Logo P',
    categoria: 'colecao-nova',
    referencias: [
      '/images/uniformes/colecao-nova/top-logo-p/01.jpeg',
      '/images/uniformes/colecao-nova/top-logo-p/02.jpeg',
    ],
  },
  {
    id: 'legging-boneco',
    nome: 'Legging Boneco',
    categoria: 'colecao-nova',
    referencias: [
      '/images/uniformes/colecao-nova/legging-boneco/01.jpeg',
      '/images/uniformes/colecao-nova/legging-boneco/02.jpeg',
    ],
  },

  // — FEMININO ——————————————————————————————————————
  {
    id: 'cam-fem-ide-003',
    nome: 'Camiseta "É Boa Ideia"',
    categoria: 'feminino',
    referencias: ['/images/uniformes/feminino/camfemide003/01.jpeg'],
  },
  {
    id: 'cam-fem-cor-002',
    nome: 'Camiseta "Coração Pilateiro"',
    categoria: 'feminino',
    referencias: ['/images/uniformes/feminino/camfemcor002/01.jpeg'],
  },
  {
    id: 'cam-fem-lat-001',
    nome: 'Camiseta "Pilates" Lateral',
    categoria: 'feminino',
    referencias: ['/images/uniformes/feminino/camfemlat001/01.jpeg'],
  },
  {
    id: 'cam-fem-dia-004',
    nome: 'Camiseta "Bom Dia Pilates"',
    categoria: 'feminino',
    referencias: ['/images/uniformes/feminino/camfemdia004/01.jpeg'],
  },
  {
    id: 'reg-fem-bat-008',
    nome: 'Regata "Batimento Pilates"',
    categoria: 'feminino',
    referencias: ['/images/uniformes/feminino/regfembat008/01.jpeg'],
  },
  {
    id: 'reg-fem-pal-009',
    nome: 'Regata Acrônimo PILATES',
    categoria: 'feminino',
    referencias: ['/images/uniformes/feminino/regfempal009/01.jpeg'],
  },
  {
    id: 'reg-fem-pos-007',
    nome: 'Regata Pure Básica',
    categoria: 'feminino',
    referencias: ['/images/uniformes/feminino/regfempos007/01.jpeg'],
  },
  {
    id: 'poa-dm-f-030',
    nome: 'Polo Bonequinho Pure',
    categoria: 'feminino',
    referencias: ['/images/uniformes/feminino/poadmf030/01.jpeg'],
  },
  {
    id: 'm-lin-sf-034',
    nome: 'Manga Longa Bonequinho',
    categoria: 'feminino',
    referencias: ['/images/uniformes/feminino/mlinsf034/01.jpeg'],
  },
  {
    id: 'ca-in-sf-032',
    nome: 'Camiseta Gola V Pure Pilates',
    categoria: 'feminino',
    referencias: ['/images/uniformes/feminino/cainsf032/01.jpeg'],
  },
];

export const UNIFORME_CATEGORIA_LABEL: Record<UniformeCategoria, string> = {
  'colecao-nova': 'Coleção Nova',
  feminino: 'Feminino',
};

export const UNIFORME_CATEGORIA_ORDER: UniformeCategoria[] = ['colecao-nova', 'feminino'];
