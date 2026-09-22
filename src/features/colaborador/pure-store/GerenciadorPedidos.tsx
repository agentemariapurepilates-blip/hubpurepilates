import { useEffect, useMemo, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { Link } from 'react-router-dom';
import { ClipboardList, Loader2, MoreHorizontal, Pencil, Search, Trash2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatarReal } from './pedidoPureStore';
import {
  COR_STATUS,
  STATUS_PEDIDO,
  TITULO_STATUS,
  excluirPedido,
  listarPedidos,
  moverPedido,
  type PedidoSalvo,
  type StatusPedido,
} from './pedidosStore';

/** Minúsculas e sem acento, para a busca pelo nome do cliente. */
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Data local no formato do campo de data (yyyy-mm-dd); o banco guarda em UTC. */
const diaLocal = (iso: string) => new Date(iso).toLocaleDateString('sv-SE');

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

const CartaoPedido = ({
  pedido,
  onAbrir,
  onMover,
  onExcluir,
  arrastavel = true,
}: {
  pedido: PedidoSalvo;
  onAbrir: () => void;
  onMover: (status: StatusPedido) => void;
  onExcluir: () => void;
  arrastavel?: boolean;
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: pedido.id, disabled: !arrastavel });

  return (
    <div
      ref={arrastavel ? setNodeRef : undefined}
      className={cn('rounded-lg border bg-card p-3 shadow-sm', isDragging && 'opacity-40')}
    >
      <div className="flex items-start gap-2">
        {/* O corpo do cartão arrasta e abre; o menu fica de fora para não disputar o clique. */}
        <button
          type="button"
          onClick={onAbrir}
          className="min-w-0 flex-1 text-left"
          {...(arrastavel ? { ...listeners, ...attributes } : {})}
        >
          <p className="text-xs text-muted-foreground">
            Pedido {pedido.numero} · {dataHora(pedido.created_at)}
          </p>
          <p className="truncate font-medium">{pedido.cliente_nome}</p>
          {pedido.cliente_unidade && (
            <p className="truncate text-xs text-muted-foreground">{pedido.cliente_unidade}</p>
          )}
          <p className="mt-1 text-sm font-semibold tabular-nums">{formatarReal(pedido.total)}</p>
          <p className="text-xs text-muted-foreground">
            {pedido.itens.length} {pedido.itens.length === 1 ? 'item' : 'itens'}
            {pedido.desconto_percentual > 0 && ` · ${pedido.desconto_percentual}% OFF`}
          </p>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Opções do pedido ${pedido.numero}`}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/colaborador/pure-store/pedidos?pedido=${pedido.id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar pedido
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {STATUS_PEDIDO.filter((s) => s !== pedido.status).map((status) => (
              <DropdownMenuItem key={status} onSelect={() => onMover(status)}>
                Mover para {TITULO_STATUS[status].toLowerCase()}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onExcluir} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir pedido
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

const Coluna = ({
  status,
  pedidos,
  onAbrir,
  onMover,
  onExcluir,
}: {
  status: StatusPedido;
  pedidos: PedidoSalvo[];
  onAbrir: (pedido: PedidoSalvo) => void;
  onMover: (id: string, status: StatusPedido) => void;
  onExcluir: (pedido: PedidoSalvo) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const total = pedidos.reduce((soma, p) => soma + p.total, 0);

  return (
    <div className="flex min-w-[260px] flex-1 flex-col">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COR_STATUS[status] }} />
        <h2 className="text-sm font-semibold">{TITULO_STATUS[status]}</h2>
        <span className="text-xs tabular-nums text-muted-foreground">{pedidos.length}</span>
        {total > 0 && <span className="ml-auto text-xs tabular-nums text-muted-foreground">{formatarReal(total)}</span>}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 rounded-lg border border-dashed p-2 transition-colors',
          isOver ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30',
        )}
      >
        {pedidos.map((pedido) => (
          <CartaoPedido
            key={pedido.id}
            pedido={pedido}
            onAbrir={() => onAbrir(pedido)}
            onMover={(destino) => onMover(pedido.id, destino)}
            onExcluir={() => onExcluir(pedido)}
          />
        ))}
        {pedidos.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">Nenhum pedido aqui.</p>
        )}
      </div>
    </div>
  );
};

const GerenciadorPedidos = () => {
  const [pedidos, setPedidos] = useState<PedidoSalvo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [aberto, setAberto] = useState<PedidoSalvo | null>(null);
  const [arrastando, setArrastando] = useState<PedidoSalvo | null>(null);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const carregar = async () => {
    try {
      setPedidos(await listarPedidos());
    } catch (error) {
      console.error('Erro ao carregar pedidos da Pure Store:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível trazer os pedidos. Tente recarregar a página.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();

    let debounce: ReturnType<typeof setTimeout>;
    const canal = supabase
      .channel('pure-store-pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pure_store_pedidos' }, () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => carregar(), 600);
      })
      .subscribe();

    return () => {
      clearTimeout(debounce);
      supabase.removeChannel(canal);
    };
  }, []);

  const filtrados = useMemo(() => {
    const termos = normalizar(busca).split(/\s+/).filter(Boolean);
    return pedidos.filter((pedido) => {
      const alvo = normalizar(`${pedido.cliente_nome} ${pedido.cliente_unidade} ${pedido.numero}`);
      if (!termos.every((termo) => alvo.includes(termo))) return false;
      const dia = diaLocal(pedido.created_at);
      if (de && dia < de) return false;
      if (ate && dia > ate) return false;
      return true;
    });
  }, [pedidos, busca, de, ate]);

  const mover = async (id: string, status: StatusPedido) => {
    const antes = pedidos;
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    try {
      await moverPedido(id, status);
    } catch (error) {
      console.error('Erro ao mover o pedido:', error);
      setPedidos(antes);
      toast({ title: 'Erro', description: 'Não foi possível mover o pedido.', variant: 'destructive' });
    }
  };

  const remover = async (pedido: PedidoSalvo) => {
    if (!window.confirm(`Excluir o pedido ${pedido.numero}, de ${pedido.cliente_nome}? Não dá para desfazer.`)) return;
    const antes = pedidos;
    setPedidos((prev) => prev.filter((p) => p.id !== pedido.id));
    try {
      await excluirPedido(pedido.id);
    } catch (error) {
      console.error('Erro ao excluir o pedido:', error);
      setPedidos(antes);
      toast({ title: 'Erro', description: 'Não foi possível excluir o pedido.', variant: 'destructive' });
    }
  };

  const aoSoltar = (evento: DragEndEvent) => {
    setArrastando(null);
    const destino = evento.over?.id as StatusPedido | undefined;
    const pedido = pedidos.find((p) => p.id === evento.active.id);
    if (destino && pedido && pedido.status !== destino) mover(pedido.id, destino);
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pure Store</p>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <ClipboardList className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            Gerenciador de pedidos
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Todos os pedidos já criados. Arraste o cartão para a coluna seguinte, ou use o menu do cartão.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por cliente, unidade ou número"
              className="pl-9"
              aria-label="Buscar pedidos"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="de" className="text-xs">De</Label>
            <Input id="de" type="date" value={de} onChange={(e) => setDe(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ate" className="text-xs">Até</Label>
            <Input id="ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="w-40" />
          </div>
          {(busca || de || ate) && (
            <button
              type="button"
              onClick={() => {
                setBusca('');
                setDe('');
                setAte('');
              }}
              className="pb-2 text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Limpar filtros
            </button>
          )}
          <span className="pb-2 text-xs tabular-nums text-muted-foreground sm:ml-auto">
            {filtrados.length} de {pedidos.length}
          </span>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pedidos.length === 0 ? (
          <Card>
            <CardContent className="space-y-2 p-10 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Nenhum pedido ainda</p>
              <p className="text-sm text-muted-foreground">
                Os pedidos criados no Gerador aparecem aqui, começando em “Pedido realizado”.
              </p>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensores}
            onDragStart={(e) => setArrastando(pedidos.find((p) => p.id === e.active.id) ?? null)}
            onDragCancel={() => setArrastando(null)}
            onDragEnd={aoSoltar}
          >
            <div className="flex flex-col gap-4 overflow-x-auto pb-2 sm:flex-row">
              {STATUS_PEDIDO.map((status) => (
                <Coluna
                  key={status}
                  status={status}
                  pedidos={filtrados.filter((p) => p.status === status)}
                  onAbrir={setAberto}
                  onMover={mover}
                  onExcluir={remover}
                />
              ))}
            </div>

            <DragOverlay>
              {arrastando && (
                <div className="w-64 rotate-2 rounded-lg border bg-card p-3 shadow-xl">
                  <p className="text-xs text-muted-foreground">Pedido {arrastando.numero}</p>
                  <p className="truncate font-medium">{arrastando.cliente_nome}</p>
                  <p className="text-sm font-semibold tabular-nums">{formatarReal(arrastando.total)}</p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <Dialog open={aberto !== null} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-w-lg">
          {aberto && (
            <>
              <DialogHeader>
                <DialogTitle>Pedido {aberto.numero}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">{aberto.cliente_nome}</p>
                  {aberto.cliente_unidade && <p className="text-muted-foreground">{aberto.cliente_unidade}</p>}
                  {aberto.cliente_telefone && <p className="text-muted-foreground">{aberto.cliente_telefone}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Criado em {dataHora(aberto.created_at)} · {TITULO_STATUS[aberto.status]}
                  </p>
                </div>

                <div className="rounded-md border">
                  {aberto.itens.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 border-b p-2 last:border-b-0">
                      <span className="min-w-0 flex-1 break-words">{item.produto}</span>
                      {item.tamanho && (
                        <span className="shrink-0 text-xs text-muted-foreground">{item.tamanho}</span>
                      )}
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{item.quantidade}x</span>
                      <span className="w-24 shrink-0 text-right tabular-nums">
                        {formatarReal(item.quantidade * item.valor_unitario)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link to={`/colaborador/pure-store/pedidos?pedido=${aberto.id}`}>
                      <Pencil className="h-4 w-4" />
                      Editar pedido
                    </Link>
                  </Button>
                </div>

                <dl className="ml-auto w-full max-w-xs space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="tabular-nums">{formatarReal(aberto.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Desconto ({aberto.desconto_percentual}%)</dt>
                    <dd className="tabular-nums text-muted-foreground">– {formatarReal(aberto.desconto_valor)}</dd>
                  </div>
                  <div className="flex justify-between text-base font-bold">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatarReal(aberto.total)}</dd>
                  </div>
                </dl>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default GerenciadorPedidos;
