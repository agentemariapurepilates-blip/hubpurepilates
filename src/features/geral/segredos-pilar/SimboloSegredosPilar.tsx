import simbolo from '@/assets/segredos-pilar/simbolo.png';
import { cn } from '@/lib/utils';

// Símbolo (cadeado) do logo da série, recortado do Canva DAHVREDixIU (página 1).
// Mesma assinatura dos ícones do lucide, para entrar na lista do menu lateral.
const SimboloSegredosPilar = ({ className }: { className?: string }) => (
  <img src={simbolo} alt="" aria-hidden className={cn('object-contain', className)} />
);

export default SimboloSegredosPilar;
