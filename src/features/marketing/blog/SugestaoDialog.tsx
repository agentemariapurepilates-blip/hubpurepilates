import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  MARCAS,
  ORDEM_DAS_MARCAS,
  PUBLICO_DA_MARCA,
  categoriasDa,
  diasPlanejaveis,
  marcaDoDia,
  rotuloDoDia,
  sugerirPautas,
  type ArtigoBlog,
  type Marca,
} from './blogTipos';

interface Campos {
  data: string;
  marca: Marca;
  tema: string;
  palavraChave: string;
  categoria: string;
  observacoes: string;
}

/**
 * Acrescenta uma pauta ao mês (escrita à mão ou pedida ao Gemini) ou edita uma
 * sugestão existente. Sem `sugestao`, é acréscimo; com ela, edição.
 */
export function SugestaoDialog({
  mes,
  aberto,
  sugestao,
  diaInicial,
  onFechar,
  onSalvo,
}: {
  mes: string;
  aberto: boolean;
  sugestao?: ArtigoBlog | null;
  diaInicial?: string;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const { user } = useAuth();
  const [campos, setCampos] = useState<Campos | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [pedindo, setPedindo] = useState(false);
  // Só de hoje em diante. Ao editar uma sugestão antiga, o dia dela continua na lista.
  const planejaveis = diasPlanejaveis(mes);
  const dias =
    sugestao?.data_prevista && !planejaveis.includes(sugestao.data_prevista)
      ? [sugestao.data_prevista, ...planejaveis]
      : planejaveis;

  useEffect(() => {
    if (!aberto) return;
    if (sugestao) {
      setCampos({
        data: sugestao.data_prevista ?? dias[0],
        marca: sugestao.marca,
        tema: sugestao.tema,
        palavraChave: sugestao.palavra_chave ?? '',
        categoria: sugestao.categoria ?? categoriasDa(sugestao.marca)[0],
        observacoes: sugestao.observacoes ?? '',
      });
    } else {
      const data = diaInicial ?? dias[0];
      const marca = marcaDoDia(data);
      setCampos({ data, marca, tema: '', palavraChave: '', categoria: categoriasDa(marca)[0], observacoes: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, sugestao, diaInicial, mes]);

  if (!campos) return null;
  const mudar = <K extends keyof Campos>(campo: K, valor: Campos[K]) => setCampos((c) => (c ? { ...c, [campo]: valor } : c));
  const trocarMarca = (marca: Marca) =>
    setCampos((c) => (c ? { ...c, marca, categoria: categoriasDa(marca).includes(c.categoria) ? c.categoria : categoriasDa(marca)[0] } : c));
  const ocupado = salvando || pedindo;

  const salvar = async () => {
    if (campos.tema.trim().length < 3) {
      toast.error('Escreva o tema.');
      return;
    }
    setSalvando(true);
    const linha = {
      data_prevista: campos.data,
      marca: campos.marca,
      publico: PUBLICO_DA_MARCA[campos.marca],
      tema: campos.tema.trim(),
      palavra_chave: campos.palavraChave.trim() || null,
      categoria: campos.categoria,
      observacoes: campos.observacoes.trim() || null,
    };
    const { error } = sugestao
      ? await supabase.from('blog_artigos').update(linha).eq('id', sugestao.id)
      : await supabase.from('blog_artigos').insert({ ...linha, status: 'sugestao', tamanho: 'medio', criado_por: user?.id ?? null });
    setSalvando(false);
    if (error) {
      toast.error('Não consegui salvar a sugestão.');
      return;
    }
    toast.success(sugestao ? 'Sugestão atualizada.' : 'Sugestão acrescentada.');
    onSalvo();
    onFechar();
  };

  // O Gemini grava a ideia direto como sugestão, já no dia e na marca escolhidos.
  const pedirIdeia = async () => {
    setPedindo(true);
    try {
      const { sugestoes } = await sugerirPautas(mes, { dias: [campos.data], marca: campos.marca });
      if (!sugestoes.length) throw new Error('o Gemini não trouxe ideia para esse dia');
      toast.success('O Gemini acrescentou uma sugestão.');
      onSalvo();
      onFechar();
    } catch (e) {
      toast.error(e instanceof Error ? `Não deu certo: ${e.message}.` : 'Não deu certo.');
    } finally {
      setPedindo(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && !ocupado && onFechar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{sugestao ? 'Editar sugestão' : 'Acrescentar sugestão'}</DialogTitle>
          <DialogDescription>
            {sugestao
              ? 'Ajuste a pauta antes de aprovar o lote.'
              : 'Escreva a pauta ou peça uma ideia ao Gemini para o dia e a marca escolhidos.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Dia</Label>
              <Select value={campos.data} onValueChange={(v) => mudar('data', v)} disabled={ocupado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dias.map((d) => <SelectItem key={d} value={d}>{rotuloDoDia(d)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Select value={campos.marca} onValueChange={(v) => trocarMarca(v as Marca)} disabled={ocupado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDEM_DAS_MARCAS.map((m) => <SelectItem key={m} value={m}>{MARCAS[m].nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!sugestao && (
            <Button variant="secondary" className="w-full" onClick={pedirIdeia} disabled={ocupado}>
              {pedindo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {pedindo ? 'Pedindo uma ideia...' : 'Pedir uma ideia ao Gemini'}
            </Button>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="sug-tema">Tema</Label>
            <Textarea id="sug-tema" rows={2} value={campos.tema} onChange={(e) => mudar('tema', e.target.value)} disabled={ocupado} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sug-palavra">Palavra-chave</Label>
              <Input id="sug-palavra" value={campos.palavraChave} onChange={(e) => mudar('palavraChave', e.target.value)} disabled={ocupado} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={campos.categoria} onValueChange={(v) => mudar('categoria', v)} disabled={ocupado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoriasDa(campos.marca).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sug-obs">Ângulo e orientações</Label>
            <Textarea id="sug-obs" rows={3} value={campos.observacoes} onChange={(e) => mudar('observacoes', e.target.value)} disabled={ocupado} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onFechar} disabled={ocupado}>Cancelar</Button>
          <Button onClick={salvar} disabled={ocupado}>
            {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {sugestao ? 'Salvar' : 'Acrescentar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
