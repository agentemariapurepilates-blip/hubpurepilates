import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { COR_DA_MARCA, MARCAS, ORDEM_DAS_MARCAS, buscarNomes, formatarData, registrarAprendizado, type Marca } from './blogTipos';

const CHAVES = [
  { chave: 'geral', rotulo: 'Geral' },
  ...ORDEM_DAS_MARCAS.map((m) => ({ chave: m, rotulo: MARCAS[m].nome })),
];

const ORIGEM: Record<string, string> = {
  revisao: 'pedido de ajuste na aprovação',
  ajuste_gemini: 'ajuste pedido ao Gemini',
  manual: 'escrito pelo time',
};

interface Contexto {
  chave: string;
  conteudo: string;
  atualizado_por: string | null;
  updated_at: string;
}
interface Aprendizado {
  id: string;
  marca: Marca | null;
  texto: string;
  origem: string;
  criado_por: string | null;
  created_at: string;
}

/**
 * O "projeto" do Gemini, como nos projetos do Claude: o contexto oficial de
 * cada marca e os aprendizados do time vão junto em TODA geração (montados em
 * supabase/functions/blog-gerar-artigo/escrita.ts). Mudou aqui, a próxima
 * geração já usa.
 */
export function ContextoBlog() {
  const { user } = useAuth();
  const [contextos, setContextos] = useState<Record<string, Contexto>>({});
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});
  const [aprendizados, setAprendizados] = useState<Aprendizado[]>([]);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [novo, setNovo] = useState({ texto: '', marca: 'todas' });

  const carregar = useCallback(async () => {
    const [{ data: ctx }, { data: apr }] = await Promise.all([
      supabase.from('blog_contextos').select('chave, conteudo, atualizado_por, updated_at'),
      supabase.from('blog_aprendizados').select('id, marca, texto, origem, criado_por, created_at').order('created_at', { ascending: false }),
    ]);
    const mapa = Object.fromEntries((ctx ?? []).map((c) => [c.chave, c as Contexto]));
    setContextos(mapa);
    setRascunhos(Object.fromEntries(Object.entries(mapa).map(([k, c]) => [k, c.conteudo])));
    setAprendizados((apr ?? []) as Aprendizado[]);
    setNomes(await buscarNomes([...(ctx ?? []).map((c) => c.atualizado_por), ...(apr ?? []).map((a) => a.criado_por)]));
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const salvarContexto = async (chave: string) => {
    setSalvando(chave);
    const { error } = await supabase
      .from('blog_contextos')
      .update({ conteudo: rascunhos[chave] ?? '', atualizado_por: user?.id ?? null })
      .eq('chave', chave);
    setSalvando(null);
    if (error) toast.error('Não consegui salvar o contexto.');
    else {
      toast.success('Contexto salvo. A próxima geração já usa.');
      carregar();
    }
  };

  const acrescentar = async () => {
    if (novo.texto.trim().length < 3) {
      toast.error('Escreva o aprendizado.');
      return;
    }
    await registrarAprendizado(novo.texto, novo.marca === 'todas' ? null : (novo.marca as Marca), 'manual', undefined, user?.id);
    setNovo({ texto: '', marca: novo.marca });
    toast.success('Aprendizado guardado.');
    carregar();
  };

  const apagar = async (id: string) => {
    const { error } = await supabase.from('blog_aprendizados').delete().eq('id', id);
    if (error) toast.error('Não consegui apagar.');
    else setAprendizados((l) => l.filter((a) => a.id !== id));
  };

  if (carregando) {
    return <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Contexto oficial</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vai junto em toda geração. É a única fonte de fatos sobre a Pure: o que estiver em "A PREENCHER" o Gemini não pode citar.
            O Geral vale para as três marcas.
          </p>
        </div>
        <Tabs defaultValue="geral">
          <TabsList>
            {CHAVES.map((c) => <TabsTrigger key={c.chave} value={c.chave}>{c.rotulo}</TabsTrigger>)}
          </TabsList>
          {CHAVES.map((c) => {
            const atual = contextos[c.chave];
            const mudou = (rascunhos[c.chave] ?? '') !== (atual?.conteudo ?? '');
            return (
              <TabsContent key={c.chave} value={c.chave} className="space-y-2">
                <Textarea
                  className="min-h-[460px] font-mono text-[13px] leading-relaxed"
                  value={rascunhos[c.chave] ?? ''}
                  onChange={(e) => setRascunhos((r) => ({ ...r, [c.chave]: e.target.value }))}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {atual?.atualizado_por ? `Editado por ${nomes[atual.atualizado_por] ?? 'alguém do time'} em ${formatarData(atual.updated_at)}` : 'Texto inicial, tirado dos canais oficiais da Pure.'}
                  </p>
                  <Button onClick={() => salvarContexto(c.chave)} disabled={!mudou || salvando === c.chave}>
                    {salvando === c.chave ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar
                  </Button>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Aprendizados do time</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            A memória do Gemini. Cada pedido de ajuste marcado para guardar vira um aprendizado, e os 25 mais recentes vão em toda geração
            da marca. Apague os que não fizerem sentido.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <Label htmlFor="novo-aprendizado">Novo aprendizado</Label>
          <Textarea
            id="novo-aprendizado"
            rows={2}
            placeholder="Ex.: nos artigos da Academy, sempre explique o termo técnico na primeira vez que aparecer."
            value={novo.texto}
            onChange={(e) => setNovo((n) => ({ ...n, texto: e.target.value }))}
          />
          <div className="flex gap-2">
            <Select value={novo.marca} onValueChange={(v) => setNovo((n) => ({ ...n, marca: v }))}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as marcas</SelectItem>
                {ORDEM_DAS_MARCAS.map((m) => <SelectItem key={m} value={m}>{MARCAS[m].nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={acrescentar}><Plus className="h-4 w-4 mr-1" /> Guardar</Button>
          </div>
        </div>

        {aprendizados.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">Nenhum aprendizado ainda. Eles aparecem conforme o time pede ajustes.</p>
        ) : (
          <ul className="space-y-2">
            {aprendizados.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{a.texto}</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => apagar(a.id)} aria-label="Apagar aprendizado">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className={cn('rounded-full px-2 py-0.5 font-medium', a.marca ? COR_DA_MARCA[a.marca] : 'bg-muted')}>
                    {a.marca ? MARCAS[a.marca].nome : 'Todas'}
                  </span>
                  {ORIGEM[a.origem] ?? a.origem}
                  {a.criado_por && `, ${nomes[a.criado_por] ?? 'alguém do time'}`}, {formatarData(a.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
