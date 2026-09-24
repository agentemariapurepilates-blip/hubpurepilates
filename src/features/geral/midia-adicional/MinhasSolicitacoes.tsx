import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox, ArrowLeft, Loader2, Plus, FileText, UserPlus } from 'lucide-react';
import { PedidosVerbaProfessores } from '@/features/geral/verba-professores/PedidosVerbaProfessores';
import {
  COLUNAS_DO_PEDIDO,
  PLAN_LABEL,
  STATUS_META,
  formatarData,
  formatarDataHora,
  type MidiaRequest,
} from './tipos';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const MinhasSolicitacoes = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<MidiaRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('midia_adicional_requests')
        .select(COLUNAS_DO_PEDIDO)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data ?? []) as unknown as MidiaRequest[]);
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
      toast.error('Não foi possível carregar suas solicitações.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { carregar(); }, [carregar]);

  if (!authLoading && !user) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <h1 className="text-xl font-heading font-bold mb-2">Acesso restrito</h1>
          <p className="text-muted-foreground">Faça login para ver suas solicitações.</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>
            Voltar ao início
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-6">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Minhas solicitações
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Histórico dos seus pedidos de Campanha Aporte Aula Experimental e Campanha Aporte Recrutamento.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button variant="outline" onClick={() => navigate('/autorizar-verba-professores')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Campanha Aporte Recrutamento
            </Button>
            <Button onClick={() => navigate('/autorizar-midia-adicional')}>
              <Plus className="h-4 w-4 mr-2" />
              Campanha Aporte Aula Experimental
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">Campanha Aporte Aula Experimental</CardTitle>
            <CardDescription>
              {loading
                ? 'Carregando...'
                : requests.length === 0
                ? 'Você ainda não fez nenhuma solicitação.'
                : `${requests.length} ${requests.length === 1 ? 'solicitação' : 'solicitações'} (mais recentes primeiro).`}
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
                <p className="text-sm text-muted-foreground mb-4">
                  Nenhuma solicitação registrada até o momento.
                </p>
                <Button onClick={() => navigate('/autorizar-midia-adicional')} variant="outline">
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
                          <p className="text-xs text-muted-foreground mt-1">
                            Contato: {req.email_unidade}
                            {req.email_franqueado ? ` · ${req.email_franqueado}` : ''}
                          </p>
                          {req.status === 'recusada' && (
                            <p className="text-sm text-destructive mt-2">
                              {req.motivo_recusa
                                ? `Motivo: ${req.motivo_recusa}`
                                : 'O pedido foi recusado. Fale com o time de marketing para entender o motivo.'}
                            </p>
                          )}
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

        <div className="mt-6">
          <PedidosVerbaProfessores modo="meus" />
        </div>
      </div>
    </MainLayout>
  );
};

export default MinhasSolicitacoes;
