import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Inbox, CircleCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatarData, formatarReais, rotuloDeProfessores } from '../../../../supabase/functions/send-verba-professores/pedido';

// Lista de pedidos de verba para novos professores, em dois modos:
// Mesmo cartão das listas da Mídia Adicional; no lugar do plano, verba + professores.
// - 'meus'  → Minha Área > Minhas solicitações (só os do usuário, só leitura)
// - 'todos' → Visão Geral das Unidades (colaborador/admin, com "Aprovar verba")
// A RLS de verba_professores_requests é quem garante quem vê o quê; o filtro
// por user_id no modo 'meus' só evita que um colaborador veja ali os pedidos
// dos outros misturados com os dele.

type StatusKey = 'pendente' | 'aprovada';

interface PedidoVerba {
  id: string;
  nome_franqueado: string;
  nome_unidade: string;
  data_inauguracao: string;
  valor_verba: number;
  qtd_professores: number;
  email_unidade: string;
  email_franqueado: string | null;
  status: StatusKey;
  created_at: string;
}

const STATUS_META: Record<StatusKey, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  aprovada: { label: 'Verba adicional aprovada', className: 'bg-green-100 text-green-800 border-green-200' },
};

const formatarDataHora = (timestamp: string) =>
  new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });


interface Props {
  modo: 'meus' | 'todos';
}

export function PedidosVerbaProfessores({ modo }: Props) {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoVerba[]>([]);
  const [loading, setLoading] = useState(true);
  const [aprovando, setAprovando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (modo === 'meus' && !user) return;
    setLoading(true);
    try {
      let consulta = supabase
        .from('verba_professores_requests' as never)
        .select('id, nome_franqueado, nome_unidade, data_inauguracao, valor_verba, qtd_professores, email_unidade, email_franqueado, status, created_at')
        .order('created_at', { ascending: false });
      if (modo === 'meus') consulta = consulta.eq('user_id', user!.id);

      const { data, error } = await consulta;
      if (error) throw error;
      setPedidos((data ?? []) as unknown as PedidoVerba[]);
    } catch (err) {
      console.error('Erro ao carregar pedidos de verba para professores:', err);
      toast.error('Não foi possível carregar os pedidos de verba para professores.');
    } finally {
      setLoading(false);
    }
  }, [modo, user]);

  useEffect(() => { carregar(); }, [carregar]);

  const aprovarVerba = async (id: string) => {
    setAprovando(id);
    try {
      // .select() para confirmar que a linha mudou: UPDATE barrado pela RLS não
      // dá erro, só atualiza zero linhas — e a tela diria "aprovada" à toa.
      const { data, error } = await supabase
        .from('verba_professores_requests' as never)
        .update({ status: 'aprovada' } as never)
        .eq('id', id)
        .select('id');

      if (error) throw error;
      if (!data?.length) throw new Error('Você não tem permissão para aprovar este pedido.');

      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'aprovada' } : p)));
      toast.success('Verba aprovada.');
    } catch (err) {
      console.error('Erro ao aprovar verba para professores:', err);
      toast.error(err instanceof Error && err.message ? err.message : 'Não foi possível aprovar a verba.');
    } finally {
      setAprovando(null);
    }
  };

  const pendentes = pedidos.filter((p) => p.status === 'pendente').length;
  const aprovadas = pedidos.length - pendentes;

  const descricao = loading
    ? 'Carregando...'
    : pedidos.length === 0
      ? (modo === 'meus' ? 'Você ainda não pediu verba para novos professores.' : 'Nenhuma unidade pediu verba para novos professores até o momento.')
      : modo === 'meus'
        ? `${pedidos.length} ${pedidos.length === 1 ? 'solicitação' : 'solicitações'} (mais recentes primeiro).`
        : `${pedidos.length} ${pedidos.length === 1 ? 'solicitação' : 'solicitações'} · ${pendentes} pendente${pendentes === 1 ? '' : 's'}, ${aprovadas} aprovada${aprovadas === 1 ? '' : 's'}.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-heading">
          {modo === 'meus' ? 'Verba para novos professores' : 'Unidades com verba para novos professores solicitada'}
        </CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma solicitação registrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map((p) => {
              const statusMeta = STATUS_META[p.status];
              return (
                <div key={p.id}
                  className="rounded-lg border border-foreground/10 p-4 hover:border-foreground/20 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-heading font-semibold text-base truncate">{p.nome_unidade}</h3>
                        <Badge variant="outline" className={statusMeta.className}>{statusMeta.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {p.nome_franqueado} · Inauguração em {formatarData(p.data_inauguracao)}
                      </p>
                      <p className="text-sm text-primary font-medium mt-1">
                        {formatarReais(p.valor_verba)} · {rotuloDeProfessores(p.qtd_professores)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contato: {p.email_unidade}
                        {p.email_franqueado ? ` · ${p.email_franqueado}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="text-xs text-muted-foreground sm:text-right">
                        {modo === 'meus' ? 'Enviada em' : 'Solicitada em'}
                        <br className="hidden sm:inline" /> {formatarDataHora(p.created_at)}
                      </div>
                      {modo === 'todos' && p.status === 'pendente' && (
                        <Button
                          size="sm"
                          onClick={() => aprovarVerba(p.id)}
                          disabled={aprovando === p.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {aprovando === p.id
                            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            : <CircleCheck className="h-4 w-4 mr-2" />}
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
  );
}
