import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchArticles, Section, Article } from "@/data/helpCenterData";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSelectArticle: (sectionId: string, articleId: string) => void;
}

export function SearchBar({ onSelectArticle }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ section: Section; article: Article }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 2) {
      const searchResults = searchArticles(query);
      setResults(searchResults.slice(0, 8));
      setIsOpen(true);
      setSelectedIndex(0);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case "Enter":
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          onSelectArticle(selected.section.id, selected.article.id);
          setQuery("");
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (sectionId: string, articleId: string) => {
    onSelectArticle(sectionId, articleId);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar no manual... (ex: 'agenda', 'pagamentos', 'planos')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="h-14 pl-12 pr-12 text-base shadow-lg border-0 bg-card focus-visible:ring-primary"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-xl border overflow-hidden z-50">
          <div className="p-2">
            {results.map((result, index) => {
              const Icon = result.section.icon;
              return (
                <button
                  key={`${result.section.id}-${result.article.id}`}
                  onClick={() => handleSelect(result.section.id, result.article.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                    index === selectedIndex
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${result.section.color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: result.section.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.article.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {result.section.title} • {result.article.summary}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="border-t px-4 py-2 text-xs text-muted-foreground bg-muted/30">
            <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono">↑↓</kbd>
            {" "}para navegar •{" "}
            <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono">Enter</kbd>
            {" "}para selecionar •{" "}
            <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono">Esc</kbd>
            {" "}para fechar
          </div>
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-xl border p-8 text-center z-50">
          <p className="text-muted-foreground">
            Nenhum resultado encontrado para "{query}"
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente buscar por outros termos
          </p>
        </div>
      )}
    </div>
  );
}
