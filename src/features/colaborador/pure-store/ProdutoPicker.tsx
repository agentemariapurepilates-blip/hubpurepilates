import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatarReal, opcoesDeProduto, type OpcaoProduto } from './pedidoPureStore';

/** Minúsculas e sem acento: "camiseta feminina" acha "Camiseta Feminina Dry Fit - Coração Pilateiro". */
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const GRUPOS = [...new Set(opcoesDeProduto.map((o) => o.grupo))];

interface ProdutoPickerProps {
  /** Nome do produto já escolhido na linha, ou vazio. */
  valor: string;
  onEscolher: (produto: OpcaoProduto) => void;
}

/** Busca entre os uniformes e os produtos do catálogo do site, com o preço de cada um. */
export function ProdutoPicker({ valor, onEscolher }: ProdutoPickerProps) {
  const [aberto, setAberto] = useState(false);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          <span className={cn('min-w-0 flex-1 truncate text-left', !valor && 'text-muted-foreground')}>
            {valor || 'Escolher produto'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(30rem,92vw)] p-0" align="start">
        <Command
          // O filtro do cmdk não ignora acento. Aqui cada palavra digitada precisa
          // aparecer no nome ou no grupo, sem acento e em qualquer ordem.
          filter={(_value, search, keywords) => {
            const alvo = normalizar((keywords ?? []).join(' '));
            return normalizar(search).split(/\s+/).every((termo) => alvo.includes(termo)) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Buscar uniforme ou produto..." />
          <CommandList className="max-h-72">
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            {GRUPOS.map((grupo) => (
              <CommandGroup key={grupo} heading={grupo}>
                {opcoesDeProduto
                  .filter((produto) => produto.grupo === grupo)
                  .map((produto) => (
                    <CommandItem
                      key={produto.chave}
                      // A chave é única; a busca olha nome e grupo, passados em `keywords`.
                      value={produto.chave}
                      keywords={[produto.nome, produto.grupo]}
                      onSelect={() => {
                        onEscolher(produto);
                        setAberto(false);
                      }}
                      className="gap-2"
                    >
                      <span className="min-w-0 flex-1 truncate">{produto.nome}</span>
                      {produto.esgotado && (
                        <span className="shrink-0 rounded bg-muted px-1.5 text-[10px] uppercase text-muted-foreground">
                          Esgotado
                        </span>
                      )}
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatarReal(produto.preco)}
                      </span>
                      {valor === produto.nome && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </CommandItem>
                  ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
