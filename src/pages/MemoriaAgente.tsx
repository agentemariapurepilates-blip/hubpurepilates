import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Brain, CheckCircle2, XCircle, Pencil, Download, RefreshCw, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface VersaoEditada {
  legenda?: string;
  roteiro?: string;
  texto_arte?: string;
}

interface ApprovedRow {
  title: string | null;
  network: string | null;
  content_type: string | null;
  legenda: string | null;
  roteiro: string | null;
  texto_arte: string | null;
}

interface RejectedRow {
  title: string | null;
  network: string | null;
  content_type: string | null;
  legenda: string | null;
  feedback_motivo: string | null;
}

interface EditedRow {
  title: string | null;
  network: string | null;
  content_type: string | null;
  legenda: string | null;
  roteiro: string | null;
  texto_arte: string | null;
  versao_editada: VersaoEditada | null;
}

interface RefinementEntry {
  prompt: string;
  before?: { legenda?: string | null; roteiro?: string | null; texto_arte?: string | null };
  after?: { legenda?: string | null; roteiro?: string | null; texto_arte?: string | null };
  at: string;
}

interface RefinedRow {
  title: string | null;
  network: string | null;
  content_type: string | null;
  refinements: RefinementEntry[] | null;
}

const MemoriaAgente = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState<ApprovedRow[]>([]);
  const [rejected, setRejected] = useState<RejectedRow[]>([]);
  const [edited, setEdited] = useState<EditedRow[]>([]);
  const [refined, setRefined] = useState<RefinedRow[]>([]);

  const loadMemory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [aprovedRes, rejectedRes, editedRes, refinedRes] = await Promise.all([
        (supabase.from('editorial_posts' as never) as any)
          .select('title, network, content_type, legenda, roteiro, texto_arte')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .not('legenda', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(8),
        (supabase.from('editorial_posts' as never) as any)
          .select('title, network, content_type, legenda, feedback_motivo')
          .eq('user_id', user.id)
          .eq('status', 'rejected')
          .not('feedback_motivo', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(8),
        (supabase.from('editorial_posts' as never) as any)
          .select('title, network, content_type, legenda, roteiro, texto_arte, versao_editada')
          .eq('user_id', user.id)
          .not('versao_editada', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(6),
        (supabase.from('editorial_posts' as never) as any)
          .select('title, network, content_type, refinements')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(20),
      ]);

      setApproved((aprovedRes.data ?? []) as ApprovedRow[]);
      setRejected((rejectedRes.data ?? []) as RejectedRow[]);
      setEdited((editedRes.data ?? []) as EditedRow[]);
      const refinedAll = ((refinedRes.data ?? []) as RefinedRow[]).filter((r) => Array.isArray(r.refinements) && r.refinements.length > 0);
      setRefined(refinedAll.slice(0, 8));
    } catch (err) {
      console.error('Erro ao carregar memória:', err);
      toast.error('Não foi possível carregar a memória do agente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const buildMarkdown = (): string => {
    const parts: string[] = [
      '# Memória do Agente Pure Studio — Instagram e Facebook',
      `> Snapshot gerado em ${new Date().toLocaleString('pt-BR')}`,
      `> Esta memória é injetada como contexto cacheado no system prompt da IA toda vez que ela gera um plano editorial.`,
      '',
    ];

    if (approved.length > 0) {
      parts.push('## ✅ Exemplos Aprovados (a IA copia este tom)');
      parts.push('');
      approved.forEach((r, i) => {
        parts.push(`### ${i + 1}. ${r.title ?? '(sem título)'} — ${r.network ?? '?'} (${r.content_type ?? 'n/a'})`);
        if (r.legenda) parts.push(`**Legenda:**\n\n${r.legenda}\n`);
        if (r.roteiro) parts.push(`**Roteiro:**\n\n${r.roteiro}\n`);
        if (r.texto_arte) parts.push(`**Texto na arte:**\n\n${r.texto_arte}\n`);
        parts.push('---');
      });
      parts.push('');
    }

    if (rejected.length > 0) {
      parts.push('## ❌ Exemplos Reprovados (a IA evita estes padrões)');
      parts.push('');
      rejected.forEach((r, i) => {
        parts.push(`### ${i + 1}. ${r.title ?? '(sem título)'} — ${r.network ?? '?'} (${r.content_type ?? 'n/a'})`);
        if (r.legenda) parts.push(`**Legenda original:**\n\n${r.legenda}\n`);
        parts.push(`**Motivo da reprovação:** ${r.feedback_motivo}\n`);
        parts.push('---');
      });
      parts.push('');
    }

    if (edited.length > 0) {
      parts.push('## ✏️ Edições Manuais (delta IA → versão final)');
      parts.push('');
      edited.forEach((r, i) => {
        parts.push(`### ${i + 1}. ${r.title ?? '(sem título)'} — ${r.network ?? '?'} (${r.content_type ?? 'n/a'})`);
        if (r.legenda && r.versao_editada?.legenda) {
          parts.push(`**Legenda IA:**\n\n${r.legenda}\n`);
          parts.push(`**Legenda VERSÃO FINAL:**\n\n${r.versao_editada.legenda}\n`);
        }
        if (r.roteiro && r.versao_editada?.roteiro) {
          parts.push(`**Roteiro IA:**\n\n${r.roteiro}\n`);
          parts.push(`**Roteiro VERSÃO FINAL:**\n\n${r.versao_editada.roteiro}\n`);
        }
        if (r.texto_arte && r.versao_editada?.texto_arte) {
          parts.push(`**Texto arte IA:**\n\n${r.texto_arte}\n`);
          parts.push(`**Texto arte VERSÃO FINAL:**\n\n${r.versao_editada.texto_arte}\n`);
        }
        parts.push('---');
      });
      parts.push('');
    }

    if (refined.length > 0) {
      parts.push('## 💬 Conversas com o Agente (refinações por prompt)');
      parts.push('');
      refined.forEach((r, i) => {
        parts.push(`### ${i + 1}. ${r.title ?? '(sem título)'} — ${r.network ?? '?'} (${r.content_type ?? 'n/a'})`);
        (r.refinements ?? []).forEach((ref, j) => {
          parts.push(`**Turn ${j + 1} (${new Date(ref.at).toLocaleString('pt-BR')}):**`);
          parts.push(`> Você: ${ref.prompt}`);
          if (ref.after?.legenda) parts.push(`> IA → Legenda: ${ref.after.legenda.slice(0, 280)}${ref.after.legenda.length > 280 ? '…' : ''}`);
          if (ref.after?.roteiro) parts.push(`> IA → Roteiro: ${ref.after.roteiro.slice(0, 280)}${ref.after.roteiro.length > 280 ? '…' : ''}`);
          parts.push('');
        });
        parts.push('---');
      });
      parts.push('');
    }

    if (approved.length === 0 && rejected.length === 0 && edited.length === 0 && refined.length === 0) {
      parts.push('_(A memória do agente está vazia. Aprove, reprove com motivo, edite conteúdos ou converse com o agente via prompt para começar a ensiná-lo.)_');
    }

    return parts.join('\n');
  };

  const downloadMarkdown = () => {
    const md = buildMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `memoria-agente-${stamp}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Memória exportada.');
  };

  const totalRows = approved.length + rejected.length + edited.length + refined.length;
  const totalRefinementTurns = refined.reduce((sum, r) => sum + (r.refinements?.length ?? 0), 0);

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Memória do Agente</h1>
              <p className="text-sm text-muted-foreground">
                Tudo que o Agente Instagram e Facebook está aprendendo com suas decisões.
                Esse conteúdo entra no contexto cacheado a cada geração.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadMemory} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Atualizar
            </Button>
            <Button size="sm" onClick={downloadMarkdown} disabled={totalRows === 0} className="gap-1.5">
              <Download className="h-4 w-4" />
              Exportar (.md)
            </Button>
            <Link to="/agente-instagram-facebook">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-emerald-50 border-emerald-200 p-4">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4" /> Aprovados
            </div>
            <div className="text-2xl font-bold text-emerald-900 mt-1">{approved.length}</div>
            <div className="text-[10px] text-emerald-700">positivos no contexto</div>
          </div>
          <div className="rounded-lg border bg-rose-50 border-rose-200 p-4">
            <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
              <XCircle className="h-4 w-4" /> Reprovados
            </div>
            <div className="text-2xl font-bold text-rose-900 mt-1">{rejected.length}</div>
            <div className="text-[10px] text-rose-700">padrões a evitar</div>
          </div>
          <div className="rounded-lg border bg-blue-50 border-blue-200 p-4">
            <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
              <Pencil className="h-4 w-4" /> Edições
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{edited.length}</div>
            <div className="text-[10px] text-blue-700">deltas IA → final</div>
          </div>
          <div className="rounded-lg border bg-violet-50 border-violet-200 p-4">
            <div className="flex items-center gap-2 text-violet-700 font-semibold text-sm">
              <MessageSquare className="h-4 w-4" /> Conversas
            </div>
            <div className="text-2xl font-bold text-violet-900 mt-1">{totalRefinementTurns}</div>
            <div className="text-[10px] text-violet-700">refinações por prompt</div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando memória…
          </div>
        ) : totalRows === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">A memória do agente está vazia.</p>
              <p className="text-sm mt-1">
                Volte para o agente, aprove conteúdos bons, reprove com motivo os ruins ou edite os textos. Tudo isso vira aprendizado.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {approved.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" /> Aprovados — a IA copia este tom
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {approved.map((r, i) => (
                    <div key={i} className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Badge variant="outline" className="text-[10px]">{r.network}</Badge>
                        <Badge variant="outline" className="text-[10px]">{r.content_type ?? 'n/a'}</Badge>
                        <span>{r.title}</span>
                      </div>
                      {r.legenda && (
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-muted-foreground">Legenda</div>
                          <p className="text-sm whitespace-pre-line">{r.legenda}</p>
                        </div>
                      )}
                      {r.roteiro && (
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-muted-foreground">Roteiro</div>
                          <p className="text-xs whitespace-pre-line text-muted-foreground">{r.roteiro}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {rejected.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-rose-700">
                    <XCircle className="h-5 w-5" /> Reprovados — a IA evita estes padrões
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rejected.map((r, i) => (
                    <div key={i} className="rounded-lg border border-rose-200 bg-rose-50/40 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Badge variant="outline" className="text-[10px]">{r.network}</Badge>
                        <Badge variant="outline" className="text-[10px]">{r.content_type ?? 'n/a'}</Badge>
                        <span>{r.title}</span>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-rose-700">Motivo</div>
                        <p className="text-sm font-medium text-rose-900 whitespace-pre-line">{r.feedback_motivo}</p>
                      </div>
                      {r.legenda && (
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-muted-foreground">Legenda original</div>
                          <p className="text-xs whitespace-pre-line text-muted-foreground line-through opacity-70">{r.legenda}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {refined.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-violet-700">
                    <MessageSquare className="h-5 w-5" /> Conversas com o Agente — refinações por prompt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {refined.map((r, i) => (
                    <div key={i} className="rounded-lg border border-violet-200 bg-violet-50/40 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Badge variant="outline" className="text-[10px]">{r.network}</Badge>
                        <Badge variant="outline" className="text-[10px]">{r.content_type ?? 'n/a'}</Badge>
                        <span>{r.title}</span>
                      </div>
                      {(r.refinements ?? []).map((ref, j) => (
                        <div key={j} className="text-xs space-y-1 border-l-2 border-violet-300 pl-3">
                          <div className="text-violet-700 font-semibold">
                            Você: <span className="font-normal text-foreground">{ref.prompt}</span>
                          </div>
                          <div className="text-muted-foreground">
                            → IA reescreveu em {new Date(ref.at).toLocaleString('pt-BR')}
                          </div>
                          {ref.after?.legenda && (
                            <p className="text-[11px] whitespace-pre-line bg-white/70 p-2 rounded mt-1 line-clamp-4">{ref.after.legenda}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {edited.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Pencil className="h-5 w-5" /> Edições manuais — IA aprende seu ajuste
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {edited.map((r, i) => (
                    <div key={i} className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Badge variant="outline" className="text-[10px]">{r.network}</Badge>
                        <Badge variant="outline" className="text-[10px]">{r.content_type ?? 'n/a'}</Badge>
                        <span>{r.title}</span>
                      </div>
                      {r.legenda && r.versao_editada?.legenda && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-[10px] uppercase font-semibold text-muted-foreground">Legenda IA</div>
                            <p className="text-xs whitespace-pre-line bg-muted/50 p-2 rounded">{r.legenda}</p>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-semibold text-blue-700">Versão final (sua)</div>
                            <p className="text-xs whitespace-pre-line bg-blue-100/70 p-2 rounded font-medium">{r.versao_editada.legenda}</p>
                          </div>
                        </div>
                      )}
                      {r.roteiro && r.versao_editada?.roteiro && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-[10px] uppercase font-semibold text-muted-foreground">Roteiro IA</div>
                            <p className="text-xs whitespace-pre-line bg-muted/50 p-2 rounded">{r.roteiro}</p>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-semibold text-blue-700">Versão final (sua)</div>
                            <p className="text-xs whitespace-pre-line bg-blue-100/70 p-2 rounded font-medium">{r.versao_editada.roteiro}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default MemoriaAgente;
