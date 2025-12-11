'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Profile, BadgeNFT, Submission } from '@/lib/database.types';

// Alias for import compatibility
export type { BadgeNFT as BadgeNft };

// Query keys
export const profileKeys = {
  all: ['profiles'] as const,
  detail: (id: string) => [...profileKeys.all, id] as const,
  badges: (id: string) => [...profileKeys.all, id, 'badges'] as const,
  submissions: (id: string) => [...profileKeys.all, id, 'submissions'] as const,
};

// Fetch profile by ID or wallet address
export function useProfile(userId: string) {
  const query = useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: async (): Promise<Profile | null> => {
      // Check if userId looks like a wallet address (longer than UUID)
      const isWalletAddress = userId.length > 36;
      
      let query = supabase.from('profiles').select('*');
      
      if (isWalletAddress) {
        query = query.eq('wallet_address', userId);
      } else {
        query = query.eq('id', userId);
      }
      
      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Fetch user's badges
export function useUserBadges(userId: string) {
  const query = useQuery({
    queryKey: profileKeys.badges(userId),
    queryFn: async (): Promise<BadgeNFT[]> => {
      console.log('Fetching badges for userId:', userId);
      
      // Handle wallet address case
      let profileId = userId;
      const isWalletAddress = userId.length > 36;
      
      if (isWalletAddress) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', userId)
          .maybeSingle();
        
        console.log('Found profile for wallet:', profile);
        
        if (!profile) return [];
        profileId = profile.id;
      }

      console.log('Querying badges with profileId:', profileId);

      // Try querying badges - first attempt with RLS
      let { data, error } = await supabase
        .from('badge_nfts')
        .select('*')
        .eq('user_id', profileId)
        .order('earned_at', { ascending: false });

      console.log('Badges query result:', { data, error });

      // If RLS blocks or no data, try the debug API
      if ((error || !data || data.length === 0)) {
        console.log('Trying fallback API for badges...');
        try {
          const response = await fetch(`/api/debug/badges?userId=${encodeURIComponent(profileId)}`);
          if (response.ok) {
            const debugData = await response.json();
            console.log('Debug API badges result:', debugData.userBadges);
            if (debugData.userBadges?.data?.length > 0) {
              return debugData.userBadges.data;
            }
          }
        } catch (e) {
          console.error('Fallback API error:', e);
        }
      }

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  return {
    badges: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Fetch user's submissions
export function useUserSubmissions(userId: string) {
  const query = useQuery({
    queryKey: profileKeys.submissions(userId),
    queryFn: async (): Promise<any[]> => {
      console.log('Fetching submissions for userId:', userId);
      
      // First, we need to figure out if userId is a wallet address or a profile ID
      // If it's a wallet address, we need to get the profile first
      let profileId = userId;
      
      // Check if userId looks like a wallet address (Solana addresses are base58 encoded, typically 32-44 chars)
      const isWalletAddress = userId.length > 36;
      
      if (isWalletAddress) {
        // Get profile by wallet address
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', userId)
          .maybeSingle();
        
        console.log('Found profile for wallet:', profile);
        
        if (!profile) return [];
        profileId = profile.id;
      }

      console.log('Querying submissions with profileId:', profileId);

      // Fetch submissions by profile ID
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });

      console.log('Submissions query result:', { count: submissions?.length, error });

      if (error) throw error;
      if (!submissions?.length) return [];

      // Fetch challenges for these submissions
      const challengeIds = Array.from(new Set(submissions.map(s => s.challenge_id)));
      const { data: challenges } = await supabase
        .from('challenges')
        .select('id, title, points')
        .in('id', challengeIds);

      const challengeMap = new Map((challenges || []).map(c => [c.id, c]));

      // Enrich submissions with challenge data
      return submissions.map(s => ({
        ...s,
        challenge: challengeMap.get(s.challenge_id) || null,
      }));
    },
    enabled: !!userId,
  });

  return {
    submissions: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Update profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<Profile> }) => {
      const { data: updated, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.userId) });
    },
  });
}

// Link wallet address to profile
export function useLinkWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, walletAddress }: { userId: string; walletAddress: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ wallet_address: walletAddress })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.userId) });
    },
  });
}
