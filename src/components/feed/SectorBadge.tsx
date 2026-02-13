import { cn } from '@/lib/utils';

type SectorType = 'estudios' | 'franchising' | 'academy' | 'consultoras' | 'implantacao' | 'marketing' | 'tecnologia' | 'expansao' | 'pure_store' | 'rh';

interface SectorBadgeProps {
  sector: SectorType;
  className?: string;
}

const sectorLabels: Record<SectorType, string> = {
  estudios: 'Estúdios',
  franchising: 'Franchising',
  academy: 'Academy',
  consultoras: 'Consultoras',
  implantacao: 'Implantação',
  marketing: 'Marketing',
  tecnologia: 'Tecnologia',
  expansao: 'Expansão',
  pure_store: 'Pure Store',
  rh: 'RH',
};

const SectorBadge = ({ sector, className }: SectorBadgeProps) => {
  return (
    <span
      className={cn(
        'sector-tag',
        `sector-${sector}`,
        className
      )}
    >
      {sectorLabels[sector]}
    </span>
  );
};

export default SectorBadge;
