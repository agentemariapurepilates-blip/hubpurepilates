import ApresentacaoDestaqueCard from './ApresentacaoDestaqueCard';
import { NOVIDADES_PURESYSTEM, NOVIDADES_SLIDES } from './novidadesPureSystem';

const NovidadesPureSystemCard = () => (
  <ApresentacaoDestaqueCard
    title={NOVIDADES_PURESYSTEM.title}
    subtitle={NOVIDADES_PURESYSTEM.subtitle}
    meeting={NOVIDADES_PURESYSTEM.meeting}
    slides={NOVIDADES_SLIDES}
  />
);

export default NovidadesPureSystemCard;
