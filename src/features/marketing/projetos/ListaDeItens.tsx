import { useState } from 'react';
import { ChevronRight, GitBranch, ListChecks, Lock, Maximize2, MoreHorizontal, Paperclip, Plus, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { BandeiraPrioridade, CampoData, PilulaStatus, SeletorDePessoas } from './pecas';
import { bloqueadoPor, descendentes, progresso, statusDe, type Item } from './projetos';
import type { DadosDosItens } from './useItens';

// A lista em árvore, como no ClickUp: cada linha com a setinha para abrir as
// subtarefas, responsáveis, início, vencimento, prioridade e status. Clicar no
// nome abre a página grande do item. Usada na tela de Projetos (raízes = os
// projetos) e dentro da página de um item (raízes = as subtarefas dele).

const COLUNAS = 'grid-cols-[minmax(260px,1fr)_120px_100px_100px_70px_150px_36px]';

export function ListaDeItens({
  raizes,
  dados,
  onAbrir,
  paiDosNovos,
  rotuloNovo,
  contagens,
}: {
  raizes: Item[];
  dados: DadosDosItens;
  onAbrir: (id: string) => void;
  /** Onde nasce o item criado na última linha (null = projeto novo). */
  paiDosNovos: string | null;
  rotuloNovo: string;
  /** Quantos anexos e itens de checklist cada item tem (para os ícones). */
  contagens?: {
    anexos: Record<string, number>;
    checklist: Record<string, number>;
  };
}) {
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <div className={cn('grid min-w-[880px] gap-2 border-b border-border px-3 py-2 text-[11px] font-medium text-muted-foreground', COLUNAS)}>
        <span className="pl-8">Nome</span>
        <span>Responsáveis</span>
        <span>Início</span>
        <span>Vencimento</span>
        <span>Prioridade</span>
        <span>Status</span>
        <span />
      </div>
      <div className="min-w-[880px]">
        {raizes.map((t) => (
          <Ramo key={t.id} item={t} nivel={0} dados={dados} abertos={abertos} setAbertos={setAbertos} onAbrir={onAbrir} contagens={contagens} />
        ))}
        <NovaLinha rotulo={rotuloNovo} recuo={0} onCriar={(titulo) => dados.criar({ titulo, item_pai_id: paiDosNovos })} />
      </div>
    </div>
  );
}

function Ramo({
  item,
  nivel,
  dados,
  abertos,
  setAbertos,
  onAbrir,
  contagens,
}: {
  item: Item;
  nivel: number;
  dados: DadosDosItens;
  abertos: Record<string, boolean>;
  setAbertos: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onAbrir: (id: string) => void;
  contagens?: {
    anexos: Record<string, number>;
    checklist: Record<string, number>;
  };
}) {
  const { itens, equipe, salvar, criar, excluir } = dados;
  const filhos = itens.filter((x) => x.item_pai_id === item.id);
  const todosAbaixo = itens.filter((x) => descendentes(item.id, itens).includes(x.id));
  const aberto = abertos[item.id];
  const feito = item.status === 'concluida';
  const s = statusDe(item.status);
  const bloq = bloqueadoPor(item, itens).length > 0;
  const prog = progresso(todosAbaixo);

  return (
    <>
      <div
        className={cn(
          'group grid items-center gap-2 border-b border-border/70 px-3 text-sm hover:bg-muted/40',
          COLUNAS,
          nivel === 0 ? 'py-2' : 'py-1.5',
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5" style={{ paddingLeft: nivel * 26 }}>
          {nivel === 0 ? (
            <button
              type="button"
              onClick={() => setAbertos((a) => ({ ...a, [item.id]: !a[item.id] }))}
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-transparent hover:border-border hover:bg-background',
                filhos.length === 0 && !aberto && 'opacity-0 group-hover:opacity-100',
              )}
              title={aberto ? 'Esconder subtarefas' : filhos.length ? 'Ver subtarefas' : 'Adicionar subtarefa'}
            >
              <ChevronRight className={cn('h-4 w-4 transition-transform', aberto && 'rotate-90')} />
            </button>
          ) : (
            <span className="w-6 shrink-0" />
          )}
          {/* círculo de status: tracejado enquanto aberto, cheio quando concluído */}
          <button
            type="button"
            onClick={() => salvar(item.id, { status: feito ? 'a_fazer' : 'concluida' })}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
            style={{
              borderColor: s.cor,
              borderStyle: feito ? 'solid' : 'dashed',
              background: feito ? s.cor : 'transparent',
            }}
            title={feito ? 'Reabrir' : 'Concluir'}
          />
          {/* Clicar no nome renomeia ali mesmo; o botão Abrir leva à página grande. */}
          <NomeEditavel
            titulo={item.titulo}
            onSalvar={(t) => salvar(item.id, { titulo: t })}
            className={cn(nivel === 0 && 'font-semibold', feito && 'text-muted-foreground line-through')}
          />
          <button
            type="button"
            onClick={() => onAbrir(item.id)}
            className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground opacity-0 transition-opacity hover:border-primary/50 hover:text-primary group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100"
            title="Abrir"
          >
            <Maximize2 className="h-3 w-3" />
            Abrir
          </button>
          {bloq && <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />}
          {filhos.length > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground" title={`${prog.feitas} de ${prog.total} concluídas`}>
              <GitBranch className="h-3.5 w-3.5" />
              {filhos.length}
            </span>
          )}
          {!!contagens?.checklist[item.id] && <ListChecks className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          {!!contagens?.anexos[item.id] && <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        </div>
        <SeletorDePessoas equipe={equipe} valor={item.responsaveis} onMudar={(ids) => salvar(item.id, { responsaveis: ids })} />
        <CampoData valor={item.data_inicio} onMudar={(d) => salvar(item.id, { data_inicio: d })} placeholder="" semSinal />
        <CampoData valor={item.prazo} onMudar={(d) => salvar(item.id, { prazo: d })} placeholder="" concluido={feito} />
        <BandeiraPrioridade valor={item.prioridade} onMudar={(p) => salvar(item.id, { prioridade: p })} />
        <span>
          <PilulaStatus valor={item.status} onMudar={(st) => salvar(item.id, { status: st })} />
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex h-7 w-7 items-center justify-center rounded opacity-0 hover:bg-muted group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAbrir(item.id)}>Abrir</DropdownMenuItem>
            {nivel === 0 && <DropdownMenuItem onClick={() => setAbertos((a) => ({ ...a, [item.id]: true }))}>Adicionar subtarefa</DropdownMenuItem>}
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                if (window.confirm(`Excluir "${item.titulo}"${filhos.length ? ' e as subtarefas dele' : ''}?`)) excluir(item.id);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {aberto && nivel === 0 && (
        <>
          {filhos.map((f) => (
            <Ramo
              key={f.id}
              item={f}
              nivel={nivel + 1}
              dados={dados}
              abertos={abertos}
              setAbertos={setAbertos}
              onAbrir={onAbrir}
              contagens={contagens}
            />
          ))}
          <NovaLinha rotulo="Nova subtarefa" recuo={nivel + 1} onCriar={(titulo) => criar({ titulo, item_pai_id: item.id })} />
        </>
      )}
    </>
  );
}

function NovaLinha({ rotulo, recuo, onCriar }: { rotulo: string; recuo: number; onCriar: (t: string) => void }) {
  const [texto, setTexto] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!texto.trim()) return;
        onCriar(texto.trim());
        setTexto('');
      }}
      className="flex items-center gap-2 border-b border-border/70 px-3 py-1.5 last:border-0"
      style={{ paddingLeft: 12 + recuo * 26 + 30 }}
    >
      <Plus className="h-4 w-4 text-muted-foreground" />
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={`${rotulo} (Enter)`}
        className="flex-1 bg-transparent py-1 text-sm outline-none"
      />
    </form>
  );
}

/** O nome do item: clica e vira campo; Enter ou sair do campo salva, Esc cancela. */
function NomeEditavel({ titulo, onSalvar, className }: { titulo: string; onSalvar: (t: string) => void; className?: string }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(titulo);
  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => {
          setTexto(titulo);
          setEditando(true);
        }}
        className={cn('min-w-0 cursor-text truncate rounded px-1 text-left hover:bg-muted', className)}
        title="Clique para renomear"
      >
        {titulo}
      </button>
    );
  }
  const terminar = () => {
    setEditando(false);
    const t = texto.trim();
    if (t && t !== titulo) onSalvar(t);
  };
  return (
    <input
      autoFocus
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={terminar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') terminar();
        if (e.key === 'Escape') setEditando(false);
      }}
      className="min-w-0 flex-1 rounded border border-primary bg-background px-1 py-0.5 text-sm outline-none"
    />
  );
}
