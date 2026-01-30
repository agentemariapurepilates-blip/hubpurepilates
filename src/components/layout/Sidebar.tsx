import { NavLink, useNavigate } from 'react-router-dom';
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
  Megaphone
} from 'lucide-react';
import logo from '@/assets/logo-pure-pilates.png';
import { useState } from 'react';

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

const Sidebar = () => {
  const { user, signOut, isAdmin, isColaborador, userType } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isFranqueado = userType === 'franqueado';

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
    { name: 'Avisos', href: '/avisos', icon: Megaphone },
    { name: 'Mídias Sociais', href: '/midias-sociais', icon: Video },
    { name: 'Calendário de Marketing', href: '/calendario-marketing', icon: CalendarDays },
    { name: 'Artes Prontas', href: '/artes-prontas', icon: Palette },
  ];

  // Colaboradores section - only for colaboradores and admins
  const colaboradoresNavigation = [
    { name: 'Feed da Sede', href: '/feed', icon: Newspaper },
    { name: 'Solicitação de demandas', href: '/pedidos-demanda', icon: ClipboardList },
  ];

  // Minha Área section
  const minhaAreaNavigation = [
    { name: 'Relatórios', href: '#', icon: FileText, disabled: true },
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
        {/* Main Navigation - No section label */}
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
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <UsersRound className="h-3.5 w-3.5" />
                Colaboradores
              </p>
            </div>
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

        {/* Minha Área Section */}
        <div className="pt-4 pb-2">
          <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FolderOpen className="h-3.5 w-3.5" />
            Minha Área
          </p>
        </div>
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
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Settings className="h-3.5 w-3.5" />
                Administração
              </p>
            </div>
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
