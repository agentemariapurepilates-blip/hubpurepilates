import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Palette,
  ArrowLeft,
  Loader2,
  Wand2,
  FileText,
  Lock,
  Square as SquareIcon,
  Smartphone,
  Images,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Camera,
  Code,
  Download,
  Upload,
  X,
  Sparkles,
  RefreshCw,
  Check,
  Lightbulb,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  GeneratedContent,
  contentTypeBadgeColor,
  contentTypeLabel,
} from '@/components/agente/types';
import { LAYOUT_FORMATS, LayoutFormat } from './data/layoutSystemPrompt';
import { AVATARES, type Avatar } from './data/avatares';
import { UNIFORMES, UNIFORME_CATEGORIA_LABEL, UNIFORME_CATEGORIA_ORDER, type Uniforme } from './data/uniformes';
import { APARELHOS, type Aparelho } from './data/aparelhos';
import {
  ENQUADRAMENTO_BLOCKS,
  ILUMINACAO_BLOCKS,
  FUNDO_BLOCKS,
  MARCA_EXTRA_BLOCKS,
  type Enquadramento,
  type IluminacaoPreset,
  type FundoPreset,
  type MarcaExtra,
} from './data/presets';
import { composePrompt, INITIAL_SCENE_STATE, type SceneState } from './lib/composePrompt';
import { urlToBase64, generateImage, type ReferenceImage } from './lib/generateImage';
import { analyzePose } from './lib/analyzePose';
import { fileToResizedBase64 } from './lib/resizeImage';
import { fitZones } from './lib/fitZones';
import EditableCanvas, { ZonePropertyPanel, findZone, type Zone } from './components/EditableCanvas';
import StaticCanvas from './components/StaticCanvas';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// ============================================================================
// Helpers
// ============================================================================

const parseSlides = (text: string | null | undefined): Array<{ index: number; text: string }> => {
  if (!text) return [];
  const regex = /Slide\s+(\d+)\s*:\s*([\s\S]*?)(?=\s*\n\s*Slide\s+\d+\s*:|$)/gi;
  const result: Array<{ index: number; text: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    result.push({ index: parseInt(m[1], 10), text: m[2].trim() });
  }
  return result;
};

const getTextoArte = (post: GeneratedContent): string =>
  post.versao_editada?.texto_arte ?? post.texto_arte ?? '';

const formatPostDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  } catch {
    return iso;
  }
};

const formatIcon: Record<LayoutFormat, typeof SquareIcon> = {
  'feed-quadrado': SquareIcon,
  'story-reels': Smartphone,
  'carrossel-feed': Images,
};

const FUNCTIONS_URL =
  (import.meta.env.VITE_FUNCTIONS_URL as string | undefined) ||
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

interface SlideResult {
  index: number; // 1-based pra ser amigável (Slide 1, Slide 2…)
  text: string;
  // Slides com foto (estático ou capa do carrossel): photoDataUrl preenchido
  // Slides HTML-only (carrossel slides 2+): backgroundColor preenchido
  photoPrompt?: string;
  photoDataUrl?: string;
  backgroundColor?: string;
  side: 'right' | 'left' | 'bottom';
  zones: Zone[];
  canvasSize: { w: number; h: number };
}

const DEFAULT_AVATAR_ID = 'maria-aluna';
const DEFAULT_UNIFORME_IDS = ['tshirt-logo-p'];
const DEFAULT_APARELHO_IDS: string[] = []; // designer escolhe se quer

type GenStage = 'idle' | 'planning' | 'generating-photo' | 'composing' | 'done' | 'error';

const STAGE_LABEL: Record<GenStage, string> = {
  idle: '',
  planning: 'Planejando composição…',
  'generating-photo': 'Gerando foto…',
  composing: 'Compondo arte final…',
  done: 'Pronto!',
  error: 'Erro',
};

// Chama uma edge function autenticada (mesmo padrão do generateImage).
async function callEdgeFunction<T>(name: string, body: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? `${name} falhou (${res.status})`);
  }
  return json as T;
}

type UploadedAsset = {
  id: string;
  name: string;
  previewUrl: string;
  base64: string;
  mimeType: string;
};

const MAX_ASSETS = 5;

// Instrução leve de negative space — uma frase curta no final do prompt da foto.
// Não força composição agressiva (que distorce proporção do aparelho/modelo),
// apenas pede pro Gemini deixar o lado indicado com fundo limpo.
function buildNegativeSpaceRule(side: 'right' | 'left' | 'bottom'): string {
  const where: Record<typeof side, string> = {
    right: 'a METADE DIREITA do quadro com fundo limpo (sem modelo, sem aparelho), pra acomodar texto depois',
    left: 'a METADE ESQUERDA do quadro com fundo limpo (sem modelo, sem aparelho), pra acomodar texto depois',
    bottom: 'a METADE INFERIOR do quadro com fundo limpo (sem modelo, sem aparelho), pra acomodar texto depois',
  };
  return `COMPOSIÇÃO: enquadre a cena deixando ${where[side]}. Mantenha a modelo e o aparelho com proporções, anatomia e detalhes naturais — sem distorcer pra forçar o espaço livre. Se precisar, escolha um plano mais fechado ou ângulo lateral pra que tudo caiba naturalmente.`;
}

// Defensive clamp — garante que cada zona caiba dentro do canvas (algumas
// vezes o Claude posiciona com x+w > canvasW e a pill estoura na exportação).
function clampZone(z: Zone, canvasW: number, canvasH: number): Zone {
  let { x, y, w, h } = z;
  // Cap dimensões na própria canvas
  w = Math.min(Math.max(w, 1), canvasW);
  h = Math.min(Math.max(h, 1), canvasH);
  // Desloca posição pra zona caber inteira
  x = Math.max(0, Math.min(x, canvasW - w));
  y = Math.max(0, Math.min(y, canvasH - h));
  return { ...z, x, y, w, h };
}

const initialScene = (): SceneState => {
  const aluna = AVATARES.find((a) => a.id === DEFAULT_AVATAR_ID);
  return {
    ...INITIAL_SCENE_STATE,
    avatares: aluna ? [aluna] : [],
    uniformes: UNIFORMES.filter((u) => DEFAULT_UNIFORME_IDS.includes(u.id)),
    aparelhos: APARELHOS.filter((a) => DEFAULT_APARELHO_IDS.includes(a.id)),
  };
};

// ============================================================================
// Componente
// ============================================================================

const CriacaoLayout = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('postId');

  // Briefing (vindo da Planilha · opcional)
  const [post, setPost] = useState<GeneratedContent | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  // Form state
  const [format, setFormat] = useState<LayoutFormat>('feed-quadrado');
  const [textoArte, setTextoArte] = useState<string>('');

  // Direção da foto · mesmas variáveis do GerarFoto (sem ângulo, decidido pelo Planner)
  const [scene, setScene] = useState<SceneState>(initialScene);
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pose: imagem de referência + draft do texto (editável)
  const [poseRefImage, setPoseRefImage] = useState<{
    mime_type: string;
    data: string;
    previewUrl: string;
  } | null>(null);
  const [poseDraft, setPoseDraft] = useState('');
  const [isAnalyzingPose, setIsAnalyzingPose] = useState(false);
  const poseInputRef = useRef<HTMLInputElement>(null);

  const updateScene = (patch: Partial<SceneState>) => setScene((s) => ({ ...s, ...patch }));
  const setAvatar = (avatar: Avatar) => updateScene({ avatares: [avatar] });
  const toggleUniforme = (u: Uniforme) =>
    setScene((s) => ({
      ...s,
      uniformes: s.uniformes.some((x) => x.id === u.id)
        ? s.uniformes.filter((x) => x.id !== u.id)
        : [...s.uniformes, u],
    }));
  const toggleAparelho = (a: Aparelho) =>
    setScene((s) => ({
      ...s,
      aparelhos: s.aparelhos.some((x) => x.id === a.id)
        ? s.aparelhos.filter((x) => x.id !== a.id)
        : [...s.aparelhos, a],
    }));
  const toggleMarcaExtra = (m: MarcaExtra) =>
    setScene((s) => ({
      ...s,
      marcaExtras: s.marcaExtras.includes(m)
        ? s.marcaExtras.filter((x) => x !== m)
        : [...s.marcaExtras, m],
    }));

  // — Assets uploads (refs extras) —
  const handleAssetsSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_ASSETS - uploadedAssets.length;
    if (remaining <= 0) {
      toast({ title: `Limite de ${MAX_ASSETS} assets`, variant: 'destructive' });
      return;
    }
    Array.from(files)
      .slice(0, remaining)
      .forEach(async (file) => {
        try {
          const resized = await fileToResizedBase64(file);
          setUploadedAssets((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: file.name,
              previewUrl: resized.previewUrl,
              base64: resized.data,
              mimeType: resized.mime_type,
            },
          ]);
        } catch (err) {
          toast({
            title: 'Erro ao processar imagem',
            description: err instanceof Error ? err.message : String(err),
            variant: 'destructive',
          });
        }
      });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAsset = (id: string) => {
    setUploadedAssets((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  // — Pose (anexa imagem e IA descreve) —
  const handlePoseFileSelected = async (file: File | null) => {
    if (!file) return;
    try {
      const resized = await fileToResizedBase64(file);
      setPoseRefImage((prev) => {
        if (prev) URL.revokeObjectURL(prev.previewUrl);
        return resized;
      });
      setPoseDraft('');
    } catch (err) {
      toast({
        title: 'Erro ao processar imagem',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    }
    if (poseInputRef.current) poseInputRef.current.value = '';
  };

  const removePoseRef = () => {
    if (poseRefImage) URL.revokeObjectURL(poseRefImage.previewUrl);
    setPoseRefImage(null);
    setPoseDraft('');
  };

  const handleAnalyzePose = async () => {
    if (!poseRefImage) return;
    setIsAnalyzingPose(true);
    try {
      const result = await analyzePose({ mime_type: poseRefImage.mime_type, data: poseRefImage.data });
      setPoseDraft(result.description);
    } catch (err) {
      toast({
        title: 'Erro ao analisar pose',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzingPose(false);
    }
  };

  const addPoseToScene = () => {
    const trimmed = poseDraft.trim();
    if (!trimmed) return;
    updateScene({ pose: trimmed });
    toast({ title: 'Pose adicionada ao prompt' });
  };

  const removePoseFromScene = () => updateScene({ pose: '' });

  // Generation state — slideResults guarda 1+ slides (sempre 1 pra feed/story,
  // 1+ pra carrossel multi-slide).
  const [stage, setStage] = useState<GenStage>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [slideResults, setSlideResults] = useState<SlideResult[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null); // mantido pro EditableCanvas (não usado mais pra export)
  const staticExportRef = useRef<HTMLDivElement>(null); // alvo real da captura

  // Vistas derivadas do slide ativo
  const activeSlide = slideResults[activeSlideIndex] ?? null;
  const photoDataUrl = activeSlide?.photoDataUrl ?? null;
  const backgroundColor = activeSlide?.backgroundColor ?? null;
  const zones = activeSlide?.zones ?? [];
  const canvasSize = activeSlide?.canvasSize ?? null;

  const selectedZone = useMemo(() => findZone(zones, selectedZoneId), [zones, selectedZoneId]);

  // Atualiza zonas do slide ativo (chamado pelo EditableCanvas)
  const setActiveZones = (newZones: Zone[]) => {
    setSlideResults((prev) =>
      prev.map((s, i) => (i === activeSlideIndex ? { ...s, zones: newZones } : s)),
    );
  };

  // Prompt composto (preview da composePrompt) — não-editável aqui, mas mostrado em debug
  const composedPrompt = useMemo(() => composePrompt(scene), [scene]);

  const textoArteLocked = !!post;
  const parsedSlides = useMemo(() => parseSlides(textoArte), [textoArte]);
  const isCarrossel = format === 'carrossel-feed';

  // Busca o post quando vem com ?postId=
  useEffect(() => {
    if (!postId || !user) return;
    setLoadingPost(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('editorial_posts' as never) as any)
      .select('*')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }: { data: unknown; error: unknown }) => {
        if (error || !data) {
          setPost(null);
        } else {
          const row = data as {
            id: string;
            post_date: string;
            network: string;
            title: string;
            description: string;
            status: GeneratedContent['status'];
            content_type?: string | null;
            legenda?: string | null;
            texto_arte?: string | null;
            briefing_arte?: string | null;
            versao_editada?: GeneratedContent['versao_editada'];
          };
          setPost({
            id: row.id,
            date: row.post_date,
            network: row.network as GeneratedContent['network'],
            title: row.title,
            description: row.description,
            status: row.status,
            content_type: (row.content_type as GeneratedContent['content_type']) ?? null,
            legenda: row.legenda ?? null,
            texto_arte: row.texto_arte ?? null,
            briefing_arte: row.briefing_arte ?? null,
            versao_editada: row.versao_editada ?? null,
          });
        }
      })
      .then(() => setLoadingPost(false))
      .catch(() => setLoadingPost(false));
  }, [postId, user]);

  // Quando o post carrega, ajusta formato + texto na arte
  useEffect(() => {
    if (!post) return;
    if (post.content_type === 'carrossel') {
      setFormat('carrossel-feed');
    } else {
      setFormat('feed-quadrado');
    }
    setTextoArte(getTextoArte(post));
  }, [post]);

  // Reset estado de geração quando muda texto ou formato
  useEffect(() => {
    if (stage === 'done' || stage === 'error') {
      setStage('idle');
      setErrorMsg(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textoArte, format]);

  const isBusy =
    stage === 'planning' || stage === 'generating-photo' || stage === 'composing';

  const handleGenerate = async () => {
    if (!textoArte.trim()) {
      toast({ title: 'Falta o texto na arte', variant: 'destructive' });
      return;
    }
    if (scene.avatares.length === 0) {
      toast({ title: 'Escolha um avatar', variant: 'destructive' });
      return;
    }
    if (scene.uniformes.length === 0) {
      toast({ title: 'Escolha pelo menos uma peça de uniforme', variant: 'destructive' });
      return;
    }

    setErrorMsg(null);
    setSlideResults([]);
    setActiveSlideIndex(0);
    setSelectedZoneId(null);
    setProgressLabel('');

    // Define os slides a gerar:
    //  - carrossel com "Slide 1:" / "Slide 2:" → 1 arte por slide
    //  - resto → 1 arte só com o texto inteiro
    const targets: Array<{ index: number; text: string }> =
      isCarrossel && parsedSlides.length > 1
        ? parsedSlides.map((s) => ({ index: s.index, text: s.text }))
        : [{ index: 1, text: textoArte.trim() }];

    try {
      // ───── 1. REFERÊNCIAS DO NANO-BANANA (base — comuns a todos os slides) ─────
      const baseAvatarRefs: ReferenceImage[] = [];
      for (const av of scene.avatares) {
        for (const url of av.referencias) {
          baseAvatarRefs.push(await urlToBase64(url));
        }
      }
      const baseAparelhoRefs: ReferenceImage[] = [];
      for (const ap of scene.aparelhos) {
        for (const url of ap.referencias) {
          baseAparelhoRefs.push(await urlToBase64(url));
        }
      }
      const baseUniformeRefs: ReferenceImage[] = [];
      for (const u of scene.uniformes) {
        for (const url of u.referencias) {
          baseUniformeRefs.push(await urlToBase64(url));
        }
      }
      const baseMarcaRefs: ReferenceImage[] = [];
      for (const m of scene.marcaExtras) {
        const block = MARCA_EXTRA_BLOCKS[m];
        if (block.referencias) {
          for (const url of block.referencias) {
            baseMarcaRefs.push(await urlToBase64(url));
          }
        }
      }
      const uploadedRefs: ReferenceImage[] = uploadedAssets.map((a) => ({
        mime_type: a.mimeType,
        data: a.base64,
      }));
      const slideReferences: ReferenceImage[] = [
        ...baseAvatarRefs,
        ...baseAparelhoRefs,
        ...baseUniformeRefs,
        ...baseMarcaRefs,
        ...uploadedRefs,
      ];

      const aspect: '3:4' | '9:16' = format === 'story-reels' ? '9:16' : '3:4';
      const accumulated: SlideResult[] = [];
      const scenePrompt = composePrompt(scene);

      // ───── 2. LOOP DE SLIDES ─────
      // Carrossel: slide 1 (capa) tem foto, slides 2+ são HTML-only.
      // Estático (feed/story): único slide com foto.
      for (let i = 0; i < targets.length; i++) {
        const slide = targets[i];
        const slideLabel =
          targets.length > 1 ? `Slide ${slide.index}/${targets.length} · ` : '';
        const isCarousel = format === 'carrossel-feed';
        const isHtmlOnly = isCarousel && i > 0;

        if (isHtmlOnly) {
          // ─── Slide HTML-only (carrossel 2+): sem foto, só fundo+texto ───
          setStage('composing');
          setProgressLabel(`${slideLabel}compondo slide HTML…`);
          const composeResult = await callEdgeFunction<{
            zones: Zone[];
            canvasW: number;
            canvasH: number;
            backgroundColor: string;
          }>('layout-compose-html', {
            textoArte: slide.text,
            format,
            slideIndex: slide.index,
            totalSlides: targets.length,
          });

          const fittedZones = fitZones(composeResult.zones, {
            canvasW: composeResult.canvasW,
            canvasH: composeResult.canvasH,
          });
          const clampedZones = fittedZones.map((z) =>
            clampZone(z, composeResult.canvasW, composeResult.canvasH),
          );

          accumulated.push({
            index: slide.index,
            text: slide.text,
            backgroundColor: composeResult.backgroundColor,
            side: 'bottom', // não importa em HTML-only, valor neutro
            zones: clampedZones,
            canvasSize: { w: composeResult.canvasW, h: composeResult.canvasH },
          });
          setSlideResults([...accumulated]);
          continue;
        }

        // ─── Slide com foto (estático ou capa do carrossel) ───

        // 2a) Decide lado livre via layout-side (Claude Haiku)
        setStage('planning');
        setProgressLabel(`${slideLabel}escolhendo lado livre…`);
        const sideResp = await callEdgeFunction<{
          side: 'right' | 'left' | 'bottom';
          reasoning?: string;
        }>('layout-side', { textoArte: slide.text, format });
        const side = sideResp.side;

        // 2b) Gera foto via Nano Banana — prompt idêntico ao GerarFoto +
        //     UMA linha curta indicando o lado livre. Sem overrides.
        setStage('generating-photo');
        setProgressLabel(`${slideLabel}gerando foto…`);
        const sideRule = buildNegativeSpaceRule(side);
        const fullPhotoPrompt = `${scenePrompt}\n\n${sideRule}`;

        const imgResult = await generateImage({
          prompt: fullPhotoPrompt,
          references: slideReferences,
          model: 'flash',
          aspect_ratio: aspect,
          resolution: '2K',
          avatar_name: scene.avatares.map((a) => a.nome).join(' + '),
        });

        // 2c) Claude designer com vision lê a foto e decide as zonas
        setStage('composing');
        setProgressLabel(`${slideLabel}compondo texto…`);
        const composeResult = await callEdgeFunction<{
          zones: Zone[];
          canvasW: number;
          canvasH: number;
        }>('layout-compose', {
          textoArte: slide.text,
          format,
          negativeSpaceSide: side,
          photoBase64: imgResult.image.data,
          photoMimeType: imgResult.image.mime_type,
        });

        const fittedZones = fitZones(composeResult.zones, {
          canvasW: composeResult.canvasW,
          canvasH: composeResult.canvasH,
        });
        const clampedZones = fittedZones.map((z) =>
          clampZone(z, composeResult.canvasW, composeResult.canvasH),
        );

        accumulated.push({
          index: slide.index,
          text: slide.text,
          photoPrompt: fullPhotoPrompt,
          photoDataUrl: `data:${imgResult.image.mime_type};base64,${imgResult.image.data}`,
          side,
          zones: clampedZones,
          canvasSize: { w: composeResult.canvasW, h: composeResult.canvasH },
        });
        setSlideResults([...accumulated]);
      }

      setStage('done');
      setProgressLabel('');
      toast({
        title:
          targets.length > 1
            ? `${targets.length} slides gerados!`
            : 'Layout gerado!',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Geração falhou:', err);
      setErrorMsg(msg);
      setStage('error');
      setProgressLabel('');
      toast({ title: 'Geração falhou', description: msg, variant: 'destructive' });
    }
  };

  const handleReset = () => {
    setStage('idle');
    setErrorMsg(null);
    setSlideResults([]);
    setActiveSlideIndex(0);
    setSelectedZoneId(null);
    setProgressLabel('');
  };

  const handleExportPng = async () => {
    if (!canvasSize || !activeSlide) return;
    setSelectedZoneId(null);
    setIsExporting(true);

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      // Aguarda o React montar o StaticCanvas oculto (renderizado quando isExporting=true)
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => setTimeout(r, 80));

      if (!staticExportRef.current) {
        throw new Error('StaticCanvas não montou');
      }

      const canvas = await html2canvas(staticExportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // 2x → PNG em 2160x2700 (feed) / 2160x3840 (story)
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: canvasSize.w,
        height: canvasSize.h,
        windowWidth: canvasSize.w,
        windowHeight: canvasSize.h,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      const suffix = slideResults.length > 1 ? `-slide${activeSlide.index}` : '';
      link.download = `pure-${format}${suffix}-${Date.now()}.png`;
      link.click();
      toast({ title: 'PNG baixado!' });
    } catch (err) {
      console.error('Export falhou:', err);
      toast({
        title: 'Falha ao exportar',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const updateSelectedZone = (patch: Partial<Zone>) => {
    if (!selectedZoneId) return;
    setActiveZones(zones.map((z) => (z.id === selectedZoneId ? { ...z, ...patch } : z)));
  };

  const deleteSelectedZone = () => {
    if (!selectedZoneId) return;
    setActiveZones(zones.filter((z) => z.id !== selectedZoneId));
    setSelectedZoneId(null);
  };

  const dimensions = LAYOUT_FORMATS.find((f) => f.value === format);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Voltar */}
        <Link
          to={postId ? '/agente-instagram-facebook/planilha' : '/agente-design'}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {postId ? 'Voltar pra Planilha Editorial' : 'Voltar pro Agente Design'}
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Criação de Layout</h1>
            <p className="text-sm text-muted-foreground">
              1 click: gera foto consciente do texto + layout HTML aplicando o design system Pure.
            </p>
          </div>
        </div>

        {/* Loading do briefing */}
        {loadingPost && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando briefing do post…
          </div>
        )}

        {/* Briefing card */}
        {!loadingPost && post && (
          <Card className="overflow-hidden border-l-4 border-l-primary">
            <div className="bg-primary/5 px-5 py-3 flex items-center gap-3 flex-wrap">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
                Briefing da Planilha Editorial
              </span>
              <span className="font-mono text-xs text-muted-foreground tabular-nums ml-auto">
                {formatPostDate(post.date)}
              </span>
              {post.content_type && (
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full',
                    contentTypeBadgeColor[post.content_type],
                  )}
                >
                  {contentTypeLabel[post.content_type]}
                </span>
              )}
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                Título do post
              </p>
              <p className="font-heading font-bold text-base">{post.title}</p>
            </div>
          </Card>
        )}

        {!loadingPost && postId && !post && (
          <Card className="p-4 bg-amber-50 border-amber-200 text-amber-900 text-sm">
            Não consegui encontrar o post{' '}
            <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">{postId}</code>.
            Você pode usar o gerador standalone abaixo.
          </Card>
        )}

        {/* ───── 1 · Formato ───── */}
        <Card className="p-5 space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-widest text-primary font-bold">
              1 · Formato
            </Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LAYOUT_FORMATS.map((f) => {
              const Icon = formatIcon[f.value];
              const isActive = format === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFormat(f.value)}
                  disabled={isBusy}
                  className={cn(
                    'rounded-xl border-2 p-4 text-left transition-all',
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                      : 'border-foreground/10 bg-card hover:border-primary/40',
                    isBusy && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={cn(
                        'rounded-lg p-2',
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {isActive && (
                      <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
                        Selecionado
                      </span>
                    )}
                  </div>
                  <p className="font-heading font-bold text-sm mb-1">{f.label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{f.dimensions}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* ───── 2 · Texto na arte ───── */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <Label className="text-xs uppercase tracking-widest text-primary font-bold">
                2 · Texto na arte
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {textoArteLocked
                  ? 'Vem fixo da Planilha Editorial. Pra editar, volta na Planilha.'
                  : 'O conteúdo textual que será aplicado na arte. Pra carrossel, use o formato "Slide 1: …\\nSlide 2: …".'}
              </p>
            </div>
            {textoArteLocked && (
              <Badge variant="secondary" className="gap-1.5">
                <Lock className="h-3 w-3" />
                Travado · vem da Planilha
              </Badge>
            )}
          </div>

          {textoArteLocked ? (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">
                {textoArte || <span className="italic text-muted-foreground/60">— sem texto na arte —</span>}
              </p>
            </div>
          ) : (
            <Textarea
              value={textoArte}
              onChange={(e) => setTextoArte(e.target.value)}
              placeholder="Frase forte que vai aparecer na arte"
              className="min-h-[120px] font-mono text-sm"
              disabled={isBusy}
            />
          )}
        </Card>

        {/* ───── 3 · Direção da foto ───── */}
        <Card className="p-5 space-y-5">
          <div>
            <Label className="text-xs uppercase tracking-widest text-primary font-bold">
              3 · Direção da foto
              {isCarrossel && parsedSlides.length > 1 && (
                <span className="ml-2 text-muted-foreground normal-case tracking-normal font-medium">
                  · capa do carrossel
                </span>
              )}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {isCarrossel && parsedSlides.length > 1 ? (
                <>
                  Essa direção define a <strong>capa (slide 1)</strong>. Pros{' '}
                  <strong>demais slides ({parsedSlides.length - 1})</strong>, o agente vai variar pose, enquadramento e até remover o aparelho conforme o tema de cada slide — mantendo o mesmo avatar, uniforme e iluminação pra unidade visual.
                </>
              ) : (
                <>Mesmos controles do Gerar Foto (avatar, pose, enquadramento, uniforme, aparelho, iluminação, fundo, etc.). O ângulo é decidido pelo planner pra deixar espaço pro texto.</>
              )}
            </p>
          </div>

          {/* Avatar — toggle aluna/aluno */}
          <SubSection title="Avatar">
            <div className="flex gap-2">
              {AVATARES.filter((a) => a.tipo === 'aluno').map((a) => {
                const isActive = scene.avatares.some((x) => x.id === a.id);
                const thumb = a.referencias[0];
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAvatar(a)}
                    disabled={isBusy}
                    className={cn(
                      'relative flex items-center gap-3 rounded-lg border-2 p-2 pr-4 text-left transition-all',
                      isActive
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-foreground/10 hover:border-primary/40',
                      isBusy && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                      {thumb ? (
                        <img src={thumb} alt={a.nome} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-[10px]">
                          {a.genero === 'feminino' ? '♀' : '♂'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{a.nome}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {a.genero === 'feminino' ? 'Aluna' : 'Aluno'}
                      </p>
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </SubSection>

          {/* Enquadramento */}
          <SubSection title="Enquadramento">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ENQUADRAMENTO_BLOCKS) as Enquadramento[]).map((k) => (
                <ChoiceChip
                  key={k}
                  selected={scene.enquadramento === k}
                  disabled={isBusy}
                  onClick={() =>
                    updateScene({ enquadramento: scene.enquadramento === k ? null : k })
                  }
                >
                  {ENQUADRAMENTO_BLOCKS[k].label}
                </ChoiceChip>
              ))}
            </div>
          </SubSection>

          {/* Pose */}
          <SubSection
            title="Pose"
            subtitle={
              scene.pose ? '✓ Pose ativa no prompt' : 'Anexe foto pra IA descrever a pose corporal'
            }
          >
            <input
              ref={poseInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handlePoseFileSelected(e.target.files?.[0] ?? null)}
              className="hidden"
            />

            {!poseRefImage ? (
              <button
                type="button"
                onClick={() => poseInputRef.current?.click()}
                disabled={isBusy}
                className="w-full flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-foreground/15 py-5 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Anexar imagem de referência
                </span>
              </button>
            ) : (
              <div className="flex gap-3 items-start">
                <div className="relative w-20 h-20 shrink-0 rounded-lg border overflow-hidden bg-muted">
                  <img
                    src={poseRefImage.previewUrl}
                    alt="referência pose"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removePoseRef}
                    disabled={isBusy}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex-1 flex items-center">
                  {isAnalyzingPose ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Analisando pose…
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant={poseDraft ? 'outline' : 'default'}
                      onClick={handleAnalyzePose}
                      disabled={isAnalyzingPose || isBusy}
                      className="gap-1.5"
                    >
                      {poseDraft ? (
                        <>
                          <RefreshCw className="h-3 w-3" />
                          Analisar de novo
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Analisar pose com IA
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {(poseDraft || scene.pose) && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={poseDraft || scene.pose}
                  onChange={(e) => setPoseDraft(e.target.value)}
                  rows={4}
                  disabled={isAnalyzingPose || isBusy}
                  className="text-xs leading-relaxed"
                  placeholder="Descrição da pose"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    onClick={addPoseToScene}
                    disabled={!poseDraft.trim() || poseDraft.trim() === scene.pose || isBusy}
                    className="gap-1.5"
                  >
                    <Check className="h-3 w-3" />
                    {scene.pose ? 'Atualizar pose no prompt' : 'Adicionar ao prompt'}
                  </Button>
                  {scene.pose && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={removePoseFromScene}
                      disabled={isBusy}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remover do prompt
                    </Button>
                  )}
                </div>
              </div>
            )}
          </SubSection>

          {/* Aparelhos — multi-select */}
          <SubSection
            title="Aparelhos"
            subtitle={`${scene.aparelhos.length} selecionado${scene.aparelhos.length === 1 ? '' : 's'}`}
          >
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
              {APARELHOS.map((a) => {
                const isActive = scene.aparelhos.some((x) => x.id === a.id);
                const thumb = a.referencias[0];
                return (
                  <ThumbToggle
                    key={a.id}
                    label={a.nome}
                    thumb={thumb}
                    selected={isActive}
                    disabled={isBusy}
                    onClick={() => toggleAparelho(a)}
                  />
                );
              })}
            </div>
          </SubSection>

          {/* Uniformes / Roupa */}
          <SubSection
            title="Roupa"
            subtitle={`${scene.uniformes.length} ${scene.uniformes.length === 1 ? 'peça' : 'peças'}`}
          >
            <div className="space-y-3">
              {UNIFORME_CATEGORIA_ORDER.map((cat) => {
                const items = UNIFORMES.filter((u) => u.categoria === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="text-[10px] text-muted-foreground/70 mb-1.5">
                      {UNIFORME_CATEGORIA_LABEL[cat]}
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
                      {items.map((u) => {
                        const isActive = scene.uniformes.some((x) => x.id === u.id);
                        const thumb = u.referencias[0];
                        return (
                          <ThumbToggle
                            key={u.id}
                            label={u.nome}
                            thumb={thumb}
                            selected={isActive}
                            disabled={isBusy}
                            onClick={() => toggleUniforme(u)}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div>
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Outras peças (texto livre)
                </Label>
                <Input
                  className="mt-1.5"
                  placeholder="Ex: tênis branco, jaqueta bordô…"
                  value={scene.roupaCustom}
                  onChange={(e) => updateScene({ roupaCustom: e.target.value })}
                  disabled={isBusy}
                />
              </div>
            </div>
          </SubSection>

          {/* Iluminação */}
          <SubSection title="Iluminação">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(ILUMINACAO_BLOCKS) as IluminacaoPreset[]).map((k) => {
                const block = ILUMINACAO_BLOCKS[k];
                const isSelected = scene.iluminacao === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() =>
                      updateScene({ iluminacao: scene.iluminacao === k ? null : k })
                    }
                    disabled={isBusy}
                    className={cn(
                      'group flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-foreground/10 hover:border-primary/40 hover:bg-primary/5',
                      isBusy && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-xl shrink-0">
                      {block.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{block.label}</div>
                      <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                        {block.texto}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </SubSection>

          {/* Fundo */}
          <SubSection title="Fundo">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(FUNDO_BLOCKS) as Exclude<FundoPreset, 'custom'>[]).map((k) => (
                <ChoiceChip
                  key={k}
                  selected={scene.fundo.preset === k}
                  disabled={isBusy}
                  onClick={() =>
                    updateScene({
                      fundo: { preset: scene.fundo.preset === k ? null : k },
                    })
                  }
                >
                  {FUNDO_BLOCKS[k].label}
                </ChoiceChip>
              ))}
              <ChoiceChip
                selected={scene.fundo.preset === 'custom'}
                disabled={isBusy}
                onClick={() => updateScene({ fundo: { preset: 'custom', custom: '' } })}
              >
                Personalizado
              </ChoiceChip>
            </div>
            {scene.fundo.preset === 'custom' && (
              <Input
                className="mt-2"
                placeholder="Ex: estúdio com painel de espelhos…"
                value={scene.fundo.custom ?? ''}
                onChange={(e) =>
                  updateScene({ fundo: { preset: 'custom', custom: e.target.value } })
                }
                disabled={isBusy}
              />
            )}
          </SubSection>

          {/* Marca extras */}
          <SubSection
            title="Elementos da marca"
            subtitle={
              scene.marcaExtras.length === 0
                ? 'Acumulativo — marque um ou mais'
                : `${scene.marcaExtras.length} selecionado${scene.marcaExtras.length === 1 ? '' : 's'}`
            }
          >
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
              {(Object.keys(MARCA_EXTRA_BLOCKS) as MarcaExtra[]).map((k) => {
                const block = MARCA_EXTRA_BLOCKS[k];
                const isActive = scene.marcaExtras.includes(k);
                const thumb = block.referencias?.[0];
                return (
                  <ThumbToggle
                    key={k}
                    label={block.label}
                    thumb={thumb}
                    selected={isActive}
                    disabled={isBusy}
                    onClick={() => toggleMarcaExtra(k)}
                    fallback={k === 'cores-pure' ? 'palette' : 'sparkles'}
                  />
                );
              })}
            </div>
          </SubSection>

          {/* Notas */}
          <SubSection title="Detalhes adicionais" subtitle="Ajustes finos que os presets não cobrem">
            <Textarea
              value={scene.notas}
              onChange={(e) => updateScene({ notas: e.target.value })}
              placeholder="Ex: rosto virado pra direita, sorriso natural. Cabelo solto."
              rows={3}
              disabled={isBusy}
              className="text-sm leading-relaxed"
            />
          </SubSection>

          {/* Refs extras (uploads) */}
          <SubSection
            title="Assets de referência"
            subtitle={`${uploadedAssets.length}/${MAX_ASSETS} · imagens extras (props, fundos específicos)`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleAssetsSelected(e.target.files)}
              className="hidden"
            />
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {uploadedAssets.map((a) => (
                <div
                  key={a.id}
                  className="group relative aspect-square rounded-md border overflow-hidden bg-muted"
                >
                  <img src={a.previewUrl} alt={a.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeAsset(a.id)}
                    disabled={isBusy}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-80 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {uploadedAssets.length < MAX_ASSETS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                  className="aspect-square flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-foreground/15 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-[9px] font-semibold uppercase tracking-wider">Anexar</span>
                </button>
              )}
            </div>
          </SubSection>

          {/* Prompt composto — preview */}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-semibold hover:text-primary inline-flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              Prompt composto (preview do que vai pro nano-banana)
            </summary>
            <pre className="mt-2 p-3 rounded-lg bg-muted/30 text-[10px] whitespace-pre-wrap leading-relaxed font-mono max-h-60 overflow-y-auto">
              {composedPrompt || '— vazio —'}
            </pre>
          </details>
        </Card>

        {/* ───── 4 · Gerar ───── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl bg-foreground text-background p-5">
          <div className="flex items-center gap-3">
            <Wand2 className="h-5 w-5 text-primary" />
            <div>
              <p className="font-heading font-bold text-base">
                Gerar layout completo
              </p>
              <p className="text-xs opacity-70">
                Planner → foto (nano-banana) → composição HTML (Claude). Custo ~$0.05/geração.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {stage === 'done' && (
              <Button onClick={handleReset} variant="outline" size="lg" className="gap-2 shrink-0">
                <RotateCcw className="h-4 w-4" />
                Refazer
              </Button>
            )}
            <Button
              onClick={handleGenerate}
              disabled={isBusy || !textoArte.trim()}
              size="lg"
              className="gap-2 shrink-0"
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {isBusy ? STAGE_LABEL[stage] : 'Gerar layout'}
            </Button>
          </div>
        </div>

        {/* ───── Status de progresso ───── */}
        {isBusy && (
          <Card className="p-4 bg-muted/30">
            {progressLabel && (
              <p className="text-xs uppercase tracking-widest text-primary font-bold mb-3">
                {progressLabel}
              </p>
            )}
            <div className="space-y-2">
              {[
                { key: 'planning', label: '1. Planejando composição (Claude)' },
                { key: 'generating-photo', label: '2. Gerando foto (nano-banana)' },
                { key: 'composing', label: '3. Compondo HTML final (Claude)' },
              ].map((step) => {
                const isActive = stage === step.key;
                const isPast =
                  (step.key === 'planning' && (stage === 'generating-photo' || stage === 'composing')) ||
                  (step.key === 'generating-photo' && stage === 'composing');
                return (
                  <div key={step.key} className="flex items-center gap-2 text-sm">
                    {isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : isPast ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span
                      className={cn(
                        isActive && 'text-primary font-semibold',
                        isPast && 'text-muted-foreground line-through',
                        !isActive && !isPast && 'text-muted-foreground/70',
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ───── Erro ───── */}
        {stage === 'error' && errorMsg && (
          <Card className="p-4 bg-destructive/5 border-destructive/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-destructive">Erro na geração</p>
                <p className="text-xs text-muted-foreground mt-1 break-words">{errorMsg}</p>
                <Button onClick={handleReset} size="sm" variant="outline" className="mt-3 gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Tentar de novo
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ───── Resultado · Canvas editável ───── */}
        {stage === 'done' && (photoDataUrl || backgroundColor) && canvasSize && zones.length > 0 && dimensions && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <p className="text-xs uppercase tracking-widest text-emerald-700 font-bold">
                  {slideResults.length > 1
                    ? `Carrossel · ${slideResults.length} slides · ${dimensions.dimensions}`
                    : `Arte final editável · ${dimensions.dimensions}`}
                </p>
              </div>
              <Button
                onClick={handleExportPng}
                disabled={isExporting}
                size="sm"
                className="gap-1.5"
              >
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {isExporting
                  ? 'Exportando…'
                  : slideResults.length > 1
                    ? `Baixar PNG · Slide ${activeSlide?.index ?? 1}`
                    : 'Baixar PNG'}
              </Button>
            </div>

            {/* Tabs de slide (só aparece quando tem mais de 1 slide) */}
            {slideResults.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {slideResults.map((s, i) => {
                  const isActive = i === activeSlideIndex;
                  return (
                    <button
                      key={s.index}
                      type="button"
                      onClick={() => {
                        setActiveSlideIndex(i);
                        setSelectedZoneId(null);
                      }}
                      className={cn(
                        'shrink-0 flex flex-col items-stretch gap-1.5 rounded-lg border-2 p-2 transition-all w-24',
                        isActive
                          ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                          : 'border-foreground/10 hover:border-primary/40',
                      )}
                    >
                      <div
                        className="aspect-[4/5] rounded-md overflow-hidden bg-muted relative"
                        style={s.backgroundColor ? { background: s.backgroundColor } : undefined}
                      >
                        {s.photoDataUrl ? (
                          <img
                            src={s.photoDataUrl}
                            alt={`Slide ${s.index}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[9px] uppercase tracking-widest font-bold opacity-60">
                              HTML
                            </span>
                          </div>
                        )}
                      </div>
                      <p
                        className={cn(
                          'text-[10px] uppercase tracking-widest font-bold text-center',
                          isActive ? 'text-primary' : 'text-muted-foreground',
                        )}
                      >
                        Slide {s.index}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Clique numa zona pra editar texto, cor e tamanho. Arraste pra reposicionar, puxe os cantos pra redimensionar.
            </p>

            <Card className="overflow-hidden bg-foreground/5 p-4">
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start justify-center">
                <div className="flex justify-center">
                  <EditableCanvas
                    key={activeSlideIndex}
                    zones={zones}
                    onZonesChange={setActiveZones}
                    photoDataUrl={photoDataUrl ?? undefined}
                    backgroundColor={backgroundColor ?? undefined}
                    canvasW={canvasSize.w}
                    canvasH={canvasSize.h}
                    maxDisplayWidth={500}
                    exportRef={exportRef}
                    selectedId={selectedZoneId}
                    onSelectChange={setSelectedZoneId}
                  />
                </div>
                <div className="bg-background rounded-lg p-4 border min-w-0">
                  <ZonePropertyPanel
                    zone={selectedZone}
                    onChange={updateSelectedZone}
                    onDelete={deleteSelectedZone}
                  />
                </div>
              </div>
            </Card>

            {/* Debug · prompt + plano + foto + zonas */}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer font-semibold hover:text-primary inline-flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5" />
                Debug · prompt + plano + foto + zonas (slide {activeSlide?.index})
              </summary>
              <div className="mt-2 space-y-3 p-3 rounded-lg bg-muted/30">
                {activeSlide?.photoPrompt && (
                  <div>
                    <p className="font-bold text-foreground mb-1">
                      Prompt enviado ao nano-banana
                    </p>
                    <pre className="text-[10px] overflow-x-auto bg-card p-2 rounded max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {activeSlide.photoPrompt}
                    </pre>
                  </div>
                )}
                {activeSlide?.side && (
                  <div>
                    <p className="font-bold text-foreground mb-1">Lado livre (decidido pelo layout-side)</p>
                    <pre className="text-[10px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {activeSlide.side}
                    </pre>
                  </div>
                )}
                {backgroundColor && (
                  <div>
                    <p className="font-bold text-foreground mb-1">Background (slide HTML-only)</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded ring-1 ring-foreground/10"
                        style={{ background: backgroundColor }}
                      />
                      <code className="text-[10px]">{backgroundColor}</code>
                    </div>
                  </div>
                )}
                {photoDataUrl && (
                  <div>
                    <p className="font-bold text-foreground mb-1 flex items-center gap-1.5">
                      <Camera className="h-3 w-3" />
                      Foto gerada (nano-banana)
                    </p>
                    <img
                      src={photoDataUrl}
                      alt="Foto gerada"
                      className="max-w-xs rounded-md ring-1 ring-foreground/10"
                    />
                  </div>
                )}
                <div>
                  <p className="font-bold text-foreground mb-1">Zonas (Designer Claude)</p>
                  <pre className="text-[10px] overflow-x-auto bg-card p-2 rounded max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {JSON.stringify(zones, null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* StaticCanvas OCULTO — montado só durante export, captura limpa
          em coordenadas nativas, sem react-rnd e sem CSS transforms.
          Funciona pra slides com foto OU slides HTML-only (backgroundColor). */}
      {isExporting && activeSlide && canvasSize && (photoDataUrl || backgroundColor) && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            left: '-99999px',
            top: 0,
            pointerEvents: 'none',
            opacity: 1, // precisa estar visível pra html2canvas capturar
          }}
        >
          <StaticCanvas
            ref={staticExportRef}
            zones={zones}
            photoDataUrl={photoDataUrl ?? undefined}
            backgroundColor={backgroundColor ?? undefined}
            canvasW={canvasSize.w}
            canvasH={canvasSize.h}
          />
        </div>
      )}
    </MainLayout>
  );
};

export default CriacaoLayout;

// ============================================================================
// Helpers visuais locais
// ============================================================================

const SubSection = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-baseline justify-between gap-2 flex-wrap">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
        {title}
      </p>
      {subtitle && <p className="text-[10px] text-muted-foreground/70">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const ChoiceChip = ({
  selected,
  onClick,
  disabled,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed',
      selected
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-foreground/10 bg-card hover:border-primary/40 hover:bg-primary/5',
    )}
  >
    {children}
  </button>
);

const ThumbToggle = ({
  label,
  thumb,
  selected,
  disabled,
  onClick,
  fallback,
}: {
  label: string;
  thumb?: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  fallback?: 'palette' | 'sparkles';
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={cn(
      'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
      selected
        ? 'border-primary ring-2 ring-primary/30 shadow-sm'
        : 'border-foreground/10 hover:border-primary/40',
      disabled && 'opacity-50 cursor-not-allowed',
    )}
  >
    {thumb ? (
      <img src={thumb} alt={label} className="absolute inset-0 w-full h-full object-cover" />
    ) : fallback === 'palette' ? (
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        <div style={{ background: '#722F37' }} />
        <div style={{ background: '#FAEBD7' }} />
        <div style={{ background: '#000000' }} />
        <div style={{ background: '#b01e1e' }} />
      </div>
    ) : (
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-[10px]">
        {label.slice(0, 3)}
      </div>
    )}
    {selected && (
      <div className="absolute top-1 right-1 rounded-full bg-primary text-primary-foreground p-0.5 shadow">
        <CheckCircle2 className="h-3 w-3" />
      </div>
    )}
    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
      <p className="text-[9px] text-white font-semibold truncate">{label}</p>
    </div>
  </button>
);
