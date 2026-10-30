import { type ReactNode } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getSuspensionMessage } from '@/lib/video';
import { ThemeLogo } from '@/components/ThemeLogo';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();
  const { publishedTheme } = useTheme();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-ketrika-200 border-t-ketrika-600" />
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile?.is_suspended) {
    const message = getSuspensionMessage(publishedTheme, profile.role as 'client' | 'seller' | 'driver');
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-md p-8 text-center">
          <Link to="/" className="inline-block mb-6">
            <ThemeLogo placement="main" size="md" />
          </Link>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Compte suspendu</h2>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  if (roles && profile && !roles.includes(profile.role)) {
    const dashboard = `/${profile.role}`;
    return <Navigate to={dashboard} replace />;
  }

  return <>{children}</>;
}
