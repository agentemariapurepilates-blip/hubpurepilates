import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowLeft, Loader2, Inbox, CircleCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type PlanKey = '1500_3m' | '2000_3m' | '2500';
type StatusKey = 'pendente' | 'aprovada';

interface MidiaRequest {
  id: string;
  nome_franqueado: string;
  nome_unidade: string;
  data_inauguracao: string;
  plano: PlanKey;
  email_unidade: string;
  email_franqueado: string | null;
  status: StatusKey;
  created_at: string;
}

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

const MidiaAdicionalUnidades = () => {
  const { isAdmin, userType, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const podeAcessar = isAdmin || userType === 'colaborador';

  const [requests, setRequests] = useState<MidiaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('midia_adicional_requests')
        .select('id, nome_franqueado, nome_unidade, data_inauguracao, plano, email_unidade, email_franqueado, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as MidiaRequest[]) || []);
    } catch (err) {
      console.error('Erro ao carregar unidades:', err);
      toast.error('Não foi possível carregar a lista.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (podeAcessar) carregar();
  }, [podeAcessar, carregar]);

  const aprovarVerba = async (id: string) => {
    setAcaoEmAndamento(id);
    try {
      const { error } = await supabase
        .from('midia_adicional_requests')
        .update({ status: 'aprovada' })
        .eq('id', id);

      if (error) throw error;

      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'aprovada' } : r)));
      toast.success('Verba aprovada.');
    } catch (err: any) {
      console.error('Erro ao aprovar verba:', err);
      toast.error(err?.message || 'Não foi possível aprovar a verba.');
    } finally {
      setAcaoEmAndamento(null);
    }
  };

  if (!authLoading && !podeAcessar) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <h1 className="text-xl font-heading font-bold mb-2">Acesso restrito</h1>
          <p className="text-muted-foreground">
            Apenas colaboradores e admins podem acessar esta página.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>
            Voltar ao início
          </Button>
        </div>
      </MainLayout>
    );
  }

  const pendentes = requests.filter((r) => r.status === 'pendente').length;
  const aprovadas = requests.filter((r) => r.status === 'aprovada').length;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto py-6">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-heading font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Visão Geral das Unidades
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Unidades que solicitaram mídia adicional, com status atual de cada pedido.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">Unidades com mídia adicional solicitada</CardTitle>
            <CardDescription>
              {loading
                ? 'Carregando...'
                : requests.length === 0
                ? 'Nenhuma unidade solicitou mídia adicional até o momento.'
                : `${requests.length} ${requests.length === 1 ? 'solicitação' : 'solicitações'} · ${pendentes} pendente${pendentes === 1 ? '' : 's'}, ${aprovadas} aprovada${aprovadas === 1 ? '' : 's'}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <Inbox className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Nenhuma solicitação registrada.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => {
                  const statusMeta = STATUS_META[req.status];
                  const carregandoAcao = acaoEmAndamento === req.id;
                  const ehPendente = req.status === 'pendente';
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
                            Solicitada em<br className="hidden sm:inline" /> {formatarDataHora(req.created_at)}
                          </div>
                          {ehPendente && (
                            <Button
                              size="sm"
                              onClick={() => aprovarVerba(req.id)}
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
                          )}
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
    </MainLayout>
  );
};

export default MidiaAdicionalUnidades;
