import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Avatarzinho } from './pecas';
import { PRIORIDADES, dataLonga, db, nomeDeCanal, primeiroNome, statusDe, type Atividade, type Comentario, type PessoaMarketing, type StatusItem } from './projetos';

// A coluna da direita, como no ClickUp: comentários do time e o histórico de
// alterações (gravado pelo banco), misturados e separados por dia.

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const diaLocal = (iso: string) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date(iso));
const horaLocal = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
const rotuloDoDia = (d: string) => {
  const x = new Date(`${d}T12:00:00Z`);
  return `${DIAS[x.getUTCDay()]}, ${x.getUTCDate()} de ${MESES[x.getUTCMonth()]}`;
};

export function Conversa({ itemId, equipe }: { itemId: string; equipe: PessoaMarketing[] }) {
  const { user, isAdmin } = useAuth();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [atividade, setAtividade] = useState<Atividade[]>([]);
  const [texto, setTexto] = useState('');
  const fim = useRef<HTMLDivElement>(null);

  const carregar = useCallback(async () => {
    const [c, a] = await Promise.all([
      db.from('marketing_comentarios').select('*').eq('item_id', itemId).order('created_at'),
      db.from('marketing_atividade').select('*').eq('item_id', itemId).order('created_at'),
    ]);
    setComentarios((c.data ?? []) as Comentario[]);
    setAtividade((a.data ?? []) as Atividade[]);
  }, [itemId]);

  useEffect(() => {
    carregar();
    const canal = db
      .channel(nomeDeCanal(`marketing-conversa-${itemId}`))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_comentarios', filter: `item_id=eq.${itemId}` }, carregar)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'marketing_atividade', filter: `item_id=eq.${itemId}` }, carregar)
      .subscribe();
    return () => {
      db.removeChannel(canal);
    };
  }, [itemId, carregar]);

  const pessoa = (id: string | null) => equipe.find((p) => p.user_id === id);
  const nomes = (ids: string | null) =>
    (ids ?? '')
      .split(',')
      .filter(Boolean)
      .map((id) => primeiroNome(pessoa(id)))
      .join(', ');

  // O que mudou, em português, como no ClickUp.
  const frase = (a: Atividade) => {
    const valor = (v: string | null) => {
      if (a.campo === 'status') return v ? statusDe(v as StatusItem).nome : '—';
      if (a.campo === 'prioridade') return PRIORIDADES.find((p) => p.chave === v)?.nome ?? 'sem prioridade';
      if (a.campo === 'data_inicio' || a.campo === 'prazo') return dataLonga(v);
      return v ?? '—';
    };
    switch (a.campo) {
      case 'criou':
        return 'criou este item';
      case 'subtarefa':
        return <>criou a subtarefa <b>{a.para}</b></>;
      case 'anexo':
        return <>anexou <b>{a.para}</b></>;
      case 'titulo':
        return <>renomeou de <b>{a.de}</b> para <b>{a.para}</b></>;
      case 'responsaveis': {
        const antes = new Set((a.de ?? '').split(',').filter(Boolean));
        const depois = new Set((a.para ?? '').split(',').filter(Boolean));
        const entrou = [...depois].filter((x) => !antes.has(x)).join(',');
        const saiu = [...antes].filter((x) => !depois.has(x)).join(',');
        return (
          <>
            {entrou && <>adicionou <b>{nomes(entrou)}</b> aos responsáveis</>}
            {entrou && saiu && ' e '}
            {saiu && <>removeu <b>{nomes(saiu)}</b> dos responsáveis</>}
          </>
        );
      }
      default: {
        const nome = { status: 'o status', data_inicio: 'a data de início', prazo: 'o vencimento', prioridade: 'a prioridade' }[a.campo] ?? a.campo;
        if (!a.de) return <>definiu {nome}: <b>{valor(a.para)}</b></>;
        if (!a.para) return <>removeu {nome} de <b>{valor(a.de)}</b></>;
        return <>alterou {nome} de <b>{valor(a.de)}</b> para <b>{valor(a.para)}</b></>;
      }
    }
  };

  const linhaDoTempo = useMemo(() => {
    const tudo = [
      ...atividade.map((a) => ({ tipo: 'atividade' as const, quando: a.created_at, a })),
      ...comentarios.map((c) => ({ tipo: 'comentario' as const, quando: c.created_at, c })),
    ].sort((x, y) => x.quando.localeCompare(y.quando));
    const porDia: { dia: string; eventos: typeof tudo }[] = [];
    for (const e of tudo) {
      const dia = diaLocal(e.quando);
      if (porDia.length && porDia[porDia.length - 1].dia === dia) porDia[porDia.length - 1].eventos.push(e);
      else porDia.push({ dia, eventos: [e] });
    }
    return porDia;
  }, [atividade, comentarios]);

  // Entre chaves: no Chrome novo o scrollIntoView devolve uma Promise, e um efeito
  // que devolve qualquer coisa além de função quebra a página ao fechar
  // ("destroy is not a function", 09/11/2026).
  useEffect(() => {
    fim.current?.scrollIntoView?.({ block: 'end' });
  }, [linhaDoTempo.length, comentarios.length]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t) return;
    setTexto('');
    const { error } = await db.from('marketing_comentarios').insert({ item_id: itemId, autor_id: user?.id, texto: t });
    if (error) {
      setTexto(t);
      toast.error('Não consegui enviar o comentário.');
    } else carregar();
  };

  // Admin apaga o histórico de alterações (linha a linha ou tudo) para não poluir
  // o chat; os comentários não são afetados (pedido de 09/11/2026).
  const apagarAtividade = async (a: Atividade) => {
    setAtividade((l) => l.filter((x) => x.id !== a.id));
    const { error } = await db.from('marketing_atividade').delete().eq('id', a.id);
    if (error) {
      toast.error('Não consegui apagar.');
      carregar();
    }
  };
  const limparHistorico = async () => {
    if (!window.confirm('Apagar todo o histórico de alterações deste item? Os comentários continuam.')) return;
    setAtividade([]);
    const { error } = await db.from('marketing_atividade').delete().eq('item_id', itemId);
    if (error) {
      toast.error('Não consegui limpar o histórico.');
      carregar();
    }
  };

  const apagar = async (c: Comentario) => {
    setComentarios((l) => l.filter((x) => x.id !== c.id));
    await db.from('marketing_comentarios').delete().eq('id', c.id);
  };

  return (
    <aside className="flex min-h-0 flex-col border-l border-border bg-background">
      <div className="flex items-baseline gap-2 border-b border-border px-5 py-3.5">
        <span className="font-semibold">Comentários</span>
        <span className="text-xs text-muted-foreground">{comentarios.length} {comentarios.length === 1 ? 'mensagem' : 'mensagens'}</span>
        {isAdmin && atividade.length > 0 && (
          <button type="button" onClick={limparHistorico} className="ml-auto text-xs text-muted-foreground hover:text-red-600" title="Só administradores">
            Limpar histórico
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {linhaDoTempo.map((d) => (
          <div key={d.dia} className="mb-4">
            <div className="my-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="rounded-full border border-border px-3 py-0.5 text-xs font-medium text-muted-foreground">{rotuloDoDia(d.dia)}</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-2.5">
              {d.eventos.map((e) =>
                e.tipo === 'atividade' ? (
                  <p key={e.a.id} className="group flex gap-2 text-[13px] leading-snug text-muted-foreground">
                    <span className="flex-1">
                      <span className="font-semibold text-foreground">{primeiroNome(pessoa(e.a.autor_id))}</span> {frase(e.a)}
                    </span>
                    <span className="shrink-0 tabular-nums text-xs">{horaLocal(e.a.created_at)}</span>
                    {isAdmin && (
                      <button type="button" onClick={() => apagarAtividade(e.a)} className="shrink-0 opacity-0 group-hover:opacity-100" title="Apagar do histórico">
                        <Trash2 className="h-3.5 w-3.5 hover:text-red-600" />
                      </button>
                    )}
                  </p>
                ) : (
                  <div key={e.c.id} className="group flex gap-2.5 py-1">
                    <Avatarzinho pessoa={pessoa(e.c.autor_id)} tamanho={28} />
                    <div className={cn('min-w-0 flex-1 rounded-xl px-3 py-2', e.c.autor_id === user?.id ? 'bg-primary/10' : 'bg-muted')}>
                      <div className="mb-0.5 flex items-baseline gap-2">
                        <span className="text-sm font-semibold">{pessoa(e.c.autor_id)?.full_name ?? 'Alguém'}</span>
                        <span className="text-[11px] text-muted-foreground">{horaLocal(e.c.created_at)}</span>
                        {e.c.autor_id === user?.id && (
                          <button type="button" onClick={() => apagar(e.c)} className="ml-auto opacity-0 group-hover:opacity-100" title="Apagar">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm">{e.c.texto}</p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
        <div ref={fim} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
        className="border-t border-border p-3"
      >
        <div className="rounded-xl border border-input bg-background p-2 focus-within:border-primary">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            rows={2}
            placeholder="Escreva um comentário para o time..."
            className="w-full resize-none bg-transparent px-1 text-sm outline-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Enter envia · Shift+Enter quebra linha</span>
            <button type="submit" disabled={!texto.trim()} className="rounded-lg bg-primary p-2 text-primary-foreground disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </aside>
  );
}
