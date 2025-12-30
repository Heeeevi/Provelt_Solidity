'use client';

import { useEffect, useState, useRef } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

export function WalletAuthListener() {
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const { disconnect } = useDisconnect();
    const supabase = createClient();

    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const hasPromptedAuth = useRef(false);

    useEffect(() => {
        // Reset auth prompt state when disconnected or address changes
        if (!isConnected) {
            hasPromptedAuth.current = false;
            setIsAuthenticating(false);
        }
    }, [isConnected, address]);

    useEffect(() => {
        const authenticate = async () => {
            // Conditions to start auth:
            // 1. Wallet is connected
            // 2. Not currently authenticating
            // 3. Haven't already prompted for this session (prevents infinite loops)
            if (!isConnected || !address || isAuthenticating || hasPromptedAuth.current) {
                return;
            }

            // Check if we already have a valid Supabase session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Already authenticated with Supabase
                return;
            }

            try {
                setIsAuthenticating(true);
                hasPromptedAuth.current = true; // Mark as attempted

                const timestamp = Date.now();
                const message = `Sign in to PROVELT\n\nWallet: ${address.toLowerCase()}\nTimestamp: ${timestamp}`;

                const toastId = toast.loading('Please sign the message to log in...');

                // 1. Request signature from wallet
                const signature = await signMessageAsync({
                    message,
                });

                // 2. Verify and create session on server
                const response = await fetch('/api/auth/wallet', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        walletAddress: address,
                        signature,
                        message,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to authenticate');
                }

                // 3. Set session on client
                if (data.session) {
                    const { error } = await supabase.auth.setSession(data.session);
                    if (error) throw error;

                    toast.success('Successfully logged in!', { id: toastId });
                } else {
                    throw new Error('No session returned from server');
                }

            } catch (error: any) {
                console.error('Auth error:', error);
                // Special handling for user rejection
                if (error.message.includes('User rejected') || error.code === 4001) {
                    toast.error('Login cancelled. Please connect again to sign in.', { id: undefined });
                    disconnect(); // Disconnect wallet so they can try again
                } else {
                    toast.error(`Login failed: ${error.message}`);
                    disconnect();
                }
            } finally {
                setIsAuthenticating(false);
            }
        };

        // Small delay to ensure wallet state is settled
        const timer = setTimeout(() => {
            authenticate();
        }, 500);

        return () => clearTimeout(timer);
    }, [isConnected, address, supabase.auth, signMessageAsync, disconnect, isAuthenticating]);

    return null;
}
