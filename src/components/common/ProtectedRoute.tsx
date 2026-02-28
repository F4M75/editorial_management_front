import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/context/auth.store';

const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
