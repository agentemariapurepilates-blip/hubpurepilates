import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Inbox, CircleCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  OBJETIVOS,
  PRODUTOS,
  formatarData,
  formatarTelefone,
  type Objetivo,
  type Produto,
} from '../../../../supabase/functions/send-midia-local/pedido';

// Lista de pedidos de mídia local, em dois modos (igual à Verba para professores):
// - 'meus'  → Minha Área > Minhas solicitações (só os do usuário, só leitura)
// - 'todos' → Visão Geral das Unidades (colaborador/admin, com "Marcar como atendido")
// A RLS de midia_local_requests decide quem vê o quê; o filtro por user_id no
// modo 'meus' só evita misturar os pedidos dos outros com os do colaborador.

type StatusKey = 'pendente' | 'atendido';

interface PedidoMidia {
  id: string;
  nome_franqueado: string;
  email_franqueado: string;
  telefone: string;
  nome_unidade: string;
  objetivo: Objetivo;
  data_inauguracao: string | null;
  periodo_inicio: string;
  periodo_fim: string;
  criativo_tipo: 'cartela' | 'adaptacao';
  produtos: Produto[];
  status: StatusKey;
  created_at: string;
}

const STATUS_META: Record<StatusKey, { label: string; className: string }> = {
  pendente: { label: 'Aguardando a Rise', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  atendido: { label: 'Atendido', className: 'bg-green-100 text-green-800 border-green-200' },
};

const formatarDataHora = (timestamp: string) =>
  new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

interface Props {
  modo: 'meus' | 'todos';
}

export function PedidosMidiaLocal({ modo }: Props) {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoMidia[]>([]);
  const [loading, setLoading] = useState(true);
  const [atendendo, setAtendendo] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (modo === 'meus' && !user) return;
    setLoading(true);
    try {
      let consulta = supabase
        .from('midia_local_requests' as never)
        .select('id, nome_franqueado, email_franqueado, telefone, nome_unidade, objetivo, data_inauguracao, periodo_inicio, periodo_fim, criativo_tipo, produtos, status, created_at')
        .order('created_at', { ascending: false });
      if (modo === 'meus') consulta = consulta.eq('user_id', user!.id);

      const { data, error } = await consulta;
      if (error) throw error;
      setPedidos((data ?? []) as unknown as PedidoMidia[]);
    } catch (err) {
      console.error('Erro ao carregar pedidos de mídia local:', err);
      toast.error('Não foi possível carregar os pedidos de mídia local.');
    } finally {
      setLoading(false);
    }
  }, [modo, user]);

  useEffect(() => { carregar(); }, [carregar]);

  const marcarAtendido = async (id: string) => {
    setAtendendo(id);
    try {
      // .select() para confirmar que a linha mudou: UPDATE barrado pela RLS não
      // dá erro, só atualiza zero linhas.
      const { data, error } = await supabase
        .from('midia_local_requests' as never)
        .update({ status: 'atendido' } as never)
        .eq('id', id)
        .select('id');

      if (error) throw error;
      if (!data?.length) throw new Error('Você não tem permissão para alterar este pedido.');

      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'atendido' } : p)));
      toast.success('Pedido marcado como atendido.');
    } catch (err) {
      console.error('Erro ao marcar pedido de mídia local:', err);
      toast.error(err instanceof Error && err.message ? err.message : 'Não foi possível atualizar o pedido.');
    } finally {
      setAtendendo(null);
    }
  };

  const pendentes = pedidos.filter((p) => p.status === 'pendente').length;
  const atendidos = pedidos.length - pendentes;

  const descricao = loading
    ? 'Carregando...'
    : pedidos.length === 0
      ? (modo === 'meus' ? 'Você ainda não pediu mídia local na TV Globo.' : 'Nenhuma unidade pediu mídia local na TV Globo até o momento.')
      : modo === 'meus'
        ? `${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'} (mais recentes primeiro).`
        : `${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'} · ${pendentes} aguardando, ${atendidos} atendido${atendidos === 1 ? '' : 's'}.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-heading">
          {modo === 'meus' ? 'Mídia local · TV Globo' : 'Unidades com mídia local na TV Globo solicitada'}
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
            <p className="text-sm text-muted-foreground">Nenhum pedido registrado.</p>
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
                        {p.nome_franqueado} · {OBJETIVOS[p.objetivo]}
                        {p.data_inauguracao ? ` em ${formatarData(p.data_inauguracao)}` : ''}
                      </p>
                      <p className="text-sm text-primary font-medium mt-1">
                        {p.produtos.map((x) => PRODUTOS[x]).join(' · ')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Veiculação: {formatarData(p.periodo_inicio)} a {formatarData(p.periodo_fim)}
                        {p.criativo_tipo === 'adaptacao' ? ' · com custo de Ancine' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contato: {p.email_franqueado} · {formatarTelefone(p.telefone)}
                      </p>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="text-xs text-muted-foreground sm:text-right">
                        {modo === 'meus' ? 'Enviado em' : 'Solicitado em'}
                        <br className="hidden sm:inline" /> {formatarDataHora(p.created_at)}
                      </div>
                      {modo === 'todos' && p.status === 'pendente' && (
                        <Button
                          size="sm"
                          onClick={() => marcarAtendido(p.id)}
                          disabled={atendendo === p.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {atendendo === p.id
                            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            : <CircleCheck className="h-4 w-4 mr-2" />}
                          Marcar como atendido
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
