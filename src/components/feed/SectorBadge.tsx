import { cn } from '@/lib/utils';

type SectorType = 'estudios' | 'franchising' | 'academy' | 'consultoras' | 'implantacao';

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
