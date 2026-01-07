import { cn } from '@/lib/utils';

type SectorType = 'estudios' | 'franchising' | 'academy' | 'marketing' | 'tecnologia' | 'expansao';

interface SectorBadgeProps {
  sector: SectorType;
  className?: string;
}

const sectorLabels: Record<SectorType, string> = {
  estudios: 'Estúdios',
  franchising: 'Franchising',
  academy: 'Academy',
  marketing: 'Marketing',
  tecnologia: 'Tecnologia',
  expansao: 'Expansão',
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
