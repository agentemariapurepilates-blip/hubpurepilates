import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { FERRAMENTAS_MARKETING } from './ferramentas';

// A página inicial da seção Marketing: um cartão para cada ferramenta, lidos da
// mesma lista do menu lateral (ferramentas.ts).
const MarketingInicio = () => (
  <MainLayout>
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-0.5 bg-primary rounded-full" />
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Time de marketing</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Marketing</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">As ferramentas do time de marketing da Pure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {FERRAMENTAS_MARKETING.map((f, i) => (
          <Link
            key={f.href}
            to={f.href}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${0.05 + i * 0.08}s` }}
          >
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
            <div className="inline-flex w-12 h-12 rounded-xl items-center justify-center bg-primary/10 text-primary mb-4 transition-transform duration-300 group-hover:scale-110">
              <f.icone className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1 flex items-center gap-1.5">
              {f.nome}
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-primary" />
            </p>
            <p className="text-sm text-muted-foreground leading-snug">{f.descricao}</p>
          </Link>
        ))}
      </div>
    </div>
  </MainLayout>
);

export default MarketingInicio;
