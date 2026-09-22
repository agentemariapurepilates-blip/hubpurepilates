import { Link } from 'react-router-dom';
import { ClipboardList, ShoppingBag } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';

// Mesma ideia da página-índice dos Tutoriais: o item do menu é clicável e cai
// aqui, com um cartão para cada tela.
const ATALHOS = [
  {
    href: '/colaborador/pure-store/pedidos',
    icon: ShoppingBag,
    titulo: 'Gerador de pedidos',
    texto: 'Monte o pedido do franqueado com uniformes e produtos da loja, aplique o desconto e veja o total.',
  },
  {
    href: '/colaborador/pure-store/gerenciador',
    icon: ClipboardList,
    titulo: 'Gerenciador de pedidos',
    texto: 'Todos os pedidos já feitos, do realizado ao entregue, com busca por cliente e por data.',
  },
];

const PureStoreColaborador = () => (
  <MainLayout>
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Colaboradores</p>
        <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
          <ShoppingBag className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
          Pure Store
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Pedidos de uniformes e produtos da loja, do momento em que o pedido é feito até a entrega.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ATALHOS.map((atalho) => (
          <Link key={atalho.href} to={atalho.href} className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/40">
              <CardContent className="space-y-2 p-5">
                <atalho.icon className="h-6 w-6 text-primary" />
                <h2 className="font-semibold">{atalho.titulo}</h2>
                <p className="text-sm text-muted-foreground">{atalho.texto}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  </MainLayout>
);

export default PureStoreColaborador;
