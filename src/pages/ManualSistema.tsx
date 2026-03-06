import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { helpCenterSections } from '@/data/helpCenterData';
import { SearchBar } from '@/components/manual/SearchBar';
import { SectionCard } from '@/components/manual/SectionCard';
import { ArticleList } from '@/components/manual/ArticleList';
import { ArticleView } from '@/components/manual/ArticleView';
import { Sparkles } from 'lucide-react';

type ViewState =
  | { type: "home" }
  | { type: "section"; sectionId: string }
  | { type: "article"; sectionId: string; articleId: string };

const ManualSistema = () => {
  const [view, setView] = useState<ViewState>({ type: "home" });

  const handleSelectSection = (sectionId: string) => {
    setView({ type: "section", sectionId });
  };

  const handleSelectArticle = (sectionId: string, articleId: string) => {
    setView({ type: "article", sectionId, articleId });
  };

  const handleBack = () => {
    if (view.type === "article") {
      setView({ type: "section", sectionId: view.sectionId });
    } else {
      setView({ type: "home" });
    }
  };

  const currentSection =
    view.type !== "home"
      ? helpCenterSections.find((s) => s.id === view.sectionId)
      : null;

  const currentArticle =
    view.type === "article" && currentSection
      ? currentSection.articles.find((a) => a.id === view.articleId)
      : null;

  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 lg:-m-8">
        {/* Hero Section (only on home) */}
        {view.type === "home" && (
          <section className="relative overflow-hidden border-b border-border">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div className="relative py-12 md:py-16 px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                  <Sparkles className="h-4 w-4" />
                  Manual do Sistema Pure Pilates
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Como podemos te ajudar?
                </h1>
                <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed max-w-2xl mx-auto">
                  Aqui você encontra <span className="font-semibold text-foreground">tutoriais passo a passo</span>, <span className="font-semibold text-foreground">guias completos</span> e <span className="font-semibold text-foreground">respostas para todas as suas dúvidas</span> sobre o sistema.
                </p>
                <SearchBar
                  onSelectArticle={(sectionId, articleId) =>
                    handleSelectArticle(sectionId, articleId)
                  }
                />
              </div>
            </div>
          </section>
        )}

        {/* Main Content */}
        <div className="p-4 sm:p-6 lg:p-8 py-8">
          {view.type === "home" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Explorar por Categoria</h2>
                <p className="text-sm text-muted-foreground">
                  {helpCenterSections.length} categorias •{" "}
                  {helpCenterSections.reduce((acc, s) => acc + s.articles.length, 0)} artigos
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {helpCenterSections.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    onClick={() => handleSelectSection(section.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {view.type === "section" && currentSection && (
            <ArticleList
              section={currentSection}
              onBack={handleBack}
              onSelectArticle={(articleId) =>
                handleSelectArticle(currentSection.id, articleId)
              }
            />
          )}

          {view.type === "article" && currentSection && currentArticle && (
            <ArticleView
              section={currentSection}
              article={currentArticle}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ManualSistema;
