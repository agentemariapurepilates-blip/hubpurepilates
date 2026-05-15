import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ChevronRight,
  Globe,
  Inbox,
} from 'lucide-react';

const SectionTag = ({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) => (
  <div className="pt-4 pb-2 px-4">
    <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  </div>
);
import logo from '@/assets/logo-pure-pilates.png';
import { useState, useEffect } from 'react';

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
  '/agente-instagram-facebook',
  '/agente-tiktok',
  '/agente-planejamento-editorial',
  '/agente-monitoramento',
];

const Sidebar = () => {
  const { user, signOut, isAdmin, isColaborador, userType } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isFranqueado = userType === 'franqueado';

  const isOnAgenteRoute = AGENTES_DE_IA_ROUTE_PREFIXES.some((p) =>
    location.pathname.startsWith(p),
  );
  const [agentesOpen, setAgentesOpen] = useState(isOnAgenteRoute);

  useEffect(() => {
    if (isOnAgenteRoute) setAgentesOpen(true);
  }, [isOnAgenteRoute]);

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
    { name: 'Tutorial do Marketing', href: '/tutorial-marketing', icon: ScrollText },
    { name: 'Mídia adicional', href: '/autorizar-midia-adicional', icon: Megaphone },
    { name: 'Avisos', href: '/avisos', icon: Megaphone },
    { name: 'Parcerias', href: '/parcerias', icon: Handshake },
    { name: 'Mídias Sociais', href: '/midias-sociais', icon: Video },
    { name: 'Calendário de Marketing', href: '/calendario-marketing', icon: CalendarDays },
    { name: 'Artes Prontas', href: '/artes-prontas', icon: Palette },
    { name: 'Pure Design', href: '/pure-design', icon: Paintbrush },
    { name: 'Materiais de Implantação', href: '/materiais-implantacao', icon: Package },
    { name: 'Manual do Sistema', href: '/manual-sistema', icon: BookOpen },
  ];

  // Colaboradores section - only for colaboradores and admins
  const colaboradoresNavigation = [
    { name: 'Feed da Sede', href: '/feed', icon: Newspaper },
    { name: 'Solicitação de demandas', href: '/pedidos-demanda', icon: ClipboardList },
    { name: 'Visão Geral das Unidades', href: '/midia-adicional/unidades', icon: Building2 },
  ];

  // Agente Pure Studio section - only for colaboradores and admins
  const socialMediaNavigation = [
    { name: 'Agente Instagram e Facebook', href: '/agente-instagram-facebook', icon: Video },
    { name: 'Agente Tik Tok', href: '/agente-tiktok', icon: Video },
  ];

  // Agente Monitoramento section - only for admins
  const monitoramentoNavigation = [
    { name: 'Métricas', href: '/agente-monitoramento/metricas', icon: BarChart3, disabled: false },
    { name: 'Saúde de marca', href: '/agente-monitoramento/saude-de-marca', icon: Heart, disabled: false },
  ];

  // Minha Área section
  const minhaAreaNavigation = [
    { name: 'Relatórios', href: '#', icon: FileText, disabled: true },
    { name: 'Minhas solicitações', href: '#', icon: Inbox, disabled: true },
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

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Geral Section - accessible by everyone */}
        <SectionTag icon={Globe} label="Geral" />
        {mainNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}

        {/* Colaboradores Section - Only for colaboradores and admins */}
        {(isColaborador || isAdmin) && (
          <>
            <SectionTag icon={UsersRound} label="Colaboradores" />
            {colaboradoresNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </>
        )}

        {/* Agentes de IA Section - collapsible parent grouping Pure Studio + Monitoramento */}
        {(isColaborador || isAdmin) && (
          <>
            <button
              type="button"
              onClick={() => setAgentesOpen((o) => !o)}
              className="w-full pt-4 pb-2 px-4 flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                <Bot className="h-3 w-3" />
                Agentes de IA
              </span>
              {agentesOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {agentesOpen && (
              <div className="space-y-1">
                {/* Sub-grupo: Agente Pure Studio */}
                <div className="pt-1 pb-1">
                  <p className="px-4 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-2">
                    <Video className="h-3 w-3" />
                    Agente Pure Studio
                  </p>
                </div>
                {socialMediaNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-2.5 ml-2 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                ))}

                {/* Sub-grupo: Agente Monitoramento */}
                <div className="pt-2 pb-1">
                  <p className="px-4 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="h-3 w-3" />
                    Agente Monitoramento
                  </p>
                </div>
                {monitoramentoNavigation.map((item) =>
                  item.disabled ? (
                    <div
                      key={item.name}
                      className="flex items-center gap-3 px-4 py-2.5 ml-2 rounded-lg text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
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
                          'flex items-center gap-3 px-4 py-2.5 ml-2 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </NavLink>
                  )
                )}
              </div>
            )}
          </>
        )}

        {/* Minha Área Section */}
        <SectionTag icon={FolderOpen} label="Minha Área" />
        {minhaAreaNavigation.map((item) => (
          item.disabled ? (
            <div
              key={item.name}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
            >
              <item.icon className="h-5 w-5" />
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
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          )
        ))}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <SectionTag icon={Settings} label="Administração" />
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </>
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
