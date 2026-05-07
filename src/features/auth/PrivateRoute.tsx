import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { AppShell } from '../../shared/components/AppShell';

export function PrivateRoute() {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
