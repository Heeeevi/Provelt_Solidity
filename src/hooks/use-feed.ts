'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { FeedItem } from '@/lib/database.types';

const PAGE_SIZE = 10;

// Query keys
export const feedKeys = {
  all: ['feed'] as const,
  list: (filter?: string) => [...feedKeys.all, 'list', filter] as const,
  user: (userId: string) => [...feedKeys.all, 'user', userId] as const,
};

// Helper to fetch profile and challenge data separately
async function enrichSubmissions(submissions: any[]): Promise<FeedItem[]> {
  if (!submissions.length) return [];

  // Get unique user IDs and challenge IDs
  const userIds = Array.from(new Set(submissions.map(s => s.user_id)));
  const challengeIds = Array.from(new Set(submissions.map(s => s.challenge_id)));

  // Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  // Fetch challenges
  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .in('id', challengeIds);

  // Create lookup maps
  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  const challengeMap = new Map((challenges || []).map(c => [c.id, c]));

  // Enrich submissions
  return submissions.map(submission => ({
    submission,
    profile: profileMap.get(submission.user_id) || null,
    challenge: challengeMap.get(submission.challenge_id) || null,
  }));
}

// Fetch feed with infinite scroll
export function useFeed(filter?: string) {
  const query = useInfiniteQuery({
    queryKey: feedKeys.list(filter),
    queryFn: async ({ pageParam }): Promise<{ items: FeedItem[]; nextCursor: string | null }> => {
      let q = supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      // Filter by status - show approved OR pending for now (to see submissions)
      // In production, you might want .eq('status', 'approved')
      
      if (pageParam) {
        q = q.lt('created_at', pageParam);
      }

      const { data, error } = await q;
      if (error) throw error;

      // Enrich with profile and challenge data
      const items = await enrichSubmissions(data || []);

      const nextCursor = items.length === PAGE_SIZE 
        ? items[items.length - 1].submission.created_at 
        : null;

      return { items, nextCursor };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // Flatten all pages into a single array
  const items = query.data?.pages.flatMap(page => page.items) ?? [];

  return {
    items,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

// Fetch user's submissions
export function useUserSubmissions(userId: string) {
  return useInfiniteQuery({
    queryKey: feedKeys.user(userId),
    queryFn: async ({ pageParam }): Promise<{ items: FeedItem[]; nextCursor: string | null }> => {
      let q = supabase
        .from('submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (pageParam) {
        q = q.lt('created_at', pageParam);
      }

      const { data, error } = await q;
      if (error) throw error;

      // Enrich with profile and challenge data
      const items = await enrichSubmissions(data || []);

      const nextCursor = items.length === PAGE_SIZE 
        ? items[items.length - 1].submission.created_at 
        : null;

      return { items, nextCursor };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
  });
}

// Like a submission
export function useLikeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, userId }: { submissionId: string; userId: string }) => {
      const { error } = await supabase
        .from('reactions')
        .insert({ submission_id: submissionId, user_id: userId, reaction_type: 'like' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });
}

// Unlike a submission
export function useUnlikeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, userId }: { submissionId: string; userId: string }) => {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('submission_id', submissionId)
        .eq('user_id', userId)
        .eq('reaction_type', 'like');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });
}
