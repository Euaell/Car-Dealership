'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useStore from '../../lib/store';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = [] 
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading } = useStore();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check role authorization if roles are specified
    if (isAuthenticated && user && allowedRoles.length > 0) {
      const hasRequiredRole = allowedRoles.includes(user.role);
      setIsAuthorized(hasRequiredRole);
      
      if (!hasRequiredRole) {
        router.push('/unauthorized');
      }
    } else if (isAuthenticated) {
      // If authenticated and no specific roles required
      setIsAuthorized(true);
    }

    setIsChecking(false);
  }, [isAuthenticated, isLoading, user, router, pathname, allowedRoles]);

  // Show loading state
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Show children only if authorized
  return isAuthenticated && isAuthorized ? <>{children}</> : null;
} 