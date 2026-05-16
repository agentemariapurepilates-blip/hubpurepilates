import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Sparkles, CalendarDays, Video, User, Palette, Megaphone, ArrowRight,
  Handshake, BookOpen, ScrollText, Paintbrush, Package, Zap,
} from 'lucide-react';

interface AvisoTitle {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
}

const CHECKLIST = [
  { icon: Sparkles, text: 'Timeline do Mês com as novidades' },
  { icon: Megaphone, text: 'Avisos e comunicados oficiais' },
  { icon: CalendarDays, text: 'Calendário de marketing' },
  { icon: Video, text: 'Mídias sociais e vídeos prontos' },
  { icon: Palette, text: 'Artes prontas pra usar' },
  { icon: Paintbrush, text: 'Pure Design — gerador de artes' },
  { icon: Handshake, text: 'Parcerias e benefícios' },
  { icon: Package, text: 'Materiais de implantação' },
  { icon: BookOpen, text: 'Manual do sistema' },
  { icon: ScrollText, text: 'Tutorial do marketing' },
];

const QUICK_LINKS = [
  { title: 'Novidades do Mês', description: 'Comunicados importantes', icon: Sparkles, href: '/novidades', color: 'bg-amber-500/10 text-amber-500' },
  { title: 'Calendário de Marketing', description: 'Eventos e campanhas', icon: CalendarDays, href: '/calendario-marketing', color: 'bg-sector-academy/10 text-sector-academy' },
  { title: 'Mídias Sociais', description: 'Conteúdos para redes', icon: Video, href: '/midias-sociais', color: 'bg-sector-franchising/10 text-sector-franchising' },
  { title: 'Meu Perfil', description: 'Suas informações', icon: User, href: '/perfil', color: 'bg-primary/10 text-primary' },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

const Index = () => {
  const { loading } = useAuth();
  const [avisos, setAvisos] = useState<AvisoTitle[]>([]);

  useEffect(() => {
    supabase
      .from('avisos')
      .select('id, title, content, image_url, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => data && setAvisos(data as AvisoTitle[]));
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  const boardAvisos = avisos.slice(0, 3);

  return (
    <MainLayout>
      {/* ━━━━━ HERO FULL-BLEED: ocupa toda a tela menos a sidebar ━━━━━ */}
      {/* Negative margins quebram o p-4/sm:p-6/lg:p-8 do MainLayout. h-screen pega 100vh. */}
      <section className="relative -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 h-[55vh] md:h-[70vh] lg:h-[100dvh] overflow-hidden bg-black">
        <video
          src="/leo-yang.mp4?v=1"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Overlay escurecido */}
        <div className="pointer-events-none absolute inset-0 bg-black/45" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </section>

      {/* Conteúdo normal centralizado abaixo do hero */}
      <div className="max-w-5xl mx-auto pt-8 md:pt-12">
        {/* Caption do crédito do vídeo */}
        <p className="text-[11px] md:text-xs text-muted-foreground italic text-right mb-6 leading-snug">
          Publicidade contratada com o influencer Leo Young, que já está rodando nas nossas redes.
        </p>

        {/* ━━━━━ Marquee de avisos ━━━━━ */}
        {avisos.length > 0 && (
          <Link
            to="/avisos"
            aria-label="Ver todos os avisos"
            className="group relative block mb-12 overflow-hidden rounded-full bg-gradient-to-r from-primary via-red-600 to-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
          >
            <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center gap-2 pl-4 pr-6 bg-gradient-to-r from-black/40 to-transparent">
              <Megaphone className="h-4 w-4 animate-pulse-soft" />
              <span className="text-[11px] font-bold uppercase tracking-widest hidden sm:inline">Avisos</span>
            </div>
            <div className="overflow-hidden py-2.5 pl-[88px] sm:pl-[140px] pr-4">
              <div className="flex whitespace-nowrap will-change-transform animate-marquee group-hover:[animation-play-state:paused]">
                {[...avisos, ...avisos].map((a, idx) => (
                  <span key={`${a.id}-${idx}`} className="inline-flex items-center gap-3 px-6 text-sm font-medium">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
                    {a.title}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        )}

        <section className="mb-12 mt-8">
          <div className="text-center mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
              O que você encontra <span className="text-primary">aqui no Hub?</span>
            </h3>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-8 md:p-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {CHECKLIST.map((item) => (
                <div key={item.text} className="group flex items-center gap-3 text-sm text-foreground/85 transition-colors hover:text-foreground cursor-default">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                    <item.icon className="h-3.5 w-3.5 text-primary transition-colors group-hover:text-white" />
                  </span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-12 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-0.5 bg-primary rounded-full" />
                <span className="text-xs font-semibold text-primary uppercase tracking-widest">Acesso rápido</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">Como você acessa</h3>
            </div>
            <Zap className="h-6 w-6 text-primary/40 hidden sm:block" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QUICK_LINKS.map((link, i) => (
              <Link
                key={link.title}
                to={link.href}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${0.9 + i * 0.08}s` }}
              >
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                <div className={`inline-flex w-10 h-10 rounded-lg items-center justify-center ${link.color} mb-3 transition-transform duration-300 group-hover:scale-110`}>
                  <link.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-0.5 flex items-center gap-1">
                  {link.title}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-primary" />
                </p>
                <p className="text-xs text-muted-foreground leading-snug">{link.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {boardAvisos.length > 0 && (
          <section className="mb-12 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-0.5 bg-primary rounded-full" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest">Quadro de avisos</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">Últimos avisos publicados</h3>
              </div>
              <Link to="/avisos">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 group">
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {boardAvisos.map((a, i) => (
                <Link
                  key={a.id}
                  to="/avisos"
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${1 + i * 0.1}s` }}
                >
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
                    {a.image_url ? (
                      <img src={a.image_url} alt={a.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Megaphone className="h-14 w-14 text-primary/30 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider shadow">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-soft" />
                        Aviso
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">
                      {formatDate(a.created_at)}
                    </p>
                    <h4 className="text-base font-bold text-foreground line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
                      {a.title}
                    </h4>
                    {a.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">{a.content}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mb-12 relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 md:p-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '1s' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-2xl md:text-3xl font-heading font-bold mb-3">Tudo em um só lugar!</h3>
            <p className="text-muted-foreground leading-relaxed">
              Menos ruído, mais clareza. Informação organizada e fácil de acessar, sempre atualizada.
            </p>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Index;
