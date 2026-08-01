import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Home,
  Newspaper,
  Users,
  LogOut,
  Menu,
  X,
  User,
  CalendarDays,
  Video,
  Sparkles,
  FolderOpen,
  UsersRound,
  Settings,
  FileText,
  ClipboardList,
  Palette,
  Paintbrush,
  Megaphone,
  Package,
  Handshake,
  BookOpen,
  ScrollText,
  BarChart3,
  Heart,
  Building2,
  Bot,
  ChevronDown,
  Globe,
  Inbox,
  Image as ImageIcon,
  Radar,
  GraduationCap,
  PlayCircle,
  FileSignature,
  LayoutDashboard,
  Trophy,
  Calendar,
  LineChart,
  SlidersHorizontal,
  PartyPopper,
} from 'lucide-react';

const SectionHeader = ({
  icon: Icon,
  label,
  open,
  onMouseDown,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  open: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
}) => (
  <div
    onMouseDown={onMouseDown}
    className={cn(
      'flex items-center justify-between gap-2 px-3 py-2 mt-3 rounded-lg text-[15px] font-semibold transition-colors cursor-pointer select-none',
      open
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
    )}
    style={{ fontFamily: "'Yaro', 'Inter', system-ui, sans-serif" }}
  >
    <span className="flex items-center gap-2">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </span>
    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', !open && '-rotate-90')} />
  </div>
);

import logo from '@/assets/logo-pure-pilates.png';
import { useState, useEffect, useRef } from 'react';
import { useHasUnitAccess } from '@/features/colaborador/dashboard/hooks/useHasUnitAccess';

// Accordion: apenas uma seção aberta por vez. Abrir uma fecha a anterior.
// Persistido em sessionStorage — sobrevive à navegação e ao reload; reseta ao fechar a aba.
type SectionKey = 'geral' | 'colaboradores' | 'agentes' | 'minha-area' | 'admin' | 'dashboard';

export const MobileMenuButton = ({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (open: boolean) => void }) => (
  <Button
    variant="ghost"
    size="icon"
    className="lg:hidden"
    onClick={() => setMobileOpen(!mobileOpen)}
  >
    {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
  </Button>
);

const AGENTES_DE_IA_ROUTE_PREFIXES = [
  '/agente-design',
  '/agente-monitoramento',
];

// Página-hub de Tutoriais + as filhas (usadas pra abrir o dropdown sozinho).
const TUTORIAIS_PATHS = [
  '/tutoriais',
  '/tutorial-marketing',
  '/materiais-implantacao',
  '/manual-sistema',
];

export const sectionFromPath = (path: string): SectionKey | null => {
  if (AGENTES_DE_IA_ROUTE_PREFIXES.some((p) => path.startsWith(p))) return 'agentes';
  if (['/feed', '/pedidos-demanda', '/academy', '/colaborador/midias-sociais', '/inauguracoes'].some((p) => path.startsWith(p))) return 'colaboradores';
  // Antes de '/minha-area': o Hub tem /minha-area/dashboard (Mídia Adicional),
  // que NÃO pertence a esta seção. Por isso o teste é '/dashboard/' com barra.
  if (path.startsWith('/dashboard/')) return 'dashboard';
  if (path.startsWith('/minha-area')) return 'minha-area';
  if (path.startsWith('/admin')) return 'admin';
  return null;
};

const Sidebar = () => {
  const { user, signOut, isAdmin, isColaborador, userType } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isFranqueado = userType === 'franqueado';
  const hasUnitAccess = useHasUnitAccess();

  // Dropdown "Tutoriais" — abre sozinho quando a rota atual é a página-hub ou uma das filhas.
  const [tutoriaisOpen, setTutoriaisOpen] = useState(() =>
    TUTORIAIS_PATHS.includes(location.pathname),
  );

  // A cada carga/reload: abre a seção da rota atual; se a rota não pertencer a
  // nenhuma seção específica (páginas "Geral"), a seção "Geral" já vem aberta.
  const [openSection, setOpenSection] = useState<SectionKey | null>(
    () => sectionFromPath(location.pathname) ?? 'geral',
  );

  // Ao mudar de rota (não no mount inicial), se a nova rota pertencer a uma seção,
  // abre essa seção e fecha as outras.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const auto = sectionFromPath(location.pathname);
    if (auto) setOpenSection(auto);
    if (TUTORIAIS_PATHS.includes(location.pathname)) setTutoriaisOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserTypeLabel = () => {
    if (isAdmin) return 'Administrador';
    if (isFranqueado) return 'Franqueado';
    return 'Colaborador';
  };

  // Main navigation - accessible by everyone (no section label)
  const mainNavigation = [
    { name: 'Comece aqui', href: '/', icon: Home },
    { name: 'Timeline do Mês', href: '/novidades', icon: Sparkles },
    { name: 'Mídia adicional', href: '/autorizar-midia-adicional', icon: Megaphone },
    { name: 'Avisos', href: '/avisos', icon: Megaphone },
    { name: 'Parcerias', href: '/parcerias', icon: Handshake },
    { name: 'Mídias Sociais', href: '/midias-sociais', icon: Video },
    { name: 'Calendário de Marketing', href: '/calendario-marketing', icon: CalendarDays },
    { name: 'Pure Design', href: '/pure-design', icon: Paintbrush },
  ];

  // Sub-grupo Tutoriais (dropdown dentro de Geral) — o header "Tutoriais" leva
  // pra página-hub /tutoriais, com botões pra cada um destes.
  const tutoriaisNavigation = [
    { name: 'Tutorial do Marketing', href: '/tutorial-marketing', icon: ScrollText },
    { name: 'Materiais de Implantação', href: '/materiais-implantacao', icon: Package },
    { name: 'Manual do Sistema', href: '/manual-sistema', icon: BookOpen },
  ];

  // Colaboradores section - only for colaboradores and admins
  const colaboradoresNavigation = [
    { name: 'Feed da Sede', href: '/feed', icon: Newspaper },
    { name: 'Solicitação de demandas', href: '/pedidos-demanda', icon: ClipboardList },
    { name: 'Visão Geral das Unidades', href: '/midia-adicional/unidades', icon: Building2 },
    { name: 'Inaugurações', href: '/inauguracoes', icon: PartyPopper },
  ];

  // Sub-grupo Academy (dentro de Colaboradores)
  const academyNavigation = [
    { name: 'Gerar certificados', href: '/academy/gerar-certificados', icon: GraduationCap, disabled: false },
    { name: 'Automação de contratos', href: '/academy/gerar-contratos', icon: FileSignature, disabled: false },
  ];

  // Sub-grupo Mídias Sociais (calendários por marca, dentro de Colaboradores)
  const midiasSociaisColabNavigation = [
    { name: 'Studios', href: '/colaborador/midias-sociais/studios', icon: Video },
    { name: 'Academy', href: '/colaborador/midias-sociais/academy', icon: GraduationCap },
    { name: 'Franchising', href: '/colaborador/midias-sociais/franchising', icon: Building2 },
  ];

  // Agente de Design - only for colaboradores and admins
  const designNavigation = [
    { name: 'Gerar Foto', href: '/agente-design/gerar-foto', icon: Sparkles, disabled: false },
    { name: 'Avatares', href: '/agente-design/avatares', icon: User, disabled: false },
    { name: 'Criação de Layout', href: '/agente-design/criacao-layout', icon: Palette, disabled: false },
  ];

  // Agente Monitoramento section - only for admins
  const monitoramentoNavigation = [
    { name: 'Métricas', href: '/agente-monitoramento/metricas', icon: BarChart3, disabled: false },
    { name: 'Pure Monitor', href: '/agente-monitoramento/pure-monitor', icon: Radar, disabled: false },
  ];

  // Minha Área section
  // 'Dashboard' aparece pra admin OU usuário com >=1 unidade atribuída.
  // 'Mídia adicional' (gestão de vínculos) só pra admin.
  const minhaAreaNavigation = [
    ...(hasUnitAccess
      ? [{ name: 'Dashboard', href: '/minha-area/dashboard', icon: BarChart3, disabled: false }]
      : []),
    ...(isAdmin
      ? [{ name: 'Mídia adicional', href: '/minha-area/midia-adicional', icon: Megaphone, disabled: false }]
      : []),
    { name: 'Minhas solicitações', href: '/minha-area/minhas-solicitacoes', icon: Inbox, disabled: false },
  ];

  // Painel de Indicadores — banco Supabase separado, leitura anônima.
  // Rótulos e ícones espelham o menu do projeto de origem.
  const dashboardNavigation = [
    { name: 'Visão Geral', href: '/dashboard/visao-geral', icon: LayoutDashboard },
    { name: 'Top 10 Unidades', href: '/dashboard/top-10-unidades', icon: Trophy },
    { name: 'Visão Diária', href: '/dashboard/visao-diaria', icon: Calendar },
    { name: 'Cronologia', href: '/dashboard/cronologia', icon: LineChart },
    { name: 'Administração', href: '/dashboard/administracao', icon: SlidersHorizontal },
  ];

  // Admin section
  const adminNavigation = [
    { name: 'Usuários', href: '/admin/usuarios', icon: Users },
  ];

  const NavContent = () => (
    <>
      <div className="p-4 border-b border-sidebar-border">
        <img src={logo} alt="Pure Pilates" className="h-12 mx-auto" />
      </div>

      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto" style={{ overflowAnchor: 'none' }}>
        {/* Geral Section */}
        <Collapsible open={openSection === 'geral'} onOpenChange={(o) => setOpenSection(o ? 'geral' : null)}>
          <CollapsibleTrigger asChild>
            <button type="button" className="w-full">
              <SectionHeader icon={Globe} label="Geral" open={openSection === 'geral'} onMouseDown={(e) => e.preventDefault()} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <div className="space-y-0.5 pb-1">
              {mainNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </NavLink>
              ))}

              {/* Tutoriais — dropdown delicado; o header leva pra página-hub */}
              <Collapsible open={tutoriaisOpen} onOpenChange={setTutoriaisOpen}>
                <div className="flex items-center gap-1">
                  <NavLink
                    to="/tutoriais"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )
                    }
                  >
                    <PlayCircle className="h-4 w-4" />
                    Tutoriais
                  </NavLink>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      aria-label={tutoriaisOpen ? 'Recolher tutoriais' : 'Expandir tutoriais'}
                      className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                    >
                      <ChevronDown
                        className={cn('h-4 w-4 transition-transform duration-200', tutoriaisOpen && 'rotate-180')}
                      />
                    </button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                  <div className="mt-0.5 ml-4 pl-2 border-l border-sidebar-border/60 space-y-0.5">
                    {tutoriaisNavigation.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                          )
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Colaboradores Section */}
        {(isColaborador || isAdmin) && (
          <Collapsible open={openSection === 'colaboradores'} onOpenChange={(o) => setOpenSection(o ? 'colaboradores' : null)}>
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full">
                <SectionHeader icon={UsersRound} label="Colaboradores" open={openSection === 'colaboradores'} onMouseDown={(e) => e.preventDefault()} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="space-y-0.5 pb-1">
                {colaboradoresNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                ))}

                {/* Sub-grupo: Mídias Sociais */}
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="h-3 w-3" />
                  Mídias Sociais
                </p>
                {midiasSociaisColabNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                ))}

                {/* Sub-grupo: Academy */}
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="h-3 w-3" />
                  Academy
                </p>
                {academyNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Agentes de IA Section */}
        {(isColaborador || isAdmin) && (
          <Collapsible open={openSection === 'agentes'} onOpenChange={(o) => setOpenSection(o ? 'agentes' : null)}>
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full">
                <SectionHeader icon={Bot} label="Agentes de IA" open={openSection === 'agentes'} onMouseDown={(e) => e.preventDefault()} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="space-y-0.5 pb-1">
                {/* Sub-grupo: Agente de Design */}
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="h-3 w-3" />
                  Agente de Design
                </p>
                {designNavigation.map((item) =>
                  item.disabled ? (
                    <div
                      key={item.name}
                      className="flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-[13px] font-medium text-muted-foreground/50 cursor-not-allowed"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                      <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">Em breve</Badge>
                    </div>
                  ) : (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </NavLink>
                  )
                )}

                {/* Sub-grupo: Agente Monitoramento */}
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="h-3 w-3" />
                  Agente Monitoramento
                </p>
                {monitoramentoNavigation.map((item) =>
                  item.disabled ? (
                    <div
                      key={item.name}
                      className="flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-[13px] font-medium text-muted-foreground/50 cursor-not-allowed"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                      <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">Em breve</Badge>
                    </div>
                  ) : (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </NavLink>
                  )
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Minha Área Section */}
        <Collapsible open={openSection === 'minha-area'} onOpenChange={(o) => setOpenSection(o ? 'minha-area' : null)}>
          <CollapsibleTrigger asChild>
            <button type="button" className="w-full">
              <SectionHeader icon={FolderOpen} label="Minha Área" open={openSection === 'minha-area'} onMouseDown={(e) => e.preventDefault()} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <div className="space-y-0.5 pb-1">
              {minhaAreaNavigation.map((item) => (
                item.disabled ? (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-muted-foreground/50 cursor-not-allowed"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                    <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">Em breve</Badge>
                  </div>
                ) : (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                )
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Dashboard — Painel de Indicadores */}
        {(isColaborador || isAdmin) && (
          <Collapsible open={openSection === 'dashboard'} onOpenChange={(o) => setOpenSection(o ? 'dashboard' : null)}>
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full">
                <SectionHeader icon={BarChart3} label="Dashboard" open={openSection === 'dashboard'} onMouseDown={(e) => e.preventDefault()} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="space-y-0.5 pb-1">
                {dashboardNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <Collapsible open={openSection === 'admin'} onOpenChange={(o) => setOpenSection(o ? 'admin' : null)}>
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full">
                <SectionHeader icon={Settings} label="Administração" open={openSection === 'admin'} onMouseDown={(e) => e.preventDefault()} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="space-y-0.5 pb-1">
                {adminNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-semibold text-xs">
              {user?.email?.[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <Badge variant={isAdmin ? 'default' : isFranqueado ? 'secondary' : 'outline'} className="text-[10px] mt-0.5">
              {getUserTypeLabel()}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start gap-2 text-muted-foreground hover:text-foreground h-8 text-xs"
            onClick={() => { navigate('/perfil'); setMobileOpen(false); }}
          >
            <User className="h-3.5 w-3.5" />
            Perfil
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 text-muted-foreground hover:text-foreground h-8 text-xs"
            onClick={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header with menu button */}
      <div className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-background border-b border-border">
        <div className="flex items-center gap-3 p-3">
          <MobileMenuButton mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
          <img src={logo} alt="Pure Pilates" className="h-8" />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-40 flex flex-col transition-transform duration-300',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <NavContent />
      </aside>
    </>
  );
};

export default Sidebar;
