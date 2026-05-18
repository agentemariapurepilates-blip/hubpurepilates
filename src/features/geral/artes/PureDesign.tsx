import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Paintbrush, Search, FolderOpen, ChevronLeft } from 'lucide-react';
import { pureDesignTemplates } from '@/data/pureDesignTemplates';

const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

const PureDesign = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    const q = normalize(search);
    return pureDesignTemplates.filter((t) => {
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (q && !normalize(`${t.name} ${t.category}`).includes(q)) return false;
      return true;
    });
  }, [search, selectedCategory]);

  const categories = useMemo(
    () =>
      Array.from(
        pureDesignTemplates.reduce((map, template) => {
          const list = map.get(template.category) ?? [];
          list.push(template);
          map.set(template.category, list);
          return map;
        }, new Map<string, typeof pureDesignTemplates>()),
      ),
    [],
  );

  const showCategoryCards = !selectedCategory && !search;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Paintbrush className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pure Design</h1>
            <p className="text-sm text-muted-foreground">
              Edite os textos e baixe como PNG. Os modelos seguem a identidade visual da Pure Pilates.
            </p>
          </div>
        </div>

        <div className="relative max-w-xl flex items-stretch rounded-lg overflow-hidden shadow-sm ring-1 ring-border focus-within:ring-2 focus-within:ring-primary transition-shadow">
          <div className="w-1.5 bg-primary shrink-0" />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar arte pelo título..."
              className="pl-11 h-12 text-base border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-card"
            />
          </div>
        </div>

        {pureDesignTemplates.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Nenhum modelo disponível ainda.
          </Card>
        ) : showCategoryCards ? (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b pb-2">
              Explorar categorias
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {categories.map(([category, templates]) => {
                const preview = templates[0];
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className="text-left"
                  >
                    <Card className="h-28 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group bg-card">
                      <div
                        className="relative h-full bg-muted"
                        style={{
                          background:
                            'linear-gradient(105deg, hsl(var(--card)) 0%, hsl(var(--card)) 43%, hsl(var(--muted)) 43%, hsl(var(--muted)) 100%)',
                        }}
                      >
                        <div className="absolute inset-y-0 right-0 w-[54%] overflow-hidden">
                          <div
                            className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                            style={{ backgroundImage: `url(${preview.thumbnail})` }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/35 to-transparent" />
                        </div>
                        <div className="relative z-10 flex h-full w-[58%] items-center gap-3 p-4">
                          <div className="h-9 w-9 shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
                            <FolderOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                              {category}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {templates.length} {templates.length === 1 ? 'modelo' : 'modelos'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Nenhuma arte encontrada para "{search}".
          </Card>
        ) : (
          <div className="space-y-5">
            {selectedCategory && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setSearch('');
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar para categorias
              </button>
            )}
            {Array.from(
              filteredTemplates.reduce((map, template) => {
                const list = map.get(template.category) ?? [];
                list.push(template);
                map.set(template.category, list);
                return map;
              }, new Map<string, typeof pureDesignTemplates>()),
            ).map(([category, templates]) => (
              <section key={category} className="space-y-3">
                <h2 className="text-base font-semibold text-foreground border-b pb-2">
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {templates.map((template) => (
                    <Link key={template.id} to={`/pure-design/${template.id}`}>
                      <Card className="h-28 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group bg-card">
                        <div
                          className="relative h-full bg-muted"
                          style={{
                            background:
                              'linear-gradient(105deg, hsl(var(--card)) 0%, hsl(var(--card)) 43%, hsl(var(--muted)) 43%, hsl(var(--muted)) 100%)',
                          }}
                        >
                          <div className="absolute inset-y-0 right-0 w-[54%] overflow-hidden">
                            <div
                              className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                              style={{ backgroundImage: `url(${template.thumbnail})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/35 to-transparent" />
                          </div>
                          <div className="relative z-10 flex h-full w-[58%] items-center p-4">
                            <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                              {template.name}
                            </h3>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PureDesign;
