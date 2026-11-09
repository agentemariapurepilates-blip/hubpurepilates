import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Título da demanda que renomeia no lugar: clica e vira campo; Enter ou sair do
 * campo salva, Esc cancela. Qualquer colaborador pode renomear, não só quem criou
 * (pedido de 09/11/2026; a RLS de demands já permitia).
 */
export function TituloEditavel({
  titulo,
  onSalvar,
  className,
}: {
  titulo: string;
  onSalvar: (novo: string) => void | Promise<void>;
  className?: string;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(titulo);

  if (!editando) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setTexto(titulo);
          setEditando(true);
        }}
        className={cn('min-w-0 cursor-text truncate rounded px-1 text-left hover:bg-muted', className)}
        title="Clique para renomear"
      >
        {titulo}
      </button>
    );
  }

  const terminar = () => {
    setEditando(false);
    const novo = texto.trim();
    if (novo && novo !== titulo) onSalvar(novo);
  };

  return (
    <input
      autoFocus
      value={texto}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setTexto(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={terminar}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') terminar();
        if (e.key === 'Escape') setEditando(false);
      }}
      className={cn('min-w-0 flex-1 rounded border border-primary bg-background px-1 py-0.5 text-sm outline-none', className)}
    />
  );
}
