import { useCallback, useEffect, useState } from 'react';
import { Eye, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import logoCreme from './assets/logo-entre-molas-creme.png';
import type { EdicaoEntreMolas } from './edicoes';

// Publicação das edições — o mesmo esquema da Timeline do Mês: enquanto o admin não clica em "Publicar para
// todos", só colaboradores veem a edição; franqueados veem "em breve". Usa a mesma tabela da Timeline
// (timeline_visibility), com a chave "entre-molas:<slug>" no lugar do mês.

const chaveDe = (slug: string) => `entre-molas:${slug}`;
const PREFIXO = chaveDe('');

export function usePublicacaoEntreMolas() {
  const { user, isColaborador, isAdmin } = useAuth();
  const [publicadas, setPublicadas] = useState<Record<string, boolean>>({});
  const [carregando, setCarregando] = useState(true);
  const [publicando, setPublicando] = useState(false);

  useEffect(() => {
    let vivo = true;
    supabase
      .from('timeline_visibility')
      .select('month_key, is_published')
      .like('month_key', `${PREFIXO}%`)
      .then(({ data }) => {
        if (!vivo) return;
        const mapa: Record<string, boolean> = {};
        (data || []).forEach((linha) => {
          mapa[linha.month_key.slice(PREFIXO.length)] = linha.is_published;
        });
        setPublicadas(mapa);
        setCarregando(false);
      });
    return () => {
      vivo = false;
    };
  }, []);

  const publicar = useCallback(
    async (slug: string) => {
      setPublicando(true);
      try {
        const { error } = await supabase
          .from('timeline_visibility')
          .upsert(
            { month_key: chaveDe(slug), is_published: true, published_at: new Date().toISOString(), published_by: user?.id },
            { onConflict: 'month_key' },
          );
        if (error) throw error;
        setPublicadas((antes) => ({ ...antes, [slug]: true }));
        toast.success('Edição publicada para todos!');
      } catch (err) {
        console.error(err);
        toast.error('Erro ao publicar a edição.');
      } finally {
        setPublicando(false);
      }
    },
    [user],
  );

  const equipe = isColaborador || isAdmin;
  return {
    carregando,
    publicando,
    publicar,
    estaPublicada: (slug: string) => publicadas[slug] === true,
    /** Publicada para todos, ou em pré-visualização para a equipe. */
    podeVer: (slug: string) => publicadas[slug] === true || equipe,
    equipe,
    isAdmin,
  };
}

/** Faixa do modo pré-visualização, no topo da revista. O botão só aparece para o admin. */
export const BarraPublicar = ({
  onPublicar,
  publicando,
  podePublicar,
}: {
  onPublicar: () => void;
  publicando: boolean;
  podePublicar: boolean;
}) => (
  <div className="em-sans relative z-10 flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#a9293b] px-4 py-2.5 text-white">
    <Eye className="h-5 w-5 shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold leading-tight">Modo pré-visualização</p>
      <p className="hidden text-xs leading-tight text-white/80 sm:block">
        Apenas colaboradores podem ver esta edição. Franqueados verão &quot;em breve&quot;.
      </p>
    </div>
    {podePublicar && (
      <button
        type="button"
        onClick={onPublicar}
        disabled={publicando}
        className="flex shrink-0 items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#a9293b] transition hover:bg-[#f7ecdc] disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {publicando ? 'Publicando...' : 'Publicar para todos'}
      </button>
    )}
  </div>
);

/** O que o franqueado vê enquanto a edição não foi publicada. */
export const EmBreve = ({ edicao }: { edicao: EdicaoEntreMolas }) => (
  <div
    className="flex h-full w-full flex-col items-center justify-center px-8 text-center"
    style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 30%, #6e1624 0%, #3a0c15 55%, #17070a 100%)' }}
  >
    <img src={logoCreme} alt="Entre Molas — Você por dentro de tudo." className="w-[min(520px,82vw)] select-none" draggable={false} />
    <div className="mt-10 flex items-center gap-4">
      <span className="h-px w-12 bg-white/30" />
      <span className="em-sans text-[12px] font-semibold uppercase tracking-[0.4em] text-white/70">
        {edicao.slug === 'edicao-1' ? 'Primeira edição' : edicao.nome}
      </span>
      <span className="h-px w-12 bg-white/30" />
    </div>
    <div className="em-display mt-5 text-[clamp(64px,12vw,128px)] font-extrabold uppercase leading-[0.85] text-[#f7ecdc]">Em breve</div>
    <p className="em-sans mt-6 max-w-md text-[16px] leading-relaxed text-white/70">
      A {edicao.nome} da Entre Molas está sendo preparada. Fique ligado!
    </p>
  </div>
);
