import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireColaborador?: boolean;
}

export function ProtectedRoute({ children, requireAdmin, requireColaborador }: ProtectedRouteProps) {
  const { user, loading, profileLoading, isApproved, isPending, isAdmin, isColaborador } = useAuth();

  if (loading || profileLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isPending || !isApproved) {
    return <Navigate to="/aguardando-aprovacao" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireColaborador && !isColaborador) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
