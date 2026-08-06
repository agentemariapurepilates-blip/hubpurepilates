import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { NovaInauguracaoForm } from './components/NovaInauguracaoForm';
import { ListaInauguracoes } from './components/ListaInauguracoes';
import { DestinatariosTab } from './components/DestinatariosTab';
import { RelatorioTab } from './components/RelatorioTab';

type Aba = 'nova' | 'solicitacoes' | 'destinatarios' | 'relatorio';

/**
 * Tela de Inaugurações.
 *
 * As três partes eram abas dentro da página; passaram a ser itens da seção
 * "Inaugurações" no menu da esquerda, cada uma com a sua própria rota. O mesmo
 * componente atende as três: o que muda é só o trecho renderizado, então
 * continua sendo um único chunk e o estado de navegação vive na URL — links
 * diretos e o botão voltar do navegador passam a funcionar, o que com abas em
 * useState não acontecia.
 *
 * As regras de quem vê o quê NÃO mudaram: "Destinatários" continua exclusivo de
 * admin, e o rótulo da lista continua variando entre "Todas" e "Minhas".
 */

const ROTAS: Record<Aba, string> = {
  nova: '/inauguracoes/nova',
  solicitacoes: '/inauguracoes/solicitacoes',
  destinatarios: '/inauguracoes/destinatarios',
  relatorio: '/inauguracoes/relatorio',
};

function abaDaRota(pathname: string): Aba {
  if (pathname.startsWith(ROTAS.solicitacoes)) return 'solicitacoes';
  if (pathname.startsWith(ROTAS.destinatarios)) return 'destinatarios';
  if (pathname.startsWith(ROTAS.relatorio)) return 'relatorio';
  return 'nova';
}

const DESCRICAO: Record<Aba, string> = {
  nova: 'Avise o marketing sobre a inauguração de uma nova unidade.',
  solicitacoes: 'Acompanhe as solicitações já feitas.',
  destinatarios: 'Quem recebe o aviso automático no dia da inauguração.',
  relatorio: 'Quem recebe o resumo semanal, toda segunda-feira às 7h.',
};

const Inauguracoes = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const aba = abaDaRota(location.pathname);

  // Colaborador que chegue em /inauguracoes/destinatarios pela URL não pode ver
  // a tela — antes a aba nem existia no DOM para ele, e a proteção precisa
  // continuar valendo agora que virou rota. Quem decide de fato é a RLS da
  // tabela (a lista voltaria vazia), mas mandar para uma tela vazia sem
  // explicação é pior do que não deixar entrar.
  if ((aba === 'destinatarios' || aba === 'relatorio') && !isAdmin) {
    return <Navigate to={ROTAS.nova} replace />;
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-2 sm:px-4 space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Inaugurações</h1>
          <p className="text-sm text-muted-foreground">{DESCRICAO[aba]}</p>
        </div>

        {aba === 'nova' && (
          <NovaInauguracaoForm aoSalvar={() => navigate(ROTAS.solicitacoes)} />
        )}

        {aba === 'solicitacoes' && (
          <ListaInauguracoes aoIrParaNova={() => navigate(ROTAS.nova)} />
        )}

        {aba === 'destinatarios' && isAdmin && <DestinatariosTab />}

        {aba === 'relatorio' && isAdmin && <RelatorioTab />}
      </div>
    </MainLayout>
  );
};

export default Inauguracoes;
