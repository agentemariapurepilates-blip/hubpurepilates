import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { MARCAS, ORDEM_DAS_MARCAS, PUBLICO_DA_MARCA, TAMANHOS, categoriasDa, escreverComGemini, produzirAgora, type Marca, type Pauta } from './blogTipos';

const PAUTA_VAZIA: Pauta = {
  marca: 'studios',
  tema: '',
  palavraChave: '',
  categoria: 'Pilates',
  tamanho: 'medio',
  observacoes: '',
};

export function NovoArtigoDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pauta, setPauta] = useState<Pauta>(PAUTA_VAZIA);
  const [escrevendo, setEscrevendo] = useState(false);
  const mudar = (campo: keyof Pauta) => (valor: string) => setPauta((p) => ({ ...p, [campo]: valor }));
  const trocarMarca = (valor: string) => {
    const marca = valor as Marca;
    setPauta((p) => ({ ...p, marca, categoria: categoriasDa(marca).includes(p.categoria) ? p.categoria : categoriasDa(marca)[0] }));
  };

  const escrever = async () => {
    if (pauta.tema.trim().length < 3) {
      toast.error('Escreva o tema do artigo.');
      return;
    }
    setEscrevendo(true);
    try {
      const { artigo: texto, avisos } = await escreverComGemini(pauta);
      const { data, error } = await supabase
        .from('blog_artigos')
        .insert({
          tema: pauta.tema.trim(),
          categoria: pauta.categoria || null,
          marca: pauta.marca,
          publico: PUBLICO_DA_MARCA[pauta.marca],
          tamanho: pauta.tamanho,
          observacoes: pauta.observacoes.trim() || null,
          ...texto,
          avisos_seo: avisos,
          capa_status: 'pendente',
          criado_por: user?.id ?? null,
        })
        .select('id')
        .single();
      if (error) throw new Error('o artigo foi escrito, mas não consegui salvar');
      if (avisos.length) {
        toast.warning('Artigo escrito, mas com pontos de SEO para conferir. Eles aparecem no editor.');
      } else {
        toast.success('Artigo escrito. Revise e edite antes de enviar para aprovação.');
      }
      setPauta(PAUTA_VAZIA);
      // A foto da capa sai pela fila; empurra agora para não esperar o cron.
      produzirAgora().catch(() => undefined);
      onFechar();
      navigate(`/marketing/blog/${data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? `Não deu certo: ${e.message}.` : 'Não deu certo.');
    } finally {
      setEscrevendo(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && !escrevendo && onFechar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo artigo</DialogTitle>
          <DialogDescription>
            Passe a pauta e o Gemini escreve o primeiro texto, já no padrão do blog. Depois você edita e envia para aprovação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tema">Tema</Label>
            <Textarea
              id="tema"
              rows={2}
              placeholder="Ex.: Pilates para quem trabalha sentado o dia inteiro"
              value={pauta.tema}
              onChange={(e) => mudar('tema')(e.target.value)}
              disabled={escrevendo}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="palavra">Palavra-chave principal</Label>
            <Input
              id="palavra"
              placeholder="Opcional. Ex.: pilates para postura"
              value={pauta.palavraChave}
              onChange={(e) => mudar('palavraChave')(e.target.value)}
              disabled={escrevendo}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Categoria do blog</Label>
              <Select value={pauta.categoria} onValueChange={mudar('categoria')} disabled={escrevendo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoriasDa(pauta.marca).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tamanho</Label>
              <Select value={pauta.tamanho} onValueChange={mudar('tamanho')} disabled={escrevendo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TAMANHOS.map((t) => <SelectItem key={t.valor} value={t.valor}>{t.rotulo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Marca</Label>
            <Select value={pauta.marca} onValueChange={trocarMarca} disabled={escrevendo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORDEM_DAS_MARCAS.map((m) => <SelectItem key={m} value={m}>{MARCAS[m].nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="obs">Orientações para o Gemini</Label>
            <Textarea
              id="obs"
              rows={3}
              placeholder="Opcional. Ex.: citar o Reformer e o Cadillac; fechar falando da campanha de novembro."
              value={pauta.observacoes}
              onChange={(e) => mudar('observacoes')(e.target.value)}
              disabled={escrevendo}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onFechar} disabled={escrevendo}>Cancelar</Button>
          <Button onClick={escrever} disabled={escrevendo}>
            {escrevendo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {escrevendo ? 'O Gemini está escrevendo, pode levar até dois minutos' : 'Escrever com o Gemini'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
