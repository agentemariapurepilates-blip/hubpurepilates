import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CalendarDays, Play } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface GeneratedContent {
  id: string;
  date: string;
  title: string;
  network: 'Instagram Studios' | 'Facebook Studios' | 'Tik Tok';
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'favorite';
}

const AgentePlanejamentoEditorial = () => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [editorialGuide, setEditorialGuide] = useState('2026');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([]);
  const [resultMonth, setResultMonth] = useState<Date | null>(null);
  const [claudeEnabled, setClaudeEnabled] = useState(false);
  const [claudeToken, setClaudeToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [shareChannel, setShareChannel] = useState<'Instagram' | 'Facebook'>('Instagram');
  const isClaudeConfigured = Boolean(claudeToken.trim());

  const networkColors: Record<GeneratedContent['network'], string> = {
    'Tik Tok': 'bg-violet-500 text-white',
    'Instagram Studios': 'bg-pink-500 text-white',
    'Facebook Studios': 'bg-sky-500 text-white',
  };

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const networks = [
    'Instagram Studios',
    'Facebook Studios',
    'Tik Tok'
  ];

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
      setEditorialGuide('pdf');
    }
  };

  const handleSaveToken = () => {
    if (claudeToken.trim()) {
      setShowTokenInput(false);
      alert('Token Claude salvo localmente para esta sessão.');
    }
  };

  const formatContentDate = (day: number) => {
    const monthIndex = months.indexOf(selectedMonth);
    return new Date(Number(selectedYear), monthIndex, day).toISOString();
  };

  const handleUpdateStatus = (id: string, status: GeneratedContent['status']) => {
    setGeneratedContents((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
  };

  const handleGenerate = () => {
    if (!selectedMonth || selectedNetworks.length === 0) {
      return;
    }

    if (claudeEnabled && !isClaudeConfigured) {
      alert('Motor Claude ativado, mas o token não está configurado. Por favor forneça o token para ativar a produção real.');
      return;
    }

    const monthIndex = months.indexOf(selectedMonth);
    const baseDates = [3, 6, 9, 12, 16, 19, 22, 25, 28];

    const generated = selectedNetworks.flatMap((network, index) =>
      baseDates.slice(0, 3).map((day, offset) => ({
        id: `${network}-${day}-${offset}`,
        date: new Date(Number(selectedYear), monthIndex, Math.min(day + index * 2, 28)).toISOString(),
        network: network as GeneratedContent['network'],
        title: `${network} - Conteúdo ${offset + 1}`,
        description: `Agenda ${selectedMonth} ${selectedYear} para ${network}. Instruções: ${instructions || 'Sem instruções adicionais.'}`,
        status: 'pending' as const,
      }))
    );

    setGeneratedContents(generated);
    setResultMonth(new Date(Number(selectedYear), monthIndex, 1));
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
              <p className="font-semibold">Motor de produção de conteúdo</p>
              <p className="text-muted-foreground">Conta Claude: <span className="font-medium">agentemaria</span></p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${claudeEnabled ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-900'}`}>
                {claudeEnabled ? 'Ligado' : 'Desligado'}
              </span>
              <Button size="sm" variant={claudeEnabled ? 'secondary' : 'outline'} onClick={() => setClaudeEnabled(!claudeEnabled)}>
                {claudeEnabled ? 'Desligar' : 'Ligar'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowTokenInput(!showTokenInput)}>
                Token
              </Button>
            </div>
          </div>

          {showTokenInput && (
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Input
                type="password"
                placeholder="Insira token Claude"
                value={claudeToken}
                onChange={(e) => setClaudeToken(e.target.value)}
                className="min-w-0 flex-1"
              />
              <Button size="sm" onClick={handleSaveToken} disabled={!claudeToken.trim()}>
                Salvar token
              </Button>
            </div>
          )}

          {claudeEnabled && !isClaudeConfigured && (
            <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
              Motor Claude ativo, mas token não configurado. Envie o token para ativar a produção real.
            </div>
          )}
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
              <Label>Guia Editorial</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="guide2026"
                    name="editorialGuide"
                    title="Selecionar Guia Editorial 2026"
                    value="2026"
                    checked={editorialGuide === '2026'}
                    onChange={(e) => setEditorialGuide(e.target.value)}
                  />
                  <Label htmlFor="guide2026">Guia Editorial 2026</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="guidePdf"
                    name="editorialGuide"
                    title="Selecionar usar arquivo PDF"
                    value="pdf"
                    checked={editorialGuide === 'pdf'}
                    onChange={(e) => setEditorialGuide(e.target.value)}
                  />
                  <Label htmlFor="guidePdf">Usar arquivo PDF</Label>
                </div>
                {editorialGuide === 'pdf' && (
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
              <div className="space-y-2">
                {networks.map((network) => (
                  <div key={network} className="flex items-center space-x-2">
                    <Checkbox
                      id={network}
                      checked={selectedNetworks.includes(network)}
                      onCheckedChange={(checked) => handleNetworkChange(network, checked as boolean)}
                    />
                    <Label htmlFor={network}>{network}</Label>
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
              disabled={!selectedMonth || selectedNetworks.length === 0}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Gerar grade de conteúdo
            </Button>

            {resultMonth && generatedContents.length > 0 && (
              <div className="mt-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">Calendário de Conteúdo Gerado</h2>
                    <p className="text-sm text-muted-foreground">Visualize a grade no formato semelhante ao calendário de mídias sociais.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['Tik Tok', 'Instagram Studios', 'Facebook Studios'] as GeneratedContent['network'][]).map((network) => (
                      <span
                        key={network}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${networkColors[network]}`}
                      >
                        {network}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="bg-slate-100 px-3 py-2 text-center text-xs font-semibold uppercase text-muted-foreground">
                      {day}
                    </div>
                  ))}

                  {paddingDays.map((_, index) => (
                    <div key={`pad-${index}`} className="min-h-[100px] bg-background p-2" />
                  ))}

                  {daysInMonth.map((date) => {
                    const items = getItemsForDay(date);
                    return (
                      <div key={date.toISOString()} className="min-h-[140px] bg-background p-3 border border-border">
                        <div className="mb-2 text-sm font-semibold">{format(date, 'd')}</div>
                        <div className="space-y-2">
                          {items.length === 0 ? (
                            <div className="text-xs text-muted-foreground">Sem conteúdo</div>
                          ) : (
                            items.map((item) => (
                              <div key={item.id} className="rounded-2xl border border-border p-3 space-y-2 bg-white shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${networkColors[item.network]}`}>
                                    {item.network}
                                  </span>
                                  <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                                    {item.status === 'pending' ? 'Pendente' : item.status === 'approved' ? 'Aprovado' : item.status === 'rejected' ? 'Reprovado' : 'Favorito'}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">{item.title}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                  <Button size="xs" variant="secondary" onClick={() => handleUpdateStatus(item.id, 'approved')}>
                                    Aprovar
                                  </Button>
                                  <Button size="xs" variant="destructive" onClick={() => handleUpdateStatus(item.id, 'rejected')}>
                                    Reprovar
                                  </Button>
                                  <Button size="xs" variant="outline" onClick={() => handleUpdateStatus(item.id, 'favorite')}>
                                    Favorito
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-2xl border border-border bg-slate-50 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Ações pós-geração</h3>
                      <p className="text-sm text-muted-foreground">Exporte sua grade em PDF ou divulgue na seção Mídias Sociais.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => alert('Exportar PDF em desenvolvimento')}>
                        Exportar PDF
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => alert(`Divulgando no ${shareChannel}`)}>
                        Divulgar no {shareChannel}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-center">
                    <div className="space-y-1">
                      <Label htmlFor="shareChannel">Divulgar em</Label>
                      <Select value={shareChannel} onValueChange={(value) => setShareChannel(value as 'Instagram' | 'Facebook')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Nota: esta opção não inclui Tik Tok.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AgentePlanejamentoEditorial;