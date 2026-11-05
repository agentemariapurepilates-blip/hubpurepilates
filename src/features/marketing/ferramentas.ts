import { Newspaper, type LucideIcon } from 'lucide-react';

// As ferramentas da seção Marketing. É a ÚNICA lista: o menu lateral e a página
// inicial do Marketing (/marketing) leem daqui, então ferramenta nova entra
// aqui e aparece nos dois lugares (pedido de 05/11/2026).
//
// O endereço de toda ferramenta começa com /marketing: é isso que faz o menu
// abrir a seção sozinho (sectionFromPath, no Sidebar.tsx) e o RotaMarketing
// barrar quem não é do time.
export interface FerramentaMarketing {
  nome: string;
  descricao: string;
  href: string;
  icone: LucideIcon;
}

export const FERRAMENTAS_MARKETING: FerramentaMarketing[] = [
  {
    nome: 'Blog da Pure',
    descricao: 'Um artigo por dia, escrito com o Gemini: planejamento do mês, aprovação e agenda no WordPress.',
    href: '/marketing/blog',
    icone: Newspaper,
  },
];
