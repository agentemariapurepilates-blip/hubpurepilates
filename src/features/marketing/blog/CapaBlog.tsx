import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { domToBlob } from 'modern-screenshot';
import { Loader2 } from 'lucide-react';
import logo from '@/assets/logo-pure-pilates-recorte.png';
import { getMontserratFontFaceCss } from '@/features/colaborador/academy/montserratEmbed';
import type { Marca } from './blogTipos';

// A capa do Blog da Pure, no modelo aprovado em 05/11/2026: foto ilustrativa
// numa pétala + título escrito pelo Hub (nunca pela IA, então não sai letra
// errada). 1408 x 768, o tamanho das capas do blog.
//
// Regras da marca: Montserrat (título em 800), vermelho Pure #C12030 e cinza
// escuro #231F20, duas formas (moldura e contorno), logo branco sobre fundo
// escuro ou vermelho.
//
// SEM ETIQUETA DE CATEGORIA (06/11/2026): a capa tinha uma pílula com a
// categoria ("SAÚDE E BELEZA"), mas o blog já mostra a categoria sozinho e a
// pílula saía errada lá. Ficaram só foto, título e logo.

export const LARGURA_CAPA = 1408;
export const ALTURA_CAPA = 768;

const VERMELHO = '#C12030';
const GRAFITE = '#231F20';
const CINZA_CLARO = '#F2F0EF';
const BRANCO = '#FFFFFF';

const TEMAS: Record<Marca, { fundo: string; titulo: string; contorno: string; logoBranco: boolean }> = {
  // Studios: cinza claro e vermelho
  studios: { fundo: CINZA_CLARO, titulo: GRAFITE, contorno: VERMELHO, logoBranco: false },
  // Academy: vermelho e branco
  academy: { fundo: VERMELHO, titulo: BRANCO, contorno: BRANCO, logoBranco: true },
  // Franchising: preto e vermelho
  franchising: { fundo: GRAFITE, titulo: BRANCO, contorno: VERMELHO, logoBranco: true },
};

// A pétala: três cantos bem redondos e um canto reto (embaixo, à esquerda).
const PETALA = '300px 300px 300px 0';
const TAMANHO_MAXIMO = 68;
const TAMANHO_MINIMO = 44;

export interface CapaBlogHandle {
  /** A capa em PNG, no tamanho real (1408 x 768). */
  gerarPng: () => Promise<Blob>;
  /** A capa em JPEG, para enviar ao WordPress. */
  gerarJpeg: () => Promise<Blob>;
}

interface Props {
  marca: Marca;
  titulo: string;
  fotoUrl: string | null;
  /** Enquanto a foto não chega, a moldura mostra o que está acontecendo. */
  aviso?: string;
  carregandoFoto?: boolean;
  /** Avisa quando a capa pode virar imagem: foto carregada, fonte embutida e título ajustado. */
  onPronto?: () => void;
}

export const CapaBlog = forwardRef<CapaBlogHandle, Props>(function CapaBlog(
  { marca, titulo, fotoUrl, aviso, carregandoFoto, onPronto },
  ref,
) {
  const tema = TEMAS[marca] ?? TEMAS.studios;
  const caixaRef = useRef<HTMLDivElement>(null);
  const capaRef = useRef<HTMLDivElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(0.5);
  const [tamanho, setTamanho] = useState(TAMANHO_MAXIMO);
  const [fonte, setFonte] = useState('');
  const [fotoCarregada, setFotoCarregada] = useState(false);
  const [tituloAjustado, setTituloAjustado] = useState(false);

  useEffect(() => {
    setFotoCarregada(false);
  }, [fotoUrl]);

  useEffect(() => {
    if (onPronto && fonte && tituloAjustado && (fotoCarregada || !fotoUrl)) onPronto();
  }, [onPronto, fonte, tituloAjustado, fotoCarregada, fotoUrl]);

  // @font-face do Montserrat embutido: sem isso o PNG exportado sai com outra fonte.
  useEffect(() => {
    getMontserratFontFaceCss().then(setFonte).catch(() => undefined);
  }, []);

  // A capa tem tamanho fixo; na tela ela é reduzida para caber na largura disponível.
  useLayoutEffect(() => {
    const caixa = caixaRef.current;
    if (!caixa) return;
    const medir = () => setEscala(caixa.clientWidth / LARGURA_CAPA);
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(caixa);
    return () => obs.disconnect();
  }, []);

  // O título encolhe até caber na área, de 68px até no mínimo 44px.
  useLayoutEffect(() => {
    let cancelado = false;
    const ajustar = () => {
      const h1 = tituloRef.current;
      const area = areaRef.current;
      if (!h1 || !area || cancelado) return;
      let t = TAMANHO_MAXIMO;
      h1.style.fontSize = `${t}px`;
      while (t > TAMANHO_MINIMO && (h1.scrollHeight > area.clientHeight - 24 || h1.scrollWidth > area.clientWidth)) {
        t -= 2;
        h1.style.fontSize = `${t}px`;
      }
      setTamanho(t);
    };
    ajustar();
    document.fonts?.ready.then(() => {
      ajustar();
      if (!cancelado) setTituloAjustado(true);
    });
    return () => {
      cancelado = true;
    };
  }, [titulo, fonte]);

  useImperativeHandle(ref, () => ({
    gerarPng: async () => {
      if (!capaRef.current) throw new Error('a capa não está na tela');
      const blob = await domToBlob(capaRef.current, { type: 'image/png', scale: 1, width: LARGURA_CAPA, height: ALTURA_CAPA });
      if (!blob) throw new Error('não consegui gerar a imagem da capa');
      return blob;
    },
    gerarJpeg: async () => {
      if (!capaRef.current) throw new Error('a capa não está na tela');
      // JPEG para o WordPress: a mesma capa em cerca de um quinto do tamanho do PNG.
      const blob = await domToBlob(capaRef.current, { type: 'image/jpeg', quality: 0.9, scale: 1, width: LARGURA_CAPA, height: ALTURA_CAPA });
      if (!blob) throw new Error('não consegui gerar a imagem da capa');
      return blob;
    },
  }));

  return (
    <div ref={caixaRef} className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: `${LARGURA_CAPA} / ${ALTURA_CAPA}` }}>
      <div style={{ transform: `scale(${escala})`, transformOrigin: 'top left', width: LARGURA_CAPA, height: ALTURA_CAPA }}>
        <div
          ref={capaRef}
          style={{
            position: 'relative',
            width: LARGURA_CAPA,
            height: ALTURA_CAPA,
            background: tema.fundo,
            overflow: 'hidden',
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          {fonte && <style>{fonte}</style>}

          {/* O contorno repete a pétala, deslocado: dá ritmo sem poluir. */}
          <div
            style={{
              position: 'absolute',
              right: 112,
              top: 112,
              width: 600,
              height: 640,
              borderRadius: PETALA,
              border: `3px solid ${tema.contorno}`,
              opacity: 0.9,
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 64,
              top: 64,
              width: 600,
              height: 640,
              borderRadius: PETALA,
              overflow: 'hidden',
              background: marca === 'studios' ? '#E4E1DF' : 'rgba(255,255,255,0.12)',
            }}
          >
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt=""
                crossOrigin="anonymous"
                onLoad={() => setFotoCarregada(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  color: tema.titulo,
                  fontSize: 26,
                  fontWeight: 600,
                  textAlign: 'center',
                  padding: 60,
                  opacity: 0.8,
                }}
              >
                {carregandoFoto && <Loader2 style={{ width: 48, height: 48 }} className="animate-spin" />}
                {aviso ?? 'Sem foto'}
              </div>
            )}
          </div>

          <div style={{ position: 'absolute', left: 80, top: 72, bottom: 72, width: 600, display: 'flex', flexDirection: 'column' }}>
            <div ref={areaRef} style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 0 }}>
              <h1
                ref={tituloRef}
                style={{
                  color: tema.titulo,
                  fontWeight: 800,
                  fontSize: tamanho,
                  lineHeight: 1.08,
                  letterSpacing: '-0.015em',
                  textWrap: 'balance',
                  margin: 0,
                }}
              >
                {titulo}
              </h1>
            </div>
            <img
              src={logo}
              alt="Pure Pilates"
              style={{ alignSelf: 'flex-start', height: 64, width: 'auto', filter: tema.logoBranco ? 'brightness(0) invert(1)' : 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
