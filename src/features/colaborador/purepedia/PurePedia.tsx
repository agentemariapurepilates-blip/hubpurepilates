import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Library, ArrowRight, Search, X, SearchX } from 'lucide-react';
import { ARTIGOS_PUREPEDIA } from './artigos';
import { buscar } from './busca';

/**
 * PurePedia — base de conhecimento exclusiva dos colaboradores.
 *
 * A busca é o caminho principal da página: quem chega aqui normalmente já sabe
 * o que procura ("retroativo", "royalties", "no-show"). Por isso ela casa por
 * título, descrição, palavras-chave E texto do artigo — sem acento, com os
 * termos em qualquer ordem.
 */

const PurePedia = () => {
  const [consulta, setConsulta] = useState('');
  const buscando = consulta.trim().length > 0;
  const resultados = useMemo(() => buscar(ARTIGOS_PUREPEDIA, consulta.trim()), [consulta]);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-0.5 bg-primary rounded-full" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              Exclusivo para colaboradores
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">PurePedia</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Artigos e manuais da Pure Pilates, reunidos num lugar só.
          </p>
        </div>

        {/* Busca */}
        <div className="mb-7">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Buscar por assunto, título ou palavra-chave — ex.: retroativo, royalties, no-show"
              aria-label="Buscar artigos na PurePedia"
              className="h-12 rounded-xl pl-11 pr-11 text-[15px]"
            />
            {buscando && (
              <button
                type="button"
                onClick={() => setConsulta('')}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {buscando && (
            <p className="mt-2 pl-1 text-xs text-muted-foreground">
              {resultados.length === 0
                ? 'Nenhum artigo encontrado'
                : `${resultados.length} ${resultados.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}`}
            </p>
          )}
        </div>

        {ARTIGOS_PUREPEDIA.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Library className="h-6 w-6" />
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">
              Os primeiros artigos estão a caminho
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
              Os materiais estão sendo transcritos um a um para o padrão visual da Pure. Assim que o
              primeiro estiver pronto, ele aparece aqui.
            </p>
          </div>
        ) : resultados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <SearchX className="h-6 w-6" />
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">
              Nada encontrado para “{consulta.trim()}”
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
              Tente uma palavra só, ou um termo mais direto — a busca procura no título, nas
              palavras-chave e no texto inteiro de cada artigo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {resultados.map(({ artigo, origens }, i) => (
              <Link
                key={artigo.href}
                to={artigo.href}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${0.05 + i * 0.08}s` }}
              >
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                <div className="inline-flex w-12 h-12 rounded-xl items-center justify-center bg-primary/10 text-primary mb-4 transition-transform duration-300 group-hover:scale-110">
                  <artigo.icon className="h-6 w-6" />
                </div>
                <p className="text-base font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  {artigo.title}
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-primary" />
                </p>
                <p className="text-sm text-muted-foreground leading-snug">{artigo.description}</p>
                {buscando && origens.length > 0 && (
                  <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-primary/80">
                    Encontrado em: {origens.join(' · ')}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PurePedia;
