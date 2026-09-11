import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  LABEL_COLORS,
  LABEL_TITULO,
  corDoTexto,
  labelsFor,
  proximaCor,
  useDemandLabels,
  type DemandLabel,
  type LabelKind,
} from './demandLabels';

interface LabelSelectProps {
  kind: LabelKind;
  /** Setor da demanda. A Frente ignora (é do Hub inteiro); o Status usa as etiquetas do setor. */
  department: string;
  selectedId: string | null;
  onSelect: (labelId: string | null) => void;
  /** cell: célula cheia da lista, como no Monday. field: campo do formulário. */
  variant: 'cell' | 'field';
  /** Classes extras do campo (variant field), para acompanhar a altura dos vizinhos. */
  className?: string;
}

const Paleta = ({ atual, onEscolher }: { atual: string; onEscolher: (cor: string) => void }) => (
  <div className="mt-1.5 flex flex-wrap gap-1 pl-7">
    {LABEL_COLORS.map((cor) => (
      <button
        key={cor}
        type="button"
        onClick={() => onEscolher(cor)}
        aria-label={`Cor ${cor}`}
        className={cn('h-5 w-5 rounded ring-offset-1 ring-offset-background', cor === atual && 'ring-2 ring-foreground')}
        style={{ backgroundColor: cor }}
      />
    ))}
  </div>
);

const EditorDeEtiquetas = ({
  kind,
  department,
  opcoes,
  onVoltar,
}: {
  kind: LabelKind;
  department: string;
  opcoes: DemandLabel[];
  onVoltar: () => void;
}) => {
  const api = useDemandLabels();
  const [novoNome, setNovoNome] = useState('');
  const [novaCor, setNovaCor] = useState(() => proximaCor(opcoes.map((l) => l.color)));
  // Id da etiqueta com a paleta aberta, ou 'nova' para a etiqueta sendo criada.
  const [paletaDe, setPaletaDe] = useState<string | null>(null);

  const adicionar = async () => {
    const nome = novoNome.trim();
    if (!nome) return;
    await api.criar(kind, kind === 'frente' ? null : department, nome, novaCor);
    setNovoNome('');
    setNovaCor(proximaCor([...opcoes.map((l) => l.color), novaCor]));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">
          {kind === 'frente' ? 'Frentes de negócio' : `Status de ${department}`}
        </p>
        <button type="button" onClick={onVoltar} aria-label="Voltar" className="rounded p-1 hover:bg-muted">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {kind === 'frente' && (
        <p className="text-[11px] text-muted-foreground">Vale para todos os setores.</p>
      )}

      <div className="max-h-56 space-y-1 overflow-y-auto">
        {opcoes.map((l) => (
          <div key={l.id}>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaletaDe(paletaDe === l.id ? null : l.id)}
                aria-label={`Trocar a cor de ${l.name}`}
                className="h-6 w-6 shrink-0 rounded"
                style={{ backgroundColor: l.color }}
              />
              <Input
                // Remonta quando o nome muda por fora (realtime), para não mostrar o antigo.
                key={`${l.id}:${l.name}`}
                defaultValue={l.name}
                maxLength={40}
                className="h-7 text-xs"
                onBlur={(e) => {
                  const nome = e.target.value.trim();
                  if (nome && nome !== l.name) api.atualizar(l.id, { name: nome });
                  else e.target.value = l.name;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => api.excluir(l)}
                aria-label={`Excluir ${l.name}`}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {paletaDe === l.id && (
              <Paleta
                atual={l.color}
                onEscolher={(cor) => {
                  api.atualizar(l.id, { color: cor });
                  setPaletaDe(null);
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="border-t pt-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPaletaDe(paletaDe === 'nova' ? null : 'nova')}
            aria-label="Cor da nova etiqueta"
            className="h-6 w-6 shrink-0 rounded"
            style={{ backgroundColor: novaCor }}
          />
          <Input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nova etiqueta"
            maxLength={40}
            className="h-7 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                adicionar();
              }
            }}
          />
          <Button type="button" size="sm" className="h-7 px-2" onClick={adicionar} disabled={!novoNome.trim()}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {paletaDe === 'nova' && (
          <Paleta
            atual={novaCor}
            onEscolher={(cor) => {
              setNovaCor(cor);
              setPaletaDe(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export function LabelSelect({ kind, department, selectedId, onSelect, variant, className }: LabelSelectProps) {
  const api = useDemandLabels();
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const opcoes = labelsFor(api.labels, kind, kind === 'frente' ? null : department);
  const atual = opcoes.find((l) => l.id === selectedId) ?? null;

  const escolher = (id: string | null) => {
    onSelect(id);
    setAberto(false);
  };

  return (
    <Popover
      open={aberto}
      onOpenChange={(o) => {
        setAberto(o);
        if (!o) setEditando(false);
      }}
    >
      <PopoverTrigger asChild>
        {variant === 'cell' ? (
          <button
            type="button"
            // A linha da lista abre a demanda no clique; aqui o clique é só da célula.
            onClick={(e) => e.stopPropagation()}
            aria-label={`${LABEL_TITULO[kind]}: ${atual?.name ?? 'vazio'}`}
            className="flex h-full min-h-[38px] w-full items-center justify-center px-2 text-xs font-medium transition-opacity hover:opacity-90"
            style={atual ? { backgroundColor: atual.color, color: corDoTexto(atual.color) } : undefined}
          >
            {atual ? (
              <span className="truncate">{atual.name}</span>
            ) : (
              <Plus className="h-3.5 w-3.5 text-transparent group-hover/linha:text-muted-foreground/60" />
            )}
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              'inline-flex h-10 w-full items-center gap-2 rounded-md border bg-background px-3 text-sm transition-colors hover:bg-muted/40',
              className,
            )}
          >
            {atual ? (
              <span
                className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: atual.color, color: corDoTexto(atual.color) }}
              >
                {atual.name}
              </span>
            ) : (
              <span className="text-muted-foreground">Escolher</span>
            )}
          </button>
        )}
      </PopoverTrigger>

      {/* O conteúdo vai para um portal, mas o evento ainda sobe pela árvore do React até a linha. */}
      <PopoverContent className="w-64 p-2" align="start" onClick={(e) => e.stopPropagation()}>
        {editando ? (
          <EditorDeEtiquetas kind={kind} department={department} opcoes={opcoes} onVoltar={() => setEditando(false)} />
        ) : (
          <div className="space-y-1.5">
            <div className="grid gap-1">
              {opcoes.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => escolher(l.id)}
                  className="flex h-8 items-center justify-center rounded text-xs font-medium transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: l.color, color: corDoTexto(l.color) }}
                >
                  {l.name}
                  {l.id === selectedId && <Check className="ml-1.5 h-3.5 w-3.5" />}
                </button>
              ))}
              {opcoes.length === 0 && (
                <p className="px-1 py-2 text-center text-xs text-muted-foreground">Nenhuma etiqueta ainda.</p>
              )}
            </div>
            <div className="flex items-center justify-between border-t pt-1.5">
              <button
                type="button"
                onClick={() => escolher(null)}
                disabled={!selectedId}
                className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
                Editar etiquetas
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
