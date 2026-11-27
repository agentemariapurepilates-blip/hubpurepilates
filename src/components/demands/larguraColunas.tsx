import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Largura das colunas da tabela de Demandas (pedido de 26/11/2026, igual ao chat
 * dos Projetos): puxar a borda direita do título da coluna aumenta ou diminui;
 * duplo clique volta ao padrão. Vale para todos os grupos do setor e fica no
 * navegador de cada pessoa, por setor.
 */
export type ColunaDemanda = 'tarefa' | 'comentarios' | 'pessoa' | 'status' | 'frente' | 'prioridade' | 'prazo' | 'gravacao';

export const LARGURA_PADRAO: Record<ColunaDemanda, number> = {
  tarefa: 240,
  comentarios: 52,
  pessoa: 104,
  status: 136,
  frente: 136,
  prioridade: 96,
  prazo: 84,
  gravacao: 96,
};

const LARGURA_MIN = 44;
const LARGURA_MAX = 720;
const chave = (setor: string) => `demandas-larguras-${setor}`;

export type Larguras = Record<ColunaDemanda, number>;

export function useLargurasDasColunas(setor: string) {
  const [larguras, setLarguras] = useState<Larguras>(() => {
    try {
      const salvas = JSON.parse(localStorage.getItem(chave(setor)) ?? '{}') as Partial<Larguras>;
      return { ...LARGURA_PADRAO, ...salvas };
    } catch {
      return { ...LARGURA_PADRAO };
    }
  });

  const mudar = useCallback(
    (coluna: ColunaDemanda, largura: number | null, guardar: boolean) => {
      setLarguras((atual) => {
        const nova = { ...atual, [coluna]: largura === null ? LARGURA_PADRAO[coluna] : Math.min(LARGURA_MAX, Math.max(LARGURA_MIN, largura)) };
        if (guardar) {
          try {
            localStorage.setItem(chave(setor), JSON.stringify(nova));
          } catch {
            /* sem armazenamento: só não lembra a largura */
          }
        }
        return nova;
      });
    },
    [setor],
  );

  return { larguras, mudar };
}

/** Título de coluna com a alça de largura na borda direita. */
export function TituloDeColuna({
  coluna,
  larguras,
  onMudar,
  className,
  children,
}: {
  coluna: ColunaDemanda;
  larguras: Larguras;
  onMudar: (coluna: ColunaDemanda, largura: number | null, guardar: boolean) => void;
  className?: string;
  children?: React.ReactNode;
}) {
  // O arraste escuta a janela inteira e sempre termina (soltar, cancelar o toque,
  // sair da janela), como a alça do chat dos Projetos.
  const comecar = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const x0 = e.clientX;
    const l0 = larguras[coluna];
    let atual = l0;
    const corpo = document.body.style;
    const antes = { cursor: corpo.cursor, userSelect: corpo.userSelect };
    corpo.cursor = 'col-resize';
    corpo.userSelect = 'none';
    const mover = (ev: PointerEvent) => {
      atual = l0 + (ev.clientX - x0);
      onMudar(coluna, atual, false);
    };
    const terminar = () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', terminar);
      window.removeEventListener('pointercancel', terminar);
      window.removeEventListener('blur', terminar);
      corpo.cursor = antes.cursor;
      corpo.userSelect = antes.userSelect;
      onMudar(coluna, atual, true);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', terminar);
    window.addEventListener('pointercancel', terminar);
    window.addEventListener('blur', terminar);
  };

  return (
    <span className={cn('group/col relative', className)}>
      {children}
      <span
        role="separator"
        aria-orientation="vertical"
        aria-label="Arraste para mudar a largura da coluna"
        title="Arraste para mudar a largura · duplo clique volta ao padrão"
        onPointerDown={comecar}
        onDoubleClick={() => onMudar(coluna, null, true)}
        className="absolute -right-1 top-0 z-10 flex h-full w-2 cursor-col-resize touch-none justify-center"
      >
        <span className="h-full w-0.5 bg-transparent transition-colors group-hover/col:bg-border hover:!bg-primary" />
      </span>
    </span>
  );
}
