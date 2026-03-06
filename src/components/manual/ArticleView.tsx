import { Section, Article } from "@/data/helpCenterData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Tag, ExternalLink, Play } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArticleViewProps {
  section: Section;
  article: Article;
  onBack: () => void;
}

export function ArticleView({ section, article, onBack }: ArticleViewProps) {
  const Icon = section.icon;

  const wordCount = article.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: section.color }} />
          <span className="text-sm text-muted-foreground">{section.title}</span>
        </div>
      </div>

      {/* Article Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        <p className="text-lg text-muted-foreground mb-4">{article.summary}</p>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{readingTime} min de leitura</span>
          </div>
          
          {article.tags && article.tags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <div className="flex flex-wrap gap-1.5">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Article Content */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 md:p-10">
          <div className="prose prose-lg prose-slate dark:prose-invert max-w-none 
            prose-headings:scroll-mt-20 
            prose-h1:text-[1.875rem] prose-h1:font-semibold prose-h1:mt-14 prose-h1:mb-7 prose-h1:text-foreground prose-h1:leading-snug
            prose-h2:text-[1.5rem] prose-h2:font-semibold prose-h2:mt-14 prose-h2:mb-6 prose-h2:text-foreground prose-h2:leading-snug
            prose-h3:text-[1.25rem] prose-h3:font-semibold prose-h3:mt-10 prose-h3:mb-5 prose-h3:text-foreground
            prose-h4:text-[1.125rem] prose-h4:font-semibold prose-h4:mt-8 prose-h4:mb-4 prose-h4:text-foreground
            prose-p:text-foreground/80 prose-p:leading-[2] prose-p:mb-6 prose-p:text-[1.0625rem]
            prose-li:text-foreground/80 prose-li:leading-[2] prose-li:mb-3 prose-li:text-[1.0625rem]
            prose-ul:my-7 prose-ul:space-y-2 prose-ul:list-disc prose-ul:pl-6
            prose-ol:my-7 prose-ol:space-y-2 prose-ol:list-decimal prose-ol:pl-6
            prose-strong:text-foreground prose-strong:font-semibold
            prose-code:text-primary prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none 
            prose-blockquote:border-l-primary prose-blockquote:bg-secondary/30 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:my-8 prose-blockquote:text-foreground/80
            prose-table:border prose-th:bg-muted prose-th:p-4 prose-td:p-4 prose-td:border prose-th:border prose-th:text-[1rem] prose-td:text-[1rem]
            prose-img:rounded-xl prose-img:shadow-lg prose-img:my-10
            prose-a:text-primary prose-a:font-medium hover:prose-a:underline
            [&_h2+p]:mt-0 [&_h3+p]:mt-0
            leading-[2]
            [&>*+h2]:mt-16 [&>*+h3]:mt-12
            [&>hr]:my-10 [&>hr]:border-border">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => {
                  const isYouTube = href && (href.includes("youtu.be") || href.includes("youtube.com"));
                  const isExternal = href && href.startsWith("http");

                  if (isYouTube) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-underline inline-flex items-center gap-2 rounded-lg bg-destructive text-destructive-foreground px-5 py-2.5 text-sm font-semibold shadow-md hover:opacity-90 transition-opacity my-1"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        {children}
                        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                      </a>
                    );
                  }

                  if (isExternal) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-underline inline-flex items-center gap-1.5 rounded-md bg-primary/10 text-primary px-3 py-1.5 text-sm font-medium hover:bg-primary/20 transition-colors my-1"
                      >
                        {children}
                        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                      </a>
                    );
                  }

                  return <a href={href}>{children}</a>;
                },
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Footer */}
      <div className="mt-8 flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Ver todos os artigos de {section.title}
        </Button>
      </div>
    </div>
  );
}
