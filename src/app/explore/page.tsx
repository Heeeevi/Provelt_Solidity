'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Award, Heart, TrendingUp, Rocket } from 'lucide-react';
import { PageContainer, Header } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { SubmissionViewer } from '@/components/feed/submission-viewer';
import { ICMTokenCard } from '@/components/icm';
import { useFeed } from '@/hooks/use-feed';
import { useChallenges } from '@/hooks/use-challenges';
import { cn } from '@/lib/utils';
import type { FeedItem } from '@/lib/database.types';

/**
 * Explore Page
 * Pinterest/Instagram Explore style masonry gallery
 */
export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
    refetch,
  } = useFeed();

  const { data: challenges = [] } = useChallenges();

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver>();
  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Filter items based on search
  const filteredItems = searchQuery
    ? items.filter(item => 
        item.submission.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.challenge?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  // Handle item click - open viewer
  const handleItemClick = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <>
      <PageContainer>
        <Header title="Explore" />

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <Input
              placeholder="Search challenges, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-surface-800 border-surface-700"
            />
          </div>
        </div>

        {/* Trending Challenges */}
        {!searchQuery && challenges && challenges.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-semibold text-white">Trending Challenges</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {challenges.slice(0, 5).map((challenge) => (
              <Link
                key={challenge.id}
                href={`/challenges/${challenge.id}`}
                className="flex-shrink-0"
              >
                <Badge 
                  variant="outline"
                  className="px-3 py-1.5 bg-surface-800/50 border-surface-700 hover:border-brand-500 transition-colors"
                >
                  {challenge.title}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

        {/* ICM Widget */}
        {!searchQuery && (
          <div className="px-4 pb-4">
            <Link href="/icm">
              <ICMTokenCard compact className="hover:border-brand-500/50 transition-colors" />
            </Link>
          </div>
        )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="px-4">
          <ErrorState message={error.message} onRetry={() => refetch()} />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="px-4">
          <EmptyState
            title={searchQuery ? "No results found" : "Nothing to explore yet"}
            description={searchQuery ? "Try a different search term" : "Be the first to complete a challenge!"}
          />
        </div>
      ) : (
        <>
          {/* Masonry Gallery */}
          <MasonryGallery 
            items={filteredItems} 
            lastItemRef={lastItemRef}
            onItemClick={handleItemClick}
          />

          {/* Loading more */}
          {isFetchingNextPage && (
            <div className="py-8 flex justify-center">
              <Spinner size="md" />
            </div>
          )}
        </>
      )}
      </PageContainer>

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <SubmissionViewer
            items={filteredItems}
            initialIndex={selectedIndex}
            onClose={() => setSelectedIndex(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Masonry Gallery Component
function MasonryGallery({ 
  items, 
  lastItemRef,
  onItemClick,
}: { 
  items: FeedItem[];
  lastItemRef: (node: HTMLDivElement | null) => void;
  onItemClick: (index: number) => void;
}) {
  // Create columns for masonry layout with original indices
  const columns = 2;
  const columnItems: { item: FeedItem; originalIndex: number }[][] = Array.from({ length: columns }, () => []);
  
  items.forEach((item, index) => {
    columnItems[index % columns].push({ item, originalIndex: index });
  });

  return (
    <div className="px-2 pb-4">
      <div className="flex gap-2">
        {columnItems.map((column, colIndex) => (
          <div key={colIndex} className="flex-1 flex flex-col gap-2">
            {column.map(({ item, originalIndex }, itemIndex) => {
              const isLast = colIndex === columns - 1 && itemIndex === column.length - 1;
              // Vary heights for visual interest
              const heightClass = getRandomHeight(item.submission.id);
              
              return (
                <div
                  key={item.submission.id}
                  ref={isLast ? lastItemRef : undefined}
                  onClick={() => onItemClick(originalIndex)}
                >
                  <GalleryItem item={item} heightClass={heightClass} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Individual Gallery Item
function GalleryItem({ 
  item, 
  heightClass 
}: { 
  item: FeedItem;
  heightClass: string;
}) {
  const { submission, challenge } = item;
  const isVideo = submission.media_type === 'video';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative rounded-xl overflow-hidden bg-surface-800 group cursor-pointer",
        heightClass
      )}
    >
      {/* Media */}
      {submission.media_url ? (
        isVideo ? (
          <div className="absolute inset-0">
            <video
              src={submission.media_url}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
            />
            {/* Play icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
              </div>
            </div>
          </div>
        ) : (
          <Image
            src={submission.media_url}
            alt={submission.caption || 'Submission'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-purple-500/20" />
      )}

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Content overlay */}
      <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {challenge && (
          <p className="text-xs text-white font-medium line-clamp-1">
            {challenge.title}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <Heart className="w-3 h-3 text-white" />
          <span className="text-xs text-white/80">
            {submission.reactions_count || 0}
          </span>
        </div>
      </div>

      {/* Badge indicator */}
      {submission.nft_mint_address && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
            <Award className="w-3 h-3 text-white" />
          </div>
        </div>
        )}

        {/* XP Badge */}
        {challenge && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 border-0">
              +{challenge.points} XP
            </Badge>
          </div>
        )}
    </motion.div>
  );
}

// Generate pseudo-random but consistent height based on ID
function getRandomHeight(id: string): string {
  const heights = ['h-40', 'h-48', 'h-56', 'h-64', 'h-52'];
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return heights[hash % heights.length];
}
