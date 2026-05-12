import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Star, Download, Pencil, Save, X, Sparkles, Loader2, Instagram } from 'lucide-react';
import { format } from 'date-fns';
import {
  GeneratedContent, SceneEntry, FieldKey, VersaoEditada,
  isThemeStage,
  contentTypeLabel, statusLabels,
} from './types';
import { CenasTable } from './CenasTable';

interface PostDialogProps {
  post: GeneratedContent | null;
  onClose: () => void;
  // Edit manual
  editMode: boolean;
  editForm: VersaoEditada;
  setEditForm: React.Dispatch<React.SetStateAction<VersaoEditada>>;
  onStartEdit: (post: GeneratedContent) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  savingEdit: boolean;
  // Tema
  generatingContent: boolean;
  onApproveTheme: () => void;
  onOpenRejectTheme: (post: GeneratedContent) => void;
  onOpenRefineTheme: () => void;
  // DOCX
  downloadingDocx: boolean;
  onDownloadDocx: (post: GeneratedContent) => void;
  // Acoes por campo
  refiningField: FieldKey | null;
  onApproveField: (field: FieldKey) => void;
  onOpenRefineField: (field: FieldKey) => void;
  onOpenRejectField: (field: FieldKey, prefillReason: string) => void;
  // Acoes globais
  onApprovePost: (post: GeneratedContent) => void;
  onOpenRejectPost: (post: GeneratedContent) => void;
  onFavoritePost: (post: GeneratedContent) => void;
}

/**
 * Dialog principal de revisao de post:
 * - Em modo TEMA (sem legenda): mostra 3 botoes (Aprovar tema / Reprovar tema / Refazer com IA)
 * - Em modo CONTEUDO: mostra os 4 cards de campo (Roteiro+Cenas / Texto na Arte / Briefing Arte / Legenda)
 *   cada um com botões proprios (Refinar / Aprovar / Reprovar) + botões globais no rodape.
 */
export function PostDialog(props: PostDialogProps) {
  const { post, onClose } = props;

  // Mantemos o <Dialog> SEMPRE montado e a condicional do conteudo dentro do
  // <DialogContent> via IIFE. Assim o Radix consegue animar o close gracefully
  // (open: true -> false) quando expandedItem vira null. Se retornassemos null
  // aqui em cima, o Dialog seria desmontado bruscamente sem animacao.
  return (
    <Dialog open={!!post} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        {post && (() => {
          const cenas: SceneEntry[] = Array.isArray(post.cenas) ? post.cenas : [];
          const isVideo = post.content_type === 'video';
          const isArt = post.content_type === 'estatico' || post.content_type === 'carrossel';
          const theme = isThemeStage(post);

          const renderFieldFooter = (field: FieldKey) => {
            const feedback = post.field_feedback?.[field];
            const isThisRefining = props.refiningField === field;
            return (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-dashed">
                {feedback?.status === 'approved' && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Aprovado
                  </span>
                )}
                {feedback?.status === 'rejected' && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-800 flex items-center gap-1"
                    title={feedback.motivo}
                  >
                    <XCircle className="h-3 w-3" /> Reprovado
                  </span>
                )}
                <div className="flex-1" />
                {!props.editMode && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isThisRefining || props.refiningField !== null}
                      onClick={() => props.onOpenRefineField(field)}
                      className="gap-1.5"
                    >
                      {isThisRefining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Refinar com IA
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => props.onApproveField(field)} className="gap-1.5 text-emerald-700 hover:text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => props.onOpenRejectField(field, feedback?.motivo ?? '')}
                      className="gap-1.5 text-rose-700 hover:text-rose-800"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reprovar
                    </Button>
                  </>
                )}
              </div>
            );
          };

          return (
            <>
              <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="rounded-full px-3 py-1 text-xs font-semibold bg-pink-500 text-white flex items-center gap-1">
              <Instagram className="h-3 w-3" /> Instagram
            </span>
            {post.content_type && (
              <span className="rounded-full px-3 py-1 text-xs font-semibold bg-purple-500 text-white">
                {contentTypeLabel[post.content_type]}
              </span>
            )}
            {post.versao_editada && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-600 text-white flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Editado por você
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {format(new Date(post.date), 'dd/MM/yyyy')}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="text-left text-xl">{post.title}</DialogTitle>
            {!props.editMode && !theme && (
              <Button size="sm" variant="outline" onClick={() => props.onStartEdit(post)} className="gap-1.5 shrink-0">
                <Pencil className="h-3.5 w-3.5" /> Editar manualmente
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Aviso de reprovação global anterior */}
        {post.feedback_motivo && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs">
            <div className="font-semibold text-rose-700 mb-1">Motivo da reprovação do post inteiro</div>
            <p className="text-rose-900 whitespace-pre-line">{post.feedback_motivo}</p>
          </div>
        )}

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Briefing do tema</Label>
            <p className="text-sm mt-1 whitespace-pre-line">{post.description}</p>
          </div>

          {/* MODO TEMA */}
          {theme && (
            <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/60 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-500 text-white">TEMA</span>
                <p className="text-sm font-medium text-amber-900">Esse post é só um tema. Aprove para gerar legenda, roteiro e briefings.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={props.onApproveTheme} disabled={props.generatingContent} className="gap-1.5">
                  {props.generatingContent ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {props.generatingContent ? 'Gerando conteúdo…' : 'Aprovar tema'}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => props.onOpenRejectTheme(post)} disabled={props.generatingContent} className="gap-1.5">
                  <XCircle className="h-4 w-4" /> Reprovar tema
                </Button>
                <Button size="sm" variant="outline" onClick={props.onOpenRefineTheme} disabled={props.generatingContent} className="gap-1.5">
                  <Sparkles className="h-4 w-4" /> Refazer com IA
                </Button>
              </div>
            </div>
          )}

          {/* MODO CONTEUDO · Roteiro + Cenas (video) */}
          {!theme && isVideo && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <Label className="text-xs uppercase tracking-wider text-purple-700">Roteiro e Cenas do vídeo</Label>
                {!props.editMode && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => props.onDownloadDocx(post)}
                    disabled={props.downloadingDocx || (cenas.length === 0 && !(post.versao_editada?.roteiro || post.roteiro))}
                    className="gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {props.downloadingDocx ? 'Gerando…' : 'Baixar .docx'}
                  </Button>
                )}
              </div>

              {props.editMode ? (
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground">Resumo do arco narrativo (texto livre)</Label>
                  <Textarea
                    value={props.editForm.roteiro ?? ''}
                    onChange={(e) => props.setEditForm((f) => ({ ...f, roteiro: e.target.value }))}
                    rows={4}
                    placeholder="Resumo em 2-4 linhas do arco do vídeo…"
                  />
                  <p className="text-[11px] text-muted-foreground italic">
                    As cenas estruturadas são editadas via "Refinar com IA". Salvar aqui mantém o resumo manual.
                  </p>
                </div>
              ) : (
                <>
                  {(post.versao_editada?.roteiro || post.roteiro) && (
                    <div className="mb-3">
                      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Arco narrativo</Label>
                      <p className="text-sm whitespace-pre-line bg-muted/30 p-3 rounded mt-1">
                        {post.versao_editada?.roteiro ?? post.roteiro}
                      </p>
                    </div>
                  )}
                  <CenasTable cenas={cenas} />
                </>
              )}

              {renderFieldFooter('roteiro')}
            </div>
          )}

          {/* MODO CONTEUDO · Texto na arte (estatico/carrossel) */}
          {!theme && isArt && (
            <div className="rounded-lg border border-border bg-card p-4">
              <Label className="text-xs uppercase tracking-wider text-blue-700">Texto na arte</Label>
              {props.editMode ? (
                <Textarea
                  value={props.editForm.texto_arte ?? ''}
                  onChange={(e) => props.setEditForm((f) => ({ ...f, texto_arte: e.target.value }))}
                  rows={6}
                  placeholder="Frases que vão dentro da arte…"
                  className="mt-2"
                />
              ) : (post.versao_editada?.texto_arte || post.texto_arte) ? (
                <p className="text-sm whitespace-pre-line mt-2 bg-muted/30 p-3 rounded font-medium">
                  {post.versao_editada?.texto_arte ?? post.texto_arte}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic mt-1">Texto da arte não definido.</p>
              )}
              {renderFieldFooter('texto_arte')}
            </div>
          )}

          {/* MODO CONTEUDO · Briefing da arte */}
          {!theme && (
            <div className="rounded-lg border border-border bg-card p-4">
              <Label className="text-xs uppercase tracking-wider text-amber-700">Briefing da arte (para o designer)</Label>
              {props.editMode ? (
                <Textarea
                  value={props.editForm.briefing_arte ?? ''}
                  onChange={(e) => props.setEditForm((f) => ({ ...f, briefing_arte: e.target.value }))}
                  rows={5}
                  placeholder="Instruções pro designer: referência visual, paleta, mood, elementos…"
                  className="mt-2"
                />
              ) : (post.versao_editada?.briefing_arte || post.briefing_arte) ? (
                <p className="text-sm whitespace-pre-line mt-2 text-muted-foreground bg-muted/20 p-3 rounded">
                  {post.versao_editada?.briefing_arte ?? post.briefing_arte}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic mt-1">Briefing da arte não definido.</p>
              )}
              {renderFieldFooter('briefing_arte')}
            </div>
          )}

          {/* MODO CONTEUDO · Legenda */}
          {!theme && (
            <div className="rounded-lg border border-border bg-card p-4">
              <Label className="text-xs uppercase tracking-wider text-pink-700">Legenda do post</Label>
              {props.editMode ? (
                <Textarea
                  value={props.editForm.legenda ?? ''}
                  onChange={(e) => props.setEditForm((f) => ({ ...f, legenda: e.target.value }))}
                  rows={8}
                  placeholder="Legenda completa…"
                  className="mt-2"
                />
              ) : (post.versao_editada?.legenda || post.legenda) ? (
                <p className="text-sm whitespace-pre-line mt-2 bg-muted/30 p-3 rounded">
                  {post.versao_editada?.legenda ?? post.legenda}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic mt-1">Legenda não definida.</p>
              )}
              {renderFieldFooter('legenda')}
            </div>
          )}

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status atual do post</Label>
            <p className="text-sm font-medium mt-1">{statusLabels[post.status]}</p>
          </div>

          {/* Botoes globais (Aprovar/Reprovar/Favorito inteiro) so quando o conteudo ja existe */}
          {!theme && (
            <div className="flex flex-wrap gap-2 pt-3 border-t">
              {props.editMode ? (
                <>
                  <Button size="sm" onClick={props.onSaveEdit} disabled={props.savingEdit} className="gap-1.5">
                    {props.savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar edição manual
                  </Button>
                  <Button size="sm" variant="outline" onClick={props.onCancelEdit} className="gap-1.5">
                    <X className="h-4 w-4" /> Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={() => props.onApprovePost(post)} className="gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Aprovar post inteiro
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => props.onOpenRejectPost(post)} className="gap-1.5">
                    <XCircle className="h-4 w-4" /> Reprovar post inteiro
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => props.onFavoritePost(post)} className="gap-1.5">
                    <Star className="h-4 w-4" /> Favorito
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
            </>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
