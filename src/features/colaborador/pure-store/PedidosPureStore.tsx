import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileDown, Info, Loader2, Pencil, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ProdutoPicker } from './ProdutoPicker';
import {
  calcularResumo,
  formatarReal,
  produtoPorNome,
  totalDoItem,
  type ItemPedido,
} from './pedidoPureStore';
import { atualizarPedido, buscarPedido, itensValidos, salvarPedido } from './pedidosStore';
import { baixarPedidoPdf } from './pedidoPdf';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Contador simples para a chave da linha: o id só serve para o React e para
// mexer na linha certa, e não depende de contexto seguro como crypto.randomUUID.
let sequencia = 0;

const linhaVazia = (): ItemPedido => ({
  id: `item-${++sequencia}`,
  produto: '',
  tamanho: '',
  quantidade: 1,
  valorUnitario: 0,
});

// Produto | tamanho | qtd | valor unitário | total | excluir
const COLUNAS = 'sm:grid-cols-[minmax(0,1fr)_96px_80px_128px_112px_40px]';

const PedidosPureStore = () => {
  const [cliente, setCliente] = useState({ nome: '', unidade: '', telefone: '' });
  const [itens, setItens] = useState<ItemPedido[]>([linhaVazia()]);
  const [desconto, setDesconto] = useState(0);
  const [frete, setFrete] = useState(0);
  // Hoje, no formato do campo de data. A pessoa pode voltar a data ao lançar pedido antigo.
  const [dataPedido, setDataPedido] = useState(() => new Date().toLocaleDateString('sv-SE'));
  const [salvando, setSalvando] = useState(false);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Com ?pedido=<id> a tela edita esse pedido em vez de criar um novo.
  const pedidoId = searchParams.get('pedido');
  const [numeroEmEdicao, setNumeroEmEdicao] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(Boolean(pedidoId));
  const resumo = calcularResumo(itens, desconto, frete);

  // Veio do Gerenciador com ?pedido=<id>: abre o pedido salvo para editar.
  useEffect(() => {
    if (!pedidoId) return;
    let ativo = true;
    setCarregando(true);
    buscarPedido(pedidoId)
      .then((pedido) => {
        if (!ativo) return;
        if (!pedido) {
          toast({ title: 'Pedido não encontrado', description: 'Ele pode ter sido excluído.', variant: 'destructive' });
          navigate('/colaborador/pure-store/gerenciador', { replace: true });
          return;
        }
        setCliente({
          nome: pedido.cliente_nome,
          unidade: pedido.cliente_unidade,
          telefone: pedido.cliente_telefone,
        });
        setItens(
          pedido.itens.map((item) => ({
            id: item.id,
            produto: item.produto,
            tamanho: item.tamanho,
            quantidade: item.quantidade,
            valorUnitario: item.valor_unitario,
          })),
        );
        setDesconto(pedido.desconto_percentual);
        setFrete(pedido.frete);
        setDataPedido(pedido.data_pedido);
        setNumeroEmEdicao(pedido.numero);
      })
      .catch((erro) => {
        console.error('Erro ao abrir o pedido:', erro);
        toast({ title: 'Erro ao abrir o pedido', description: 'Tente de novo pelo Gerenciador.', variant: 'destructive' });
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [pedidoId, navigate]);

  const atualizarItem = (id: string, mudanca: Partial<ItemPedido>) =>
    setItens((prev) => prev.map((item) => (item.id === id ? { ...item, ...mudanca } : item)));

  const removerItem = (id: string) =>
    // A tela nunca fica sem nenhuma linha: sem isso não sobra onde clicar para recomeçar.
    setItens((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : [linhaVazia()]));

  const baixarPdf = async () => {
    const itensParaPdf = itensValidos(itens);
    if (itensParaPdf.length === 0) {
      toast({ title: 'Nenhum produto escolhido', description: 'O PDF sairia em branco.', variant: 'destructive' });
      return;
    }
    try {
      await baixarPedidoPdf({
        numero: numeroEmEdicao,
        dataDoPedido: dataPedido,
        cliente,
        itens: itensParaPdf,
        resumo,
      });
    } catch (erro) {
      console.error('Erro ao gerar o PDF do pedido:', erro);
      toast({ title: 'Erro ao gerar o PDF', description: 'Tente de novo.', variant: 'destructive' });
    }
  };

  const salvar = async () => {
    if (!cliente.nome.trim()) {
      toast({ title: 'Falta o nome do cliente', description: 'O pedido precisa de um nome para ser encontrado depois.', variant: 'destructive' });
      return;
    }
    if (itensValidos(itens).length === 0) {
      toast({ title: 'Nenhum produto escolhido', description: 'Escolha ao menos um produto antes de salvar.', variant: 'destructive' });
      return;
    }

    setSalvando(true);
    try {
      if (pedidoId) {
        const editado = await atualizarPedido(pedidoId, {
          cliente,
          itens,
          descontoPercentual: desconto,
          frete,
          dataPedido,
        });
        toast({ title: `Pedido ${editado.numero} atualizado`, description: 'As mudanças já aparecem no Gerenciador.' });
        navigate('/colaborador/pure-store/gerenciador');
        return;
      }

      const pedido = await salvarPedido({
        cliente,
        itens,
        descontoPercentual: desconto,
        frete,
        dataPedido,
        criadoPor: user?.id,
      });
      toast({ title: `Pedido ${pedido.numero} salvo`, description: 'Ele já está no Gerenciador, em "Pedido realizado".' });
      setCliente({ nome: '', unidade: '', telefone: '' });
      setItens([linhaVazia()]);
      setDesconto(0);
      setFrete(0);
      setDataPedido(new Date().toLocaleDateString('sv-SE'));
    } catch (erro) {
      console.error('Erro ao salvar o pedido:', erro);
      toast({ title: 'Erro ao salvar', description: 'O pedido não foi gravado. Tente de novo.', variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          {/* Volta para onde a pessoa veio: do Gerenciador, quando está editando um pedido. */}
          <Link
            to={pedidoId ? '/colaborador/pure-store/gerenciador' : '/colaborador/pure-store'}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {pedidoId ? 'Gerenciador de pedidos' : 'Pure Store'}
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <ShoppingBag className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            Gerador de pedidos
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Monte o pedido do franqueado com os uniformes e os produtos da loja. O preço já vem preenchido e
            continua editável, e o total é calculado sozinho.
          </p>
        </div>

        {numeroEmEdicao !== null ? (
          <Alert>
            <Pencil className="h-4 w-4" />
            <AlertDescription className="flex flex-wrap items-center gap-x-2">
              <span>
                Editando o <strong>pedido {numeroEmEdicao}</strong>: salvar troca os itens e os valores, e a coluna
                dele no quadro continua a mesma.
              </span>
              <Link to="/colaborador/pure-store/gerenciador" className="underline underline-offset-2">
                Cancelar
              </Link>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              O pedido salvo aparece no Gerenciador, em “Pedido realizado”. <strong>Gerar PDF</strong> e o preço
              vindo direto do site entram na sequência.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados do pedido</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="cliente-nome">Nome do cliente</Label>
              <Input
                id="cliente-nome"
                value={cliente.nome}
                onChange={(e) => setCliente((c) => ({ ...c, nome: e.target.value }))}
                placeholder="Maria Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente-unidade">Nome da unidade</Label>
              <Input
                id="cliente-unidade"
                value={cliente.unidade}
                onChange={(e) => setCliente((c) => ({ ...c, unidade: e.target.value }))}
                placeholder="Pure Pilates Moema"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente-telefone">Telefone de contato</Label>
              <Input
                id="cliente-telefone"
                value={cliente.telefone}
                onChange={(e) => setCliente((c) => ({ ...c, telefone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-pedido">Data do pedido</Label>
              <Input
                id="data-pedido"
                type="date"
                value={dataPedido}
                onChange={(e) => setDataPedido(e.target.value || new Date().toLocaleDateString('sv-SE'))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cabeçalho só no computador; no celular cada campo leva o próprio rótulo. */}
            <div className={`hidden text-xs font-medium text-muted-foreground sm:grid sm:gap-3 ${COLUNAS}`}>
              <span>Produto</span>
              <span>Tamanho</span>
              <span>Qtd.</span>
              <span>Valor unit.</span>
              <span className="text-right">Total</span>
              <span />
            </div>

            {itens.map((item) => {
              const esgotado = produtoPorNome(item.produto)?.esgotado;
              return (
                <div key={item.id} className="space-y-2">
                  <div className={`grid items-end gap-3 rounded-lg border p-3 sm:items-center sm:border-0 sm:p-0 ${COLUNAS}`}>
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:hidden">Produto</Label>
                      <ProdutoPicker
                        valor={item.produto}
                        onEscolher={(produto) =>
                          atualizarItem(item.id, { produto: produto.nome, valorUnitario: produto.preco })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs sm:hidden">Tamanho</Label>
                      <Input
                        value={item.tamanho}
                        onChange={(e) => atualizarItem(item.id, { tamanho: e.target.value })}
                        placeholder="M"
                        aria-label="Tamanho"
                        maxLength={10}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs sm:hidden">Quantidade</Label>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={item.quantidade}
                        onChange={(e) => atualizarItem(item.id, { quantidade: Number(e.target.value) || 0 })}
                        aria-label="Quantidade"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs sm:hidden">Valor unitário</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.valorUnitario}
                        onChange={(e) => atualizarItem(item.id, { valorUnitario: Number(e.target.value) || 0 })}
                        aria-label="Valor unitário"
                      />
                    </div>

                    <div className="flex items-center justify-between sm:justify-end">
                      <Label className="text-xs sm:hidden">Total</Label>
                      <span className="text-sm font-medium tabular-nums">{formatarReal(totalDoItem(item))}</span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerItem(item.id)}
                      aria-label={`Remover ${item.produto || 'item'}`}
                      className="justify-self-end text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {esgotado && (
                    <p className="text-xs text-amber-600 sm:pl-1">
                      Este produto está marcado como esgotado no site. Confirme com a Pure Store antes de enviar.
                    </p>
                  )}
                </div>
              );
            })}

            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setItens((prev) => [...prev, linhaVazia()])}>
              <Plus className="h-4 w-4" />
              Adicionar item
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-32 space-y-2">
                <Label htmlFor="desconto">Desconto (%)</Label>
                <Input
                  id="desconto"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={desconto}
                  onChange={(e) => setDesconto(Number(e.target.value) || 0)}
                />
              </div>
              <div className="w-36 space-y-2">
                <Label htmlFor="frete">Frete (R$)</Label>
                <Input
                  id="frete"
                  type="number"
                  min={0}
                  step="0.01"
                  value={frete}
                  onChange={(e) => setFrete(Number(e.target.value) || 0)}
                />
              </div>
              <p className="pb-2 text-xs text-muted-foreground">
                O desconto incide sobre os produtos. O frete é digitado à mão e entra inteiro no total.
              </p>
            </div>

            <Separator />

            <dl className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatarReal(resumo.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Desconto ({resumo.percentual}%)</dt>
                <dd className="tabular-nums text-muted-foreground">– {formatarReal(resumo.desconto)}</dd>
              </div>
              {resumo.frete > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Frete</dt>
                  <dd className="tabular-nums">+ {formatarReal(resumo.frete)}</dd>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatarReal(resumo.total)}</dd>
              </div>
            </dl>

            <Separator />

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Link
                to="/colaborador/pure-store/gerenciador"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Ver pedidos salvos
              </Link>
              <Button type="button" variant="outline" onClick={baixarPdf} className="gap-2">
                <FileDown className="h-4 w-4" />
                Baixar PDF
              </Button>
              <Button onClick={salvar} disabled={salvando || carregando} className="gap-2">
                {(salvando || carregando) && <Loader2 className="h-4 w-4 animate-spin" />}
                {pedidoId ? 'Salvar alterações' : 'Salvar pedido'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default PedidosPureStore;
