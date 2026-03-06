import { Section } from "@/data/helpCenterData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, ChevronRight } from "lucide-react";

interface ArticleListProps {
  section: Section;
  onBack: () => void;
  onSelectArticle: (articleId: string) => void;
}

export function ArticleList({ section, onBack, onSelectArticle }: ArticleListProps) {
  const Icon = section.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${section.color}15` }}
          >
            <Icon className="h-5 w-5" style={{ color: section.color }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{section.title}</h2>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {section.articles.map((article) => (
          <Card
            key={article.id}
            onClick={() => onSelectArticle(article.id)}
            className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-muted/30 border"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <FileText className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {article.summary}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100" />
              </div>
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 ml-14">
                  {article.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
