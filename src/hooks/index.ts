/**
 * Hooks Index
 * Export all hooks for the PROVELT application
 */
export { useMantleWallet, useWalletConnection } from './use-mantle-wallet';
export { useChallenges, useTodayChallenge, useChallenge, challengeKeys } from './use-challenges';
export { useFeed, useUserSubmissions, useLikeSubmission, useUnlikeSubmission, feedKeys } from './use-feed';
export { useProfile, useUserBadges, useUpdateProfile, useLinkWallet, profileKeys } from './use-profile';
export { useMintBadge, useLogChallengeCompletion } from './use-mint-badge';
export {
  useRealtimeFeed,
  useRealtimeReactions,
  useRealtimeChallenge,
  useRealtimeNotifications
} from './use-realtime';
