'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { FeedItem } from '@/lib/database.types';

const PAGE_SIZE = 10;

// Generate a session seed for random ordering (stays same during session)
function getSessionSeed(): number {
  if (typeof window === 'undefined') return Date.now();
  
  let seed = sessionStorage.getItem('feed_seed');
  if (!seed) {
    seed = Date.now().toString();
    sessionStorage.setItem('feed_seed', seed);
  }
  return parseInt(seed, 10);
}

// Simple seeded random for shuffling
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Shuffle array with seed
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  const random = seededRandom(seed);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Query keys
export const feedKeys = {
  all: ['feed'] as const,
  list: (filter?: string, seed?: number) => [...feedKeys.all, 'list', filter, seed] as const,
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

// Fetch feed with infinite scroll and random ordering per session
export function useFeed(filter?: string) {
  const sessionSeed = typeof window !== 'undefined' ? getSessionSeed() : Date.now();
  
  const query = useInfiniteQuery({
    queryKey: feedKeys.list(filter, sessionSeed),
    queryFn: async ({ pageParam }): Promise<{ items: FeedItem[]; nextCursor: number | null }> => {
      const offset = pageParam || 0;
      
      // Fetch all submissions for randomization (or a larger batch)
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      // Enrich with profile and challenge data
      let items = await enrichSubmissions(data || []);
      
      // Shuffle items with session seed (only for first page to maintain consistency)
      if (offset === 0) {
        items = shuffleWithSeed(items, sessionSeed);
      }

      const nextCursor = items.length === PAGE_SIZE ? offset + PAGE_SIZE : null;

      return { items, nextCursor };
    },
    initialPageParam: 0 as number | null,
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

// Reset feed seed - call this on login/logout to get new random order
export function resetFeedSeed() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('feed_seed');
  }
}
