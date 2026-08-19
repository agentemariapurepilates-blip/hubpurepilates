import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ScrollText, Package, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

// Os mesmos destinos do dropdown "Tutoriais" no menu lateral.
const TUTORIAIS = [
  {
    title: 'Tutorial do Marketing',
    description: 'Passo a passo pra usar o marketing da Pure no dia a dia.',
    href: '/tutorial-marketing',
    icon: ScrollText,
  },
  {
    title: 'Materiais de Implantação',
    description: 'Tudo que você precisa pra montar e abrir sua unidade.',
    href: '/materiais-implantacao',
    icon: Package,
  },
  {
    title: 'Manual do Sistema',
    description: 'Como usar o Hub, recurso por recurso.',
    href: '/manual-sistema',
    icon: BookOpen,
  },
  {
    title: 'Onboarding do Instrutor',
    description: 'Guia de boas-vindas do instrutor(a) da Pure Pilates.',
    href: '/onboarding-instrutor',
    icon: GraduationCap,
  },
];

const Tutoriais = () => (
  <MainLayout>
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-0.5 bg-primary rounded-full" />
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">
            Central de ajuda
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Guias e Tutoriais</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Guias e materiais pra você tirar o máximo do Hub.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TUTORIAIS.map((t, i) => (
          <Link
            key={t.href}
            to={t.href}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${0.05 + i * 0.08}s` }}
          >
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
            <div className="inline-flex w-12 h-12 rounded-xl items-center justify-center bg-primary/10 text-primary mb-4 transition-transform duration-300 group-hover:scale-110">
              <t.icon className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1 flex items-center gap-1.5">
              {t.title}
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-primary" />
            </p>
            <p className="text-sm text-muted-foreground leading-snug">{t.description}</p>
          </Link>
        ))}
      </div>
    </div>
  </MainLayout>
);

export default Tutoriais;
