import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireColaborador?: boolean;
}

export function ProtectedRoute({ children, requireAdmin, requireColaborador }: ProtectedRouteProps) {
  const { user, loading, profileLoading, isAdmin, isColaborador } = useAuth();
  const location = useLocation();

  if (loading || profileLoading) {
    return null;
  }

  if (!user) {
    // Guarda o destino (ex.: o link de uma demanda) para voltar para lá depois do login.
    return <Navigate to="/auth" state={{ from: location.pathname + location.search }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireColaborador && !isColaborador) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
