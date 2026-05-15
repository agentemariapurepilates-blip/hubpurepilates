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
    className="flex items-center justify-between gap-2 px-3 py-2 mt-3 text-[13px] font-medium text-sidebar-foreground/55 hover:text-sidebar-foreground transition-colors cursor-pointer select-none"
    style={{ fontFamily: "'Yaro', 'Inter', system-ui, sans-serif" }}
  >
    <span className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </span>
    <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', !open && '-rotate-90')} />
  </div>
);

import logo from '@/assets/logo-pure-pilates.png';
import { useState, useEffect, useCallback } from 'react';

// Hook simples para persistir estado de cada seção colapsável no localStorage.
// autoOpen força aberto (ex: quando o usuário está numa rota dessa seção).
const useCollapsibleSection = (key: string, defaultOpen: boolean, autoOpen?: boolean) => {
  const storageKey = `sidebar-section:${key}`;
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultOpen;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === null) return defaultOpen;
    return stored === 'true';
  });

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  const setOpenPersist = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setOpen((prev) => {
      const next = typeof value === 'function' ? (value as (p: boolean) => boolean)(prev) : value;
      try { window.localStorage.setItem(storageKey, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, [storageKey]);

  return [open, setOpenPersist] as const;
};

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
  const isOnColaboradorRoute = ['/feed', '/pedidos-demanda'].some((p) =>
    location.pathname.startsWith(p),
  );
  const isOnMinhaAreaRoute = ['/minha-area'].some((p) => location.pathname.startsWith(p));
  const isOnAdminRoute = location.pathname.startsWith('/admin');

  const [geralOpen, setGeralOpen] = useCollapsibleSection('geral', true);
  const [colaboradoresOpen, setColaboradoresOpen] = useCollapsibleSection('colaboradores', true, isOnColaboradorRoute);
  const [agentesOpen, setAgentesOpen] = useCollapsibleSection('agentes', true, isOnAgenteRoute);
  const [minhaAreaOpen, setMinhaAreaOpen] = useCollapsibleSection('minha-area', true, isOnMinhaAreaRoute);
  const [adminOpen, setAdminOpen] = useCollapsibleSection('admin', true, isOnAdminRoute);

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
    { name: 'Minhas solicitações', href: '/minha-area/minhas-solicitacoes', icon: Inbox, disabled: false },
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
        <Collapsible open={geralOpen} onOpenChange={setGeralOpen}>
          <CollapsibleTrigger asChild>
            <button type="button" className="w-full">
              <SectionHeader icon={Globe} label="Geral" open={geralOpen} onMouseDown={(e) => e.preventDefault()} />
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
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
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
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Colaboradores Section */}
        {(isColaborador || isAdmin) && (
          <Collapsible open={colaboradoresOpen} onOpenChange={setColaboradoresOpen}>
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full">
                <SectionHeader icon={UsersRound} label="Colaboradores" open={colaboradoresOpen} onMouseDown={(e) => e.preventDefault()} />
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
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
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
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Agentes de IA Section */}
        {(isColaborador || isAdmin) && (
          <Collapsible open={agentesOpen} onOpenChange={setAgentesOpen}>
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full">
                <SectionHeader icon={Bot} label="Agentes de IA" open={agentesOpen} onMouseDown={(e) => e.preventDefault()} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="space-y-0.5 pb-1">
                {/* Sub-grupo: Agente Pure Studio */}
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="h-3 w-3" />
                  Agente Pure Studio
                </p>
                {socialMediaNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-sm font-medium transition-all duration-200',
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
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="h-3 w-3" />
                  Agente Monitoramento
                </p>
                {monitoramentoNavigation.map((item) =>
                  item.disabled ? (
                    <div
                      key={item.name}
                      className="flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
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
                          'flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-sm font-medium transition-all duration-200',
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
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Minha Área Section */}
        <Collapsible open={minhaAreaOpen} onOpenChange={setMinhaAreaOpen}>
          <CollapsibleTrigger asChild>
            <button type="button" className="w-full">
              <SectionHeader icon={FolderOpen} label="Minha Área" open={minhaAreaOpen} onMouseDown={(e) => e.preventDefault()} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <div className="space-y-0.5 pb-1">
              {minhaAreaNavigation.map((item) => (
                item.disabled ? (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
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
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
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
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Admin Section */}
        {isAdmin && (
          <Collapsible open={adminOpen} onOpenChange={setAdminOpen}>
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full">
                <SectionHeader icon={Settings} label="Administração" open={adminOpen} onMouseDown={(e) => e.preventDefault()} />
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
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
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
