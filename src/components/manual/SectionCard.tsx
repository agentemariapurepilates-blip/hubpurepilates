import { Section } from "@/data/helpCenterData";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

interface SectionCardProps {
  section: Section;
  onClick: () => void;
}

export function SectionCard({ section, onClick }: SectionCardProps) {
  const Icon = section.icon;

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 bg-card overflow-hidden"
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${section.color}15` }}
          >
            <Icon className="h-6 w-6" style={{ color: section.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {section.title}
              </h3>
              <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {section.description}
            </p>
            <p className="text-xs text-primary mt-2 font-medium">
              {section.articles.length} {section.articles.length === 1 ? "artigo" : "artigos"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
