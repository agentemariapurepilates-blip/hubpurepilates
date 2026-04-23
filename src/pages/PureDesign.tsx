import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Paintbrush } from 'lucide-react';
import { pureDesignTemplates } from '@/data/pureDesignTemplates';

const PureDesign = () => {
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

        {pureDesignTemplates.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Nenhum modelo disponível ainda.
          </Card>
        ) : (
          <div className="space-y-8">
            {Array.from(
              pureDesignTemplates.reduce((map, template) => {
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
