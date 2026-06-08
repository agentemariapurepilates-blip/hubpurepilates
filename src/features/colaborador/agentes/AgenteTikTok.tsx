import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  VersaoEditada, FieldKey, FieldFeedback, GeneratedContent,
  FIELD_LABELS,
  MONTHS as months, NETWORKS_TIKTOK,
} from '@/components/agente/types';
import { downloadRoteiroDocx as buildAndDownloadRoteiroDocx } from '@/components/agente/lib/docx';
import { fetchGuideText, GUIDE_URLS } from '@/components/agente/lib/guide';
import { extractPdfText } from '@/components/agente/lib/pdf';
import {
  selectMonthPosts, replaceMonthPosts,
  updatePostStatus, rejectPostWithReason, updatePostVersaoEditada,
  updatePostFieldFeedback, bulkApprovePosts,
} from '@/components/agente/services/postsRepository';
import {
  invokeGenerateEditorialPlan, invokeGeneratePostContent, invokeRefineEditorialPost,
} from '@/components/agente/services/agenteAi';
import { usePastPlans } from '@/components/agente/hooks/usePastPlans';
import { RefineThemeDialog, RefineFieldDialog, RejectFieldDialog, RejectGlobalDialog } from '@/components/agente/dialogs';
import { EditorialCalendar } from '@/components/agente/EditorialCalendar';
import { PlanConfigCard } from '@/components/agente/PlanConfigCard';
import { PastPlansCard } from '@/components/agente/PastPlansCard';
import { PostDialog } from '@/components/agente/PostDialog';

// Agente TikTok: clone do agente Instagram/Facebook, mas:
// - network fixo 'Tik Tok' (sem replicacao de Facebook)
// - guia editorial proprio (guia-editorial-tiktok-resumido.html)
// - usa todos os mesmos componentes / hooks / services do agente IG.
const AgenteTikTok = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [useGuide2026, setUseGuide2026] = useState(true);
  const [usePdf, setUsePdf] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState('');
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([]);
  const [resultMonth, setResultMonth] = useState<Date | null>(null);
  const [generating, setGenerating] = useState(false);
  const [expandedItem, setExpandedItem] = useState<GeneratedContent | null>(null);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; item: GeneratedContent | null; reason: string }>({ open: false, item: null, reason: '' });
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<VersaoEditada>({ legenda: '', roteiro: '', texto_arte: '', briefing_arte: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingReject, setSavingReject] = useState(false);
  const [refineFieldDialog, setRefineFieldDialog] = useState<{ open: boolean; field: FieldKey | null; prompt: string }>({ open: false, field: null, prompt: '' });
  const [refiningField, setRefiningField] = useState<FieldKey | null>(null);
  const [rejectFieldDialog, setRejectFieldDialog] = useState<{ open: boolean; field: FieldKey | null; reason: string }>({ open: false, field: null, reason: '' });
  const [savingRejectField, setSavingRejectField] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [refineThemePrompt, setRefineThemePrompt] = useState('');
  const [refineThemeOpen, setRefineThemeOpen] = useState(false);
  const [refiningTheme, setRefiningTheme] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      setUsePdf(true);
    }
  };

  const downloadRoteiroDocx = async (post: GeneratedContent) => {
    setDownloadingDocx(true);
    try {
      await buildAndDownloadRoteiroDocx(post);
    } catch (err) {
      if (err instanceof Error && err.message.includes('roteiro')) {
        toast.error(err.message);
      } else {
        console.error('Erro ao gerar DOCX:', err);
        toast.error('Falha ao gerar o DOCX.');
      }
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: GeneratedContent['status']) => {
    setGeneratedContents((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    try { await updatePostStatus(supabase, id, status); }
    catch (err) { console.error('Erro ao salvar status:', err); toast.error('Não foi possível salvar a alteração.'); }
  };

  const handleSaveReject = async () => {
    if (!rejectDialog.item) return;
    if (!rejectDialog.reason.trim()) { toast.error('Conta rapidinho por que está reprovando — esse motivo vai ensinar a IA.'); return; }
    setSavingReject(true);
    const id = rejectDialog.item.id;
    const reason = rejectDialog.reason.trim();
    setGeneratedContents((current) => current.map((item) => item.id === id ? { ...item, status: 'rejected', feedback_motivo: reason } : item));
    try {
      await rejectPostWithReason(supabase, id, reason);
      toast.success('Reprovação salva — a IA vai usar isso na próxima geração.');
      setRejectDialog({ open: false, item: null, reason: '' });
      setExpandedItem(null);
    } catch (err) { console.error('Erro ao salvar reprovação:', err); toast.error('Não foi possível salvar.'); }
    finally { setSavingReject(false); }
  };

  const handleSaveEdit = async () => {
    if (!expandedItem) return;
    setSavingEdit(true);
    const cleanEdit: VersaoEditada = {};
    if (editForm.legenda?.trim()) cleanEdit.legenda = editForm.legenda.trim();
    if (editForm.roteiro?.trim()) cleanEdit.roteiro = editForm.roteiro.trim();
    if (editForm.texto_arte?.trim()) cleanEdit.texto_arte = editForm.texto_arte.trim();
    if (editForm.briefing_arte?.trim()) cleanEdit.briefing_arte = editForm.briefing_arte.trim();
    const id = expandedItem.id;
    setGeneratedContents((current) => current.map((item) => item.id === id ? { ...item, versao_editada: cleanEdit } : item));
    try {
      await updatePostVersaoEditada(supabase, id, cleanEdit);
      toast.success('Edição salva. A IA vai aprender com sua versão.');
      setExpandedItem((current) => current ? { ...current, versao_editada: cleanEdit } : current);
      setEditMode(false);
    } catch (err) { console.error('Erro ao salvar edição:', err); toast.error('Não foi possível salvar a edição.'); }
    finally { setSavingEdit(false); }
  };

  const handleApproveTheme = async () => {
    if (!expandedItem) return;
    setGeneratingContent(true);
    try {
      let guideText = '';
      try { guideText = await fetchGuideText(GUIDE_URLS.tiktok); } catch { /* sem guia, segue */ }
      const content = await invokeGeneratePostContent(supabase, expandedItem.id, guideText || undefined);
      const updated: GeneratedContent = {
        ...expandedItem,
        legenda: content.legenda ?? null,
        roteiro: content.roteiro ?? null,
        cenas: Array.isArray(content.cenas) ? content.cenas : null,
        texto_arte: content.texto_arte ?? null,
        briefing_arte: content.briefing_arte ?? null,
      };
      setGeneratedContents((current) => current.map((it) => it.id === expandedItem.id ? updated : it));
      setExpandedItem(updated);
      toast.success('Conteúdo gerado a partir do tema aprovado.');
    } catch (err) {
      console.error('Approve theme failed:', err);
      // DEBUG TEMPORARIO 2026-06-03: extrai detalhe do FunctionsHttpError pra ver no toast
      let detail = (err as Error)?.message ?? String(err);
      try {
        // deno-lint-ignore no-explicit-any
        const ctx = (err as any)?.context;
        if (ctx && typeof ctx.text === 'function') {
          const body = await ctx.text();
          detail += ` | body: ${body.slice(0, 400)}`;
        }
      } catch { /* segue */ }
      toast.error(`DEBUG: ${detail}`, { duration: 60000 });
    }
    finally { setGeneratingContent(false); }
  };

  const handleRefineTheme = async () => {
    if (!expandedItem) return;
    const userHint = refineThemePrompt.trim();
    setRefiningTheme(true);
    try {
      const promptBase = userHint
        ? `Refaça o TEMA deste post (apenas titulo e briefing/description). Mantenha a data e o content_type. Ajuste: ${userHint}`
        : `Refaça o TEMA deste post (apenas titulo e briefing/description) para algo mais forte e alinhado ao guia. Mantenha a data e o content_type.`;
      const { refined } = await invokeRefineEditorialPost(supabase, expandedItem.id, promptBase);
      const updated: GeneratedContent = {
        ...expandedItem,
        title: refined.title ?? expandedItem.title,
        description: refined.description ?? expandedItem.description,
      };
      setGeneratedContents((current) => current.map((it) => it.id === expandedItem.id ? updated : it));
      setExpandedItem(updated);
      setRefineThemeOpen(false);
      setRefineThemePrompt('');
      toast.success('Tema refeito.');
    } catch (err) { console.error('Refine theme failed:', err); toast.error('Falha ao refazer o tema.'); }
    finally { setRefiningTheme(false); }
  };

  const handleRefineField = async () => {
    if (!expandedItem || !refineFieldDialog.field) return;
    const field = refineFieldDialog.field;
    const prompt = refineFieldDialog.prompt.trim();
    if (!prompt) { toast.error('Escreve o que você quer ajustar neste campo.'); return; }
    setRefiningField(field);
    try {
      const { refined, refinement } = await invokeRefineEditorialPost(supabase, expandedItem.id, prompt, field);
      const updated: GeneratedContent = {
        ...expandedItem,
        legenda: field === 'legenda' ? (refined.legenda ?? expandedItem.legenda) : expandedItem.legenda,
        roteiro: field === 'roteiro' ? (refined.roteiro ?? expandedItem.roteiro) : expandedItem.roteiro,
        cenas: field === 'roteiro' ? (Array.isArray(refined.cenas) ? refined.cenas : expandedItem.cenas) : expandedItem.cenas,
        texto_arte: field === 'texto_arte' ? (refined.texto_arte ?? expandedItem.texto_arte) : expandedItem.texto_arte,
        briefing_arte: field === 'briefing_arte' ? (refined.briefing_arte ?? expandedItem.briefing_arte) : expandedItem.briefing_arte,
        versao_editada: null,
        refinements: refinement ? [...(expandedItem.refinements ?? []), refinement] : expandedItem.refinements,
      };
      setGeneratedContents((current) => current.map((it) => it.id === expandedItem.id ? updated : it));
      setExpandedItem(updated);
      setRefineFieldDialog({ open: false, field: null, prompt: '' });
      toast.success(`${FIELD_LABELS[field]} reescrito. Confere aí.`);
    } catch (err) { console.error('Refine field falhou:', err); toast.error('Não consegui reescrever. Tenta de novo daqui a pouco.'); }
    finally { setRefiningField(null); }
  };

  const handleApproveField = async (field: FieldKey) => {
    if (!expandedItem) return;
    const newFeedback: FieldFeedback = {
      ...(expandedItem.field_feedback ?? {}),
      [field]: { status: 'approved', at: new Date().toISOString() },
    };
    setGeneratedContents((current) => current.map((item) => item.id === expandedItem.id ? { ...item, field_feedback: newFeedback } : item));
    setExpandedItem((current) => current ? { ...current, field_feedback: newFeedback } : current);
    try {
      await updatePostFieldFeedback(supabase, expandedItem.id, newFeedback);
      toast.success(`${FIELD_LABELS[field]} aprovado.`);
    } catch (err) { console.error('Erro ao salvar aprovação do campo:', err); toast.error('Não foi possível salvar.'); }
  };

  const handleRejectField = async () => {
    if (!expandedItem || !rejectFieldDialog.field) return;
    const motivo = rejectFieldDialog.reason.trim();
    if (!motivo) { toast.error('Conta o motivo, é o que ensina a IA.'); return; }
    setSavingRejectField(true);
    const field = rejectFieldDialog.field;
    const newFeedback: FieldFeedback = {
      ...(expandedItem.field_feedback ?? {}),
      [field]: { status: 'rejected', motivo, at: new Date().toISOString() },
    };
    setGeneratedContents((current) => current.map((item) => item.id === expandedItem.id ? { ...item, field_feedback: newFeedback } : item));
    setExpandedItem((current) => current ? { ...current, field_feedback: newFeedback } : current);
    try {
      await updatePostFieldFeedback(supabase, expandedItem.id, newFeedback);
      toast.success(`${FIELD_LABELS[field]} reprovado. A IA vai usar isso na próxima geração.`);
      setRejectFieldDialog({ open: false, field: null, reason: '' });
    } catch (err) { console.error('Erro ao salvar reprovação do campo:', err); toast.error('Não foi possível salvar.'); }
    finally { setSavingRejectField(false); }
  };

  const startEditing = (item: GeneratedContent) => {
    setEditForm({
      legenda: item.versao_editada?.legenda ?? item.legenda ?? '',
      roteiro: item.versao_editada?.roteiro ?? item.roteiro ?? '',
      texto_arte: item.versao_editada?.texto_arte ?? item.texto_arte ?? '',
      briefing_arte: item.versao_editada?.briefing_arte ?? item.briefing_arte ?? '',
    });
    setEditMode(true);
  };

  const handleApproveAll = async () => {
    if (!user) return;
    const pendingIds = generatedContents.filter((c) => c.status === 'pending').map((c) => c.id);
    if (pendingIds.length === 0) { toast.info('Não há postagens pendentes.'); return; }
    setGeneratedContents((current) => current.map((item) => item.status === 'pending' ? { ...item, status: 'approved' } : item));
    try { await bulkApprovePosts(supabase, pendingIds); toast.success(`${pendingIds.length} postagens aprovadas.`); }
    catch (err) { console.error('Erro ao aprovar tudo:', err); toast.error('Falha ao salvar aprovação em massa.'); }
  };

  const loadPostsForMonth = async (month: string, year: string) => {
    if (!user || !month || !year) return;
    try {
      const posts = await selectMonthPosts(supabase, user.id, month, year, NETWORKS_TIKTOK);
      if (posts.length > 0) {
        const monthIndex = months.indexOf(month);
        setGeneratedContents(posts);
        setResultMonth(new Date(Number(year), monthIndex, 1));
      } else {
        setGeneratedContents([]);
        setResultMonth(null);
      }
    } catch (err) { console.error('Erro ao carregar posts:', err); }
  };

  useEffect(() => {
    if (selectedMonth && selectedYear) loadPostsForMonth(selectedMonth, selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, user?.id]);

  const { pastPlans } = usePastPlans(user?.id, NETWORKS_TIKTOK, generatedContents.length);

  const persistPosts = async (posts: GeneratedContent[]) => {
    if (!user) return [];
    try { return await replaceMonthPosts(supabase, user.id, selectedMonth, selectedYear, posts, NETWORKS_TIKTOK); }
    catch (err) { console.error('Erro ao salvar plano:', err); toast.error('Plano gerado mas falhou ao salvar.'); return posts; }
  };

  const handleGenerate = async () => {
    if (!selectedMonth) { toast.error('Selecione o mês.'); return; }
    const monthIndex = months.indexOf(selectedMonth);
    setGenerating(true);
    try {
      const guideParts: string[] = [];
      if (useGuide2026) {
        try { guideParts.push(await fetchGuideText(GUIDE_URLS.tiktok)); }
        catch (err) { console.error('Falha ao carregar guia editorial:', err); toast.error('Não consegui carregar o Guia Editorial — vou gerar sem ele.'); }
      }
      if (usePdf && uploadedFile) {
        try {
          const pdfText = await extractPdfText(uploadedFile);
          if (pdfText) guideParts.push(`### GUIA ADICIONAL (PDF — ${uploadedFile.name})\n\n${pdfText}`);
        } catch (err) { console.error('Falha ao extrair PDF:', err); toast.error(`Não consegui ler o PDF "${uploadedFile.name}". Vou gerar sem ele.`); }
      }
      const guideText = guideParts.join('\n\n---\n\n');

      const posts = await invokeGenerateEditorialPlan(supabase, {
        month: selectedMonth,
        year: selectedYear,
        networks: NETWORKS_TIKTOK,
        instructions: instructions || undefined,
        editorialGuide: guideText || undefined,
      });

      // TikTok é sempre vídeo, mas a edge function ja garante isso. Aqui só
      // mapeamos o que vier.
      const generated: GeneratedContent[] = posts.map((p, idx) => ({
        id: `${p.network}-${idx}`,
        date: p.date,
        network: p.network as GeneratedContent['network'],
        title: p.title,
        description: p.description,
        status: 'pending',
        content_type: 'video' as const,
        legenda: p.legenda ?? null,
        roteiro: p.roteiro ?? null,
        cenas: Array.isArray(p.cenas) && p.cenas.length > 0 ? p.cenas : null,
        texto_arte: p.texto_arte ?? null,
        briefing_arte: p.briefing_arte ?? null,
      }));

      const saved = await persistPosts(generated);
      setGeneratedContents(saved);
      setResultMonth(new Date(Number(selectedYear), monthIndex, 1));
      toast.success(`${posts.length} temas gerados. Aprove cada tema pra gerar o conteúdo completo.`);
    } catch (err) { console.error(err); toast.error('Falha ao gerar temas. Verifica sua conexão e tenta de novo.'); }
    finally { setGenerating(false); }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <Video className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Agente TikTok</h1>
              <p className="text-muted-foreground">Planeja o mês de TikTok com vídeos verticais, hooks fortes, sounds e formato cru. Gera tema, e depois conteúdo completo por aprovação.</p>
            </div>
          </div>
        </div>

        <PlanConfigCard
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          useGuide2026={useGuide2026}
          setUseGuide2026={setUseGuide2026}
          usePdf={usePdf}
          setUsePdf={setUsePdf}
          uploadedFile={uploadedFile}
          onFileUpload={handleFileUpload}
          instructions={instructions}
          setInstructions={setInstructions}
          generating={generating}
          onGenerate={handleGenerate}
        >
          {resultMonth && generatedContents.length > 0 && (
            <EditorialCalendar
              resultMonth={resultMonth}
              generatedContents={generatedContents}
              primaryNetwork="Tik Tok"
              legendNetworks={NETWORKS_TIKTOK}
              onItemClick={setExpandedItem}
              onApproveAll={handleApproveAll}
            />
          )}
        </PlanConfigCard>

        <PastPlansCard
          plans={pastPlans}
          currentMonth={selectedMonth}
          currentYear={selectedYear}
          onSelect={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }}
        />
      </div>

      <PostDialog
        post={expandedItem}
        onClose={() => { setExpandedItem(null); setEditMode(false); }}
        editMode={editMode}
        editForm={editForm}
        setEditForm={setEditForm}
        onStartEdit={startEditing}
        onCancelEdit={() => setEditMode(false)}
        onSaveEdit={handleSaveEdit}
        savingEdit={savingEdit}
        generatingContent={generatingContent}
        onApproveTheme={handleApproveTheme}
        onOpenRejectTheme={(post) => setRejectDialog({ open: true, item: post, reason: post.feedback_motivo ?? '' })}
        onOpenRefineTheme={() => setRefineThemeOpen(true)}
        downloadingDocx={downloadingDocx}
        onDownloadDocx={downloadRoteiroDocx}
        refiningField={refiningField}
        onApproveField={handleApproveField}
        onOpenRefineField={(field) => setRefineFieldDialog({ open: true, field, prompt: '' })}
        onOpenRejectField={(field, prefill) => setRejectFieldDialog({ open: true, field, reason: prefill })}
        onApprovePost={(post) => { handleUpdateStatus(post.id, 'approved'); setExpandedItem(null); }}
        onOpenRejectPost={(post) => setRejectDialog({ open: true, item: post, reason: post.feedback_motivo ?? '' })}
        onFavoritePost={(post) => { handleUpdateStatus(post.id, 'favorite'); setExpandedItem(null); }}
      />

      <RefineThemeDialog
        open={refineThemeOpen}
        prompt={refineThemePrompt}
        loading={refiningTheme}
        onPromptChange={setRefineThemePrompt}
        onCancel={() => { setRefineThemeOpen(false); setRefineThemePrompt(''); }}
        onConfirm={handleRefineTheme}
      />

      <RefineFieldDialog
        open={refineFieldDialog.open}
        field={refineFieldDialog.field}
        prompt={refineFieldDialog.prompt}
        loading={refiningField !== null}
        onPromptChange={(v) => setRefineFieldDialog((d) => ({ ...d, prompt: v }))}
        onCancel={() => setRefineFieldDialog({ open: false, field: null, prompt: '' })}
        onConfirm={handleRefineField}
      />

      <RejectFieldDialog
        open={rejectFieldDialog.open}
        field={rejectFieldDialog.field}
        reason={rejectFieldDialog.reason}
        saving={savingRejectField}
        onReasonChange={(v) => setRejectFieldDialog((d) => ({ ...d, reason: v }))}
        onCancel={() => setRejectFieldDialog({ open: false, field: null, reason: '' })}
        onConfirm={handleRejectField}
      />

      <RejectGlobalDialog
        open={rejectDialog.open}
        reason={rejectDialog.reason}
        saving={savingReject}
        onReasonChange={(v) => setRejectDialog((d) => ({ ...d, reason: v }))}
        onCancel={() => setRejectDialog({ open: false, item: null, reason: '' })}
        onConfirm={handleSaveReject}
      />
    </MainLayout>
  );
};

export default AgenteTikTok;
