import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Newspaper, 
  GraduationCap, 
  BarChart3, 
  Users, 
  LogOut,
  Menu,
  X,
  User,
  CalendarDays
} from 'lucide-react';
import logo from '@/assets/logo-pure-pilates.png';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Feed', href: '/feed', icon: Newspaper },
  { name: 'Calendário de Marketing', href: '/calendario-marketing', icon: CalendarDays },
  { name: 'Onboarding', href: '/onboarding', icon: GraduationCap },
  { name: 'Métricas', href: '/metricas', icon: BarChart3 },
  { name: 'Perfil', href: '/perfil', icon: User },
];

const adminNavigation = [
  { name: 'Usuários', href: '/admin/usuarios', icon: Users },
];

const Sidebar = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const NavContent = () => (
    <>
      <div className="p-4 border-b border-sidebar-border">
        <img src={logo} alt="Pure Pilates" className="h-12 mx-auto" />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => (
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

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">
              {user?.email?.[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'Administrador' : 'Colaborador'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

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
