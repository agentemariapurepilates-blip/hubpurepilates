import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { selectMonthPosts } from '@/components/agente/services/postsRepository';
import {
  GeneratedContent,
  MONTHS,
  contentTypeBadgeColor,
  contentTypeLabel,
} from '@/components/agente/types';
import { Button } from '@/components/ui/button';
import {
  Table2,
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Layers,
  Square,
  Palette,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Parser: "Slide 1: foo\nSlide 2: bar" => [{index:1,text:'foo'},{index:2,text:'bar'}]
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

// Edição persistida (versao_editada) tem prioridade sobre o gerado.
const getEffectiveField = (
  post: GeneratedContent,
  field: 'texto_arte' | 'legenda',
): string => {
  return post.versao_editada?.[field] ?? post[field] ?? '';
};

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

const PlanilhaEditorial = () => {
  const { user } = useAuth();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState<string>(String(now.getFullYear()));
  const [posts, setPosts] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    selectMonthPosts(supabase, user.id, selectedMonth, selectedYear, ['Instagram Studios'])
      .then(setPosts)
      .catch((err) => {
        console.error('Erro ao carregar posts:', err);
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, [user, selectedMonth, selectedYear]);

  const approvedPosts = useMemo(
    () => posts.filter((p) => p.status === 'approved'),
    [posts],
  );

  const yearOptions = useMemo(() => {
    const y = now.getFullYear();
    return [String(y - 1), String(y), String(y + 1)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carrosselCount = approvedPosts.filter((p) => p.content_type === 'carrossel').length;
  const estaticoVideoCount = approvedPosts.length - carrosselCount;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Volta pro Agente */}
        <Link
          to="/agente-instagram-facebook"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar pro Agente Instagram
        </Link>

        {/* Header + Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Table2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Planilha Editorial</h1>
              <p className="text-sm text-muted-foreground">
                Posts aprovados do Instagram, organizados pra alimentar o próximo agente de layout.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        {!loading && approvedPosts.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Aprovados
              </p>
              <p className="text-2xl font-heading font-bold mt-1 text-foreground">
                {approvedPosts.length}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-1.5 text-sky-700">
                <Layers className="h-3 w-3" />
                <p className="text-[10px] uppercase tracking-widest font-bold">Carrossel</p>
              </div>
              <p className="text-2xl font-heading font-bold mt-1 text-foreground">
                {carrosselCount}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-1.5 text-amber-700">
                <Square className="h-3 w-3" />
                <p className="text-[10px] uppercase tracking-widest font-bold">Estático/Vídeo</p>
              </div>
              <p className="text-2xl font-heading font-bold mt-1 text-foreground">
                {estaticoVideoCount}
              </p>
            </Card>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Vazio */}
        {!loading && approvedPosts.length === 0 && (
          <Card className="p-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="font-heading font-bold text-base mb-1">
              Nenhum post aprovado em {selectedMonth} {selectedYear}
            </p>
            <p className="text-sm text-muted-foreground">
              Aprove posts no{' '}
              <Link to="/agente-instagram-facebook" className="text-primary underline">
                Agente Instagram
              </Link>{' '}
              para vê-los aqui. Você também pode trocar o mês acima.
            </p>
          </Card>
        )}

        {/* Lista de posts */}
        {!loading && approvedPosts.length > 0 && (
          <div className="space-y-4">
            {approvedPosts.map((post) => {
              const slides =
                post.content_type === 'carrossel' ? parseSlides(post.texto_arte) : [];
              const isCarrossel = post.content_type === 'carrossel' && slides.length > 0;
              const legenda = getEffectiveField(post, 'legenda');
              const textoArte = getEffectiveField(post, 'texto_arte');

              return (
                <Card key={post.id} className="overflow-hidden">
                  {/* Header do post */}
                  <div className="bg-muted/40 border-b px-4 py-3 flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {formatPostDate(post.date)}
                    </span>
                    <span className="font-bold text-base text-foreground flex-1 min-w-0 truncate">
                      {post.title}
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
                    <Link to={`/agente-design/criacao-layout?postId=${post.id}`}>
                      <Button size="sm" variant="default" className="gap-1.5 shrink-0">
                        <Palette className="h-4 w-4" />
                        Subir para layout
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>

                  {/* Planilha */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-card border-b">
                          {isCarrossel ? (
                            <>
                              {slides.map((s) => (
                                <th
                                  key={s.index}
                                  className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-primary font-bold border-r border-foreground/10 last:border-r-0 min-w-[180px]"
                                >
                                  Texto arte {s.index}
                                </th>
                              ))}
                              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-primary font-bold min-w-[220px]">
                                Legenda
                              </th>
                            </>
                          ) : (
                            <>
                              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-primary font-bold border-r border-foreground/10 w-1/2 min-w-[220px]">
                                Texto na arte
                              </th>
                              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-primary font-bold w-1/2 min-w-[220px]">
                                Legenda
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="align-top">
                          {isCarrossel ? (
                            <>
                              {slides.map((s) => (
                                <td
                                  key={s.index}
                                  data-post-id={post.id}
                                  data-field="texto_arte"
                                  data-slide-index={s.index}
                                  className="px-4 py-3 text-foreground/85 leading-relaxed whitespace-pre-wrap border-r border-foreground/10 last:border-r-0 align-top"
                                >
                                  {s.text || <span className="italic text-muted-foreground/60">—</span>}
                                </td>
                              ))}
                              <td
                                data-post-id={post.id}
                                data-field="legenda"
                                className="px-4 py-3 text-foreground/85 leading-relaxed whitespace-pre-wrap align-top"
                              >
                                {legenda || <span className="italic text-muted-foreground/60">—</span>}
                              </td>
                            </>
                          ) : (
                            <>
                              <td
                                data-post-id={post.id}
                                data-field="texto_arte"
                                className="px-4 py-3 text-foreground/85 leading-relaxed whitespace-pre-wrap border-r border-foreground/10 align-top"
                              >
                                {textoArte || <span className="italic text-muted-foreground/60">—</span>}
                              </td>
                              <td
                                data-post-id={post.id}
                                data-field="legenda"
                                className="px-4 py-3 text-foreground/85 leading-relaxed whitespace-pre-wrap align-top"
                              >
                                {legenda || <span className="italic text-muted-foreground/60">—</span>}
                              </td>
                            </>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Rodapé com hint do próximo passo */}
        {!loading && approvedPosts.length > 0 && (
          <Card className="p-4 bg-muted/30 border-dashed">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Próximo passo:</strong> a edição inline e o
              export pra entrar no agente de criação de layout vêm no M2/M4 do plano.
            </p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default PlanilhaEditorial;
