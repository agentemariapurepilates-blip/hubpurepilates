import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, GanttChartSquare, List, Loader2, Plus } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { LinhaDoTempo } from './LinhaDoTempo';
import { ListaDeItens } from './ListaDeItens';
import { Avatares } from './pecas';
import { statusDe } from './projetos';
import { useItens } from './useItens';

// Marketing → Projetos, no modelo do ClickUp. A lista mostra os projetos; a
// setinha abre as subtarefas; o nome abre a página grande do projeto. A linha do
// tempo mostra cada projeto do início ao vencimento, com as subtarefas embaixo. Sem frente de trabalho: o projeto envolve o
// marketing todo (pedido da equipe, 09/11/2026).

type Visao = 'lista' | 'linha';

export default function ProjetosMarketing() {
  const navigate = useNavigate();
  const dados = useItens();
  const { itens, equipe, carregando, erro, criar, salvar } = dados;
  const [visao, setVisao] = useState<Visao>(() => (localStorage.getItem('marketing-projetos-visao') as Visao) || 'lista');
  const [verConcluidos, setVerConcluidos] = useState(false);
  const [novo, setNovo] = useState(false);
  const [titulo, setTitulo] = useState('');

  const trocarVisao = (v: Visao) => {
    setVisao(v);
    try {
      localStorage.setItem('marketing-projetos-visao', v);
    } catch {
      /* navegador sem armazenamento: só não lembra a visão */
    }
  };

  const projetos = useMemo(
    () =>
      itens
        .filter((t) => !t.item_pai_id && (verConcluidos || t.status !== 'concluida'))
        .sort((a, b) => (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999') || a.created_at.localeCompare(b.created_at)),
    [itens, verConcluidos],
  );

  const abrir = (id: string) => navigate(`/marketing/projetos/${id}`);

  const criarProjeto = async () => {
    const t = titulo.trim();
    if (!t) return;
    const novoItem = await criar({ titulo: t, item_pai_id: null });
    if (novoItem) {
      setNovo(false);
      setTitulo('');
      abrir(novoItem.id);
    }
  };

  // Linha do tempo: cada projeto e, logo abaixo, as subtarefas dele.
  const linhas = projetos.flatMap((p) => [
    {
      id: p.id,
      rotulo: p.titulo,
      cor: statusDe(p.status).cor,
      de: p.data_inicio ?? p.prazo,
      ate: p.prazo ?? p.data_inicio,
      feito: p.status === 'concluida',
      detalhe: <Avatares ids={p.responsaveis} equipe={equipe} tamanho={20} max={2} />,
    },
    ...itens
      .filter((t) => t.item_pai_id === p.id)
      .map((t) => ({
        id: t.id,
        rotulo: t.titulo,
        recuo: true,
        cor: statusDe(t.status).cor,
        de: t.data_inicio ?? t.prazo,
        ate: t.prazo ?? t.data_inicio,
        feito: t.status === 'concluida',
        detalhe: <Avatares ids={t.responsaveis} equipe={equipe} tamanho={20} max={2} />,
      })),
  ]);

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="h-0.5 w-8 rounded-full bg-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Time de marketing</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Projetos</h1>
            <p className="mt-1 text-sm text-muted-foreground">Os projetos do marketing, com subtarefas, responsáveis e prazos.</p>
          </div>
          <Button onClick={() => setNovo(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo projeto
          </Button>
        </div>

        {/* Visões */}
        <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-border">
          {(
            [
              ['lista', 'Lista', List],
              ['linha', 'Linha do tempo', GanttChartSquare],
            ] as const
          ).map(([v, nome, Icone]) => (
            <button
              key={v}
              type="button"
              onClick={() => trocarVisao(v)}
              className={cn(
                '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                visao === v ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icone className="h-4 w-4" />
              {nome}
            </button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-2 pb-1 text-sm text-muted-foreground">
            <input type="checkbox" checked={verConcluidos} onChange={(e) => setVerConcluidos(e.target.checked)} />
            Mostrar concluídos
          </label>
        </div>

        {carregando ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : erro ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{erro}</p>
        ) : projetos.length === 0 && visao === 'linha' ? (
          <Vazio onNovo={() => setNovo(true)} />
        ) : visao === 'lista' ? (
          <ListaDeItens raizes={projetos} dados={dados} onAbrir={abrir} paiDosNovos={null} rotuloNovo="Novo projeto" />
        ) : (
          <LinhaDoTempo linhas={linhas} onAbrir={abrir} onMudarDatas={(id, de, ate) => salvar(id, { data_inicio: de, prazo: ate })} />
        )}
      </div>

      <Dialog open={novo} onOpenChange={setNovo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo projeto</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              criarProjeto();
            }}
            className="space-y-4"
          >
            <input
              autoFocus
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nome do projeto"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base outline-none focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">Descrição, datas, responsáveis e subtarefas você completa dentro do projeto.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setNovo(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!titulo.trim()}>
                Criar e abrir
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function Vazio({ onNovo }: { onNovo: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-12 text-center">
      <FolderKanban className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
      <p className="font-medium">Nenhum projeto ainda.</p>
      <p className="mb-4 text-sm text-muted-foreground">Crie o primeiro: é só dar um nome.</p>
      <Button onClick={onNovo}>
        <Plus className="mr-2 h-4 w-4" />
        Novo projeto
      </Button>
    </div>
  );
}
