import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleDot,
  Columns3,
  ExternalLink,
  GanttChartSquare,
  Hourglass,
  Link2,
  List,
  Loader2,
  Lock,
  Plus,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Anexos } from './Anexos';
import { CampoEtiquetas } from './Etiquetas';
import { Conversa } from './Conversa';
import { LinhaDoTempo } from './LinhaDoTempo';
import { ListaDeItens } from './ListaDeItens';
import { Avatares, BandeiraPrioridade, BarraProgresso, CampoData, PilulaStatus, SeletorDePessoas } from './pecas';
import { STATUS, bloqueadoPor, db, descendentes, progresso, statusDe, type Item, type ItemChecklist, type LinkItem } from './projetos';
import { useItens, type DadosDosItens } from './useItens';

// A página grande de um projeto (ou de uma subtarefa), como a tarefa aberta no
// ClickUp: à esquerda, título, campos (status, início e vencimento, vários
// responsáveis, prioridade, estimativa e etiquetas), descrição com arquivos,
// subtarefas em lista, quadro ou linha do tempo, checklist, links e dependências;
// à direita, comentários e histórico. (Os prazos das etapas saíram a pedido da
// equipe, 09/11/2026; as colunas continuam no banco, sem uso.)

export default function ItemMarketing() {
  const { id } = useParams<{ id: string }>();
  const [projetoId, setProjetoId] = useState<string | null>(null);
  const [naoAchou, setNaoAchou] = useState(false);

  // Descobre de qual projeto o item faz parte, para carregar o projeto inteiro.
  useEffect(() => {
    if (!id) return;
    setNaoAchou(false);
    db.from('marketing_itens')
      .select('id, projeto_id')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setNaoAchou(true);
        else setProjetoId((data.projeto_id as string | null) ?? (data.id as string));
      });
  }, [id]);

  if (naoAchou) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl py-16 text-center">
          <p className="mb-4 font-medium">Não encontrei este item. Ele pode ter sido excluído.</p>
          <Link to="/marketing/projetos" className="text-primary hover:underline">
            Voltar para Projetos
          </Link>
        </div>
      </MainLayout>
    );
  }
  if (!id || !projetoId) return <Carregando />;
  return <Pagina id={id} projetoId={projetoId} />;
}

function Carregando() {
  return (
    <MainLayout>
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </MainLayout>
  );
}

type VisaoSub = 'lista' | 'quadro' | 'linha';

function Pagina({ id, projetoId }: { id: string; projetoId: string }) {
  const navigate = useNavigate();
  const dados = useItens(projetoId);
  const { itens, equipe, carregando, salvar, excluir } = dados;
  const item = itens.find((t) => t.id === id);
  const [visao, setVisao] = useState<VisaoSub>('lista');
  const [contagens, setContagens] = useState<{
    anexos: Record<string, number>;
    checklist: Record<string, number>;
  }>({ anexos: {}, checklist: {} });

  // Ícones de anexo e checklist nas linhas das subtarefas.
  useEffect(() => {
    if (!itens.length) return;
    const ids = itens.map((t) => t.id);
    Promise.all([
      db.from('marketing_anexos').select('item_id').in('item_id', ids),
      db.from('marketing_checklist').select('item_id').in('item_id', ids),
    ]).then(([a, c]) => {
      const contar = (rows: { item_id: string }[] | null) =>
        (rows ?? []).reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.item_id]: (acc[r.item_id] ?? 0) + 1 }), {});
      setContagens({
        anexos: contar(a.data as { item_id: string }[]),
        checklist: contar(c.data as { item_id: string }[]),
      });
    });
  }, [itens]);

  if (carregando || !item) return <Carregando />;

  const ehProjeto = !item.item_pai_id;
  const caminho: Item[] = [];
  for (let p = itens.find((t) => t.id === item.item_pai_id); p; p = itens.find((t) => t.id === p!.item_pai_id)) caminho.unshift(p);
  const filhos = itens.filter((t) => t.item_pai_id === item.id);
  const abaixo = itens.filter((t) => descendentes(item.id, itens).includes(t.id));
  const prog = progresso(abaixo);
  const abrir = (x: string) => navigate(`/marketing/projetos/${x}`);
  const fechar = () => navigate(item.item_pai_id ? `/marketing/projetos/${item.item_pai_id}` : '/marketing/projetos');

  return (
    <MainLayout>
      <div className="-m-4 flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden bg-background sm:-m-6 lg:-m-8">
        {/* Barra do topo: caminho e fechar */}
        <div className="flex items-center gap-2 border-b border-border px-5 py-2.5 text-sm">
          {/* Voltar: da subtarefa para o item de cima (o projeto); do projeto, para a lista. */}
          <button
            type="button"
            onClick={fechar}
            className="mr-1 flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-medium hover:border-primary/50 hover:text-primary"
            title={caminho.length ? `Voltar para ${caminho[caminho.length - 1].titulo}` : 'Voltar para Projetos'}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="max-w-[220px] truncate">{caminho.length ? caminho[caminho.length - 1].titulo : 'Projetos'}</span>
          </button>
          <Link to="/marketing/projetos" className="text-muted-foreground hover:text-primary">
            Projetos
          </Link>
          {caminho.map((p) => (
            <span key={p.id} className="flex min-w-0 items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <button type="button" onClick={() => abrir(p.id)} className="truncate text-muted-foreground hover:text-primary">
                {p.titulo}
              </button>
            </span>
          ))}
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{item.titulo}</span>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Excluir "${item.titulo}"${filhos.length ? ' e todas as subtarefas' : ''}?`)) {
                  excluir(item.id);
                  fechar();
                }
              }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button type="button" onClick={fechar} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" title="Fechar">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Conteúdo */}
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-5xl px-6 pb-16 pt-6 sm:px-10">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground">
                <CircleDot className="h-3.5 w-3.5" />
                {ehProjeto ? 'Projeto' : 'Subtarefa'}
                {abaixo.length > 0 && (
                  <span className="ml-1">
                    · {abaixo.length} {abaixo.length === 1 ? 'subtarefa' : 'subtarefas'}
                  </span>
                )}
              </span>
              <Titulo item={item} salvar={salvar} />

              {bloqueadoPor(item, itens).length > 0 && (
                <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Aguardando:{' '}
                    {bloqueadoPor(item, itens).map((b, i, l) => (
                      <button key={b.id} type="button" onClick={() => abrir(b.id)} className="font-medium hover:underline">
                        {b.titulo}
                        {i < l.length - 1 ? ', ' : ''}
                      </button>
                    ))}
                  </span>
                </div>
              )}

              {/* Campos, como no ClickUp */}
              <div className="mb-6 grid grid-cols-1 gap-x-10 md:grid-cols-2">
                <Campo icone={<CircleDot className="h-4 w-4" />} rotulo="Status">
                  <span className="flex items-center gap-1.5">
                    <PilulaStatus valor={item.status} onMudar={(s) => salvar(item.id, { status: s })} grande />
                    <button
                      type="button"
                      onClick={() =>
                        salvar(item.id, {
                          status: item.status === 'concluida' ? 'a_fazer' : 'concluida',
                        })
                      }
                      className={cn(
                        'flex h-[30px] w-[30px] items-center justify-center rounded-md border',
                        item.status === 'concluida'
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-border hover:border-emerald-500 hover:text-emerald-600',
                      )}
                      title={item.status === 'concluida' ? 'Reabrir' : 'Concluir'}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </span>
                </Campo>
                <Campo icone={<Users className="h-4 w-4" />} rotulo="Responsáveis">
                  <SeletorDePessoas equipe={equipe} valor={item.responsaveis} onMudar={(ids) => salvar(item.id, { responsaveis: ids })}>
                    {item.responsaveis.length ? (
                      <span className="flex items-center gap-2">
                        <Avatares ids={item.responsaveis} equipe={equipe} max={5} tamanho={26} />
                        <span className="text-sm">
                          {item.responsaveis.length === 1
                            ? equipe.find((p) => p.user_id === item.responsaveis[0])?.full_name
                            : `${item.responsaveis.length} pessoas`}
                        </span>
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Vazio</span>
                    )}
                  </SeletorDePessoas>
                </Campo>
                <Campo icone={<GanttChartSquare className="h-4 w-4" />} rotulo="Datas">
                  <span className="flex items-center gap-1">
                    <CampoData valor={item.data_inicio} onMudar={(d) => salvar(item.id, { data_inicio: d })} placeholder="Início" semSinal />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <CampoData
                      valor={item.prazo}
                      onMudar={(d) => salvar(item.id, { prazo: d })}
                      placeholder="Vencimento"
                      concluido={item.status === 'concluida'}
                    />
                  </span>
                </Campo>
                <Campo icone={<span className="h-4 w-4 text-center text-[13px] leading-4">⚑</span>} rotulo="Prioridade">
                  <BandeiraPrioridade valor={item.prioridade} onMudar={(p) => salvar(item.id, { prioridade: p })} comNome />
                </Campo>
                <Campo icone={<Hourglass className="h-4 w-4" />} rotulo="Estimativa de tempo">
                  <span className="flex items-center gap-1 text-sm">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      key={item.estimativa_horas ?? 'vazio'}
                      defaultValue={item.estimativa_horas ?? ''}
                      onBlur={(e) => {
                        const v = e.target.value ? Number(e.target.value) : null;
                        if (v !== item.estimativa_horas) salvar(item.id, { estimativa_horas: v });
                      }}
                      placeholder="Vazio"
                      className="w-16 rounded bg-transparent px-1 py-0.5 hover:bg-muted focus:bg-muted focus:outline-none"
                    />
                    {item.estimativa_horas != null && <span className="text-muted-foreground">horas</span>}
                  </span>
                </Campo>
                <Campo icone={<Tag className="h-4 w-4" />} rotulo="Etiquetas">
                  <CampoEtiquetas valor={item.etiquetas} onMudar={(e) => salvar(item.id, { etiquetas: e })} />
                </Campo>
              </div>

              {/* Descrição e arquivos */}
              <Secao titulo="Descrição">
                <Descricao item={item} salvar={salvar} />
                <div className="mt-4">
                  <Anexos itemId={item.id} />
                </div>
              </Secao>

              {/* Subtarefas: só no projeto (um nível só, pedido de 09/11/2026) */}
              {ehProjeto && (
                <Secao
                  titulo="Subtarefas"
                  extra={
                    <span className="flex flex-1 items-center gap-3">
                      {abaixo.length > 0 && (
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="w-24">
                            <BarraProgresso pct={prog.pct} />
                          </span>
                          {abaixo.length - prog.feitas} em aberto
                        </span>
                      )}
                      <span className="ml-auto flex rounded-lg border border-border p-0.5">
                        {(
                          [
                            ['lista', List, 'Lista'],
                            ['quadro', Columns3, 'Quadro'],
                            ['linha', GanttChartSquare, 'Linha do tempo'],
                          ] as const
                        ).map(([v, Icone, nome]) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setVisao(v)}
                            className={cn(
                              'flex items-center gap-1 rounded-md px-2 py-1 text-xs',
                              visao === v ? 'bg-muted font-semibold' : 'text-muted-foreground hover:text-foreground',
                            )}
                          >
                            <Icone className="h-3.5 w-3.5" />
                            {nome}
                          </button>
                        ))}
                      </span>
                    </span>
                  }
                >
                  {visao === 'lista' && (
                    <ListaDeItens
                      raizes={filhos}
                      dados={dados}
                      onAbrir={abrir}
                      paiDosNovos={item.id}
                      rotuloNovo="Nova subtarefa"
                      contagens={contagens}
                    />
                  )}
                  {visao === 'quadro' && <Quadro filhos={filhos} dados={dados} onAbrir={abrir} paiId={item.id} />}
                  {visao === 'linha' && (
                    <LinhaDoTempo
                      linhas={[item, ...abaixo].map((t) => ({
                        id: t.id,
                        rotulo: t.titulo,
                        recuo: t.id !== item.id,
                        cor: statusDe(t.status).cor,
                        de: t.data_inicio ?? t.prazo,
                        ate: t.prazo ?? t.data_inicio,
                        feito: t.status === 'concluida',
                        detalhe: <Avatares ids={t.responsaveis} equipe={equipe} tamanho={20} max={2} />,
                      }))}
                      onAbrir={(x) => x !== item.id && abrir(x)}
                      onMudarDatas={(x, de, ate) => salvar(x, { data_inicio: de, prazo: ate })}
                    />
                  )}
                </Secao>
              )}

              <Checklist itemId={item.id} />
              <Links valor={item.links} onMudar={(l) => salvar(item.id, { links: l })} />
              <Secao titulo="Aguardando" extra={<span className="text-xs text-muted-foreground">itens que precisam terminar antes deste</span>}>
                <Dependencias item={item} todos={itens} onMudar={(ids) => salvar(item.id, { aguardando: ids })} onAbrir={abrir} />
              </Secao>
            </div>
          </div>

          {/* Comentários e histórico */}
          <PainelRedimensionavel>
            <Conversa itemId={item.id} equipe={equipe} />
          </PainelRedimensionavel>
        </div>
      </div>
    </MainLayout>
  );
}

// ---------- peças da página ----------

const LARGURA_PADRAO = 400;
const LARGURA_MIN = 300;
const LARGURA_MAX = 800;
const CHAVE_LARGURA = 'marketing-projetos-largura-chat';

/**
 * A coluna dos comentários com uma alça na divisória: arrastar aumenta ou diminui
 * o chat (cada pessoa escolhe; fica guardado no navegador). Duplo clique na alça
 * volta ao tamanho padrão. No celular a coluna vai para baixo, sem alça.
 */
function PainelRedimensionavel({ children }: { children: React.ReactNode }) {
  const [largura, setLargura] = useState(() => {
    try {
      const salva = Number(localStorage.getItem(CHAVE_LARGURA));
      return salva >= LARGURA_MIN && salva <= LARGURA_MAX ? salva : LARGURA_PADRAO;
    } catch {
      return LARGURA_PADRAO;
    }
  });
  const [arrastando, setArrastando] = useState(false);

  const guardar = (l: number) => {
    try {
      localStorage.setItem(CHAVE_LARGURA, String(l));
    } catch {
      /* sem armazenamento: só não lembra a largura */
    }
  };

  // O arraste escuta a janela inteira e SEMPRE termina: ao soltar o mouse, ao
  // cancelar o toque, ao sair da janela ou ao trocar de aba. (A primeira versão
  // usava uma camada por cima da tela que às vezes não recebia o "soltar" e
  // deixava o cursor preso, 09/11/2026.)
  const comecar = (e: React.PointerEvent) => {
    e.preventDefault();
    const x0 = e.clientX;
    const l0 = largura;
    let atual = l0;
    setArrastando(true);
    const corpo = document.body.style;
    const antes = { cursor: corpo.cursor, userSelect: corpo.userSelect };
    corpo.cursor = 'col-resize';
    corpo.userSelect = 'none';

    const mover = (ev: PointerEvent) => {
      atual = Math.min(LARGURA_MAX, Math.max(LARGURA_MIN, l0 + (x0 - ev.clientX)));
      setLargura(atual);
    };
    const terminar = () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', terminar);
      window.removeEventListener('pointercancel', terminar);
      window.removeEventListener('blur', terminar);
      corpo.cursor = antes.cursor;
      corpo.userSelect = antes.userSelect;
      setArrastando(false);
      guardar(atual);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', terminar);
    window.addEventListener('pointercancel', terminar);
    window.addEventListener('blur', terminar);
  };

  return (
    <div
      className="relative flex min-h-[420px] shrink-0 flex-col lg:min-h-0 lg:[width:var(--largura-chat)]"
      style={{ ['--largura-chat' as string]: `${largura}px` }}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        title="Arraste para aumentar ou diminuir os comentários (duplo clique volta ao padrão)"
        onPointerDown={comecar}
        onDoubleClick={() => {
          setLargura(LARGURA_PADRAO);
          guardar(LARGURA_PADRAO);
        }}
        className={cn(
          'absolute inset-y-0 -left-1.5 z-10 hidden w-3 cursor-col-resize touch-none select-none lg:block',
          'after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:transition-colors hover:after:bg-primary/60',
          arrastando && 'after:bg-primary',
        )}
      />
      {children}
    </div>
  );
}

function Titulo({ item, salvar }: { item: Item; salvar: DadosDosItens['salvar'] }) {
  const [texto, setTexto] = useState(item.titulo);
  useEffect(() => {
    setTexto(item.titulo);
  }, [item.titulo]);
  return (
    <textarea
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => texto.trim() && texto !== item.titulo && salvar(item.id, { titulo: texto.trim() })}
      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), (e.target as HTMLTextAreaElement).blur())}
      rows={1}
      className="mb-6 w-full resize-none bg-transparent text-3xl font-bold leading-tight tracking-tight outline-none [field-sizing:content]"
    />
  );
}

function Campo({ icone, rotulo, children }: { icone: React.ReactNode; rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[44px] items-center gap-3 py-1">
      <span className="flex w-44 shrink-0 items-center gap-2.5 text-sm text-muted-foreground">
        {icone}
        {rotulo}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Secao({ titulo, extra, children }: { titulo: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-10 border-t border-border pt-6">
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-base font-semibold">{titulo}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

function Descricao({ item, salvar }: { item: Item; salvar: DadosDosItens['salvar'] }) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  // O editor só lê o conteúdo inicial: remonta ao trocar de item.
  return (
    <div className="rounded-xl border border-border">
      <RichTextEditor
        key={item.id}
        content={item.descricao ?? ''}
        placeholder="Adicione uma descrição: objetivo, briefing, referências, critérios de pronto..."
        onChange={(html) => {
          clearTimeout(timer.current);
          timer.current = setTimeout(() => salvar(item.id, { descricao: html }), 800);
        }}
      />
    </div>
  );
}

function Quadro({ filhos, dados, onAbrir, paiId }: { filhos: Item[]; dados: DadosDosItens; onAbrir: (id: string) => void; paiId: string }) {
  const { itens, equipe, salvar, criar } = dados;
  const [arrastando, setArrastando] = useState<string | null>(null);
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STATUS.map((st) => {
        const doStatus = filhos.filter((t) => t.status === st.chave);
        return (
          <div
            key={st.chave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (arrastando) salvar(arrastando, { status: st.chave });
              setArrastando(null);
            }}
            className="flex w-64 shrink-0 flex-col rounded-xl bg-muted/50"
          >
            <div className="flex items-center gap-2 px-3 pb-2 pt-3">
              <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: st.cor }}>
                {st.nome}
              </span>
              <span className="text-xs text-muted-foreground">{doStatus.length}</span>
            </div>
            <div className="flex min-h-[60px] flex-col gap-2 px-2 pb-2">
              {doStatus.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setArrastando(t.id)}
                  onDragEnd={() => setArrastando(null)}
                  onClick={() => onAbrir(t.id)}
                  className={cn(
                    'cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md',
                    arrastando === t.id && 'opacity-40',
                  )}
                >
                  <p className={cn('mb-2 text-sm font-medium', t.status === 'concluida' && 'text-muted-foreground line-through')}>{t.titulo}</p>
                  <div className="flex items-center gap-2">
                    <Avatares ids={t.responsaveis} equipe={equipe} tamanho={22} />
                    <CampoData valor={t.prazo} onMudar={(d) => salvar(t.id, { prazo: d })} placeholder="" concluido={t.status === 'concluida'} />
                    {itens.some((x) => x.item_pai_id === t.id) && (
                      <span className="ml-auto text-xs text-muted-foreground">{itens.filter((x) => x.item_pai_id === t.id).length} sub</span>
                    )}
                  </div>
                </div>
              ))}
              <NovoCartao onCriar={(titulo) => criar({ titulo, item_pai_id: paiId, status: st.chave })} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NovoCartao({ onCriar }: { onCriar: (t: string) => void }) {
  const [texto, setTexto] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (texto.trim()) onCriar(texto.trim());
        setTexto('');
      }}
      className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-card"
    >
      <Plus className="h-4 w-4 text-muted-foreground" />
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Nova subtarefa"
        className="w-full bg-transparent py-1 text-sm outline-none"
      />
    </form>
  );
}

function Checklist({ itemId }: { itemId: string }) {
  const [itens, setItens] = useState<ItemChecklist[]>([]);
  const [texto, setTexto] = useState('');
  const carregar = async () => {
    const { data } = await db.from('marketing_checklist').select('*').eq('item_id', itemId).order('ordem').order('created_at');
    setItens((data ?? []) as ItemChecklist[]);
  };
  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);
  const feitos = itens.filter((i) => i.feito).length;

  const criar = async () => {
    const t = texto.trim();
    if (!t) return;
    setTexto('');
    const { data, error } = await db.from('marketing_checklist').insert({ item_id: itemId, texto: t, ordem: itens.length }).select('*').single();
    if (error) return toast.error('Não consegui adicionar o item.');
    setItens((l) => [...l, data as ItemChecklist]);
  };
  const mudar = async (i: ItemChecklist, campos: Partial<ItemChecklist>) => {
    setItens((l) => l.map((x) => (x.id === i.id ? { ...x, ...campos } : x)));
    await db.from('marketing_checklist').update(campos).eq('id', i.id);
  };
  const apagar = async (i: ItemChecklist) => {
    setItens((l) => l.filter((x) => x.id !== i.id));
    await db.from('marketing_checklist').delete().eq('id', i.id);
  };

  return (
    <Secao
      titulo="Checklist"
      extra={
        itens.length > 0 && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-24">
              <BarraProgresso pct={Math.round((feitos / itens.length) * 100)} />
            </span>
            {feitos}/{itens.length}
          </span>
        )
      }
    >
      <div className="overflow-hidden rounded-xl border border-border">
        {itens.map((i) => (
          <div key={i.id} className="group flex items-center gap-3 border-b border-border px-4 py-2 last:border-0 hover:bg-muted/40">
            <button
              type="button"
              onClick={() => mudar(i, { feito: !i.feito })}
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                i.feito ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-muted-foreground/50',
              )}
            >
              {i.feito && <Check className="h-3 w-3" />}
            </button>
            <span className={cn('flex-1 text-sm', i.feito && 'text-muted-foreground line-through')}>{i.texto}</span>
            <button type="button" onClick={() => apagar(i)} className="opacity-0 group-hover:opacity-100" title="Remover">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            criar();
          }}
          className="flex items-center gap-2 px-4 py-1.5"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Novo item do checklist (Enter)"
            className="flex-1 bg-transparent py-1 text-sm outline-none"
          />
        </form>
      </div>
    </Secao>
  );
}

function Links({ valor, onMudar }: { valor: LinkItem[]; onMudar: (l: LinkItem[]) => void }) {
  const [url, setUrl] = useState('');
  const adicionar = () => {
    let u = url.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    onMudar([...valor, { nome: u.replace(/^https?:\/\//, '').split('/')[0], url: u }]);
    setUrl('');
  };
  return (
    <Secao titulo="Links">
      <div className="space-y-1.5">
        {valor.map((l, i) => (
          <div key={i} className="group flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <a href={l.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm text-primary hover:underline" title={l.url}>
              {l.url}
            </a>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            <button type="button" onClick={() => onMudar(valor.filter((_, j) => j !== i))} className="opacity-0 group-hover:opacity-100">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            adicionar();
          }}
          className="flex gap-2"
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Cole um link do Figma, Drive, Canva... (Enter)"
            className="flex-1 rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </form>
      </div>
    </Secao>
  );
}

function Dependencias({
  item,
  todos,
  onMudar,
  onAbrir,
}: {
  item: Item;
  todos: Item[];
  onMudar: (ids: string[]) => void;
  onAbrir: (id: string) => void;
}) {
  const escolhidos = todos.filter((t) => item.aguardando.includes(t.id));
  const proibidos = new Set([item.id, ...descendentes(item.id, todos), ...item.aguardando]);
  const opcoes = todos.filter((t) => !proibidos.has(t.id));
  const nomes = useMemo(() => Object.fromEntries(todos.map((t) => [t.id, t.titulo])), [todos]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {escolhidos.map((t) => (
        <span key={t.id} className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-sm">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusDe(t.status).cor }} />
          <button type="button" onClick={() => onAbrir(t.id)} className="hover:text-primary">
            {nomes[t.id]}
          </button>
          <button type="button" onClick={() => onMudar(item.aguardando.filter((x) => x !== t.id))}>
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </span>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </button>
        </PopoverTrigger>
        <PopoverContent className="max-h-72 w-72 overflow-y-auto p-1" align="start">
          {opcoes.length === 0 && <p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum outro item no projeto.</p>}
          {opcoes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onMudar([...item.aguardando, t.id])}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: statusDe(t.status).cor }} />
              <span className="truncate">{t.titulo}</span>
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
