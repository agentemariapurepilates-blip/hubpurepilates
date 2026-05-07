import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, Play, Loader2, Instagram, Facebook, Music2, CheckCircle2, XCircle, Star, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GeneratedContent {
  id: string;
  date: string;
  title: string;
  network: 'Instagram Studios' | 'Facebook Studios' | 'Tik Tok';
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'favorite';
}

const AgentePlanejamentoEditorial = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [useGuide2026, setUseGuide2026] = useState(true);
  const [usePdf, setUsePdf] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([]);
  const [resultMonth, setResultMonth] = useState<Date | null>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedItem, setExpandedItem] = useState<GeneratedContent | null>(null);
  const [pastPlans, setPastPlans] = useState<Array<{ month: string; year: string; total: number; approved: number }>>([]);

  const networkColors: Record<GeneratedContent['network'], string> = {
    'Tik Tok': 'bg-violet-500 text-white',
    'Instagram Studios': 'bg-pink-500 text-white',
    'Facebook Studios': 'bg-sky-500 text-white',
  };

  const networkLegendColors: Record<GeneratedContent['network'], string> = {
    'Tik Tok': 'bg-violet-500',
    'Instagram Studios': 'bg-pink-500',
    'Facebook Studios': 'bg-sky-500',
  };

  const networkIcons: Record<GeneratedContent['network'], typeof Instagram> = {
    'Tik Tok': Music2,
    'Instagram Studios': Instagram,
    'Facebook Studios': Facebook,
  };

  const statusIcons: Record<GeneratedContent['status'], typeof Clock> = {
    pending: Clock,
    approved: CheckCircle2,
    rejected: XCircle,
    favorite: Star,
  };

  const statusLabels: Record<GeneratedContent['status'], string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Reprovado',
    favorite: 'Favorito',
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weekDaysShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const networkOptions: Array<{ id: string; label: string; sends: string[] }> = [
    { id: 'instagram-facebook', label: 'Instagram + Facebook', sends: ['Instagram Studios', 'Facebook Studios'] },
    { id: 'tiktok', label: 'Tik Tok', sends: ['Tik Tok'] },
  ];

  const isOptionChecked = (option: typeof networkOptions[number]) =>
    option.sends.every((n) => selectedNetworks.includes(n));

  const handleNetworkOptionChange = (option: typeof networkOptions[number], checked: boolean) => {
    if (checked) {
      const merged = Array.from(new Set([...selectedNetworks, ...option.sends]));
      setSelectedNetworks(merged);
    } else {
      setSelectedNetworks(selectedNetworks.filter((n) => !option.sends.includes(n)));
    }
  };

  const handleNetworkChange = (network: string, checked: boolean) => {
    if (checked) {
      setSelectedNetworks([...selectedNetworks, network]);
    } else {
      setSelectedNetworks(selectedNetworks.filter(n => n !== network));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      setUsePdf(true);
    }
  };

  const formatContentDate = (day: number) => {
    const monthIndex = months.indexOf(selectedMonth);
    return new Date(Number(selectedYear), monthIndex, day).toISOString();
  };

  const handleUpdateStatus = async (id: string, status: GeneratedContent['status']) => {
    setGeneratedContents((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
    const { error } = await (supabase.from('editorial_posts' as never) as any)
      .update({ status })
      .eq('id', id);
    if (error) {
      console.error('Erro ao salvar status:', error);
      toast.error('Não foi possível salvar a alteração.');
    }
  };

  const handleApproveAll = async () => {
    if (!user) return;
    const pendingIds = generatedContents.filter((c) => c.status === 'pending').map((c) => c.id);
    if (pendingIds.length === 0) {
      toast.info('Não há postagens pendentes.');
      return;
    }

    setGeneratedContents((current) =>
      current.map((item) =>
        item.status === 'pending' ? { ...item, status: 'approved' } : item,
      ),
    );

    const { error } = await (supabase.from('editorial_posts' as never) as any)
      .update({ status: 'approved' })
      .in('id', pendingIds);

    if (error) {
      console.error('Erro ao aprovar tudo:', error);
      toast.error('Falha ao salvar aprovação em massa.');
    } else {
      toast.success(`${pendingIds.length} postagens aprovadas.`);
    }
  };

  const loadPostsForMonth = async (month: string, year: string) => {
    if (!user || !month || !year) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('editorial_posts' as never) as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
        .order('post_date', { ascending: true });

      if (error) throw error;

      const posts = (data ?? []) as Array<{
        id: string;
        post_date: string;
        network: string;
        title: string;
        description: string;
        status: GeneratedContent['status'];
      }>;

      if (posts.length > 0) {
        const monthIndex = months.indexOf(month);
        setGeneratedContents(
          posts.map((p) => ({
            id: p.id,
            date: p.post_date,
            network: p.network as GeneratedContent['network'],
            title: p.title,
            description: p.description,
            status: p.status,
          })),
        );
        setResultMonth(new Date(Number(year), monthIndex, 1));
      } else {
        setGeneratedContents([]);
        setResultMonth(null);
      }
    } catch (err) {
      console.error('Erro ao carregar posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPastPlans = async () => {
    if (!user) return;
    const { data, error } = await (supabase.from('editorial_posts' as never) as any)
      .select('month, year, status')
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao listar planos:', error);
      return;
    }

    const rows = (data ?? []) as Array<{ month: string; year: string; status: string }>;
    const grouped = new Map<string, { month: string; year: string; total: number; approved: number }>();
    rows.forEach((r) => {
      const key = `${r.year}-${r.month}`;
      const existing = grouped.get(key) ?? { month: r.month, year: r.year, total: 0, approved: 0 };
      existing.total += 1;
      if (r.status === 'approved') existing.approved += 1;
      grouped.set(key, existing);
    });

    const ordered = Array.from(grouped.values()).sort((a, b) => {
      if (a.year !== b.year) return Number(b.year) - Number(a.year);
      return months.indexOf(b.month) - months.indexOf(a.month);
    });
    setPastPlans(ordered);
  };

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      loadPostsForMonth(selectedMonth, selectedYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, user?.id]);

  useEffect(() => {
    loadPastPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, generatedContents.length]);

  const generateMockContent = (): GeneratedContent[] => {
    const monthIndex = months.indexOf(selectedMonth);
    const baseDates = [3, 6, 9, 12, 16, 19, 22, 25, 28];
    return selectedNetworks.flatMap((network, index) =>
      baseDates.slice(0, 3).map((day, offset) => ({
        id: `${network}-${day}-${offset}`,
        date: new Date(Number(selectedYear), monthIndex, Math.min(day + index * 2, 28)).toISOString(),
        network: network as GeneratedContent['network'],
        title: `${network} - Conteúdo ${offset + 1}`,
        description: `Agenda ${selectedMonth} ${selectedYear} para ${network}. Instruções: ${instructions || 'Sem instruções adicionais.'}`,
        status: 'pending' as const,
      })),
    );
  };

  const persistPosts = async (posts: GeneratedContent[]) => {
    if (!user) return [];
    // Apaga posts existentes do mês/ano antes de inserir os novos
    await (supabase.from('editorial_posts' as never) as any)
      .delete()
      .eq('user_id', user.id)
      .eq('month', selectedMonth)
      .eq('year', selectedYear);

    const rows = posts.map((p) => ({
      user_id: user.id,
      month: selectedMonth,
      year: selectedYear,
      post_date: p.date,
      network: p.network,
      title: p.title,
      description: p.description,
      status: p.status,
    }));

    const { data, error } = await (supabase.from('editorial_posts' as never) as any)
      .insert(rows)
      .select('*');

    if (error) {
      console.error('Erro ao salvar plano:', error);
      toast.error('Plano gerado mas falhou ao salvar.');
      return posts;
    }

    return ((data ?? []) as Array<{ id: string; post_date: string; network: string; title: string; description: string; status: GeneratedContent['status'] }>).map((row) => ({
      id: row.id,
      date: row.post_date,
      network: row.network as GeneratedContent['network'],
      title: row.title,
      description: row.description,
      status: row.status,
    }));
  };

  const handleGenerate = async () => {
    if (!selectedMonth || selectedNetworks.length === 0) {
      toast.error('Selecione o mês e ao menos uma rede.');
      return;
    }

    const monthIndex = months.indexOf(selectedMonth);
    const guides: string[] = [];
    if (useGuide2026) guides.push('Guia Editorial 2026');
    if (usePdf && uploadedFile) guides.push(`PDF: ${uploadedFile.name}`);

    if (!aiEnabled) {
      const mock = generateMockContent();
      const saved = await persistPosts(mock);
      setGeneratedContents(saved);
      setResultMonth(new Date(Number(selectedYear), monthIndex, 1));
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-editorial-plan', {
        body: {
          month: selectedMonth,
          year: selectedYear,
          networks: selectedNetworks,
          instructions: instructions || undefined,
          editorialGuide: guides.join(' + '),
        },
      });

      if (error) throw error;

      const posts = (data?.posts ?? []) as Array<{ date: string; network: string; title: string; description: string }>;
      if (!posts.length) {
        throw new Error('Nenhum conteúdo retornado.');
      }

      const generated: GeneratedContent[] = posts.map((p, idx) => ({
        id: `${p.network}-${idx}`,
        date: p.date,
        network: p.network as GeneratedContent['network'],
        title: p.title,
        description: p.description,
        status: 'pending',
      }));

      const saved = await persistPosts(generated);
      setGeneratedContents(saved);
      setResultMonth(new Date(Number(selectedYear), monthIndex, 1));
      toast.success(`${posts.length} postagens geradas e salvas.`);
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível gerar pela IA. Usando exemplo.');
      const mock = generateMockContent();
      const saved = await persistPosts(mock);
      setGeneratedContents(saved);
      setResultMonth(new Date(Number(selectedYear), monthIndex, 1));
    } finally {
      setGenerating(false);
    }
  };

  const monthStart = resultMonth ? startOfMonth(resultMonth) : null;
  const monthEnd = resultMonth ? endOfMonth(resultMonth) : null;
  const daysInMonth = monthStart && monthEnd ? eachDayOfInterval({ start: monthStart, end: monthEnd }) : [];
  const startDayOfWeek = monthStart ? monthStart.getDay() : 0;
  const paddingDays = Array.from({ length: startDayOfWeek }, () => null);

  const getItemsForDay = (date: Date) =>
    generatedContents.filter((item) => isSameDay(date, new Date(item.date)));

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <CalendarDays className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Agente Planejamento Editorial</h1>
            <p className="text-muted-foreground">Configure os calendários para todas as redes sociais</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-slate-50 p-4 mb-6 text-sm text-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold">Motor de IA para geração de conteúdo</p>
              <p className="text-muted-foreground">
                {aiEnabled
                  ? 'A IA vai gerar um plano editorial real para o mês selecionado.'
                  : 'Modo demonstração — conteúdos de exemplo, sem custo de IA.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${aiEnabled ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-900'}`}>
                {aiEnabled ? 'IA Ativa' : 'Modo Demo'}
              </span>
              <Button size="sm" variant={aiEnabled ? 'secondary' : 'outline'} onClick={() => setAiEnabled(!aiEnabled)}>
                {aiEnabled ? 'Desligar IA' : 'Ligar IA'}
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuração do Calendário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selecionar Mês - Ano */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Mês</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Ano</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selecionar Guia Editorial */}
            <div className="space-y-4">
              <Label>Guia Editorial (pode marcar os dois)</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="guide2026"
                    checked={useGuide2026}
                    onCheckedChange={(checked) => setUseGuide2026(checked === true)}
                  />
                  <Label htmlFor="guide2026" className="cursor-pointer">Guia Editorial 2026</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="guidePdf"
                    checked={usePdf}
                    onCheckedChange={(checked) => setUsePdf(checked === true)}
                  />
                  <Label htmlFor="guidePdf" className="cursor-pointer">Usar arquivo PDF</Label>
                </div>
                {usePdf && (
                  <div className="ml-6">
                    <Input
                      type="file"
                      accept=".pdf"
                      title="Upload do arquivo PDF do guia editorial"
                      onChange={handleFileUpload}
                      className="max-w-sm"
                    />
                    {uploadedFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Arquivo selecionado: {uploadedFile.name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selecionar redes sociais */}
            <div className="space-y-4">
              <Label>Redes Sociais</Label>
              <p className="text-xs text-muted-foreground -mt-2">
                Instagram e Facebook compartilham o mesmo conteúdo. Tik Tok tem conteúdo próprio (3x/semana).
              </p>
              <div className="space-y-2">
                {networkOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={isOptionChecked(option)}
                      onCheckedChange={(checked) => handleNetworkOptionChange(option, checked as boolean)}
                    />
                    <Label htmlFor={option.id} className="cursor-pointer">{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Campo de Instruções específicas */}
            <div className="space-y-2">
              <Label htmlFor="instructions">Instruções Específicas</Label>
              <Textarea
                id="instructions"
                placeholder="Digite instruções específicas para aperfeiçoamento do agente (máximo 400 caracteres)"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value.slice(0, 400))}
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                {instructions.length}/400 caracteres
              </p>
            </div>

            {/* Botão para inicio da atividade */}
            <Button
              onClick={handleGenerate}
              disabled={!selectedMonth || selectedNetworks.length === 0 || generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando com IA...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Gerar grade de conteúdo
                </>
              )}
            </Button>

            {resultMonth && generatedContents.length > 0 && (
              <div className="mt-8 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold capitalize">
                      {format(resultMonth, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {generatedContents.length} postagens · {generatedContents.filter((c) => c.status === 'approved').length} aprovadas · {generatedContents.filter((c) => c.status === 'pending').length} pendentes
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleApproveAll}
                    disabled={!generatedContents.some((c) => c.status === 'pending')}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aprovar tudo
                  </Button>
                </div>

                {/* Legenda das redes */}
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {(Object.keys(networkLegendColors) as GeneratedContent['network'][]).map((network) => {
                    const Icon = networkIcons[network];
                    return (
                      <div key={network} className="flex items-center gap-1.5">
                        <span className={cn('w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center', networkLegendColors[network])}>
                          <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                        </span>
                        <span className="text-xs sm:text-sm text-muted-foreground">{network}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="grid grid-cols-7 border-b border-border">
                    {weekDays.map((day, index) => (
                      <div key={day} className="p-1.5 sm:p-3 text-center text-xs sm:text-sm font-medium text-muted-foreground bg-muted/20">
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{weekDaysShort[index]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7">
                    {paddingDays.map((_, index) => (
                      <div key={`pad-${index}`} className="min-h-16 sm:min-h-24 md:min-h-28 p-1 sm:p-2 border-b border-r border-border bg-muted/10" />
                    ))}

                    {daysInMonth.map((day) => {
                      const items = getItemsForDay(day);
                      const hasContent = items.length > 0;
                      const isDayToday = isToday(day);

                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            'min-h-16 sm:min-h-24 md:min-h-28 p-1 sm:p-2 border-b border-r border-border transition-colors',
                            !isSameMonth(day, resultMonth) && 'bg-muted/20 text-muted-foreground',
                            isDayToday && 'bg-primary/5',
                          )}
                        >
                          <div className={cn('text-xs sm:text-sm font-medium mb-0.5 sm:mb-1', isDayToday && 'text-primary font-bold')}>
                            {format(day, 'd')}
                          </div>
                          {hasContent && (
                            <div className="space-y-0.5 sm:space-y-1">
                              {items.map((item) => {
                                const NetworkIcon = networkIcons[item.network];
                                const StatusIcon = statusIcons[item.status];
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setExpandedItem(item)}
                                    title={`${item.title} — ${statusLabels[item.status]}`}
                                    className={cn(
                                      'w-full text-[10px] sm:text-xs p-1 sm:p-1.5 rounded font-medium flex items-center gap-0.5 sm:gap-1 cursor-pointer hover:opacity-80 transition-opacity text-left',
                                      networkColors[item.network],
                                      item.status === 'rejected' && 'opacity-50 line-through',
                                    )}
                                  >
                                    <NetworkIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                    <span className="truncate hidden sm:inline flex-1">{item.title}</span>
                                    {item.status !== 'pending' && (
                                      <StatusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0 opacity-90" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {pastPlans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Planos Editoriais Salvos</CardTitle>
              <p className="text-sm text-muted-foreground">Clique num plano pra carregar e visualizar.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pastPlans.map((plan) => {
                  const isCurrent = plan.month === selectedMonth && plan.year === selectedYear;
                  return (
                    <button
                      key={`${plan.year}-${plan.month}`}
                      type="button"
                      onClick={() => {
                        setSelectedMonth(plan.month);
                        setSelectedYear(plan.year);
                      }}
                      className={`text-left rounded-2xl border p-4 transition hover:shadow-md ${
                        isCurrent
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{plan.month} {plan.year}</h3>
                        {isCurrent && (
                          <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Atual</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>{plan.total} postagens</div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                          {plan.approved} aprovadas
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                          {plan.total - plan.approved} restantes
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!expandedItem} onOpenChange={(open) => !open && setExpandedItem(null)}>
        <DialogContent className="max-w-lg">
          {expandedItem && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${networkColors[expandedItem.network]}`}>
                    {expandedItem.network}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(expandedItem.date), "dd/MM/yyyy")}
                  </span>
                </div>
                <DialogTitle className="text-left mt-3">{expandedItem.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Briefing</Label>
                  <p className="text-sm mt-1 whitespace-pre-line">{expandedItem.description}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status atual</Label>
                  <p className="text-sm font-medium mt-1">
                    {expandedItem.status === 'pending' ? 'Pendente' : expandedItem.status === 'approved' ? 'Aprovado' : expandedItem.status === 'rejected' ? 'Reprovado' : 'Favorito'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button size="sm" variant="secondary" onClick={() => { handleUpdateStatus(expandedItem.id, 'approved'); setExpandedItem(null); }}>
                    Aprovar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => { handleUpdateStatus(expandedItem.id, 'rejected'); setExpandedItem(null); }}>
                    Reprovar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { handleUpdateStatus(expandedItem.id, 'favorite'); setExpandedItem(null); }}>
                    Favorito
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default AgentePlanejamentoEditorial;