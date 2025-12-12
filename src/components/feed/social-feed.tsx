'use client';

import { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Award, MoreHorizontal, Play } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard, SkeletonAvatar, SkeletonText } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { ShareModal } from '@/components/ui/share-modal';
import { cn, formatRelativeTime, truncateAddress } from '@/lib/utils';
import { getSubmissionShareUrl } from '@/lib/share';
import type { FeedItem } from '@/lib/database.types';
import Link from 'next/link';
import Image from 'next/image';
import { Target } from 'lucide-react';

interface SocialFeedProps {
  items: FeedItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error?: Error | null;
  onLoadMore: () => void;
  onRefresh: () => void;
}

export function SocialFeed({
  items,
  isLoading,
  isLoadingMore,
  hasMore,
  error,
  onLoadMore,
  onRefresh,
}: SocialFeedProps) {
  const observerRef = useRef<IntersectionObserver>();
  
  // Infinite scroll trigger
  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        onLoadMore();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoadingMore, hasMore, onLoadMore]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <FeedPostSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ErrorState message={error.message} onRetry={onRefresh} />
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={<Target className="w-8 h-8 text-surface-500" />}
          title="No posts yet"
          description="Be the first to complete a challenge and share your proof!"
          action={{
            label: 'Browse Challenges',
            onClick: () => window.location.href = '/challenges',
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Feed Posts */}
      <div className="divide-y divide-surface-800">
        {items.map((item, index) => (
          <div
            key={item.submission.id}
            ref={index === items.length - 1 ? lastItemRef : undefined}
          >
            <FeedPost item={item} />
          </div>
        ))}
      </div>

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="py-8 flex items-center justify-center">
          <Spinner size="md" />
        </div>
      )}

      {/* End of feed */}
      {!hasMore && items.length > 0 && (
        <div className="py-8 flex items-center justify-center">
          <p className="text-surface-500 text-sm">You've reached the end ✨</p>
        </div>
      )}
    </div>
  );
}

// Individual Feed Post Component (Instagram/Threads style)
function FeedPost({ item }: { item: FeedItem }) {
  const { submission, profile, challenge } = item;
  const [liked, setLiked] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const isVideo = submission.media_type === 'video';
  const displayName = profile?.display_name || profile?.username || truncateAddress(submission.user_id);
  const username = profile?.username || truncateAddress(submission.user_id);
  const avatarUrl = profile?.avatar_url;
  const caption = submission.caption || '';
  const shouldTruncate = caption.length > 150;

  const shareUrl = getSubmissionShareUrl(submission.id);
  const shareText = `Check out ${displayName}'s proof for "${challenge?.title || 'a challenge'}" on PROVELT! 🏆`;

  return (
    <article className="bg-surface-950">
      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`${challenge?.title || 'Submission'} - PROVELT`}
        text={shareText}
        url={shareUrl}
      />

      {/* Post Header */}
      <div className="flex items-center justify-between p-3">
        <Link href={`/profile/${submission.user_id}`} className="flex items-center gap-3">
          <Avatar className="w-9 h-9 ring-2 ring-brand-500/30">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-surface-800 text-sm">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-white hover:underline">
              {displayName}
            </p>
            {challenge && (
              <p className="text-xs text-surface-400">
                completed <span className="text-brand-400">{challenge.title}</span>
              </p>
            )}
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="text-surface-400">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Post Media */}
      <div className="relative aspect-square bg-surface-900">
        {isVideo ? (
          <div className="relative w-full h-full">
            <video
              src={submission.media_url || ''}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              controls
            />
          </div>
        ) : (
          <Image
            src={submission.media_url || '/placeholder.jpg'}
            alt={caption || 'Submission'}
            fill
            className="object-cover"
          />
        )}
        
        {/* Challenge Badge Overlay */}
        {challenge && (
          <div className="absolute top-3 left-3">
            <Badge 
              variant="default" 
              className="bg-black/60 backdrop-blur-sm text-white border-0"
            >
              <Award className="w-3 h-3 mr-1" />
              {challenge.points} XP
            </Badge>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLiked(!liked)}
              className="transition-transform active:scale-90"
            >
              <Heart 
                className={cn(
                  "w-6 h-6 transition-colors",
                  liked ? "fill-red-500 text-red-500" : "text-white hover:text-surface-300"
                )} 
              />
            </button>
            <button className="transition-transform active:scale-90">
              <MessageCircle className="w-6 h-6 text-white hover:text-surface-300" />
            </button>
            <button 
              onClick={() => setShowShareModal(true)}
              className="transition-transform active:scale-90"
            >
              <Share2 className="w-6 h-6 text-white hover:text-surface-300" />
            </button>
          </div>
          
          {/* Badge earned indicator */}
          {submission.nft_mint_address && (
            <div className="flex items-center gap-1 text-brand-400">
              <Award className="w-5 h-5" />
              <span className="text-xs font-medium">Badge Earned</span>
            </div>
          )}
        </div>

        {/* Likes count */}
        <p className="text-sm font-semibold text-white mb-1">
          {submission.reactions_count || 0} likes
        </p>

        {/* Caption */}
        {caption && (
          <div className="text-sm">
            <Link href={`/profile/${submission.user_id}`} className="font-semibold text-white mr-1">
              {username}
            </Link>
            <span className="text-surface-300">
              {shouldTruncate && !showFullCaption ? (
                <>
                  {caption.slice(0, 150)}...
                  <button 
                    onClick={() => setShowFullCaption(true)}
                    className="text-surface-500 ml-1"
                  >
                    more
                  </button>
                </>
              ) : (
                caption
              )}
            </span>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-surface-500 mt-2">
          {formatRelativeTime(submission.created_at)}
        </p>
      </div>
    </article>
  );
}

// Skeleton for loading state
function FeedPostSkeleton() {
  return (
    <div className="bg-surface-950 animate-pulse">
      <div className="flex items-center gap-3 p-3">
        <SkeletonAvatar size="sm" />
        <div className="space-y-1">
          <SkeletonText className="h-4 w-24" />
          <SkeletonText className="h-3 w-32" />
        </div>
      </div>
      <div className="aspect-square bg-surface-800" />
      <div className="p-3 space-y-2">
        <SkeletonText className="h-4 w-20" />
        <SkeletonText className="h-4 w-full" />
        <SkeletonText className="h-3 w-16" />
      </div>
    </div>
  );
}
