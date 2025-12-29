'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAccount, useDisconnect } from 'wagmi';
import { resetFeedSeed } from '@/hooks/use-feed';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  // Traditional Supabase auth
  user: User | null;
  session: Session | null;
  // Wallet-based auth (Web3)
  walletAddress: string | null;
  isWalletConnected: boolean;
  // Combined auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  // User ID for database operations (prefers Supabase user, falls back to wallet)
  userId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  walletAddress: null,
  isWalletConnected: false,
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  signOut: async () => { },
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Wallet state
  const walletAddress = address || null;
  const isWalletConnected = isConnected && !!address;

  // User is authenticated if they have either Supabase session OR connected wallet
  const isAuthenticated = !!user || isWalletConnected;

  // User ID: prefer Supabase user ID, fallback to wallet address
  const userId = user?.id || walletAddress;

  useEffect(() => {
    // Get initial Supabase session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Reset feed seed on sign in/out to get new random order
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          resetFeedSeed();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Also set loading to false once wallet state is determined
  useEffect(() => {
    // Small delay to let wallet adapter initialize
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const signOut = async () => {
    // Reset feed seed for new random order on next login
    resetFeedSeed();

    // Sign out from Supabase
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);

    // Disconnect wallet
    if (isConnected) {
      disconnect();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      walletAddress,
      isWalletConnected,
      isAuthenticated,
      isLoading,
      userId,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}
