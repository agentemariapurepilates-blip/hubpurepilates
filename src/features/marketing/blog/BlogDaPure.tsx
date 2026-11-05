import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, Loader2, Plus } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { NovoArtigoDialog } from './NovoArtigoDialog';
import { PlanejamentoMes } from './PlanejamentoMes';
import { ContextoBlog } from './ContextoBlog';
import { COR_DA_MARCA, MARCAS, STATUS, buscarNomes, formatarData, rotuloDoDia, type ArtigoBlog, type StatusArtigo } from './blogTipos';

// As etapas da aba Artigos. As sugestões ficam no Planejamento, não aqui.
const ETAPAS: { chave: string; rotulo: string; status: StatusArtigo[] }[] = [
  { chave: 'aprovacao', rotulo: 'Para aprovar', status: ['em_aprovacao'] },
  { chave: 'edicao', rotulo: 'Em edição', status: ['rascunho', 'ajustes'] },
  { chave: 'producao', rotulo: 'Em produção', status: ['na_fila', 'gerando', 'falhou'] },
  { chave: 'aprovados', rotulo: 'Aprovados', status: ['aprovado'] },
  { chave: 'agendados', rotulo: 'Agendados', status: ['agendado'] },
  { chave: 'publicados', rotulo: 'Publicados', status: ['publicado'] },
];

type Linha = Pick<ArtigoBlog, 'id' | 'status' | 'marca' | 'data_prevista' | 'titulo' | 'tema' | 'categoria' | 'criado_por' | 'updated_at'>;

function ListaDeArtigos({ onNovo }: { onNovo: () => void }) {
  const [artigos, setArtigos] = useState<Linha[]>([]);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [etapa, setEtapa] = useState('aprovacao');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('blog_artigos')
        .select('id, status, marca, data_prevista, titulo, tema, categoria, criado_por, updated_at')
        .not('status', 'in', '(sugestao,descartada)')
        .order('data_prevista', { ascending: true, nullsFirst: false })
        .order('updated_at', { ascending: false });
      if (error) {
        // PGRST205: a tabela não existe, ou seja, a migração do Blog não rodou.
        setErro(
          error.code === 'PGRST205'
            ? 'A tabela do Blog ainda não foi criada no banco. Falta rodar a migração blog_artigos.'
            : 'Não consegui carregar os artigos agora.',
        );
      } else {
        setArtigos((data ?? []) as Linha[]);
        setNomes(await buscarNomes((data ?? []).map((a) => a.criado_por)));
      }
      setCarregando(false);
    })();
  }, []);

  const porEtapa = useMemo(
    () => Object.fromEntries(ETAPAS.map((e) => [e.chave, artigos.filter((a) => e.status.includes(a.status as StatusArtigo))])),
    [artigos],
  );
  const lista = porEtapa[etapa] ?? [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <Tabs value={etapa} onValueChange={setEtapa}>
          <TabsList>
            {ETAPAS.map((e) => (
              <TabsTrigger key={e.chave} value={e.chave}>
                {e.rotulo}
                <span className="ml-2 text-xs text-muted-foreground tabular-nums">{porEtapa[e.chave]?.length ?? 0}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="outline" onClick={onNovo} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Artigo avulso
        </Button>
      </div>

      {carregando ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : erro ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">{erro}</p>
      ) : lista.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <FileText className="h-6 w-6 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum artigo nesta etapa.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {lista.map((a) => (
            <li key={a.id}>
              <Link
                to={`/marketing/blog/${a.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-5 py-4 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{a.titulo || a.tema}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-1.5">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', COR_DA_MARCA[a.marca])}>{MARCAS[a.marca]?.nome}</span>
                    {[
                      a.data_prevista && `para ${rotuloDoDia(a.data_prevista)}`,
                      a.categoria,
                      a.criado_por ? `por ${nomes[a.criado_por] ?? 'alguém do time'}` : '',
                      `atualizado em ${formatarData(a.updated_at)}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-medium', STATUS[a.status as StatusArtigo]?.classe)}>
                  {STATUS[a.status as StatusArtigo]?.rotulo ?? a.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const BlogDaPure = () => {
  const [busca, setBusca] = useSearchParams();
  const aba = busca.get('aba') ?? 'planejamento';
  const [novoAberto, setNovoAberto] = useState(false);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-0.5 bg-primary rounded-full" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Marketing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Blog da Pure</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Um artigo por dia, revezando Studios, Academy e Franchising. O Gemini escreve, o time aprova.
          </p>
        </div>

        <Tabs value={aba} onValueChange={(v) => setBusca({ aba: v }, { replace: true })}>
          <TabsList className="mb-5">
            <TabsTrigger value="planejamento">Planejamento do mês</TabsTrigger>
            <TabsTrigger value="artigos">Artigos</TabsTrigger>
            <TabsTrigger value="contexto">Contexto e aprendizados</TabsTrigger>
          </TabsList>
          <TabsContent value="planejamento"><PlanejamentoMes /></TabsContent>
          <TabsContent value="artigos"><ListaDeArtigos onNovo={() => setNovoAberto(true)} /></TabsContent>
          <TabsContent value="contexto"><ContextoBlog /></TabsContent>
        </Tabs>
      </div>

      <NovoArtigoDialog aberto={novoAberto} onFechar={() => setNovoAberto(false)} />
    </MainLayout>
  );
};

export default BlogDaPure;
