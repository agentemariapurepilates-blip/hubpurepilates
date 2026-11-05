import { supabase } from '@/integrations/supabase/client';
import { MARCAS, type Marca } from '../../../../supabase/functions/blog-gerar-artigo/marcas';

// A mesma conferência de SEO e o mesmo revezamento de marcas que as functions
// usam no servidor, para a tela mostrar exatamente o que o Gemini recebe.
export { conferirArtigo } from '../../../../supabase/functions/blog-gerar-artigo/texto';
export { MARCAS, ORDEM_DAS_MARCAS, diasDoMes, diasPlanejaveis, hojeEmSaoPaulo, marcaDoDia, type Marca } from '../../../../supabase/functions/blog-gerar-artigo/marcas';

export type StatusArtigo =
  | 'sugestao'
  | 'descartada'
  | 'na_fila'
  | 'gerando'
  | 'falhou'
  | 'rascunho'
  | 'em_aprovacao'
  | 'ajustes'
  | 'aprovado'
  | 'agendado'
  | 'publicado';

export interface ArtigoBlog {
  id: string;
  status: StatusArtigo;
  marca: Marca;
  data_prevista: string | null;
  tema: string;
  palavra_chave: string | null;
  categoria: string | null;
  publico: string;
  tamanho: string;
  observacoes: string | null;
  titulo: string;
  slug: string;
  meta_descricao: string;
  tags: string[];
  conteudo_html: string;
  avisos_seo: string[];
  erro_geracao: string | null;
  tentativas: number;
  foto_url: string | null;
  cena_foto: string | null;
  capa_status: 'pendente' | 'gerando' | 'pronta' | 'falhou' | null;
  capa_erro: string | null;
  capa_tentativas: number;
  wp_post_id: number | null;
  wp_url: string | null;
  wp_media_id: number | null;
  wp_erro: string | null;
  agendado_para: string | null;
  publicado_em: string | null;
  comentario_revisao: string | null;
  enviado_por: string | null;
  enviado_em: string | null;
  revisado_por: string | null;
  revisado_em: string | null;
  criado_por: string | null;
  created_at: string;
  updated_at: string;
}

/** O que o Gemini devolve: só o texto, sem a pauta nem o status. */
export interface TextoGerado {
  palavra_chave: string;
  titulo: string;
  slug: string;
  meta_descricao: string;
  tags: string[];
  conteudo_html: string;
  cena_foto?: string;
}

export interface Pauta {
  marca: Marca;
  tema: string;
  palavraChave: string;
  categoria: string;
  tamanho: string;
  observacoes: string;
}

export const STATUS: Record<StatusArtigo, { rotulo: string; classe: string }> = {
  sugestao: { rotulo: 'Sugestão', classe: 'bg-muted text-muted-foreground' },
  descartada: { rotulo: 'Sem postagem', classe: 'bg-muted text-muted-foreground' },
  na_fila: { rotulo: 'Na fila', classe: 'bg-slate-100 text-slate-700' },
  gerando: { rotulo: 'Escrevendo', classe: 'bg-violet-100 text-violet-800' },
  falhou: { rotulo: 'Falhou', classe: 'bg-red-100 text-red-800' },
  rascunho: { rotulo: 'Rascunho', classe: 'bg-muted text-muted-foreground' },
  ajustes: { rotulo: 'Pediram ajustes', classe: 'bg-amber-100 text-amber-800' },
  em_aprovacao: { rotulo: 'Para aprovar', classe: 'bg-blue-100 text-blue-800' },
  aprovado: { rotulo: 'Aprovado', classe: 'bg-emerald-100 text-emerald-800' },
  agendado: { rotulo: 'Agendado', classe: 'bg-sky-100 text-sky-800' },
  publicado: { rotulo: 'Publicado', classe: 'bg-primary/10 text-primary' },
};

export const COR_DA_MARCA: Record<Marca, string> = {
  studios: 'bg-rose-100 text-rose-800',
  academy: 'bg-violet-100 text-violet-800',
  franchising: 'bg-zinc-800 text-white',
};

// O público vai para a coluna `publico`, que guarda para quem o texto foi escrito.
export const PUBLICO_DA_MARCA: Record<Marca, string> = {
  studios: 'alunos',
  academy: 'profissionais',
  franchising: 'investidores',
};

export const TAMANHOS = [
  { valor: 'curto', rotulo: 'Curto, cerca de 600 palavras' },
  { valor: 'medio', rotulo: 'Médio, cerca de 900 palavras' },
  { valor: 'longo', rotulo: 'Longo, cerca de 1.300 palavras' },
];

export const categoriasDa = (marca: Marca) => MARCAS[marca].categorias;

export const pautaDoArtigo = (a: ArtigoBlog): Pauta => ({
  marca: a.marca,
  tema: a.tema,
  palavraChave: a.palavra_chave ?? '',
  categoria: a.categoria ?? '',
  tamanho: a.tamanho,
  observacoes: a.observacoes ?? '',
});

export const contarPalavras = (html: string): number =>
  html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

/** Mês corrente no formato '2026-11'. */
export const mesAtual = () => {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
};

export const somarMeses = (mes: string, n: number) => {
  const [ano, m] = mes.split('-').map(Number);
  const d = new Date(ano, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const nomeDoMes = (mes: string) => {
  const [ano, m] = mes.split('-').map(Number);
  const nome = new Date(ano, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
};

/** '2026-11-03' vira 'ter, 03/11'. */
export const rotuloDoDia = (data: string) => {
  const [ano, m, d] = data.split('-').map(Number);
  const semana = new Date(ano, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return `${semana}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
};

/**
 * Chama uma function do Blog e devolve o corpo. O invoke do Supabase só diz
 * "non-2xx"; o motivo de verdade vem no corpo da resposta.
 */
async function chamar<T>(funcao: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(funcao, { body });
  if (error) {
    const resposta = (error as { context?: Response }).context;
    if (resposta?.status === 404) throw new Error(`a função ${funcao} ainda não está publicada no Supabase`);
    let motivo = '';
    try {
      motivo = (await resposta?.json())?.erro ?? '';
    } catch {
      /* sem corpo legível */
    }
    throw new Error(motivo || 'não consegui falar com o Gemini agora');
  }
  if (data?.erro) throw new Error(data.erro);
  return data as T;
}

/**
 * Pede o texto ao Gemini. Sem `ajuste`, escreve um artigo novo; com `ajuste`,
 * reescreve seguindo o pedido.
 */
export const escreverComGemini = (pauta: Pauta, ajuste?: { artigo: TextoGerado; pedido: string }) =>
  chamar<{ artigo: TextoGerado; avisos: string[] }>('blog-gerar-artigo', { pauta, ...(ajuste ?? {}) });

/** Sugere pautas para os dias livres do mês, ou só para `dias`. Grava como sugestão. */
export const sugerirPautas = (mes: string, opcoes?: { dias?: string[]; marca?: Marca }) =>
  chamar<{ sugestoes: ArtigoBlog[]; faltaram?: string[]; mensagem?: string }>('blog-sugerir-pautas', { mes, ...opcoes });

/** Empurra a fila: escreve o próximo artigo sem esperar o minuto do cron. */
export const produzirAgora = () => chamar<{ processado: boolean }>('blog-produzir', {});

/** Guarda uma correção do time para as próximas gerações da marca. */
export async function registrarAprendizado(texto: string, marca: Marca | null, origem: 'revisao' | 'ajuste_gemini' | 'manual', artigoId?: string, userId?: string) {
  const limpo = texto.trim();
  if (limpo.length < 3) return;
  await supabase.from('blog_aprendizados').insert({
    texto: limpo.slice(0, 1000),
    marca,
    origem,
    artigo_id: artigoId ?? null,
    criado_por: userId ?? null,
  });
}

/** Nome de quem criou, enviou ou aprovou, para mostrar na tela. */
export async function buscarNomes(ids: (string | null)[]): Promise<Record<string, string>> {
  const unicos = [...new Set(ids.filter((i): i is string => !!i))];
  if (!unicos.length) return {};
  const { data } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', unicos);
  return Object.fromEntries((data ?? []).map((p) => [p.user_id, p.full_name || p.email]));
}

export const formatarData = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '';

/** Um artigo do mês no planejamento, com o que é preciso para aprovar da lista. */
export type ItemDoMes = Pick<
  ArtigoBlog,
  | 'id'
  | 'status'
  | 'marca'
  | 'data_prevista'
  | 'tema'
  | 'palavra_chave'
  | 'categoria'
  | 'observacoes'
  | 'titulo'
  | 'erro_geracao'
  | 'meta_descricao'
  | 'conteudo_html'
  | 'foto_url'
  | 'capa_status'
  | 'wp_post_id'
  | 'wp_erro'
  | 'wp_url'
  | 'agendado_para'
  | 'publicado_em'
>;

// As etapas do mês, na ordem em que um artigo passa por elas.
export const ETAPAS_DO_MES: { chave: string; rotulo: string; status: StatusArtigo[] }[] = [
  { chave: 'sugestoes', rotulo: 'Sugestões', status: ['sugestao'] },
  { chave: 'producao', rotulo: 'Em produção', status: ['na_fila', 'gerando', 'falhou'] },
  { chave: 'edicao', rotulo: 'Em edição', status: ['rascunho', 'ajustes'] },
  { chave: 'aprovar', rotulo: 'Para aprovar', status: ['em_aprovacao'] },
  // Aprovado vai sozinho para a agenda do WordPress. Fica em Aprovados só o que
  // ainda não foi: capa por fazer ou erro do WordPress.
  { chave: 'aprovados', rotulo: 'Aprovados', status: ['aprovado'] },
  { chave: 'agendados', rotulo: 'Agendados', status: ['agendado'] },
  // Quem marca é a function blog-conferir-publicados, de hora em hora, depois de
  // conferir no WordPress que o post entrou no ar.
  { chave: 'publicados', rotulo: 'Publicados', status: ['publicado'] },
];

/** 'qui, 20/11 às 09h', no horário de Brasília. */
export const rotuloDoAgendamento = (iso: string) => {
  const d = new Date(iso);
  const dia = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }).replace('.', '');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).replace(':00', 'h');
  return `${dia} às ${hora}`;
};

/** O post no painel do WordPress (o link público só abre depois de publicado). */
export const linkNoPainelWp = (wpPostId: number) => `https://blog.purepilates.com.br/wp-admin/post.php?post=${wpPostId}&action=edit`;
