import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Only run client-side after mounting
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // After mounting, if not loading and not authenticated, redirect to login
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push({
        pathname: '/login',
        query: { returnUrl: router.asPath }
      });
    }
  }, [isAuthenticated, isLoading, router, isMounted]);

  // Show loading state while checking authentication (only after mount)
  if (!isMounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute; 