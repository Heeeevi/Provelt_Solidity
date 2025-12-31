'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Settings,
  Share2,
  Trophy,
  Target,
  Award,
  Calendar,
  Edit2,
  Copy,
  CheckCircle,
  ExternalLink,
  Flame,
  Gift,
  Users,
} from 'lucide-react';
import { PageContainer, Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SkeletonCard, SkeletonAvatar, SkeletonText } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { ShareModal } from '@/components/ui/share-modal';
import { useProfile, useUserBadges, useUserSubmissions } from '@/hooks/use-profile';
import { useAuth } from '@/components/providers/auth-provider';
import { cn, formatShortDate, truncateAddress } from '@/lib/utils';
import { getProfileShareUrl } from '@/lib/share';
import { getExplorerUrl } from '@/lib/mantle';

/**
 * Profile Page
 * User profile with earned badges and submission history
 */
export default function ProfilePage({ params }: { params: { id: string } }) {
  const userId = params.id;
  const router = useRouter();
  const { userId: currentUserId } = useAuth();
  const { profile, isLoading, error, refetch } = useProfile(userId);
  const { badges, isLoading: badgesLoading } = useUserBadges(userId);
  const { submissions, isLoading: submissionsLoading } = useUserSubmissions(userId);

  const [activeTab, setActiveTab] = useState('badges');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const isOwnProfile = currentUserId === userId;

  // Copy wallet address
  const handleCopyAddress = () => {
    if (profile?.wallet_address) {
      navigator.clipboard.writeText(profile.wallet_address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <PageContainer>
        <Header
          title="Profile"
          leftAction={
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          }
        />
        <div className="space-y-6">
          {/* Profile skeleton */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <SkeletonAvatar size="lg" />
                <div className="mt-4 space-y-2 w-full max-w-xs">
                  <SkeletonText className="h-6 w-32 mx-auto" />
                  <SkeletonText className="h-4 w-24 mx-auto" />
                </div>
              </div>
            </CardContent>
          </Card>
          <SkeletonCard />
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <PageContainer>
        <Header
          title="Profile"
          leftAction={
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          }
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorState
            message={error?.message || 'Profile not found'}
            onRetry={refetch}
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`${profile.display_name || 'User'} on PROVELT`}
        text={`Check out ${profile.display_name || 'this user'}'s profile on PROVELT! ${profile.badges_count || 0} badges earned 🏅`}
        url={getProfileShareUrl(userId)}
      />

      <Header
        title={isOwnProfile ? 'My Profile' : profile.display_name || 'Profile'}
        leftAction={
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        }
        rightAction={
          isOwnProfile ? (
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setShowShareModal(true)}>
              <Share2 className="w-5 h-5" />
            </Button>
          )
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar size="lg">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name?.[0] || profile.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>

              <h1 className="mt-4 text-xl font-bold text-white">
                {profile.display_name || profile.username}
              </h1>

              <p className="text-surface-400 text-sm">
                @{profile.username}
              </p>

              {profile.bio && (
                <p className="mt-3 text-surface-300 text-sm max-w-xs">
                  {profile.bio}
                </p>
              )}

              {/* Wallet Address */}
              {profile.wallet_address && (
                <button
                  onClick={handleCopyAddress}
                  className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-800 text-surface-400 text-xs hover:bg-surface-700 transition-colors"
                >
                  <span>{truncateAddress(profile.wallet_address)}</span>
                  {copiedAddress ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {/* Stats Row */}
              <div className="mt-6 grid grid-cols-4 gap-4 w-full max-w-sm">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{profile.total_points}</p>
                  <p className="text-xs text-surface-500">XP</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{profile.submissions_count}</p>
                  <p className="text-xs text-surface-500">Done</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{profile.badges_count}</p>
                  <p className="text-xs text-surface-500">Badges</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-500 flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4" />
                    {(profile as any).streak_days || 0}
                  </p>
                  <p className="text-xs text-surface-500">Streak</p>
                </div>
              </div>

              {/* Streak & Referral Cards - Only on own profile */}
              {isOwnProfile && (
                <div className="mt-6 w-full max-w-sm space-y-3">
                  {/* Streak Card */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {(profile as any).streak_days || 0} Day Streak
                        </p>
                        <p className="text-xs text-surface-400">
                          {((profile as any).streak_days || 0) >= 7 ? '1.5x XP Multiplier Active!' : 'Keep going for bonus XP!'}
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl">🔥</div>
                  </div>

                  {/* Referral Card */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-brand-500/10 to-purple-500/10 border border-brand-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-brand-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Invite Friends</p>
                        <p className="text-xs text-surface-400">Earn $5 per referral</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                      const referralLink = `${window.location.origin}/auth/login?ref=${userId}`;
                      navigator.clipboard.writeText(referralLink);
                    }}>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              )}

              {/* Edit Profile Button */}
              {isOwnProfile && (
                <Link href="/profile/edit" className="mt-6 w-full max-w-xs">
                  <Button variant="outline" className="w-full">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="badges">
              Badges ({profile.badges_count})
            </TabsTrigger>
            <TabsTrigger value="submissions">
              Submissions
            </TabsTrigger>
          </TabsList>

          {/* Badges Tab */}
          <TabsContent value="badges" className="mt-4">
            {badgesLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square rounded-xl bg-surface-800 animate-pulse" />
                ))}
              </div>
            ) : badges && badges.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {badges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden">
                      <div className="aspect-square bg-surface-800 relative">
                        {badge.image_url ? (
                          <img
                            src={badge.image_url}
                            alt={badge.name || 'Badge'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Award className="w-8 h-8 text-brand-500" />
                          </div>
                        )}

                        {/* NFT Link */}
                        {badge.mint_address && (
                          <a
                            href={getExplorerUrl(badge.mint_address, 'address')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3 text-white" />
                          </a>
                        )}
                      </div>
                      <CardContent className="p-2">
                        <p className="text-xs font-medium text-white truncate text-center">
                          {badge.name || 'Badge'}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Award className="w-8 h-8 text-surface-500" />}
                title="No badges yet"
                description={isOwnProfile
                  ? "Complete challenges to earn badges!"
                  : "This user hasn't earned any badges yet."
                }
                action={isOwnProfile ? {
                  label: 'Browse Challenges',
                  onClick: () => router.push('/challenges'),
                } : undefined}
              />
            )}
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="mt-4">
            {submissionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : submissions && submissions.length > 0 ? (
              <div className="space-y-4">
                {submissions.map((submission, index) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/challenges/${submission.challenge_id}`}>
                      <Card className="overflow-hidden hover:bg-surface-800/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {/* Thumbnail */}
                            <div className="w-20 h-20 rounded-lg bg-surface-800 overflow-hidden shrink-0">
                              {submission.media_url ? (
                                submission.media_type === 'video' ? (
                                  <video
                                    src={submission.media_url}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={submission.media_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                )
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Target className="w-6 h-6 text-surface-600" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-medium text-white text-sm line-clamp-1">
                                  {(submission as any).challenge?.title || 'Challenge'}
                                </h3>
                                <Badge
                                  variant={submission.status === 'approved' ? 'default' : 'secondary'}
                                  className="shrink-0 text-xs"
                                >
                                  {submission.status}
                                </Badge>
                              </div>

                              {submission.caption && (
                                <p className="text-surface-400 text-sm mt-1 line-clamp-2">
                                  {submission.caption}
                                </p>
                              )}

                              <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatShortDate(new Date(submission.created_at))}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Trophy className="w-3 h-3" />
                                  +{(submission as any).challenge?.xp_reward || 0} XP
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Target className="w-8 h-8 text-surface-500" />}
                title="No submissions yet"
                description={isOwnProfile
                  ? "Submit proof to complete challenges!"
                  : "This user hasn't submitted any proofs yet."
                }
                action={isOwnProfile ? {
                  label: 'Browse Challenges',
                  onClick: () => router.push('/challenges'),
                } : undefined}
              />
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </PageContainer>
  );
}
