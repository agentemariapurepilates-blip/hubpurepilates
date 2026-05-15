import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import {
  Megaphone, ArrowLeft, AlertTriangle, Check, Plus, Inbox, Loader2, CircleCheck,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type PlanKey = '1500_3m' | '2000_3m' | '2500';
type StatusKey = 'pendente' | 'aprovada';
type ViewMode = 'list' | 'form' | 'success';

interface PlanOption {
  key: PlanKey;
  valor: string;
  titulo: string;
  descricao: string;
}

interface MidiaRequest {
  id: string;
  user_id: string;
  nome_franqueado: string;
  nome_unidade: string;
  data_inauguracao: string;
  plano: PlanKey;
  email_unidade: string;
  email_franqueado: string | null;
  status: StatusKey;
  created_at: string;
  updated_at: string;
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    key: '1500_3m',
    valor: 'R$ 1.500,00',
    titulo: 'Plano A',
    descricao: '3 meses de campanha de aula experimental.',
  },
  {
    key: '2000_3m',
    valor: 'R$ 2.000,00',
    titulo: 'Plano B',
    descricao: '3 meses de campanha de aula experimental.',
  },
  {
    key: '2500',
    valor: 'R$ 2.500,00',
    titulo: 'Plano C',
    descricao: 'Campanha de aula experimental.',
  },
];

const PLAN_LABEL: Record<PlanKey, string> = {
  '1500_3m': 'Plano A · R$ 1.500,00',
  '2000_3m': 'Plano B · R$ 2.000,00',
  '2500':    'Plano C · R$ 2.500,00',
};

const STATUS_META: Record<StatusKey, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  aprovada: { label: 'Verba adicional aprovada', className: 'bg-green-100 text-green-800 border-green-200' },
};

const formatarData = (dataIso: string) =>
  new Date(dataIso + 'T00:00:00').toLocaleDateString('pt-BR');

const formatarDataHora = (timestamp: string) =>
  new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ============================================================================
// Visao do Franqueado: lista propria + form
// ============================================================================
const FranqueadoView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<ViewMode>('list');
  const [requests, setRequests] = useState<MidiaRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [nomeFranqueado, setNomeFranqueado] = useState('');
  const [nomeUnidade, setNomeUnidade] = useState('');
  const [dataInauguracao, setDataInauguracao] = useState('');
  const [plano, setPlano] = useState<PlanKey | ''>('');
  const [emailUnidade, setEmailUnidade] = useState('');
  const [emailFranqueado, setEmailFranqueado] = useState('');
  const [aceitouRegras, setAceitouRegras] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const carregarSolicitacoes = useCallback(async () => {
    if (!user) return;
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('midia_adicional_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRequests((data as MidiaRequest[]) || []);
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
      toast.error('Não foi possível carregar suas solicitações.');
    } finally {
      setLoadingRequests(false);
    }
  }, [user]);

  useEffect(() => { carregarSolicitacoes(); }, [carregarSolicitacoes]);

  const limparFormulario = () => {
    setNomeFranqueado('');
    setNomeUnidade('');
    setDataInauguracao('');
    setPlano('');
    setEmailUnidade('');
    setEmailFranqueado('');
    setAceitouRegras(false);
  };

  const camposObrigatoriosPreenchidos =
    nomeFranqueado.trim() &&
    nomeUnidade.trim() &&
    dataInauguracao &&
    plano &&
    emailUnidade.trim() &&
    aceitouRegras;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camposObrigatoriosPreenchidos || !user || submitting) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-midia-adicional', {
        body: {
          nome_franqueado: nomeFranqueado.trim(),
          nome_unidade: nomeUnidade.trim(),
          data_inauguracao: dataInauguracao,
          plano,
          email_unidade: emailUnidade.trim(),
          email_franqueado: emailFranqueado.trim() || null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Solicitação enviada com sucesso!');
      limparFormulario();
      setView('success');
      carregarSolicitacoes();
    } catch (err: any) {
      console.error('Erro ao enviar solicitação:', err);
      toast.error(err?.message || 'Não foi possível enviar a solicitação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (view === 'success') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-heading font-bold mb-2">Solicitação enviada</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Sua solicitação de mídia adicional foi registrada. O time de marketing entrará em contato pelos e-mails informados.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setView('list')}>
                Ver minhas solicitações
              </Button>
              <Button onClick={() => setView('form')}>
                Nova solicitação
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className="max-w-3xl mx-auto py-6">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => setView('list')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-heading font-bold flex items-center gap-2">
            <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Nova solicitação de Mídia adicional
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Preencha os dados abaixo para solicitar autorização de investimento adicional em campanha de aula experimental para sua unidade.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Dados da unidade</CardTitle>
              <CardDescription>Quem está solicitando e qual unidade será beneficiada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome-franqueado">Nome do franqueado *</Label>
                <Input id="nome-franqueado" value={nomeFranqueado}
                  onChange={(e) => setNomeFranqueado(e.target.value)}
                  placeholder="Nome completo" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome-unidade">Nome da unidade Pure Pilates *</Label>
                <Input id="nome-unidade" value={nomeUnidade}
                  onChange={(e) => setNomeUnidade(e.target.value)}
                  placeholder="Ex.: Pure Pilates Vila Olímpia" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-inauguracao">Data de inauguração *</Label>
                <Input id="data-inauguracao" type="date" value={dataInauguracao}
                  onChange={(e) => setDataInauguracao(e.target.value)} required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Plano de investimento *</CardTitle>
              <CardDescription>Selecione uma das opções abaixo.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={plano} onValueChange={(v) => setPlano(v as PlanKey)}>
                <div className="space-y-3">
                  {PLAN_OPTIONS.map((opt) => (
                    <label key={opt.key} htmlFor={`plano-${opt.key}`}
                      className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all hover:border-primary/50 ${
                        plano === opt.key ? 'border-primary bg-primary/5' : 'border-foreground/10'
                      }`}>
                      <RadioGroupItem value={opt.key} id={`plano-${opt.key}`} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-heading font-bold text-base">{opt.titulo}</span>
                          <span className="text-primary font-semibold">{opt.valor}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{opt.descricao}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Contatos para retorno</CardTitle>
              <CardDescription>O time de marketing entrará em contato pelos e-mails abaixo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-unidade">E-mail da unidade *</Label>
                <Input id="email-unidade" type="email" value={emailUnidade}
                  onChange={(e) => setEmailUnidade(e.target.value)}
                  placeholder="unidade@purepilates.com.br" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-franqueado">
                  E-mail do franqueado <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input id="email-franqueado" type="email" value={emailFranqueado}
                  onChange={(e) => setEmailFranqueado(e.target.value)}
                  placeholder="franqueado@exemplo.com" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-300/40 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Regras de faturamento e aplicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-foreground/80 leading-relaxed space-y-2">
                <p>
                  <strong>[Texto placeholder]</strong> Substitua este bloco pelo texto definitivo das regras de
                  faturamento e aplicação da campanha de mídia adicional.
                </p>
                <p>
                  O valor solicitado será faturado pela unidade conforme as regras vigentes. A campanha será
                  veiculada pelo time central de marketing, após análise e aprovação da solicitação.
                  Os prazos, formatos e canais de veiculação seguem as diretrizes da Pure Pilates para o período
                  selecionado.
                </p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={aceitouRegras}
                  onChange={(e) => setAceitouRegras(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-foreground/30 text-primary focus:ring-primary"
                  required />
                <span className="text-sm text-foreground/85 leading-relaxed">
                  Li e concordo com as regras de faturamento e aplicação descritas acima.
                </span>
              </label>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setView('list')}>Cancelar</Button>
            <Button type="submit"
              disabled={!camposObrigatoriosPreenchidos || submitting}
              className="min-w-[160px]">
              {submitting ? 'Enviando...' : 'Enviar solicitação'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate('/')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold flex items-center gap-2">
            <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Autorizar Mídia adicional
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Histórico das suas solicitações de investimento adicional em campanha.
          </p>
        </div>
        <Button onClick={() => setView('form')} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Nova solicitação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Minhas solicitações</CardTitle>
          <CardDescription>
            {loadingRequests
              ? 'Carregando...'
              : requests.length === 0
              ? 'Você ainda não fez nenhuma solicitação.'
              : `${requests.length} ${requests.length === 1 ? 'solicitação' : 'solicitações'} (mais recentes primeiro).`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Nenhuma solicitação registrada até o momento.
              </p>
              <Button onClick={() => setView('form')} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira solicitação
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const statusMeta = STATUS_META[req.status];
                return (
                  <div key={req.id}
                    className="rounded-lg border border-foreground/10 p-4 hover:border-foreground/20 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-heading font-semibold text-base truncate">
                            {req.nome_unidade}
                          </h3>
                          <Badge variant="outline" className={statusMeta.className}>
                            {statusMeta.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {req.nome_franqueado} · Inauguração em {formatarData(req.data_inauguracao)}
                        </p>
                        <p className="text-sm text-primary font-medium mt-1">
                          {PLAN_LABEL[req.plano]}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground sm:text-right shrink-0">
                        Enviada em<br className="hidden sm:inline" /> {formatarDataHora(req.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// Visao do Colaborador/Admin: lista geral + aprovar
// ============================================================================
const ColaboradorView = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MidiaRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('midia_adicional_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as MidiaRequest[]) || []);
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
      toast.error('Não foi possível carregar as solicitações.');
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const alterarStatus = async (id: string, novoStatus: StatusKey) => {
    setAcaoEmAndamento(id);
    try {
      const { error } = await supabase
        .from('midia_adicional_requests')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;

      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: novoStatus } : r));
      toast.success(novoStatus === 'aprovada' ? 'Verba aprovada.' : 'Solicitação voltou para pendente.');
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      toast.error(err?.message || 'Não foi possível atualizar o status.');
    } finally {
      setAcaoEmAndamento(null);
    }
  };

  const pendentes = requests.filter((r) => r.status === 'pendente');

  const renderCard = (req: MidiaRequest, _acao: 'aprovar') => {
    const statusMeta = STATUS_META[req.status];
    const carregandoAcao = acaoEmAndamento === req.id;

    return (
      <div key={req.id}
        className="rounded-lg border border-foreground/10 p-4 hover:border-foreground/20 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-heading font-semibold text-base truncate">
                {req.nome_unidade}
              </h3>
              <Badge variant="outline" className={statusMeta.className}>
                {statusMeta.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {req.nome_franqueado} · Inauguração em {formatarData(req.data_inauguracao)}
            </p>
            <p className="text-sm text-primary font-medium mt-1">
              {PLAN_LABEL[req.plano]}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Contato: {req.email_unidade}
              {req.email_franqueado ? ` · ${req.email_franqueado}` : ''}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-xs text-muted-foreground sm:text-right">
              Enviada em<br className="hidden sm:inline" /> {formatarDataHora(req.created_at)}
            </div>
            <Button
              size="sm"
              onClick={() => alterarStatus(req.id, 'aprovada')}
              disabled={carregandoAcao}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {carregandoAcao ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CircleCheck className="h-4 w-4 mr-2" />
              )}
              Aprovar verba
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate('/')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-heading font-bold flex items-center gap-2">
          <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Mídia adicional - Aprovações
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Solicitações de franqueados aguardando aprovação. Para ver todas as unidades com mídia adicional,
          acesse <strong>Visão Geral das Unidades</strong>.
        </p>
      </div>

      {loadingRequests ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
              Solicitações pendentes ({pendentes.length})
            </CardTitle>
            <CardDescription>
              Pedidos aguardando aprovação. Clique em "Aprovar verba" para liberar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendentes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhuma solicitação pendente no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {pendentes.map((r) => renderCard(r, 'aprovar'))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// Roteamento por tipo de usuario
// ============================================================================
const AutorizarMidiaAdicional = () => {
  const { isAdmin, userType, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isFranqueado = userType === 'franqueado';
  const isManageView = isAdmin || userType === 'colaborador';
  const podeAcessar = isFranqueado || isManageView;

  if (!authLoading && !podeAcessar) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <h1 className="text-xl font-heading font-bold mb-2">Acesso restrito</h1>
          <p className="text-muted-foreground">
            Apenas franqueados, colaboradores e admins podem acessar esta página.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>
            Voltar ao início
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {isManageView ? <ColaboradorView /> : <FranqueadoView />}
    </MainLayout>
  );
};

export default AutorizarMidiaAdicional;
