import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MessageCircle, ExternalLink, ShoppingBag, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo-pure-pilates.png';
import { catalogoProdutos, type CatalogoProduto } from '@/data/pureStoreCatalogo';

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const deslug = (s: string) =>
  s.replace(/-/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());

const secId = (cat: string) =>
  'sec-' + cat.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

// Ordem das seções (igual ao menu do site) + extras no fim.
const ORDEM_SECOES = [
  'Acessórios',
  'Moletons',
  'Lançamentos',
  'Camisetas',
  'Cropped',
  'Legging',
  'Meias',
  'Outros',
  'PURE BOX',
];

/**
 * Catálogo digital público de uma unidade. Rota aberta (sem login) para o
 * cliente final. Os dados da unidade vêm do próprio link:
 *   /catalogo/<slug>?u=<nome>&w=<whatsapp só dígitos>
 * Produtos setorizados como no site. Sem backend — cada link é exclusivo da
 * unidade pelo WhatsApp.
 */
const CatalogoPublico = () => {
  const { slug } = useParams();
  const [sp] = useSearchParams();
  const [carregando, setCarregando] = useState(true);
  const [unidade, setUnidade] = useState('Pure Pilates');
  const [whats, setWhats] = useState('');

  // A unidade (nome + WhatsApp) vem da tabela `catalogos` pelo slug (link limpo).
  // Fallback: parâmetros ?u=&w= (links antigos, antes do backend).
  useEffect(() => {
    let ativo = true;
    (async () => {
      let nome = sp.get('u')?.trim() || (slug ? deslug(slug) : 'Pure Pilates');
      let w = (sp.get('w') || '').replace(/\D/g, '');
      if (slug) {
        try {
          const { data } = await supabase
            .from('catalogos')
            .select('nome, whatsapp')
            .eq('slug', slug)
            .maybeSingle();
          if (data) {
            nome = data.nome;
            w = (data.whatsapp || '').replace(/\D/g, '');
          }
        } catch {
          /* sem registro / offline → usa o fallback dos parâmetros */
        }
      }
      if (ativo) {
        setUnidade(nome);
        setWhats(w);
        setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [slug, sp]);

  const waHref = (msg: string) =>
    whats ? `https://wa.me/${whats}?text=${encodeURIComponent(msg)}` : undefined;
  const pedidoGeral = waHref(`Olá! Vi o catálogo da Pure Store (${unidade}) e gostaria de fazer um pedido.`);

  // Agrupa por seção na ordem definida; seções fora da lista vão pro fim.
  const secoes = useMemo(() => {
    const map = new Map<string, CatalogoProduto[]>();
    for (const p of catalogoProdutos) {
      const list = map.get(p.categoria) ?? [];
      list.push(p);
      map.set(p.categoria, list);
    }
    const nomes = [
      ...ORDEM_SECOES.filter((s) => map.has(s)),
      ...[...map.keys()].filter((s) => !ORDEM_SECOES.includes(s)),
    ];
    return nomes.map((nome) => ({ nome, produtos: map.get(nome)! }));
  }, []);

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Cabeçalho + navegação de seções */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 py-3">
          <img src={logo} alt="Pure Pilates" className="h-9" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-primary font-semibold leading-none">
              Catálogo Pure Store
            </p>
            <h1 className="text-base font-bold text-foreground truncate leading-tight">{unidade}</h1>
          </div>
        </div>
        <nav className="max-w-5xl mx-auto flex gap-1.5 overflow-x-auto px-4 pb-2">
          {secoes.map((s) => (
            <a
              key={s.nome}
              href={`#${secId(s.nome)}`}
              className="shrink-0 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {s.nome}
            </a>
          ))}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        <div className="py-5">
          <p className="text-sm text-muted-foreground">
            Confira os produtos da Pure Store.{' '}
            {whats
              ? 'Gostou de algo? É só chamar no WhatsApp para fazer seu pedido.'
              : 'Fale com a sua unidade para fazer seu pedido.'}
          </p>
        </div>

        <div className="space-y-8">
          {secoes.map((s) => (
            <section key={s.nome} id={secId(s.nome)} className="scroll-mt-32">
              <h2 className="mb-3 flex items-center gap-2 border-b border-border pb-2 text-lg font-bold text-foreground">
                {s.nome}
                <span className="text-sm font-normal text-muted-foreground">({s.produtos.length})</span>
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {s.produtos.map((p) => (
                  <ProdutoCard key={p.url} p={p} waHref={waHref} temWhats={!!pedidoGeral} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="py-8 text-center text-xs text-muted-foreground">
          {catalogoProdutos.length} produtos · Preços de referência do site, sujeitos a alteração.
        </p>
      </main>

      {/* Botão fixo de pedido */}
      {pedidoGeral && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <a href={pedidoGeral} target="_blank" rel="noopener noreferrer" className="block">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition hover:brightness-95">
                <MessageCircle className="h-5 w-5" />
                Fazer pedido no WhatsApp
              </button>
            </a>
          </div>
        </div>
      )}

      {!pedidoGeral && (
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <ShoppingBag className="h-4 w-4 shrink-0" />
            Este link não tem um WhatsApp configurado. Peça à sua unidade o link do catálogo dela.
          </div>
        </div>
      )}
    </div>
  );
};

const ProdutoCard = ({
  p,
  waHref,
  temWhats,
}: {
  p: CatalogoProduto;
  waHref: (msg: string) => string | undefined;
  temWhats: boolean;
}) => {
  // Esgotado: mostra só a tag — sem "Pedir", sem link "Ver no site", imagem não clicável.
  const foto = (
    <div className="relative block aspect-square overflow-hidden bg-muted">
      <img
        src={p.foto}
        alt={p.nome}
        loading="lazy"
        className={cn(
          'h-full w-full object-cover',
          p.esgotado ? 'opacity-70 grayscale-[0.3]' : 'transition-transform duration-300 hover:scale-105',
        )}
      />
      {p.esgotado && (
        <span className="absolute left-2 top-2 rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] font-semibold text-background">
          Esgotado
        </span>
      )}
    </div>
  );

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-xl border border-border bg-card', p.esgotado && 'opacity-90')}>
      {p.esgotado ? (
        foto
      ) : (
        <a href={p.url} target="_blank" rel="noopener noreferrer">
          {foto}
        </a>
      )}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-xs font-medium leading-snug text-foreground">{p.nome}</h3>
        <p className="mt-1 text-sm font-bold text-primary">{brl(p.preco)}</p>
        {!p.esgotado && (
          <div className="mt-2 flex items-center gap-2 pt-1">
            {temWhats && (
              <a
                href={waHref(`Olá! Quero pedir: ${p.nome} (${brl(p.preco)}).`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-[#25D366] px-2 py-1 text-[11px] font-semibold text-white hover:brightness-95"
              >
                <MessageCircle className="h-3 w-3" />
                Pedir
              </a>
            )}
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary"
            >
              Ver no site
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogoPublico;
