import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, Lock } from 'lucide-react';
import { useVideoAssistido } from './useVideoAssistido';

interface VideoUnicoSlideProps {
  videoId: string;
  src: string;
  /** Imagem mostrada no player antes de dar o play. */
  capa?: string;
  /** Posição (1-based) que a pessoa precisa ter alcançado para o vídeo liberar. */
  liberaAposSlide: number;
  /** Quantas vezes cada pessoa pode assistir até o fim. */
  limiteVezes: number;
  ativo: boolean;
  maiorSlideVisto: number;
}

// Vídeo com limite de visualizações por pessoa. Começa sozinho quando o slide
// entra na tela e pausa quando sai. Cada vez que chega ao fim conta uma
// visualização (useVideoAssistido); no limite, o player não aparece mais.
const VideoUnicoSlide = ({
  videoId,
  src,
  capa,
  liberaAposSlide,
  limiteVezes,
  ativo,
  maiorSlideVisto,
}: VideoUnicoSlideProps) => {
  const { vezes, carregando, registrar } = useVideoAssistido(videoId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [terminou, setTerminou] = useState(false);
  const liberado = maiorSlideVisto >= liberaAposSlide;
  const restantes = Math.max(0, limiteVezes - vezes);
  const podeTocar = !!src && liberado && !carregando && restantes > 0;

  // Entrou no slide: toca (do começo, se já tinha terminado). Saiu: pausa.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!ativo) {
      video.pause();
      return;
    }
    if (terminou) {
      video.currentTime = 0;
      setTerminou(false);
    }
    video.play().catch(() => {
      // Navegador barrou o autoplay com som: toca mudo e a pessoa liga o som.
      video.muted = true;
      video.play().catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, podeTocar]);

  const aviso = (icone: React.ReactNode, titulo: string, texto: string) => (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-white">
      {icone}
      <p className="text-base font-semibold sm:text-lg">{titulo}</p>
      <p className="max-w-md text-xs text-white/70 sm:text-sm">{texto}</p>
    </div>
  );

  let conteudo: React.ReactNode;
  if (!src) {
    conteudo = aviso(<Clock className="h-8 w-8" />, 'Vídeo em breve', 'O vídeo desta apresentação será publicado aqui.');
  } else if (!liberado) {
    conteudo = aviso(
      <Lock className="h-8 w-8" />,
      'Vídeo bloqueado',
      `Passe pelos slides até o ${liberaAposSlide} para liberar o vídeo.`,
    );
  } else if (carregando) {
    conteudo = (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
      </div>
    );
  } else if (restantes === 0) {
    conteudo = aviso(
      <CheckCircle2 className="h-8 w-8 text-green-400" />,
      `Você já assistiu a este vídeo ${limiteVezes} vezes`,
      'Esse é o limite de visualizações. Siga para os próximos slides.',
    );
  } else {
    conteudo = (
      // Arrastar sobre o player não pode trocar de slide.
      <div className="flex h-full flex-col" onPointerDown={(e) => e.stopPropagation()}>
        <video
          ref={videoRef}
          src={src}
          poster={capa}
          controls
          playsInline
          preload="metadata"
          disablePictureInPicture
          controlsList="nodownload noplaybackrate noremoteplayback"
          onContextMenu={(e) => e.preventDefault()}
          onPlay={() => setTerminou(false)}
          onEnded={() => {
            setTerminou(true);
            registrar();
          }}
          className="min-h-0 w-full flex-1 bg-black object-contain"
        />
        <p className="bg-black/80 px-3 py-1.5 text-center text-[11px] text-white/80 sm:text-xs">
          {terminou
            ? `Restam ${restantes} de ${limiteVezes} visualizações. Dê o play para assistir de novo.`
            : `Você pode assistir a este vídeo até ${limiteVezes} vezes · ${restantes} restante${restantes === 1 ? '' : 's'}.`}
        </p>
      </div>
    );
  }

  return <div className="aspect-video w-full bg-neutral-950">{conteudo}</div>;
};

export default VideoUnicoSlide;
