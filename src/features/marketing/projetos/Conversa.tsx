import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Paperclip, Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { COR, ICONE, subirArquivos } from './Anexos';
import { Avatarzinho } from './pecas';
import {
  BUCKET_ANEXOS,
  PRIORIDADES,
  dataLonga,
  db,
  nomeDeCanal,
  primeiroNome,
  statusDe,
  tamanhoLegivel,
  tipoDoArquivo,
  type Anexo,
  type Atividade,
  type Comentario,
  type PessoaMarketing,
  type StatusItem,
} from './projetos';

// A coluna da direita, como no ClickUp: comentários do time e o histórico de
// alterações (gravado pelo banco), misturados e separados por dia. Arquivo
// mandado junto com um comentário vai para os anexos do item, ligado a esse
// comentário, e aparece dentro dele (pedido de 09/11/2026).

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const diaLocal = (iso: string) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date(iso));
const horaLocal = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
const rotuloDoDia = (d: string) => {
  const x = new Date(`${d}T12:00:00Z`);
  return `${DIAS[x.getUTCDay()]}, ${x.getUTCDate()} de ${MESES[x.getUTCMonth()]}`;
};

export function Conversa({ itemId, equipe }: { itemId: string; equipe: PessoaMarketing[] }) {
  const { user, isAdmin } = useAuth();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [atividade, setAtividade] = useState<Atividade[]>([]);
  const [texto, setTexto] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [sobre, setSobre] = useState(false);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [links, setLinks] = useState<Record<string, string>>({});
  const fim = useRef<HTMLDivElement>(null);
  const seletor = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    const [c, a, x] = await Promise.all([
      db.from('marketing_comentarios').select('*').eq('item_id', itemId).order('created_at'),
      db.from('marketing_atividade').select('*').eq('item_id', itemId).order('created_at'),
      db.from('marketing_anexos').select('*').eq('item_id', itemId).order('created_at'),
    ]);
    setComentarios((c.data ?? []) as Comentario[]);
    setAtividade((a.data ?? []) as Atividade[]);
    // Só os que subiram pelo chat; os enviados direto ficam na seção Anexos.
    const lista = ((x.data ?? []) as Anexo[]).filter((n) => n.comentario_id);
    setAnexos(lista);
    if (lista.length) {
      const { data: urls } = await db.storage.from(BUCKET_ANEXOS).createSignedUrls(
        lista.map((n) => n.caminho),
        60 * 60,
      );
      setLinks(Object.fromEntries((urls ?? []).map((u, i) => [lista[i].id, u.signedUrl ?? ''])));
    }
  }, [itemId]);

  useEffect(() => {
    carregar();
    const canal = db
      .channel(nomeDeCanal(`marketing-conversa-${itemId}`))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_comentarios', filter: `item_id=eq.${itemId}` }, carregar)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'marketing_atividade', filter: `item_id=eq.${itemId}` }, carregar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_anexos', filter: `item_id=eq.${itemId}` }, carregar)
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
        return (
          <>
            criou a subtarefa <b>{a.para}</b>
          </>
        );
      case 'anexo':
        return (
          <>
            anexou <b>{a.para}</b>
          </>
        );
      case 'titulo':
        return (
          <>
            renomeou de <b>{a.de}</b> para <b>{a.para}</b>
          </>
        );
      case 'responsaveis': {
        const antes = new Set((a.de ?? '').split(',').filter(Boolean));
        const depois = new Set((a.para ?? '').split(',').filter(Boolean));
        const entrou = [...depois].filter((x) => !antes.has(x)).join(',');
        const saiu = [...antes].filter((x) => !depois.has(x)).join(',');
        return (
          <>
            {entrou && (
              <>
                adicionou <b>{nomes(entrou)}</b> aos responsáveis
              </>
            )}
            {entrou && saiu && ' e '}
            {saiu && (
              <>
                removeu <b>{nomes(saiu)}</b> dos responsáveis
              </>
            )}
          </>
        );
      }
      default: {
        const nome = { status: 'o status', data_inicio: 'a data de início', prazo: 'o vencimento', prioridade: 'a prioridade' }[a.campo] ?? a.campo;
        if (!a.de)
          return (
            <>
              definiu {nome}: <b>{valor(a.para)}</b>
            </>
          );
        if (!a.para)
          return (
            <>
              removeu {nome} de <b>{valor(a.de)}</b>
            </>
          );
        return (
          <>
            alterou {nome} de <b>{valor(a.de)}</b> para <b>{valor(a.para)}</b>
          </>
        );
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

  const juntar = (lista: FileList | File[]) => setArquivos((a) => [...a, ...Array.from(lista)]);

  const enviar = async () => {
    const t = texto.trim();
    if ((!t && arquivos.length === 0) || enviando) return;
    const junto = arquivos;
    setTexto('');
    setArquivos([]);
    setEnviando(true);
    const { data, error } = await db.from('marketing_comentarios').insert({ item_id: itemId, autor_id: user?.id, texto: t }).select('id').single();
    if (error || !data) {
      setTexto(t);
      setArquivos(junto);
      setEnviando(false);
      toast.error('Não consegui enviar o comentário.');
      return;
    }
    if (junto.length) await subirArquivos(itemId, junto, user?.id, (data as { id: string }).id);
    setEnviando(false);
    carregar();
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
    <aside
      className={cn('relative flex min-h-0 flex-col border-l border-border bg-background', sobre && 'ring-2 ring-inset ring-primary')}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        setSobre(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setSobre(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setSobre(false);
        juntar(e.dataTransfer.files);
      }}
    >
      <div className="flex items-baseline gap-2 border-b border-border px-5 py-3.5">
        <span className="font-semibold">Comentários</span>
        <span className="text-xs text-muted-foreground">
          {comentarios.length} {comentarios.length === 1 ? 'mensagem' : 'mensagens'}
        </span>
        {isAdmin && atividade.length > 0 && (
          <button
            type="button"
            onClick={limparHistorico}
            className="ml-auto text-xs text-muted-foreground hover:text-red-600"
            title="Só administradores"
          >
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
                      <button
                        type="button"
                        onClick={() => apagarAtividade(e.a)}
                        className="shrink-0 opacity-0 group-hover:opacity-100"
                        title="Apagar do histórico"
                      >
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
                      {e.c.texto && <p className="whitespace-pre-wrap break-words text-sm">{e.c.texto}</p>}
                      <ArquivosDoComentario anexos={anexos.filter((n) => n.comentario_id === e.c.id)} links={links} />
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
          {arquivos.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {arquivos.map((f, i) => (
                <span key={`${f.name}-${i}`} className="flex max-w-full items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                  <Paperclip className="h-3 w-3 shrink-0" />
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setArquivos((a) => a.filter((_, j) => j !== i))}
                    title="Tirar"
                    className="shrink-0 rounded hover:bg-background"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            onPaste={(e) => {
              if (e.clipboardData.files.length) {
                e.preventDefault();
                juntar(e.clipboardData.files);
              }
            }}
            rows={2}
            placeholder="Escreva um comentário para o time..."
            className="w-full resize-none bg-transparent px-1 text-sm outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => seletor.current?.click()}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Anexar arquivo"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              ref={seletor}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) juntar(e.target.files);
                e.target.value = '';
              }}
            />
            <span className="flex-1 text-[11px] text-muted-foreground">Enter envia · arquivos vão para os anexos</span>
            <button
              type="submit"
              disabled={(!texto.trim() && arquivos.length === 0) || enviando}
              className="rounded-lg bg-primary p-2 text-primary-foreground disabled:opacity-40"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </form>
    </aside>
  );
}

/** Os arquivos que subiram junto com um comentário: foto em miniatura, o resto como ficha. */
function ArquivosDoComentario({ anexos, links }: { anexos: Anexo[]; links: Record<string, string> }) {
  if (!anexos.length) return null;
  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      {anexos.map((a) => {
        const tipo = tipoDoArquivo(a.nome, a.tipo);
        const url = links[a.id];
        if (tipo === 'imagem' && url) {
          return (
            <a key={a.id} href={url} target="_blank" rel="noreferrer" title={a.nome}>
              <img src={url} alt={a.nome} className="max-h-48 rounded-lg border border-border object-cover" />
            </a>
          );
        }
        const Icone = ICONE[tipo];
        return (
          <a
            key={a.id}
            href={url || undefined}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 hover:border-primary/50"
            title={a.nome}
          >
            <Icone className="h-5 w-5 shrink-0" style={{ color: COR[tipo] }} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium">{a.nome}</span>
              <span className="block text-[11px] text-muted-foreground">{tamanhoLegivel(a.tamanho)}</span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
