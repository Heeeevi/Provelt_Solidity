'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Heart, 
  MessageCircle, 
  Share2, 
  Award,
  Trophy,
  ExternalLink,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  Loader2,
} from 'lucide-react';
import { PageContainer, Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShareModal } from '@/components/ui/share-modal';
import { supabase } from '@/lib/supabase/client';
import { cn, formatRelativeTime, truncateAddress } from '@/lib/utils';
import { getSubmissionShareUrl } from '@/lib/share';
import { useAuth } from '@/components/providers/auth-provider';
import type { FeedItem } from '@/lib/database.types';

/**
 * Single Submission Page
 * View submission details from a shared link
 */
export default function SubmissionPage({ params }: { params: { id: string } }) {
  const submissionId = params.id;
  const router = useRouter();
  const { user } = useAuth();
  
  const [item, setItem] = useState<FeedItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Fetch submission data
  useEffect(() => {
    async function fetchSubmission() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch submission
        const { data: submission, error: subError } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', submissionId)
          .single();

        if (subError || !submission) {
          setError('Submission not found');
          setIsLoading(false);
          return;
        }

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', submission.user_id)
          .single();

        // Fetch challenge
        const { data: challenge } = await supabase
          .from('challenges')
          .select('*')
          .eq('id', submission.challenge_id)
          .single();

        setItem({
          submission,
          profile: profile || null,
          challenge: challenge || null,
        });

        setLikesCount(submission.reactions_count || 0);

        // Check if user liked this submission
        if (user) {
          const { data: reaction } = await supabase
            .from('reactions')
            .select('id')
            .eq('submission_id', submissionId)
            .eq('user_id', user.id)
            .single();
          setIsLiked(!!reaction);
        }
      } catch (err) {
        console.error('Error fetching submission:', err);
        setError('Failed to load submission');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubmission();
  }, [submissionId, user]);

  // Handle like
  const handleLike = async () => {
    if (!user || !item) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

    try {
      if (newIsLiked) {
        await supabase.from('reactions').insert({
          submission_id: submissionId,
          user_id: user.id,
          reaction_type: 'like',
        });
      } else {
        await supabase.from('reactions').delete()
          .eq('submission_id', submissionId)
          .eq('user_id', user.id);
      }
    } catch (err) {
      // Revert on error
      setIsLiked(!newIsLiked);
      setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <PageContainer>
        <Header 
          title="Loading..."
          leftAction={
            <Button variant="ghost" size="icon" onClick={() => router.push('/feed')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          }
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error || !item) {
    return (
      <PageContainer>
        <Header 
          title="Submission"
          leftAction={
            <Button variant="ghost" size="icon" onClick={() => router.push('/feed')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          }
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-surface-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Submission Not Found</h2>
          <p className="text-surface-400 mb-6">This submission may have been removed or doesn&apos;t exist.</p>
          <Link href="/feed">
            <Button>Browse Feed</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const { submission, profile, challenge } = item;
  const mediaUrl = submission.media_url;
  const isVideo = mediaUrl?.includes('.mp4') || mediaUrl?.includes('.webm') || mediaUrl?.includes('.mov');

  return (
    <PageContainer className="pb-24">
      <Header 
        title="Proof"
        leftAction={
          <Button variant="ghost" size="icon" onClick={() => router.push('/feed')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        }
        rightAction={
          <Button variant="ghost" size="icon" onClick={() => setShowShareModal(true)}>
            <Share2 className="w-5 h-5" />
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* User Info Card */}
        <Card className="bg-surface-900 border-surface-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${profile?.id}`}>
                <Avatar className="w-12 h-12 ring-2 ring-brand-500/20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-brand-500/20 text-brand-400">
                    {profile?.display_name?.[0] || profile?.username?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${profile?.id}`} className="hover:underline">
                  <h3 className="font-semibold text-white truncate">
                    {profile?.display_name || profile?.username || truncateAddress(submission.user_id)}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 text-sm text-surface-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatRelativeTime(new Date(submission.created_at))}</span>
                </div>
              </div>
              {submission.status === 'approved' && (
                <Badge variant="success" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </Badge>
              )}
              {submission.status === 'pending' && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" />
                  Pending
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Challenge Info */}
        {challenge && (
          <Link href={`/challenges/${challenge.id}`}>
            <Card className="bg-surface-900 border-surface-800 hover:bg-surface-800/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-surface-500 uppercase tracking-wider">Challenge</p>
                    <h4 className="font-medium text-white truncate">{challenge.title}</h4>
                  </div>
                  <Badge className={cn(
                    challenge.difficulty === 'easy' && 'bg-green-500/20 text-green-400 border-green-500/30',
                    challenge.difficulty === 'medium' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                    challenge.difficulty === 'hard' && 'bg-red-500/20 text-red-400 border-red-500/30',
                  )}>
                    {challenge.difficulty}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Media Content */}
        <Card className="bg-surface-900 border-surface-800 overflow-hidden">
          <div className="relative aspect-square bg-black">
            {isVideo ? (
              <video
                src={mediaUrl || undefined}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <Image
                src={mediaUrl || '/placeholder-image.png'}
                alt="Submission proof"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            )}
          </div>

          {/* Description */}
          {(submission.caption || submission.text_content) && (
            <CardContent className="p-4 border-t border-surface-800">
              <p className="text-surface-300 whitespace-pre-wrap">{submission.caption || submission.text_content}</p>
            </CardContent>
          )}

          {/* External Link - NFT Metadata */}
          {submission.nft_metadata_uri && (
            <CardContent className="p-4 pt-0">
              <a 
                href={submission.nft_metadata_uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View NFT Metadata
              </a>
            </CardContent>
          )}
        </Card>

        {/* Action Buttons */}
        <Card className="bg-surface-900 border-surface-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-around">
              <button 
                onClick={handleLike}
                className="flex flex-col items-center gap-1 py-2 px-4 rounded-lg hover:bg-surface-800 transition-colors"
              >
                <Heart 
                  className={cn(
                    "w-6 h-6 transition-colors",
                    isLiked ? "fill-red-500 text-red-500" : "text-surface-400"
                  )} 
                />
                <span className={cn(
                  "text-sm",
                  isLiked ? "text-red-500" : "text-surface-400"
                )}>
                  {likesCount}
                </span>
              </button>

              <button 
                onClick={() => setShowShareModal(true)}
                className="flex flex-col items-center gap-1 py-2 px-4 rounded-lg hover:bg-surface-800 transition-colors"
              >
                <Share2 className="w-6 h-6 text-surface-400" />
                <span className="text-sm text-surface-400">Share</span>
              </button>

              {submission.nft_mint_address && (
                <a 
                  href={`https://explorer.solana.com/address/${submission.nft_mint_address}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 py-2 px-4 rounded-lg hover:bg-surface-800 transition-colors"
                >
                  <Award className="w-6 h-6 text-brand-400" />
                  <span className="text-sm text-brand-400">NFT</span>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CTA for non-logged in users */}
        {!user && (
          <Card className="bg-gradient-to-r from-brand-500/10 to-accent-500/10 border-brand-500/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Want to prove your skills too?
              </h3>
              <p className="text-surface-400 mb-4 text-sm">
                Join PROVELT and start building your verified portfolio today.
              </p>
              <Link href="/auth/login">
                <Button>Get Started Free</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`${profile?.display_name || 'Someone'}'s Proof - PROVELT`}
        text={`Check out this proof for "${challenge?.title || 'a challenge'}" on PROVELT! 🏆`}
        url={getSubmissionShareUrl(submissionId)}
      />
    </PageContainer>
  );
}
