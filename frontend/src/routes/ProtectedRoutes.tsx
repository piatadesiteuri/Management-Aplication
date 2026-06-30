import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Definim maparea rolurilor la rute
const ROLE_ROUTES: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  MANAGER: '/manager/dashboard',
  OPERATOR: '/operator/dashboard',
  GUEST: '/guest/dashboard'
};

export const ProtectedRoutes = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Găsim prima rută corespunzătoare rolului utilizatorului
  const userRoute = user.roles.find(role => ROLE_ROUTES[role]);
  const defaultRoute = ROLE_ROUTES[userRoute || 'GUEST'];

  // Dacă suntem pe ruta root /, redirectăm către dashboard-ul corespunzător
  if (window.location.pathname === '/') {
    return <Navigate to={defaultRoute} replace />;
  }

  // Verificăm dacă utilizatorul are acces la ruta curentă
  const currentPath = window.location.pathname;
  const hasAccess = user.roles.some(role => {
    const routePath = ROLE_ROUTES[role];
    return currentPath.startsWith(routePath.split('/')[1]); // Verificăm prefixul rutei (admin, manager, etc.)
  });

  if (!hasAccess) {
    return <Navigate to={defaultRoute} replace />;
  }

  return <Outlet />;
}; 