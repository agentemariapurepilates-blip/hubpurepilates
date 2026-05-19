import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Wand2,
  Sparkles,
  Loader2,
  Download,
  RefreshCw,
  ImageIcon,
  Zap,
  Gem,
  User,
  ChevronDown,
  Check,
  X,
  Globe,
  Upload,
  Lightbulb,
  Cloud,
} from 'lucide-react';
import {
  AVATARES,
  TIPO_SINGULAR,
  type Avatar,
  type AvatarTipo,
} from './data/avatares';
import {
  ENQUADRAMENTO_BLOCKS,
  ANGULO_BLOCKS,
  ILUMINACAO_BLOCKS,
  FUNDO_BLOCKS,
  MARCA_EXTRA_BLOCKS,
  type Enquadramento,
  type AnguloCamera,
  type IluminacaoPreset,
  type FundoPreset,
  type MarcaExtra,
} from './data/presets';
import {
  UNIFORMES,
  UNIFORME_CATEGORIA_LABEL,
  UNIFORME_CATEGORIA_ORDER,
  type Uniforme,
} from './data/uniformes';
import { APARELHOS, type Aparelho } from './data/aparelhos';
import { composePrompt, INITIAL_SCENE_STATE, type SceneState } from './lib/composePrompt';
import {
  generateImage,
  urlToBase64,
  type GenerateModel,
  type AspectRatio,
  type Resolution,
  type ReferenceImage,
} from './lib/generateImage';
import { analyzePose } from './lib/analyzePose';
import { fileToResizedBase64 } from './lib/resizeImage';
import { ToastAction } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const tipoAccent: Record<AvatarTipo, string> = {
  franqueado: 'text-pure-red',
  instrutor: 'text-foreground',
  aluno: 'text-muted-foreground',
};

const ASPECT_RATIOS: { value: AspectRatio; label: string; hint: string }[] = [
  { value: 'auto', label: 'Auto', hint: 'Modelo decide' },
  { value: '1:1', label: '1:1 (quadrado)', hint: 'Feed Instagram' },
  { value: '16:9', label: '16:9 (horizontal)', hint: 'Banner, capa' },
  { value: '9:16', label: '9:16 (vertical)', hint: 'Stories, Reels' },
  { value: '4:3', label: '4:3', hint: 'Clássico' },
  { value: '3:4', label: '3:4', hint: 'Vertical clássico' },
  { value: '21:9', label: '21:9 (ultra-wide)', hint: 'Cinema' },
];

const RESOLUTIONS: { value: Resolution; label: string; hint: string }[] = [
  { value: 'auto', label: 'Auto', hint: 'Modelo decide' },
  { value: '1K', label: '1K', hint: '~1024px' },
  { value: '2K', label: '2K', hint: '~2048px (Pro)' },
  { value: '4K', label: '4K', hint: '~4096px (Pro)' },
];

type UploadedAsset = {
  id: string;
  name: string;
  previewUrl: string; // object URL local pra preview
  base64: string;
  mimeType: string;
};

const MAX_ASSETS = 5;
const MAX_TOTAL_REFERENCES = 14;

const GerarFoto = () => {
  const [searchParams] = useSearchParams();
  const preselectedAvatarId = searchParams.get('avatar');

  const [scene, setScene] = useState<SceneState>(() => ({
    ...INITIAL_SCENE_STATE,
    avatares: preselectedAvatarId
      ? AVATARES.filter((a) => a.id === preselectedAvatarId)
      : [],
  }));

  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pose: imagem de referência (anexada pelo designer) + draft (texto da IA, editável)
  const [poseRefImage, setPoseRefImage] = useState<{
    mime_type: string;
    data: string;
    previewUrl: string;
  } | null>(null);
  const [poseDraft, setPoseDraft] = useState('');
  const [isAnalyzingPose, setIsAnalyzingPose] = useState(false);
  const poseInputRef = useRef<HTMLInputElement>(null);

  // Controles do modelo (separados do scene state)
  const [model, setModel] = useState<GenerateModel>('flash');
  const temperature = 0.3; // travado: quem mexer aqui ajusta direto no código
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('auto');
  const [resolution, setResolution] = useState<Resolution>('auto');
  const [systemInstructions, setSystemInstructions] = useState('');
  const [grounding, setGrounding] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Geração
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);

  const composedPrompt = useMemo(() => composePrompt(scene), [scene]);

  // Prompt editável: sincroniza com composedPrompt até o usuário editar manualmente.
  const [promptDraft, setPromptDraft] = useState(composedPrompt);
  const [promptEdited, setPromptEdited] = useState(false);
  useEffect(() => {
    if (!promptEdited) setPromptDraft(composedPrompt);
  }, [composedPrompt, promptEdited]);

  const resetPromptDraft = () => {
    setPromptDraft(composedPrompt);
    setPromptEdited(false);
  };

  const totalAvatarRefs = scene.avatares.reduce((acc, a) => acc + a.referencias.length, 0);
  const totalAparelhoRefs = scene.aparelhos.reduce((acc, a) => acc + a.referencias.length, 0);
  const totalUniformeRefs = scene.uniformes.reduce((acc, u) => acc + u.referencias.length, 0);
  const totalMarcaRefs = scene.marcaExtras.reduce(
    (acc, m) => acc + (MARCA_EXTRA_BLOCKS[m].referencias?.length ?? 0),
    0
  );
  const totalReferences =
    totalAvatarRefs + totalAparelhoRefs + totalUniformeRefs + totalMarcaRefs + uploadedAssets.length;

  const updateScene = (patch: Partial<SceneState>) => setScene((s) => ({ ...s, ...patch }));

  const toggleAvatar = (id: string) => {
    setScene((s) => {
      const exists = s.avatares.some((a) => a.id === id);
      if (exists) return { ...s, avatares: s.avatares.filter((a) => a.id !== id) };
      if (s.avatares.length >= 5) {
        toast({
          title: 'Limite de 5 avatares',
          description: 'Nano Banana aceita até 5 personagens distintos.',
          variant: 'destructive',
        });
        return s;
      }
      const avatar = AVATARES.find((a) => a.id === id);
      if (!avatar) return s;
      return { ...s, avatares: [...s.avatares, avatar] };
    });
  };

  const toggleUniforme = (u: Uniforme) => {
    setScene((s) => ({
      ...s,
      uniformes: s.uniformes.some((x) => x.id === u.id)
        ? s.uniformes.filter((x) => x.id !== u.id)
        : [...s.uniformes, u],
    }));
  };

  const toggleAparelho = (a: Aparelho) => {
    setScene((s) => ({
      ...s,
      aparelhos: s.aparelhos.some((x) => x.id === a.id)
        ? s.aparelhos.filter((x) => x.id !== a.id)
        : [...s.aparelhos, a],
    }));
  };

  const toggleMarcaExtra = (m: MarcaExtra) => {
    setScene((s) => ({
      ...s,
      marcaExtras: s.marcaExtras.includes(m)
        ? s.marcaExtras.filter((x) => x !== m)
        : [...s.marcaExtras, m],
    }));
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_ASSETS - uploadedAssets.length;
    if (remaining <= 0) {
      toast({
        title: `Limite de ${MAX_ASSETS} assets`,
        description: 'Remova algum antes de adicionar mais.',
        variant: 'destructive',
      });
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    toUpload.forEach(async (file) => {
      try {
        const resized = await fileToResizedBase64(file);
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setUploadedAssets((prev) => [
          ...prev,
          {
            id,
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

  // — Pose (analise por IA de uma imagem de referência) —————————————————
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
  };

  const handleAnalyzePose = async () => {
    if (!poseRefImage) return;
    setIsAnalyzingPose(true);
    try {
      const result = await analyzePose({
        mime_type: poseRefImage.mime_type,
        data: poseRefImage.data,
      });
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
    toast({
      title: 'Pose adicionada ao prompt',
      description: 'A descrição entra na composição automática.',
    });
  };

  const removePoseFromScene = () => {
    updateScene({ pose: '' });
  };

  const handleGenerate = async () => {
    if (scene.avatares.length === 0) {
      toast({
        title: 'Escolha pelo menos um avatar',
        description: 'Selecione um ou mais avatares na lista acima.',
        variant: 'destructive',
      });
      return;
    }
    if (totalReferences > MAX_TOTAL_REFERENCES) {
      toast({
        title: 'Muitas referências',
        description: `${totalReferences} no total — Gemini aceita até ${MAX_TOTAL_REFERENCES}. Reduza avatares ou assets.`,
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setResultDataUrl(null);
    setElapsedMs(null);

    try {
      const allReferences: ReferenceImage[] = [];
      // Avatar references
      for (const av of scene.avatares) {
        for (const url of av.referencias) {
          allReferences.push(await urlToBase64(url));
        }
      }
      // Aparelho references (foto do equipamento Pure)
      for (const ap of scene.aparelhos) {
        for (const url of ap.referencias) {
          allReferences.push(await urlToBase64(url));
        }
      }
      // Uniforme references (peças visuais)
      for (const u of scene.uniformes) {
        for (const url of u.referencias) {
          allReferences.push(await urlToBase64(url));
        }
      }
      // Marca extras com foto (ex: P Luminoso)
      for (const m of scene.marcaExtras) {
        const block = MARCA_EXTRA_BLOCKS[m];
        if (block.referencias) {
          for (const url of block.referencias) {
            allReferences.push(await urlToBase64(url));
          }
        }
      }
      // Uploaded assets
      for (const a of uploadedAssets) {
        allReferences.push({ mime_type: a.mimeType, data: a.base64 });
      }

      const result = await generateImage({
        prompt: promptDraft.trim() || composedPrompt,
        references: allReferences,
        model,
        temperature,
        aspect_ratio: aspectRatio === 'auto' ? undefined : aspectRatio,
        resolution: resolution === 'auto' ? undefined : resolution,
        system_instructions: systemInstructions.trim() || undefined,
        grounding,
        avatar_name: scene.avatares.map((a) => a.nome).join(' + '),
      });

      setResultDataUrl(`data:${result.image.mime_type};base64,${result.image.data}`);
      setElapsedMs(result.elapsed_ms);
    } catch (err) {
      toast({
        title: 'Erro ao gerar imagem',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadName = `pure-design-${Date.now()}.png`;

  const handleSaveToDrive = async () => {
    if (!resultDataUrl) return;
    const webhookUrl = import.meta.env.VITE_PURE_DESIGN_DRIVE_WEBHOOK_URL as string | undefined;
    if (!webhookUrl) {
      toast({
        title: 'Salvar no Drive não configurado',
        description: 'Defina VITE_PURE_DESIGN_DRIVE_WEBHOOK_URL no .env.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingToDrive(true);
    try {
      const blob = await (await fetch(resultDataUrl)).blob();
      const formData = new FormData();
      formData.append('file', blob, downloadName);
      formData.append('fileName', downloadName);

      const response = await fetch(webhookUrl, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`webhook respondeu ${response.status}`);

      const payload = await response.json().catch(() => null);
      const link: string | undefined = payload?.webViewLink || payload?.[0]?.webViewLink;

      toast({
        title: 'Salvo no Drive',
        description: 'A imagem foi adicionada na pasta Pure Design.',
        action: link ? (
          <ToastAction altText="Abrir no Drive" onClick={() => window.open(link, '_blank')}>
            Abrir
          </ToastAction>
        ) : undefined,
      });
    } catch (err) {
      toast({
        title: 'Erro ao salvar no Drive',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setIsSavingToDrive(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-pure-red/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-pure-red mb-3">
            <Sparkles className="h-3 w-3" />
            Agente de Design
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Gerar Foto
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-2xl">
            Monte a cena escolhendo presets. O sistema compõe o prompt no padrão Pure pra você.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* COLUNA PRINCIPAL */}
          <div className="space-y-6">
            {/* Avatares */}
            <SectionCard
              title="Avatares"
              subtitle={`${scene.avatares.length}/5 selecionados · ${totalAvatarRefs} ${totalAvatarRefs === 1 ? 'foto' : 'fotos'} de referência`}
            >
              <div className="flex gap-2 overflow-x-auto pb-1">
                {AVATARES.map((avatar) => (
                  <AvatarChip
                    key={avatar.id}
                    avatar={avatar}
                    selected={scene.avatares.some((a) => a.id === avatar.id)}
                    onClick={() => toggleAvatar(avatar.id)}
                  />
                ))}
              </div>
            </SectionCard>

            {/* Enquadramento + Ângulo (lado a lado em telas largas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Enquadramento" inline>
                <ChipGroup>
                  {(Object.keys(ENQUADRAMENTO_BLOCKS) as Enquadramento[]).map((k) => (
                    <ChoiceChip
                      key={k}
                      selected={scene.enquadramento === k}
                      onClick={() =>
                        updateScene({ enquadramento: scene.enquadramento === k ? null : k })
                      }
                    >
                      {ENQUADRAMENTO_BLOCKS[k].label}
                    </ChoiceChip>
                  ))}
                </ChipGroup>
              </SectionCard>

              <SectionCard title="Ângulo da câmera" inline>
                <ChipGroup>
                  {(Object.keys(ANGULO_BLOCKS) as AnguloCamera[]).map((k) => (
                    <ChoiceChip
                      key={k}
                      selected={scene.angulo === k}
                      onClick={() => updateScene({ angulo: scene.angulo === k ? null : k })}
                    >
                      {ANGULO_BLOCKS[k].label}
                    </ChoiceChip>
                  ))}
                </ChipGroup>
              </SectionCard>
            </div>

            {/* Pose — anexa imagem de referência e IA descreve só a pose */}
            <SectionCard
              title="Pose"
              subtitle={
                scene.pose
                  ? '✓ Pose ativa no prompt'
                  : 'Quer uma pose específica? Mande uma referência e a IA descreve.'
              }
            >
              <p className="text-[11px] text-muted-foreground mb-3 flex items-start gap-1.5">
                <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Anexe uma foto e a IA descreve em detalhe só a pose corporal (sem ambiente,
                iluminação ou pessoa). Depois revise e clique em "Adicionar ao prompt".
              </p>

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
                  className="w-full flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border py-6 text-muted-foreground hover:border-pure-red/50 hover:text-pure-red transition-all"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Anexar imagem de referência
                  </span>
                </button>
              ) : (
                <div className="flex gap-3 items-start">
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg border border-border overflow-hidden bg-muted">
                    <img
                      src={poseRefImage.previewUrl}
                      alt="referência de pose"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removePoseRef}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-pure-red text-white flex items-center justify-center"
                      aria-label="Remover referência"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex-1 flex items-center">
                    {isAnalyzingPose ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analisando pose...
                      </div>
                    ) : poseDraft ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAnalyzePose}
                        disabled={isAnalyzingPose}
                      >
                        <RefreshCw className="h-3 w-3 mr-1.5" />
                        Analisar de novo
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAnalyzePose}
                        disabled={isAnalyzingPose}
                        className="bg-pure-red hover:bg-pure-red-light text-white"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Analisar pose com IA
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {(poseDraft || scene.pose) && (
                <div className="mt-3 space-y-2">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Descrição da pose
                  </Label>
                  <Textarea
                    value={poseDraft}
                    onChange={(e) => setPoseDraft(e.target.value)}
                    rows={5}
                    disabled={isAnalyzingPose}
                    className="text-xs leading-relaxed"
                    placeholder="A descrição da pose aparece aqui após a análise — pode editar livremente."
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      onClick={addPoseToScene}
                      disabled={!poseDraft.trim() || poseDraft.trim() === scene.pose}
                      className="bg-pure-red hover:bg-pure-red-light text-white"
                    >
                      <Check className="h-3 w-3 mr-1.5" />
                      {scene.pose ? 'Atualizar pose no prompt' : 'Adicionar ao prompt'}
                    </Button>
                    {scene.pose && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={removePoseFromScene}
                      >
                        <X className="h-3 w-3 mr-1.5" />
                        Remover do prompt
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Aparelho — fotos vão como referência visual obrigatória */}
            <SectionCard
              title="Aparelho"
              subtitle={
                scene.aparelhos.length === 0
                  ? 'Selecione se a cena usa algum aparelho Pure'
                  : `${scene.aparelhos.length} selecionado${scene.aparelhos.length === 1 ? '' : 's'} · ${totalAparelhoRefs} ${totalAparelhoRefs === 1 ? 'foto' : 'fotos'} de referência`
              }
            >
              <div className="flex gap-2 overflow-x-auto pb-1">
                {APARELHOS.map((a) => (
                  <AparelhoChip
                    key={a.id}
                    aparelho={a}
                    selected={scene.aparelhos.some((x) => x.id === a.id)}
                    onClick={() => toggleAparelho(a)}
                  />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-start gap-1.5">
                <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Quando selecionado, a foto do aparelho vai junto pro Nano Banana e o prompt
                exige que ele use exatamente esse modelo (não invente um genérico).
              </p>
            </SectionCard>

            {/* Roupa */}
            <SectionCard
              title="Roupa"
              subtitle={`${scene.uniformes.length} ${scene.uniformes.length === 1 ? 'peça' : 'peças'} selecionada${scene.uniformes.length === 1 ? '' : 's'} · imagens enviadas como referência visual`}
            >
              {UNIFORME_CATEGORIA_ORDER.map((cat) => {
                const uniformesCat = UNIFORMES.filter((u) => u.categoria === cat);
                if (uniformesCat.length === 0) return null;
                return (
                  <div key={cat} className="space-y-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {UNIFORME_CATEGORIA_LABEL[cat]}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {uniformesCat.map((u) => (
                        <UniformeChip
                          key={u.id}
                          uniforme={u}
                          selected={scene.uniformes.some((s) => s.id === u.id)}
                          onClick={() => toggleUniforme(u)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="mt-3">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Outras peças (texto livre)
                </Label>
                <Input
                  className="mt-1.5"
                  placeholder="Ex: tênis branco, jaqueta corta-vento bordô..."
                  value={scene.roupaCustom}
                  onChange={(e) => updateScene({ roupaCustom: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
                  <Lightbulb className="h-3 w-3" />
                  Pode combinar: ex. seleciona o top + descreve sapato e legging custom.
                </p>
              </div>
            </SectionCard>

            {/* Iluminação */}
            <SectionCard title="Iluminação">
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
                      className={cn(
                        'group flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all',
                        isSelected
                          ? 'border-pure-red bg-pure-red/5'
                          : 'border-border hover:border-pure-red/40 hover:bg-pure-red/5'
                      )}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-pure-red/10 text-xl flex-shrink-0">
                        {block.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground">
                          {block.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                          {block.texto}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-pure-red flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                <Lightbulb className="h-3 w-3" />
                Mais presets de iluminação virão conforme você mandar mais exemplos de prompts.
              </p>
            </SectionCard>

            {/* Fundo */}
            <SectionCard title="Fundo">
              <ChipGroup>
                {(Object.keys(FUNDO_BLOCKS) as Exclude<FundoPreset, 'custom'>[]).map((k) => (
                  <ChoiceChip
                    key={k}
                    selected={scene.fundo.preset === k}
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
                  onClick={() => updateScene({ fundo: { preset: 'custom', custom: '' } })}
                >
                  Personalizado
                </ChoiceChip>
              </ChipGroup>
              {scene.fundo.preset === 'custom' && (
                <Input
                  className="mt-2"
                  placeholder="Ex: estúdio com painel de espelhos, ambiente residencial..."
                  value={scene.fundo.custom ?? ''}
                  onChange={(e) =>
                    updateScene({ fundo: { preset: 'custom', custom: e.target.value } })
                  }
                />
              )}
            </SectionCard>

            {/* Marca extra */}
            <SectionCard
              title="Elementos da marca"
              subtitle={
                scene.marcaExtras.length === 0
                  ? 'Acumulativo — marque um ou mais'
                  : `${scene.marcaExtras.length} selecionado${scene.marcaExtras.length === 1 ? '' : 's'}${totalMarcaRefs > 0 ? ` · ${totalMarcaRefs} ${totalMarcaRefs === 1 ? 'foto' : 'fotos'} de referência` : ''}`
              }
            >
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(Object.keys(MARCA_EXTRA_BLOCKS) as MarcaExtra[]).map((k) => (
                  <MarcaExtraChip
                    key={k}
                    chave={k}
                    block={MARCA_EXTRA_BLOCKS[k]}
                    selected={scene.marcaExtras.includes(k)}
                    onClick={() => toggleMarcaExtra(k)}
                  />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-start gap-1.5">
                <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Itens com foto cadastrada (ex: P Luminoso) já vão como referência visual
                pro Nano Banana automaticamente — não precisa anexar em Assets.
              </p>
            </SectionCard>

            {/* Upload de assets */}
            <SectionCard
              title="Assets de referência"
              subtitle={`${uploadedAssets.length}/${MAX_ASSETS} · total de referências: ${totalReferences}/${MAX_TOTAL_REFERENCES}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {uploadedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group relative aspect-square rounded-lg border border-border overflow-hidden bg-muted"
                  >
                    <img src={asset.previewUrl} alt={asset.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAsset(asset.id)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-pure-red text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remover"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                      <div className="text-[9px] font-medium text-white truncate">
                        {asset.name}
                      </div>
                    </div>
                  </div>
                ))}
                {uploadedAssets.length < MAX_ASSETS && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-pure-red/50 hover:text-pure-red transition-all"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                      Anexar
                    </span>
                  </button>
                )}
              </div>
            </SectionCard>

            {/* Notas adicionais */}
            <SectionCard
              title="Detalhes adicionais"
              subtitle="Texto livre — ajustes finos que os presets não cobrem"
            >
              <Textarea
                value={scene.notas}
                onChange={(e) => updateScene({ notas: e.target.value })}
                placeholder="Ex: rosto virado para a direita, olhos fechados, sorriso natural. Cabelo solto. Brinco de pérola."
                rows={3}
                disabled={isGenerating}
                className="text-sm leading-relaxed"
              />
            </SectionCard>

            {/* Prompt composto — editável */}
            <SectionCard
              title="Prompt composto"
              subtitle={
                promptEdited
                  ? 'Editado manualmente · será enviado como está'
                  : 'Atualiza com os controles acima. Pode editar livremente antes de gerar.'
              }
            >
              <Textarea
                value={promptDraft}
                onChange={(e) => {
                  setPromptDraft(e.target.value);
                  setPromptEdited(true);
                }}
                rows={12}
                disabled={isGenerating}
                className="text-[11px] leading-relaxed font-mono"
              />
              {promptEdited && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <Lightbulb className="h-3 w-3" />
                    Mexer nos controles acima não vai mais sobrescrever esse texto.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={resetPromptDraft}
                    disabled={isGenerating}
                    className="h-7 text-[10px]"
                  >
                    <RefreshCw className="h-3 w-3 mr-1.5" />
                    Voltar pro automático
                  </Button>
                </div>
              )}
            </SectionCard>

            {/* Botão Gerar */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || scene.avatares.length === 0}
                className="bg-pure-red hover:bg-pure-red-light text-white px-6 h-11"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Gerar
                  </>
                )}
              </Button>
              {!isGenerating && elapsedMs !== null && (
                <span className="text-xs text-muted-foreground">
                  Última geração: {(elapsedMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>

            {/* Resultado */}
            <SectionCard title="Resultado">
              <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6">
                    <Loader2 className="h-10 w-10 animate-spin text-pure-red mb-3" />
                    <p className="text-sm font-medium text-foreground">Gerando imagem...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {model === 'flash' ? '~10-15 segundos' : '~20-30 segundos'}
                    </p>
                  </div>
                ) : resultDataUrl ? (
                  <div>
                    <div className="relative bg-black">
                      <img
                        src={resultDataUrl}
                        alt="Imagem gerada"
                        className="w-full h-auto max-h-[600px] object-contain mx-auto"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-card">
                      <Button type="button" size="sm" variant="outline" onClick={handleGenerate}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Gerar de novo
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleSaveToDrive}
                        disabled={isSavingToDrive}
                      >
                        {isSavingToDrive ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Cloud className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {isSavingToDrive ? 'Salvando…' : 'Salvar no Drive'}
                      </Button>
                      <Button
                        size="sm"
                        asChild
                        className="bg-pure-red hover:bg-pure-red-light text-white"
                      >
                        <a href={resultDataUrl} download={downloadName}>
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          Baixar
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      A imagem gerada vai aparecer aqui
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          {/* PAINEL DE CONTROLES */}
          <aside className="space-y-5">
            <ControlSection title="Modelo">
              <div className="grid grid-cols-2 gap-2">
                <ModelOption
                  selected={model === 'flash'}
                  onSelect={() => setModel('flash')}
                  disabled={isGenerating}
                  icon={Zap}
                  title="Flash"
                  subtitle="gemini-3.1-flash"
                  hint="Rápido · ~10s"
                />
                <ModelOption
                  selected={model === 'pro'}
                  onSelect={() => setModel('pro')}
                  disabled={isGenerating}
                  icon={Gem}
                  title="Pro"
                  subtitle="gemini-3-pro"
                  hint="Qualidade · ~25s"
                />
              </div>
            </ControlSection>

            <ControlSection title="System Instructions" optional>
              <Textarea
                value={systemInstructions}
                onChange={(e) => setSystemInstructions(e.target.value)}
                placeholder="Tom e estilo opcionais. Ex: gerar SEM texto na imagem."
                rows={3}
                disabled={isGenerating}
                className="text-xs leading-relaxed"
              />
            </ControlSection>

            <ControlSection title="Aspect ratio">
              <Select
                value={aspectRatio}
                onValueChange={(v) => setAspectRatio(v as AspectRatio)}
                disabled={isGenerating}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center justify-between gap-3 w-full">
                        <span>{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground">{opt.hint}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlSection>

            <ControlSection title="Resolução">
              <Select
                value={resolution}
                onValueChange={(v) => setResolution(v as Resolution)}
                disabled={isGenerating}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      disabled={model === 'flash' && (opt.value === '2K' || opt.value === '4K')}
                    >
                      <span className="flex items-center justify-between gap-3 w-full">
                        <span>{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground">{opt.hint}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {model === 'flash' && (
                <p className="text-[10px] text-muted-foreground mt-1">2K e 4K só no Pro.</p>
              )}
            </ControlSection>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Avançado</span>
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 transition-transform', advancedOpen && 'rotate-180')}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <Globe className="h-3.5 w-3.5 text-pure-red" />
                      Grounding (Google Search)
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Modelo consulta a web pra fatos antes de gerar.
                    </p>
                  </div>
                  <Switch
                    checked={grounding}
                    onCheckedChange={setGrounding}
                    disabled={isGenerating}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
};

// — Componentes auxiliares —————————————————————————————————

type SectionCardProps = {
  title: string;
  subtitle?: string;
  inline?: boolean; // pra cards lado-a-lado sem padding extra
  children: React.ReactNode;
};

const SectionCard = ({ title, subtitle, inline: _inline, children }: SectionCardProps) => (
  <section className="rounded-xl border border-border bg-card/30 p-4">
    <div className="flex items-center justify-between mb-3">
      <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
        {title}
      </Label>
      {subtitle && (
        <span className="text-[10px] text-muted-foreground">{subtitle}</span>
      )}
    </div>
    {children}
  </section>
);

const ChipGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap gap-1.5">{children}</div>
);

type ChoiceChipProps = {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const ChoiceChip = ({ selected, onClick, children }: ChoiceChipProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all',
      selected
        ? 'border-pure-red bg-pure-red/10 text-pure-red'
        : 'border-border bg-card hover:border-pure-red/40 hover:bg-pure-red/5'
    )}
  >
    {children}
  </button>
);

type AvatarChipProps = {
  avatar: Avatar;
  selected: boolean;
  onClick: () => void;
};

const AvatarChip = ({ avatar, selected, onClick }: AvatarChipProps) => {
  const thumb = avatar.referencias[0] ?? null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex-shrink-0 w-28 rounded-lg border-2 overflow-hidden text-left transition-all',
        selected
          ? 'border-pure-red shadow-md shadow-pure-red/10'
          : 'border-border hover:border-pure-red/40'
      )}
    >
      <div className="aspect-square bg-muted/40">
        {thumb ? (
          <img src={thumb} alt={avatar.nome} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-muted-foreground/40">
            <User className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="p-1.5 bg-card">
        <div className="text-[10px] font-semibold leading-tight truncate">{avatar.nome}</div>
        <div className={cn('text-[9px] uppercase tracking-wider', tipoAccent[avatar.tipo])}>
          {TIPO_SINGULAR[avatar.tipo][avatar.genero]}
        </div>
      </div>
      {selected && (
        <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-pure-red text-white flex items-center justify-center">
          <Check className="h-3 w-3" />
        </div>
      )}
      {selected && (
        <div className="absolute top-1 left-1">
          <Badge className="bg-pure-red text-white text-[9px] px-1 py-0 h-4">
            {avatar.referencias.length}
          </Badge>
        </div>
      )}
    </button>
  );
};

type MarcaExtraChipProps = {
  chave: MarcaExtra;
  block: { label: string; texto: string; referencias?: string[] };
  selected: boolean;
  onClick: () => void;
};

const MarcaExtraChip = ({ chave, block, selected, onClick }: MarcaExtraChipProps) => {
  const thumb = block.referencias?.[0];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex-shrink-0 w-28 rounded-lg border-2 overflow-hidden text-left transition-all',
        selected
          ? 'border-pure-red shadow-md shadow-pure-red/10'
          : 'border-border hover:border-pure-red/40'
      )}
    >
      <div className="aspect-square bg-muted/40">
        {thumb ? (
          <img src={thumb} alt={block.label} loading="lazy" className="w-full h-full object-cover" />
        ) : chave === 'cores-pure' ? (
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
            <div style={{ background: '#722F37' }} />
            <div style={{ background: '#FAEBD7' }} />
            <div style={{ background: '#000000' }} />
            <div style={{ background: '#b01e1e' }} />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full text-muted-foreground/40">
            <Sparkles className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="px-1.5 py-1 bg-card">
        <div className="text-[10px] font-semibold leading-tight truncate">{block.label}</div>
      </div>
      {selected && (
        <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-pure-red text-white flex items-center justify-center">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  );
};

type AparelhoChipProps = {
  aparelho: Aparelho;
  selected: boolean;
  onClick: () => void;
};

const AparelhoChip = ({ aparelho, selected, onClick }: AparelhoChipProps) => {
  const thumb = aparelho.referencias[0] ?? null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex-shrink-0 w-28 rounded-lg border-2 overflow-hidden text-left transition-all',
        selected
          ? 'border-pure-red shadow-md shadow-pure-red/10'
          : 'border-border hover:border-pure-red/40'
      )}
    >
      <div className="aspect-square bg-muted/40">
        {thumb ? (
          <img src={thumb} alt={aparelho.nome} loading="lazy" className="w-full h-full object-contain p-1" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-muted-foreground/40">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="px-1.5 py-1 bg-card">
        <div className="text-[10px] font-semibold leading-tight truncate">{aparelho.nome}</div>
      </div>
      {selected && (
        <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-pure-red text-white flex items-center justify-center">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  );
};

type UniformeChipProps = {
  uniforme: Uniforme;
  selected: boolean;
  onClick: () => void;
};

const UniformeChip = ({ uniforme, selected, onClick }: UniformeChipProps) => {
  const thumb = uniforme.referencias[0] ?? null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex-shrink-0 w-24 rounded-lg border-2 overflow-hidden text-left transition-all',
        selected
          ? 'border-pure-red shadow-md shadow-pure-red/10'
          : 'border-border hover:border-pure-red/40'
      )}
    >
      <div className="aspect-square bg-muted/40">
        {thumb ? (
          <img src={thumb} alt={uniforme.nome} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-muted-foreground/40">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="px-1.5 py-1 bg-card">
        <div className="text-[10px] font-semibold leading-tight truncate">
          {uniforme.nome}
        </div>
      </div>
      {selected && (
        <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-pure-red text-white flex items-center justify-center">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  );
};

type ControlSectionProps = {
  title: string;
  rightLabel?: string;
  optional?: boolean;
  children: React.ReactNode;
};

const ControlSection = ({ title, rightLabel, optional, children }: ControlSectionProps) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
        {title}
        {optional && (
          <span className="ml-1.5 text-[9px] font-medium normal-case tracking-normal text-muted-foreground">
            opcional
          </span>
        )}
      </Label>
      {rightLabel && (
        <span className="text-xs font-mono text-muted-foreground">{rightLabel}</span>
      )}
    </div>
    {children}
  </div>
);

type ModelOptionProps = {
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
  icon: typeof Zap;
  title: string;
  subtitle: string;
  hint: string;
};

const ModelOption = ({
  selected,
  onSelect,
  disabled,
  icon: Icon,
  title,
  subtitle,
  hint,
}: ModelOptionProps) => (
  <button
    type="button"
    onClick={onSelect}
    disabled={disabled}
    className={cn(
      'group relative flex flex-col items-start gap-0.5 rounded-lg border-2 p-3 text-left transition-all',
      selected ? 'border-pure-red bg-pure-red/5' : 'border-border hover:border-pure-red/40',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    <div className="flex items-center gap-1.5 w-full">
      <Icon className={cn('h-3.5 w-3.5', selected ? 'text-pure-red' : 'text-muted-foreground')} />
      <span className="text-xs font-semibold">{title}</span>
    </div>
    <span className="text-[9px] text-muted-foreground font-mono leading-tight">{subtitle}</span>
    <span className="text-[10px] text-muted-foreground mt-0.5">{hint}</span>
  </button>
);

export default GerarFoto;
