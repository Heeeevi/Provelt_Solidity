'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Challenge, Submission } from '@/lib/database.types';

// Extended challenge with UI-friendly computed fields
export interface ChallengeWithUI extends Challenge {
  status: 'active' | 'upcoming' | 'ended';
  start_time: string;
  end_time: string;
  xp_reward: number;
  submission_count: number;
  rules?: string[];
}

// Map DB challenge to UI challenge
function mapChallengeToUI(challenge: Challenge): ChallengeWithUI {
  const now = new Date();
  const startsAt = new Date(challenge.starts_at);
  const endsAt = new Date(challenge.ends_at);
  
  let status: 'active' | 'upcoming' | 'ended' = 'ended';
  if (now < startsAt) status = 'upcoming';
  else if (now >= startsAt && now <= endsAt) status = 'active';
  
  return {
    ...challenge,
    status,
    start_time: challenge.starts_at,
    end_time: challenge.ends_at,
    xp_reward: challenge.points,
    submission_count: challenge.submissions_count,
    rules: [], // Can be populated from instructions if needed
  };
}

// Query keys
export const challengeKeys = {
  all: ['challenges'] as const,
  list: (status?: string) => [...challengeKeys.all, 'list', status] as const,
  detail: (id: string) => [...challengeKeys.all, id] as const,
  submissions: (id: string) => [...challengeKeys.all, id, 'submissions'] as const,
  today: () => [...challengeKeys.all, 'today'] as const,
};

interface UseChallengesOptions {
  status?: 'active' | 'upcoming' | 'ended';
}

// Fetch challenges by status
export function useChallenges(options: UseChallengesOptions = {}) {
  const { status = 'active' } = options;
  
  return useQuery({
    queryKey: challengeKeys.list(status),
    queryFn: async (): Promise<ChallengeWithUI[]> => {
      const now = new Date().toISOString();
      let query = supabase.from('challenges').select('*');

      if (status === 'active') {
        query = query
          .eq('is_active', true)
          .lte('starts_at', now)
          .gte('ends_at', now);
      } else if (status === 'upcoming') {
        query = query.gt('starts_at', now);
      } else if (status === 'ended') {
        query = query.lt('ends_at', now);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapChallengeToUI);
    },
  });
}

// Fetch today's challenge
export function useTodayChallenge() {
  return useQuery({
    queryKey: challengeKeys.today(),
    queryFn: async (): Promise<ChallengeWithUI | null> => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? mapChallengeToUI(data) : null;
    },
  });
}

// Fetch single challenge by ID
export function useChallenge(id: string) {
  const query = useQuery({
    queryKey: challengeKeys.detail(id),
    queryFn: async (): Promise<ChallengeWithUI | null> => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? mapChallengeToUI(data) : null;
    },
    enabled: !!id,
  });

  return {
    challenge: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Fetch submissions for a challenge
export function useChallengeSubmissions(challengeId: string) {
  const query = useQuery({
    queryKey: challengeKeys.submissions(challengeId),
    queryFn: async (): Promise<any[]> => {
      // Fetch submissions
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!submissions?.length) return [];

      // Fetch profiles for these submissions
      const userIds = Array.from(new Set(submissions.map(s => s.user_id)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Enrich submissions with profile data
      return submissions.map(s => ({
        ...s,
        profile: profileMap.get(s.user_id) || null,
      }));
    },
    enabled: !!challengeId,
  });

  return {
    submissions: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Submit proof for a challenge
interface SubmitProofParams {
  challengeId: string;
  userId: string;
  file: File;
  caption?: string;
}

export function useSubmitChallenge() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ challengeId, userId, file, caption }: SubmitProofParams) => {
      // 0. Ensure profile exists for this user (wallet address)
      // Check if userId looks like a wallet address (not UUID)
      const isWalletAddress = userId.length > 36; // Wallet addresses are longer than UUIDs
      
      if (isWalletAddress) {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', userId)
          .single();
        
        if (!existingProfile) {
          // Create profile for wallet user
          const { data: newProfile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: crypto.randomUUID(), // Generate a new UUID
              wallet_address: userId,
              username: `user_${userId.slice(0, 8).toLowerCase()}`,
              display_name: `${userId.slice(0, 4)}...${userId.slice(-4)}`,
            })
            .select()
            .single();
          
          if (profileError) {
            console.error('Profile creation error:', profileError);
            throw new Error('Failed to create user profile. Please try again.');
          }
          
          // Use the new profile ID for submission
          userId = newProfile.id;
        } else {
          // Use existing profile ID
          userId = existingProfile.id;
        }
      }

      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${challengeId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(fileName);

      // 3. Create submission record
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          challenge_id: challengeId,
          user_id: userId,
          media_url: publicUrl,
          media_type: mediaType,
          caption,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: challengeKeys.submissions(variables.challengeId) });
      queryClient.invalidateQueries({ queryKey: challengeKeys.detail(variables.challengeId) });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return {
    submit: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}
