import ApresentacaoDestaqueCard from './ApresentacaoDestaqueCard';
import VideoUnicoSlide from './VideoUnicoSlide';
import type { PresentationSlide } from './novidadesPureSystem';
import { UPDATES_MKT_OUT, UPDATES_MKT_SLIDES } from './updatesMkt20Out';

const { video } = UPDATES_MKT_OUT;

// O vídeo entra logo depois do slide `video.aposSlide`.
const SLIDES: PresentationSlide[] = [
  ...UPDATES_MKT_SLIDES.slice(0, video.aposSlide),
  {
    src: '',
    alt: `${UPDATES_MKT_OUT.title} — vídeo`,
    render: ({ ativo, maiorSlideVisto }) => (
      <VideoUnicoSlide
        videoId={video.id}
        src={video.src}
        capa={video.capa}
        liberaAposSlide={video.aposSlide}
        limiteVezes={video.limiteVezes}
        ativo={ativo}
        maiorSlideVisto={maiorSlideVisto}
      />
    ),
  },
  ...UPDATES_MKT_SLIDES.slice(video.aposSlide),
];

const UpdatesMktCard = () => (
  <ApresentacaoDestaqueCard
    title={UPDATES_MKT_OUT.title}
    subtitle={UPDATES_MKT_OUT.subtitle}
    meeting={UPDATES_MKT_OUT.meeting}
    slides={SLIDES}
  />
);

export default UpdatesMktCard;
