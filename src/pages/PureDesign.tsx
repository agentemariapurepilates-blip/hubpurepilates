import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Paintbrush, Search } from 'lucide-react';
import { pureDesignTemplates } from '@/data/pureDesignTemplates';

const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

const PureDesign = () => {
  const [search, setSearch] = useState('');

  const filteredTemplates = useMemo(() => {
    const q = normalize(search);
    if (!q) return pureDesignTemplates;
    return pureDesignTemplates.filter((t) =>
      normalize(`${t.name} ${t.category}`).includes(q),
    );
  }, [search]);

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
        ) : filteredTemplates.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Nenhuma arte encontrada para "{search}".
          </Card>
        ) : (
          <div className="space-y-8">
            {Array.from(
              filteredTemplates.reduce((map, template) => {
                const list = map.get(template.category) ?? [];
                list.push(template);
                map.set(template.category, list);
                return map;
              }, new Map<string, typeof pureDesignTemplates>()),
            ).map(([category, templates]) => (
              <section key={category} className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b pb-2">
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {templates.map((template) => (
                    <Link key={template.id} to={`/pure-design/${template.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                        <div
                          className="aspect-[3/4] bg-muted bg-cover bg-center"
                          style={{ backgroundImage: `url(${template.thumbnail})` }}
                        />
                        <div className="p-4">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {template.category}
                          </p>
                          <h3 className="font-semibold text-foreground mt-1 group-hover:text-primary transition-colors">
                            {template.name}
                          </h3>
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
