export type FeedSectorValue = 'estudios' | 'franchising' | 'academy' | 'consultoras' | 'implantacao' | 'marketing' | 'tecnologia' | 'expansao' | 'pure_store';

export interface FeedSector {
  value: FeedSectorValue;
  label: string;
}

export const feedSectors: FeedSector[] = [
  { value: 'estudios', label: 'Estúdios' },
  { value: 'franchising', label: 'Franchising' },
  { value: 'academy', label: 'Academy' },
  { value: 'consultoras', label: 'Consultoras' },
  { value: 'implantacao', label: 'Implantação' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'expansao', label: 'Expansão' },
  { value: 'pure_store', label: 'Pure Store' },
];

export const profileSectors: FeedSector[] = [
  ...feedSectors,
  { value: 'rh' as FeedSectorValue, label: 'RH' },
];

export const demandSectors = [
  'Marketing',
  'Implantação',
  'Consultoras',
  'Tecnologia',
  'Pure Store',
  'Academy',
  'Estúdios',
  'Franchising',
  'Expansão',
  'Financeiro/Jurídico',
  'Comercial',
  'Parceiros externos',
  'RH',
] as const;

export type DemandSector = typeof demandSectors[number];

export const novidadesSectors: FeedSector[] = [
  { value: 'estudios', label: 'Estúdios' },
  { value: 'franchising', label: 'Franchising' },
  { value: 'academy', label: 'Academy' },
  { value: 'consultoras', label: 'Consultoras' },
  { value: 'implantacao', label: 'Implantação' },
];
