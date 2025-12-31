'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Target,
  Clock,
  Trophy,
  Users,
  ChevronLeft,
  Upload,
  Share2,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { PageContainer, Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { ShareModal } from '@/components/ui/share-modal';
import { useChallenge, useChallengeSubmissions } from '@/hooks/use-challenges';
import { useUserStore } from '@/stores/user-store';
import { cn, formatTimeRemaining } from '@/lib/utils';
import { getChallengeShareUrl } from '@/lib/share';

/**
 * Single Challenge Page
 * View challenge details and submit proof
 */
export default function ChallengePage({ params }: { params: { id: string } }) {
  const challengeId = params.id;
  const router = useRouter();
  const { profile: user } = useUserStore();
  const { challenge, isLoading, error, refetch } = useChallenge(challengeId);
  const { submissions, isLoading: submissionsLoading } = useChallengeSubmissions(challengeId);
  const [activeTab, setActiveTab] = useState('about');
  const [showShareModal, setShowShareModal] = useState(false);

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!challenge) return null;
    const endTime = new Date(challenge.end_time);
    const now = new Date();
    return formatTimeRemaining(endTime, now);
  };

  // Check if user has already submitted
  const hasSubmitted = submissions?.some(s => s.user_id === user?.id);
  const isActive = challenge?.status === 'active';
  const timeRemaining = getTimeRemaining();

  // Loading state
  if (isLoading) {
    return (
      <PageContainer>
        <Header
          title="Loading..."
          leftAction={
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          }
        />
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error || !challenge) {
    return (
      <PageContainer>
        <Header
          title="Challenge"
          leftAction={
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          }
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorState
            message={error?.message || 'Challenge not found'}
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
        title={`${challenge.title} - PROVELT Challenge`}
        text={`Can you complete this challenge? "${challenge.title}" - Earn ${challenge.points} points and an NFT badge! 🎯`}
        url={getChallengeShareUrl(challengeId)}
      />

      <Header
        title={challenge.title}
        leftAction={
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
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
        className="space-y-6 pb-32"
      >
        {/* Hero Section */}
        <Card className="overflow-hidden">
          <div className="relative h-48 bg-gradient-to-br from-brand-600 to-brand-800">
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={isActive ? 'default' : 'secondary'}>
                  {challenge.status}
                </Badge>
                <Badge variant="outline" className="bg-surface-950/50 border-white/20">
                  {challenge.difficulty}
                </Badge>
              </div>
              <h1 className="text-xl font-bold text-white">{challenge.title}</h1>
            </div>
          </div>

          <CardContent className="p-4">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 py-4 border-b border-surface-800">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-1">
                  <Trophy className="w-4 h-4" />
                  <span className="font-semibold">{challenge.xp_reward}</span>
                </div>
                <p className="text-xs text-surface-500">XP Reward</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-brand-500 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">{challenge.submission_count}</span>
                </div>
                <p className="text-xs text-surface-500">Submissions</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-500 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold text-sm">{timeRemaining || 'Ended'}</span>
                </div>
                <p className="text-xs text-surface-500">Remaining</p>
              </div>
            </div>

            {/* Time Progress */}
            {isActive && (
              <div className="py-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-surface-400">Challenge Progress</span>
                  <span className="text-surface-400">
                    {timeRemaining} left
                  </span>
                </div>
                <Progress
                  value={challenge.submission_count}
                  max={100}
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="submissions">
              Submissions ({challenge.submission_count})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4 mt-4">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-surface-300 leading-relaxed">
                  {challenge.description}
                </p>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(challenge.rules as string[] || []).map((rule, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-surface-300 text-sm">{rule}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Badge Preview */}
            {challenge.badge_image_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Badge Reward</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-surface-800 flex items-center justify-center overflow-hidden">
                    <img
                      src={challenge.badge_image_url}
                      alt="Badge"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-surface-200 font-medium">Completion Badge</p>
                    <p className="text-surface-500 text-sm mt-1">
                      Minted as an ERC-721 NFT on Mantle
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="submissions" className="mt-4">
            {submissionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : submissions && submissions.length > 0 ? (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar size="sm">
                          <AvatarImage src={(submission as any).profile?.avatar_url} />
                          <AvatarFallback>
                            {(submission as any).profile?.username?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {(submission as any).profile?.display_name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-surface-500">
                            @{(submission as any).profile?.username || 'user'}
                          </p>
                        </div>
                        <Badge
                          variant={submission.status === 'approved' ? 'default' : 'secondary'}
                          className="ml-auto"
                        >
                          {submission.status}
                        </Badge>
                      </div>
                      {submission.caption && (
                        <p className="text-sm text-surface-300">{submission.caption}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Target className="w-8 h-8 text-surface-500" />}
                title="No submissions yet"
                description="Be the first to complete this challenge!"
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Submit CTA */}
        {isActive && (
          <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-surface-950 via-surface-950 to-transparent">
            <Link href={`/challenges/${challengeId}/submit`}>
              <Button
                className="w-full"
                size="lg"
                disabled={hasSubmitted}
              >
                {hasSubmitted ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Already Submitted
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Submit Proof
                  </>
                )}
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </PageContainer>
  );
}
