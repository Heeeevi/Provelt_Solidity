'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState, type ReactNode } from 'react';
import { WalletProvider } from '@/components/providers/wallet-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { WalletAuthListener } from '@/components/wallet/wallet-auth-listener';
import { OnboardingProvider } from '@/components/onboarding';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <AuthProvider>
          <OnboardingProvider>
            {children}
            <Toaster
              position="bottom-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#27272a',
                  color: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #3f3f46',
                },
                success: {
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            {/* Listen for wallet connection to trigger auth */}
            <WalletAuthListener />
          </OnboardingProvider>
        </AuthProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}
