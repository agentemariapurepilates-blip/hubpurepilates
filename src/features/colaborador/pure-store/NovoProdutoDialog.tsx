// Cadastro de produto da Pure Store (lista interna do gerador de pedidos).
//
// Vive em dois lugares, de propósito: na aba Produtos e no "+" ao lado do
// produto no gerador de pedidos. Em qualquer um deles o produto cai na MESMA
// lista, e quem cadastrou no meio de um pedido não precisa sair da tela.

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { criarProduto, type ProdutoInterno } from './produtosStore';

interface NovoProdutoDialogProps {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  /** Grupos que já existem, para repetir o nome em vez de inventar um novo. */
  grupos: string[];
  /** Recebe o produto recém-criado: a aba atualiza a lista, o pedido já escolhe. */
  onCriado: (produto: ProdutoInterno) => void;
}

export function NovoProdutoDialog({ aberto, onAbertoChange, grupos, onCriado }: NovoProdutoDialogProps) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [grupo, setGrupo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const limpar = () => {
    setNome('');
    setPreco('');
    setGrupo('');
  };

  const salvar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    const valor = Number(preco.replace(/\./g, '').replace(',', '.'));
    if (nome.trim().length < 2) {
      toast({ title: 'Faltou o nome do produto', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      toast({ title: 'Preço inválido', description: 'Use números, como 109,90.', variant: 'destructive' });
      return;
    }

    setSalvando(true);
    try {
      const produto = await criarProduto({ nome, preco: valor, grupo: grupo || 'Outros' });
      toast({ title: 'Produto cadastrado', description: `${produto.nome} já aparece na lista.` });
      onCriado(produto);
      limpar();
      onAbertoChange(false);
    } catch (erro) {
      // O nome é único: cadastrar repetido dá erro do banco, que não ajuda ninguém.
      const repetido = erro instanceof Error && /duplicate|unique|nome_unico/i.test(erro.message);
      toast({
        title: repetido ? 'Esse produto já está na lista' : 'Não deu para cadastrar',
        description: repetido
          ? 'Procure pelo nome na busca de produtos.'
          : 'Tente de novo em instantes.',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar produto</DialogTitle>
          <DialogDescription>
            Entra na lista da Pure Store e fica disponível no gerador de pedidos na hora.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={salvar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="produto-nome">Nome do produto</Label>
            <Input
              id="produto-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Canga Pure Pilates - Farm"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="produto-preco">Preço (R$)</Label>
            <Input
              id="produto-preco"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="109,90"
              inputMode="decimal"
              required
            />
            <p className="text-xs text-muted-foreground">
              É o preço que vem preenchido no pedido — lá ele continua editável.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="produto-grupo">Grupo</Label>
            <Input
              id="produto-grupo"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              placeholder="Acessórios, Meias, Uniformes…"
              list="produto-grupos"
            />
            <datalist id="produto-grupos">
              {grupos.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              Serve só para organizar a busca. Em branco, entra como "Outros".
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onAbertoChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
