import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { podeVerMarketing } from './equipe';

// Barra quem não é do time de marketing mesmo digitando o endereço direto.
// Vai dentro do ProtectedRoute, que já esperou o login carregar.
export function RotaMarketing({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!podeVerMarketing(user?.email)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
