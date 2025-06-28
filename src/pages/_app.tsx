import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useState } from 'react';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));
  
  const router = useRouter();

  // List of public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/examples'];

  // Check if the current path is a public route
  const isPublicRoute = (path: string) => {
    return publicRoutes.includes(path) || path.startsWith('/examples/');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isPublicRoute(router.pathname) ? (
          <Component {...pageProps} />
        ) : (
          <ProtectedRoute>
            <Component {...pageProps} />
          </ProtectedRoute>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default MyApp; 