import { useCallback, useEffect, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { db, nomeDeCanal } from './projetos';

// Etiquetas do time (tabela marketing_etiquetas), como no ClickUp: uma lista única
// com cor. No seletor dá para marcar e desmarcar no item, criar etiqueta nova,
// trocar a cor e excluir de vez (some de todos os itens). Pedido de 09/11/2026.

export interface Etiqueta {
  id: string;
  nome: string;
  cor: string;
}

export const CORES_ETIQUETA = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#64748b'];

/** A lista de etiquetas do time, sempre atualizada. */
export function useEtiquetas() {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const carregar = useCallback(async () => {
    const { data } = await db.from('marketing_etiquetas').select('id, nome, cor').order('nome');
    setEtiquetas((data ?? []) as Etiqueta[]);
  }, []);
  useEffect(() => {
    carregar();
    const canal = db
      .channel(nomeDeCanal('marketing-etiquetas'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_etiquetas' }, () => carregar())
      .subscribe();
    return () => {
      db.removeChannel(canal);
    };
  }, [carregar]);
  return { etiquetas, carregar, setEtiquetas };
}

/** Cor da etiqueta pelo nome (cinza se ela saiu da lista). */
export const corDaEtiqueta = (nome: string, lista: Etiqueta[]) => lista.find((e) => e.nome === nome)?.cor ?? '#94a3b8';

export function ChipEtiqueta({ nome, cor, pequeno }: { nome: string; cor: string; pequeno?: boolean }) {
  return (
    <span
      className={cn('inline-flex items-center rounded font-medium', pequeno ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-xs')}
      style={{ background: `${cor}22`, color: cor }}
    >
      {nome}
    </span>
  );
}

/** O campo "Etiquetas" do item: mostra as do item e abre o seletor. */
export function CampoEtiquetas({ valor, onMudar }: { valor: string[]; onMudar: (e: string[]) => void }) {
  const { etiquetas, carregar } = useEtiquetas();
  const [busca, setBusca] = useState('');
  const termo = busca.trim().toLowerCase();
  const filtradas = etiquetas.filter((e) => e.nome.includes(termo));
  const existe = etiquetas.some((e) => e.nome === termo);

  const alternar = (nome: string) => onMudar(valor.includes(nome) ? valor.filter((x) => x !== nome) : [...valor, nome]);

  const criar = async () => {
    if (!termo || existe) return;
    const cor = CORES_ETIQUETA[etiquetas.length % CORES_ETIQUETA.length];
    const { error } = await db.from('marketing_etiquetas').insert({ nome: termo, cor });
    if (error) return toast.error('Não consegui criar a etiqueta.');
    onMudar([...valor, termo]);
    setBusca('');
    carregar();
  };

  const recolorir = async (e: Etiqueta, cor: string) => {
    await db.from('marketing_etiquetas').update({ cor }).eq('id', e.id);
    carregar();
  };

  const excluir = async (e: Etiqueta) => {
    if (!window.confirm(`Excluir a etiqueta "${e.nome}"? Ela sai de todos os projetos e subtarefas.`)) return;
    const { error } = await db.rpc('marketing_excluir_etiqueta', { p_nome: e.nome });
    if (error) return toast.error('Não consegui excluir a etiqueta.');
    onMudar(valor.filter((x) => x !== e.nome));
    toast.success(`Etiqueta "${e.nome}" excluída.`);
    carregar();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="flex min-h-[28px] flex-wrap items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-muted">
          {valor.length === 0 && <span className="text-sm text-muted-foreground">Vazio</span>}
          {valor.map((n) => (
            <ChipEtiqueta key={n} nome={n} cor={corDaEtiqueta(n, etiquetas)} />
          ))}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            if (!existe) criar();
            else alternar(termo);
          }}
        >
          <input
            autoFocus
            value={busca}
            onChange={(ev) => setBusca(ev.target.value)}
            placeholder="Buscar ou criar etiqueta..."
            className="mb-2 w-full rounded-md border border-input px-2 py-1.5 text-sm outline-none focus:border-primary"
          />
        </form>
        <div className="max-h-72 overflow-y-auto">
          {filtradas.map((e) => {
            const marcada = valor.includes(e.nome);
            return (
              <div key={e.id} className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted">
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="h-4 w-4 shrink-0 rounded" style={{ background: e.cor }} title="Trocar a cor" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" side="left">
                    <div className="grid grid-cols-5 gap-1.5">
                      {CORES_ETIQUETA.map((c) => (
                        <button key={c} type="button" onClick={() => recolorir(e, c)} className="flex h-6 w-6 items-center justify-center rounded" style={{ background: c }}>
                          {c === e.cor && <Check className="h-3.5 w-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <button type="button" onClick={() => alternar(e.nome)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <ChipEtiqueta nome={e.nome} cor={e.cor} />
                  {marcada && <Check className="ml-auto h-4 w-4 text-primary" />}
                </button>
                <button type="button" onClick={() => excluir(e)} className="rounded p-1 opacity-0 hover:bg-background group-hover:opacity-100" title="Excluir etiqueta">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            );
          })}
          {termo && !existe && (
            <button type="button" onClick={criar} className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm hover:bg-muted">
              <Plus className="h-4 w-4 text-primary" />
              Criar <ChipEtiqueta nome={termo} cor={CORES_ETIQUETA[etiquetas.length % CORES_ETIQUETA.length]} />
            </button>
          )}
          {!termo && etiquetas.length === 0 && <p className="px-1.5 py-1 text-sm text-muted-foreground">Nenhuma etiqueta ainda. Digite para criar.</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
