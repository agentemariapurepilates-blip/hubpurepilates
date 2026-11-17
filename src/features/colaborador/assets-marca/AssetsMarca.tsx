// Assets de marca — a biblioteca do time (só colaboradores e admins), como aba do Pure Design.
//
// Uma aba por unidade de negócio, como os kits de marca do Canva. Qualquer
// colaborador sobe um asset novo e ele vai direto para o banco; o "quando usar"
// de cada um é o que o agente do Pure Design lê para escolher o logo da arte.

import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  TIPOS,
  UNIDADES,
  apagarAsset,
  atualizarAsset,
  enviarAsset,
  listarAssets,
  type MarcaAsset,
} from './marcaAssets';

interface Rascunho {
  id?: string;
  arquivo?: File;
  unidade: string;
  subpasta: string;
  nome: string;
  tipo: string;
  descricao: string;
}

const vazio = (unidade: string): Rascunho => ({ unidade, subpasta: '', nome: '', tipo: 'logo', descricao: '' });

/** Fundo xadrez: mostra que o logo é transparente e funciona em fundo claro e escuro. */
const XADREZ =
  'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--background)) 0% 50%) 50% / 18px 18px';

/** Conteúdo da aba "Assets de marca" do Pure Design (só para o time). */
export default function AssetsMarca() {
  const [assets, setAssets] = useState<MarcaAsset[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<string>(UNIDADES[0]);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    try {
      setAssets(await listarAssets());
    } catch (e) {
      toast.error('Não consegui carregar a biblioteca.', { description: e instanceof Error ? e.message : undefined });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, []);

  // Unidades fixas + qualquer outra que alguém tenha criado.
  const unidades = useMemo(
    () => Array.from(new Set<string>([...UNIDADES, ...assets.map((a) => a.unidade)])),
    [assets],
  );

  const salvar = async () => {
    if (!rascunho) return;
    if (!rascunho.nome.trim()) return toast.error('Dê um nome ao asset.');
    if (!rascunho.descricao.trim()) return toast.error('Escreva quando usar: é isso que o assistente lê.');
    setSalvando(true);
    try {
      if (rascunho.id) {
        await atualizarAsset(rascunho.id, {
          nome: rascunho.nome.trim(),
          descricao: rascunho.descricao.trim(),
          tipo: rascunho.tipo,
          unidade: rascunho.unidade,
          subpasta: rascunho.subpasta.trim() || null,
        });
      } else {
        if (!rascunho.arquivo) return toast.error('Escolha o arquivo.');
        await enviarAsset({ ...rascunho, arquivo: rascunho.arquivo });
      }
      toast.success('Salvo na biblioteca.');
      setRascunho(null);
      await carregar();
    } catch (e) {
      toast.error('Não consegui salvar.', { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSalvando(false);
    }
  };

  const alternarAtivo = async (a: MarcaAsset) => {
    try {
      await atualizarAsset(a.id, { ativo: !a.ativo });
      setAssets((lista) => lista.map((x) => (x.id === a.id ? { ...x, ativo: !a.ativo } : x)));
    } catch {
      toast.error('Não consegui mudar.');
    }
  };

  const apagar = async (a: MarcaAsset) => {
    if (!window.confirm(`Apagar "${a.nome}" da biblioteca? Artes já baixadas não mudam.`)) return;
    try {
      await apagarAsset(a);
      setAssets((lista) => lista.filter((x) => x.id !== a.id));
    } catch {
      toast.error('Não consegui apagar.');
    }
  };

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Logos e elementos da marca por unidade de negócio. Só o time vê esta biblioteca. O assistente
              do Pure Design escolhe o logo de cada arte pelo "quando usar".
            </p>
          </div>
          <Button onClick={() => setRascunho(vazio(aba))}>
            <ImagePlus className="mr-1.5 h-4 w-4" />
            Subir asset
          </Button>
        </div>

        {carregando ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </p>
        ) : (
          <Tabs value={aba} onValueChange={setAba}>
            <TabsList className="flex h-auto flex-wrap justify-start">
              {unidades.map((u) => (
                <TabsTrigger key={u} value={u}>
                  {u} ({assets.filter((a) => a.unidade === u).length})
                </TabsTrigger>
              ))}
            </TabsList>
            {unidades.map((u) => {
              const daUnidade = assets.filter((a) => a.unidade === u);
              const subpastas = Array.from(new Set(daUnidade.map((a) => a.subpasta ?? '')));
              return (
                <TabsContent key={u} value={u} className="space-y-6 pt-3">
                  {daUnidade.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum asset em {u} ainda.</p>
                  )}
                  {subpastas.map((sp) => (
                    <section key={sp || 'raiz'} className="space-y-3">
                      {sp && <h2 className="border-b pb-1.5 text-sm font-semibold">{sp}</h2>}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {daUnidade
                          .filter((a) => (a.subpasta ?? '') === sp)
                          .map((a) => (
                            <Card key={a.id} className={`overflow-hidden ${a.ativo ? '' : 'opacity-50'}`}>
                              <div className="flex h-36 items-center justify-center p-4" style={{ background: XADREZ }}>
                                <img src={a.url} alt={a.nome} className="max-h-full max-w-full object-contain" />
                              </div>
                              <div className="space-y-2 p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold">{a.nome}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {TIPOS.find((t) => t.id === a.tipo)?.nome ?? a.tipo}
                                      {a.largura && a.altura ? ` · ${a.largura}×${a.altura}` : ''}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1">
                                    <Switch
                                      checked={a.ativo}
                                      onCheckedChange={() => void alternarAtivo(a)}
                                      title={a.ativo ? 'Ativo: o assistente pode usar' : 'Desativado'}
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      title="Editar"
                                      onClick={() =>
                                        setRascunho({
                                          id: a.id,
                                          unidade: a.unidade,
                                          subpasta: a.subpasta ?? '',
                                          nome: a.nome,
                                          tipo: a.tipo,
                                          descricao: a.descricao,
                                        })
                                      }
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-destructive"
                                      title="Apagar"
                                      onClick={() => void apagar(a)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium text-foreground">Quando usar: </span>
                                  {a.descricao}
                                </p>
                              </div>
                            </Card>
                          ))}
                      </div>
                    </section>
                  ))}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>

      <Dialog open={!!rascunho} onOpenChange={(o) => !o && setRascunho(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{rascunho?.id ? 'Editar asset' : 'Subir asset'}</DialogTitle>
            <DialogDescription>
              Prefira PNG com fundo transparente. O "quando usar" é o que o assistente lê para escolher.
            </DialogDescription>
          </DialogHeader>
          {rascunho && (
            <div className="space-y-3">
              {!rascunho.id && (
                <div className="space-y-1.5">
                  <Label>Arquivo</Label>
                  <Input
                    type="file"
                    accept="image/png,image/svg+xml,image/webp,image/jpeg"
                    onChange={(e) => {
                      const arquivo = e.target.files?.[0];
                      if (!arquivo) return;
                      setRascunho((r) =>
                        r ? { ...r, arquivo, nome: r.nome || arquivo.name.replace(/\.[^.]+$/, '').replace(/[-_.]+/g, ' ') } : r,
                      );
                    }}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Unidade de negócio (pasta)</Label>
                  <Select value={rascunho.unidade} onValueChange={(v) => setRascunho((r) => (r ? { ...r, unidade: v } : r))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Subpasta (opcional)</Label>
                  <Input
                    value={rascunho.subpasta}
                    placeholder="Ex.: Coleção Move"
                    onChange={(e) => setRascunho((r) => (r ? { ...r, subpasta: e.target.value } : r))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={rascunho.nome} onChange={(e) => setRascunho((r) => (r ? { ...r, nome: e.target.value } : r))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={rascunho.tipo} onValueChange={(v) => setRascunho((r) => (r ? { ...r, tipo: v } : r))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Quando usar</Label>
                <Textarea
                  rows={3}
                  value={rascunho.descricao}
                  placeholder="Ex.: logo da Coleção Move — usar em qualquer arte de peças da coleção Move."
                  onChange={(e) => setRascunho((r) => (r ? { ...r, descricao: e.target.value } : r))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRascunho(null)}>
              Cancelar
            </Button>
            <Button onClick={() => void salvar()} disabled={salvando}>
              {salvando && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
