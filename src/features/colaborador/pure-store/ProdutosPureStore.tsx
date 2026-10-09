// Aba Produtos da Pure Store: a lista que alimenta o gerador de pedidos.
//
// Desde 09/10/2026 esta lista é mantida à mão pelos colaboradores e não vem
// mais da loja — o catálogo do site continua existindo, mas é outra coisa (é o
// que a unidade mostra para o aluno). Aqui só se lista e se cadastra: não há
// exclusão, para não quebrar a leitura de pedidos antigos.

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Package, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { formatarReal } from './pedidoPureStore';
import { NovoProdutoDialog } from './NovoProdutoDialog';
import { gruposDe, listarProdutos, type ProdutoInterno } from './produtosStore';

/** Minúsculas e sem acento: "necessaire" acha "Nécessaire Pure Pilates Duo". */
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export default function ProdutosPureStore() {
  const [produtos, setProdutos] = useState<ProdutoInterno[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [dialogAberto, setDialogAberto] = useState(false);

  useEffect(() => {
    let ativo = true;
    listarProdutos()
      .then((lista) => ativo && setProdutos(lista))
      .catch(() =>
        toast({
          title: 'Não foi possível carregar os produtos',
          description: 'Atualize a página e tente de novo.',
          variant: 'destructive',
        }),
      )
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, []);

  const filtrados = useMemo(() => {
    const q = normalizar(busca);
    return q ? produtos.filter((p) => normalizar(p.nome).includes(q)) : produtos;
  }, [produtos, busca]);

  // Agrupado como na busca do pedido, para a pessoa reconhecer a mesma ordem.
  const porGrupo = useMemo(() => {
    const mapa = new Map<string, ProdutoInterno[]>();
    for (const p of filtrados) mapa.set(p.grupo, [...(mapa.get(p.grupo) ?? []), p]);
    return [...mapa.entries()].sort(([a], [b]) =>
      a === 'Uniformes' ? -1 : b === 'Uniformes' ? 1 : a.localeCompare(b, 'pt-BR'),
    );
  }, [filtrados]);

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
            <Link to="/colaborador/pure-store">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Pure Store
            </Link>
          </Button>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Package className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            Produtos
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            A lista que aparece quando você monta um pedido. Cadastre aqui o que for novo — vale na hora, para
            todo mundo.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto"
              className="pl-9"
            />
          </div>
          <Button onClick={() => setDialogAberto(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar produto
          </Button>
        </div>

        {carregando ? (
          <Card>
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </CardContent>
          </Card>
        ) : filtrados.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              {busca
                ? 'Nenhum produto com esse nome. Cadastre o novo produto pelo botão acima.'
                : 'Nenhum produto cadastrado ainda.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {porGrupo.map(([grupo, itens]) => (
              <Card key={grupo}>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b px-5 py-3">
                    <h2 className="text-sm font-semibold">{grupo}</h2>
                    <span className="text-xs text-muted-foreground">
                      {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                  <ul className="divide-y">
                    {itens.map((produto) => (
                      <li key={produto.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                        <span className="min-w-0 flex-1 truncate text-sm">{produto.nome}</span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatarReal(produto.preco)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
            <p className="text-xs text-muted-foreground">
              {produtos.length} produtos na lista.
            </p>
          </div>
        )}

        <NovoProdutoDialog
          aberto={dialogAberto}
          onAbertoChange={setDialogAberto}
          grupos={gruposDe(produtos)}
          onCriado={(produto) => setProdutos((atuais) => [...atuais, produto].sort((a, b) =>
            a.grupo === 'Uniformes' ? -1 : b.grupo === 'Uniformes' ? 1 : a.nome.localeCompare(b.nome, 'pt-BR'),
          ))}
        />
      </div>
    </MainLayout>
  );
}
