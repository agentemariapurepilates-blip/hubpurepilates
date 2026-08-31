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
  ShoppingBag,
  Handshake,
  BookOpen,
  ScrollText,
  BarChart3,
  Heart,
  Building2,
  Bot,
  ChevronDown,
  Inbox,
  Image as ImageIcon,
  Radar,
  GraduationCap,
  PlayCircle,
  Library,
  FileSignature,
  LayoutDashboard,
  Layers,
  Trophy,
  Calendar,
  LineChart,
  SlidersHorizontal,
  PartyPopper,
  Gauge,
  UserSearch,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
import { ARTIGOS_PUREPEDIA } from '@/features/colaborador/purepedia/artigos';

// Accordion: apenas uma seção aberta por vez. Abrir uma fecha a anterior.
// Persistido em sessionStorage — sobrevive à navegação e ao reload; reseta ao fechar a aba.
type SectionKey =
  | 'colaboradores'
  | 'agentes'
  | 'minha-area'
  | 'admin'
  | 'dashboard'
  | 'inauguracoes';

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

// Agentes de IA: seção oculta da produção (não estamos usando).
// Trocar para true reexibe a seção inteira (as rotas continuam existindo).
const MOSTRAR_AGENTES_IA = false;

// Página-hub de Tutoriais + as filhas (usadas pra abrir o dropdown sozinho).
const TUTORIAIS_PATHS = [
  '/tutoriais',
  '/tutorial-marketing',
  '/materiais-implantacao',
  '/manual-sistema',
  '/onboarding-instrutor',
];

// Página-índice do PurePedia + os artigos (usadas pra abrir o dropdown sozinho).
// Sai do registro em artigos.ts — publicar um artigo novo não exige tocar aqui.
const PUREPEDIA_PATHS = ['/purepedia', ...ARTIGOS_PUREPEDIA.map((a) => a.href)];

export const sectionFromPath = (path: string): SectionKey | null => {
  if (AGENTES_DE_IA_ROUTE_PREFIXES.some((p) => path.startsWith(p))) return 'agentes';
  // Antes de 'colaboradores': Inaugurações saiu de dentro daquela seção e virou
  // seção própria. Se o teste ficasse depois, '/inauguracoes' continuaria
  // casando com a lista de colaboradores e a seção errada abriria.
  if (path.startsWith('/inauguracoes')) return 'inauguracoes';
  if (['/feed', '/pedidos-demanda', '/academy', '/colaborador/midias-sociais', '/leads-rh', '/purepedia'].some((p) => path.startsWith(p))) return 'colaboradores';
  // Antes de '/minha-area': o Hub tem /minha-area/dashboard (Mídia Adicional),
  // que NÃO pertence a esta seção. Por isso o teste é '/dashboard/' com barra.
  if (path.startsWith('/dashboard/')) return 'dashboard';
  // '/autorizar-midia-adicional' (Solicitar Mídia adicional) faz parte do fluxo
  // da Minha Área, então abre/destaca essa seção mesmo estando fora do prefixo.
  if (path.startsWith('/minha-area') || path.startsWith('/autorizar-midia-adicional')) return 'minha-area';
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

  // Mesmo comportamento pro dropdown do PurePedia (dentro de Colaboradores).
  const [purepediaOpen, setPurepediaOpen] = useState(() =>
    PUREPEDIA_PATHS.includes(location.pathname),
  );

  // A cada carga/reload: abre a seção da rota atual (accordion). Os itens do topo
  // (Timeline, Página Inicial, etc.) são soltos e ficam sempre visíveis — não há
  // mais seção "Geral" pra abrir por padrão.
  const [openSection, setOpenSection] = useState<SectionKey | null>(
    () => sectionFromPath(location.pathname),
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
    if (PUREPEDIA_PATHS.includes(location.pathname)) setPurepediaOpen(true);
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

  // Itens soltos no topo (acessíveis por todos, sem grupo "Geral").
  const mainNavigation = [
    { name: 'Página Inicial', href: '/', icon: Home },
    { name: 'Timeline do Mês', href: '/novidades', icon: Sparkles },
    { name: 'Avisos', href: '/avisos', icon: Megaphone },
    { name: 'Pure Store', href: '/pure-store', icon: ShoppingBag },
    // Parcerias: oculto da produção a pedido (a rota /parcerias continua existindo).
    // Para reexibir, basta descomentar a linha abaixo.
    // { name: 'Parcerias', href: '/parcerias', icon: Handshake },
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
    { name: 'Onboarding do Instrutor', href: '/onboarding-instrutor', icon: GraduationCap },
  ];

  // Colaboradores section - only for colaboradores and admins
  const colaboradoresNavigation = [
    { name: 'Feed da Sede', href: '/feed', icon: Newspaper },
    { name: 'Solicitação de demandas', href: '/pedidos-demanda', icon: ClipboardList },
    { name: 'Visão Geral das Unidades', href: '/midia-adicional/unidades', icon: Building2 },
    { name: 'Leads RH', href: '/leads-rh', icon: UserSearch },
  ];

  // Artigos do PurePedia (filhos do dropdown), vindos do mesmo registro que
  // alimenta a página-índice — uma lista só, sem risco de divergir.
  const purepediaNavigation: { name: string; href: string; icon: LucideIcon }[] =
    ARTIGOS_PUREPEDIA.map((a) => ({ name: a.title, href: a.href, icon: a.icon }));

  // Inaugurações — seção própria. Os três itens eram abas dentro da página; o
  // "Destinatários" continua exclusivo de admin (some da lista, não fica
  // desabilitado) e o rótulo do meio continua variando conforme o alcance de
  // quem olha, exatamente como era na TabsList.
  const inauguracoesNavigation = [
    { name: 'Nova solicitação', href: '/inauguracoes/nova', icon: PartyPopper },
    {
      name: isAdmin ? 'Todas as solicitações' : 'Minhas solicitações',
      href: '/inauguracoes/solicitacoes',
      icon: ClipboardList,
    },
    ...(isAdmin
      ? [
          { name: 'Destinatários', href: '/inauguracoes/destinatarios', icon: Inbox },
          { name: 'Relatório semanal', href: '/inauguracoes/relatorio', icon: ScrollText },
        ]
      : []),
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
    { name: 'Solicitar Mídia adicional', href: '/autorizar-midia-adicional', icon: ImageIcon, disabled: false },
    { name: 'Minhas solicitações', href: '/minha-area/minhas-solicitacoes', icon: Inbox, disabled: false },
  ];

  // Painel de Indicadores — banco Supabase separado, leitura anônima.
  // Rótulos e ícones espelham o menu do projeto de origem.
  const dashboardNavigation = [
    { name: 'Visão Geral', href: '/dashboard/visao-geral', icon: LayoutDashboard },
    { name: 'Ritmo do Mês', href: '/dashboard/ritmo-do-mes', icon: Gauge },
    { name: 'Avaliação de Mídia', href: '/dashboard/avaliacao-de-midia', icon: ClipboardList },
    { name: 'Top 10 Unidades', href: '/dashboard/top-10-unidades', icon: Trophy },
    { name: 'Visão Diária', href: '/dashboard/visao-diaria', icon: Calendar },
    { name: 'Cronologia', href: '/dashboard/cronologia', icon: LineChart },
    { name: 'Clusters de Matriculados', href: '/dashboard/clusters-matriculados', icon: Layers },
    { name: 'Administração', href: '/dashboard/administracao', icon: SlidersHorizontal },
  ];

  // Admin section
  const adminNavigation = [
    { name: 'Usuários', href: '/admin/usuarios', icon: Users },
  ];

  const NavContent = () => (
    <>
      <div className="p-4 border-b border-sidebar-border">
        <img src={logo} alt="Pure Pilates" className="h-20 mx-auto" />
      </div>

      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto" style={{ overflowAnchor: 'none' }}>
        {/* Itens soltos no topo — sem grupo "Geral", sempre visíveis. */}
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
                    Guias e Tutoriais
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

                {/* PurePedia — mesmo molde do dropdown de Tutoriais: o header
                    leva pra página-índice e os artigos ficam embaixo. */}
                <Collapsible open={purepediaOpen} onOpenChange={setPurepediaOpen}>
                  <div className="flex items-center gap-1">
                    <NavLink
                      to="/purepedia"
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
                      <Library className="h-4 w-4" />
                      PurePedia
                    </NavLink>
                    {purepediaNavigation.length > 0 && (
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          aria-label={purepediaOpen ? 'Recolher PurePedia' : 'Expandir PurePedia'}
                          className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                        >
                          <ChevronDown
                            className={cn('h-4 w-4 transition-transform duration-200', purepediaOpen && 'rotate-180')}
                          />
                        </button>
                      </CollapsibleTrigger>
                    )}
                  </div>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <div className="mt-0.5 ml-4 pl-2 border-l border-sidebar-border/60 space-y-0.5">
                      {purepediaNavigation.map((item) => (
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

        {/* Agentes de IA Section — oculto da produção (não estamos usando). */}
        {MOSTRAR_AGENTES_IA && (isColaborador || isAdmin) && (
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

        {/* Minha(s) Unidade(s) Section */}
        <Collapsible open={openSection === 'minha-area'} onOpenChange={(o) => setOpenSection(o ? 'minha-area' : null)}>
          <CollapsibleTrigger asChild>
            <button type="button" className="w-full">
              <SectionHeader icon={FolderOpen} label="Minha(s) Unidade(s)" open={openSection === 'minha-area'} onMouseDown={(e) => e.preventDefault()} />
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

        {/* Inaugurações — mesmo alcance da seção Colaboradores, de onde saiu */}
        {(isColaborador || isAdmin) && (
          <Collapsible open={openSection === 'inauguracoes'} onOpenChange={(o) => setOpenSection(o ? 'inauguracoes' : null)}>
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full">
                <SectionHeader icon={PartyPopper} label="Inaugurações" open={openSection === 'inauguracoes'} onMouseDown={(e) => e.preventDefault()} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="space-y-0.5 pb-1">
                {inauguracoesNavigation.map((item) => (
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

        {/* Dashboard — Painel de Indicadores. SÓ ADMIN: a área lê um banco de
            produção compartilhado com o painel do Cloudflare, com os números de
            todas as unidades da rede. Colaborador não deve nem ver que existe —
            esconder o menu é a primeira camada; quem barra de verdade é o
            requireAdmin das rotas em App.tsx. */}
        {isAdmin && (
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
