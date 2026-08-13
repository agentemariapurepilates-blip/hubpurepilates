import { useSearchParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Paintbrush, Sparkles, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { pureDesignTemplates } from '@/data/pureDesignTemplates';
import ArtesPersonalizadas from './ArtesPersonalizadas';
import ArtesProntas from './ArtesProntas';

type Tab = 'personalizadas' | 'prontas';

const PureDesign = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get('tab');
  const tab: Tab | null =
    param === 'prontas' ? 'prontas' : param === 'personalizadas' ? 'personalizadas' : null;

  const setTab = (next: Tab | null) => {
    setSearchParams(next ? { tab: next } : {}, { replace: true });
  };

  const templatePreview = pureDesignTemplates[0]?.thumbnail;
  const activeLabel = tab === 'prontas' ? 'Artes prontas' : 'Artes personalizadas';

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Paintbrush className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pure Design</h1>
            <p className="text-sm text-muted-foreground">
              Modelos editáveis e artes prontas com a identidade visual da Pure Pilates.
            </p>
          </div>
        </div>

        {tab === null ? (
          /* Tela de escolha */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Artes personalizadas */}
            <button
              type="button"
              onClick={() => setTab('personalizadas')}
              className="text-left"
            >
              <Card className="h-44 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group bg-card">
                <div
                  className="relative h-full"
                  style={{
                    background:
                      'linear-gradient(105deg, hsl(var(--card)) 0%, hsl(var(--card)) 45%, hsl(var(--muted)) 45%, hsl(var(--muted)) 100%)',
                  }}
                >
                  {templatePreview && (
                    <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
                      <div
                        className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${templatePreview})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/40 to-transparent" />
                    </div>
                  )}
                  <div className="relative z-10 flex h-full w-[56%] flex-col justify-center gap-2 p-6">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      Artes personalizadas
                    </h2>
                    <p className="text-sm text-muted-foreground leading-snug">
                      Modelos editáveis: troque os textos e baixe como PNG.
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                      Ver modelos
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Card>
            </button>

            {/* Artes prontas */}
            <button type="button" onClick={() => setTab('prontas')} className="text-left">
              <Card className="h-44 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group bg-card">
                <div
                  className="relative h-full"
                  style={{
                    background:
                      'linear-gradient(105deg, hsl(var(--card)) 0%, hsl(var(--card)) 45%, hsl(var(--primary)/0.08) 45%, hsl(var(--primary)/0.08) 100%)',
                  }}
                >
                  <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-center">
                    <Download className="h-16 w-16 text-primary/15" />
                  </div>
                  <div className="relative z-10 flex h-full w-[56%] flex-col justify-center gap-2 p-6">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Download className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      Artes prontas
                    </h2>
                    <p className="text-sm text-muted-foreground leading-snug">
                      Artes finalizadas para baixar e usar direto no seu estúdio.
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                      Ver artes
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Card>
            </button>
          </div>
        ) : (
          /* Seção escolhida */
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setTab(null)}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar para o Pure Design
            </button>
            <div className="flex items-center gap-2">
              {tab === 'prontas' ? (
                <Download className="h-5 w-5 text-primary" />
              ) : (
                <Sparkles className="h-5 w-5 text-primary" />
              )}
              <h2 className="text-lg font-bold text-foreground">{activeLabel}</h2>
            </div>

            {tab === 'prontas' ? <ArtesProntas /> : <ArtesPersonalizadas />}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PureDesign;
