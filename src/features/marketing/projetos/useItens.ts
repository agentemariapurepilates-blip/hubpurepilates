import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { buscarEquipe, db, descendentes, nomeDeCanal, type Item, type PessoaMarketing } from './projetos';

// Os itens (projetos e subtarefas), com atualização em tempo real quando outra
// pessoa do time mexe, e as ações de criar, salvar e excluir. A tela mostra a
// mudança na hora e volta atrás se o banco recusar.
//
// Sem `projetoId`: todos os itens (a lista de projetos). Com `projetoId`: o
// projeto e tudo o que está dentro dele (a página grande).
export function useItens(projetoId?: string | null) {
  const { user } = useAuth();
  const [itens, setItens] = useState<Item[]>([]);
  const [equipe, setEquipe] = useState<PessoaMarketing[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    let consulta = db.from('marketing_itens').select('*').eq('arquivado', false);
    if (projetoId) consulta = consulta.or(`id.eq.${projetoId},projeto_id.eq.${projetoId}`);
    const { data, error } = await consulta.order('ordem').order('created_at');
    if (error) {
      setErro(error.code === 'PGRST205' ? 'As tabelas de Projetos ainda não foram criadas no banco.' : 'Não consegui carregar os projetos agora.');
    } else {
      setErro('');
      setItens((data ?? []) as Item[]);
    }
    setCarregando(false);
  }, [projetoId]);

  useEffect(() => {
    carregar();
    buscarEquipe().then(setEquipe);
    const canal = db
      .channel(nomeDeCanal(`marketing-itens-${projetoId ?? 'todos'}`))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_itens' }, () => carregar())
      .subscribe();
    return () => {
      db.removeChannel(canal);
    };
  }, [projetoId, carregar]);

  const criar = async (campos: Partial<Item> & { titulo: string }) => {
    if (!campos.titulo.trim()) return null;
    const pai = campos.item_pai_id ?? null;
    const irmaos = itens.filter((t) => t.item_pai_id === pai);
    const { data, error } = await db
      .from('marketing_itens')
      .insert({
        ordem: irmaos.length ? Math.max(...irmaos.map((t) => t.ordem)) + 1 : 0,
        criado_por: user?.id,
        responsaveis: user?.id && !pai ? [user.id] : [],
        ...campos,
        titulo: campos.titulo.trim(),
      })
      .select('*')
      .single();
    if (error) {
      toast.error('Não consegui criar. Tente de novo.');
      return null;
    }
    setItens((ts) => [...ts, data as Item]);
    return data as Item;
  };

  const salvar = async (id: string, campos: Partial<Item>) => {
    setItens((ts) => ts.map((t) => (t.id === id ? { ...t, ...campos } : t)));
    const { error } = await db.from('marketing_itens').update(campos).eq('id', id);
    if (error) {
      toast.error(error.message.includes('check') ? 'A data de início precisa ser antes do vencimento.' : 'Não consegui salvar.');
      carregar();
    }
  };

  const excluir = async (id: string) => {
    const sai = new Set([id, ...descendentes(id, itens)]);
    setItens((ts) => ts.filter((t) => !sai.has(t.id)));
    const { error } = await db.from('marketing_itens').delete().eq('id', id);
    if (error) {
      toast.error('Não consegui excluir.');
      carregar();
    }
  };

  return { itens, equipe, carregando, erro, carregar, criar, salvar, excluir };
}

export type DadosDosItens = ReturnType<typeof useItens>;
