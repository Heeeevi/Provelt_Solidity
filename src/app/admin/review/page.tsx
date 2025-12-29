'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Trophy,
  User,
  Calendar,
  ExternalLink,
  Play,
  Filter,
} from 'lucide-react';
import { PageContainer, Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/components/providers/auth-provider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { cn, formatRelativeTime, truncateAddress } from '@/lib/utils';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminReviewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId, isAuthenticated } = useAuth();

  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Fetch submissions
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['admin-submissions', filter],
    queryFn: async () => {
      let query = supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;

      // Fetch related data
      if (!data?.length) return [];

      const userIds = Array.from(new Set(data.map(s => s.user_id)));
      const challengeIds = Array.from(new Set(data.map(s => s.challenge_id)));

      const [profilesRes, challengesRes] = await Promise.all([
        supabase.from('profiles').select('*').in('id', userIds),
        supabase.from('challenges').select('*').in('id', challengeIds),
      ]);

      // Also try to get profiles by wallet address
      const { data: walletProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('wallet_address', userIds);

      const allProfiles = [...(profilesRes.data || []), ...(walletProfiles || [])];

      const profileMap = new Map(allProfiles.map(p => [p.id, p]));
      const walletProfileMap = new Map(allProfiles.map(p => [p.wallet_address, p]));
      const challengeMap = new Map((challengesRes.data || []).map(c => [c.id, c]));

      return data.map(s => ({
        ...s,
        profile: profileMap.get(s.user_id) || walletProfileMap.get(s.user_id) || null,
        challenge: challengeMap.get(s.challenge_id) || null,
      }));
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const response = await fetch('/api/submissions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, action: 'approve' }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setMessage({ type: 'success', text: `Approved! ${data.data?.pointsAwarded || 0} XP awarded` });
      queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
      setSelectedSubmission(null);
    },
    onError: (error: Error) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ submissionId, reason }: { submissionId: string; reason: string }) => {
      const response = await fetch('/api/submissions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, action: 'reject', rejectionReason: reason }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Submission rejected' });
      queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
      setSelectedSubmission(null);
      setRejectionReason('');
    },
    onError: (error: Error) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  const pendingCount = submissions?.filter(s => s.status === 'pending').length || 0;

  return (
    <PageContainer>
      <Header
        title="Review Submissions"
        leftAction={
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        }
      />

      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Clock className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{pendingCount}</p>
              <p className="text-xs text-surface-400">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">
                {submissions?.filter(s => s.status === 'approved').length || 0}
              </p>
              <p className="text-xs text-surface-400">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">
                {submissions?.filter(s => s.status === 'rejected').length || 0}
              </p>
              <p className="text-xs text-surface-400">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg flex items-center gap-2 ${message.type === 'error'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-emerald-500/20 text-emerald-400'
              }`}
          >
            {message.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span className="text-sm">{message.text}</span>
          </motion.div>
        )}

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status}
              {status === 'pending' && pendingCount > 0 && (
                <Badge className="ml-1 bg-yellow-500/20 text-yellow-400 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Submissions List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : submissions?.length === 0 ? (
          <EmptyState
            icon={<Trophy className="w-8 h-8 text-surface-500" />}
            title="No submissions"
            description={filter === 'pending' ? "No pending submissions to review" : "No submissions found"}
          />
        ) : (
          <div className="space-y-3">
            {submissions?.map((submission) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className={cn(
                    "cursor-pointer transition-colors rounded-xl",
                    selectedSubmission?.id === submission.id
                      ? "ring-2 ring-brand-500"
                      : ""
                  )}
                  onClick={() => setSelectedSubmission(
                    selectedSubmission?.id === submission.id ? null : submission
                  )}
                >
                  <Card
                    className={cn(
                      "overflow-hidden",
                      selectedSubmission?.id === submission.id
                        ? "bg-surface-800/50"
                        : "hover:bg-surface-800/50"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-lg bg-surface-800 overflow-hidden shrink-0">
                          {submission.media_url ? (
                            submission.media_type === 'video' ? (
                              <div className="relative w-full h-full">
                                <video
                                  src={submission.media_url}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <Play className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            ) : (
                              <img
                                src={submission.media_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Trophy className="w-6 h-6 text-surface-600" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Avatar size="sm">
                                <AvatarImage src={submission.profile?.avatar_url} />
                                <AvatarFallback>
                                  {submission.profile?.display_name?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {submission.profile?.display_name || truncateAddress(submission.user_id)}
                                </p>
                                <p className="text-xs text-surface-500">
                                  {formatRelativeTime(submission.created_at)}
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={cn(
                                submission.status === 'pending' && 'bg-yellow-500/20 text-yellow-400',
                                submission.status === 'approved' && 'bg-green-500/20 text-green-400',
                                submission.status === 'rejected' && 'bg-red-500/20 text-red-400',
                              )}
                            >
                              {submission.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-surface-400 mt-1">
                            {submission.challenge?.title || 'Unknown Challenge'}
                          </p>
                          {submission.caption && (
                            <p className="text-xs text-surface-500 mt-1 line-clamp-1">
                              {submission.caption}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {selectedSubmission?.id === submission.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 mt-4 border-t border-surface-700 space-y-4">
                              {/* Media Preview */}
                              {submission.media_url && (
                                <div className="rounded-lg overflow-hidden bg-surface-800 max-h-64">
                                  {submission.media_type === 'video' ? (
                                    <video
                                      src={submission.media_url}
                                      controls
                                      className="w-full max-h-64 object-contain"
                                    />
                                  ) : (
                                    <img
                                      src={submission.media_url}
                                      alt=""
                                      className="w-full max-h-64 object-contain"
                                    />
                                  )}
                                </div>
                              )}

                              {/* Caption */}
                              {submission.caption && (
                                <p className="text-sm text-surface-300">
                                  {submission.caption}
                                </p>
                              )}

                              {/* Challenge Info */}
                              <div className="p-3 rounded-lg bg-surface-800/50">
                                <p className="text-xs text-surface-500 mb-1">Challenge</p>
                                <p className="text-sm font-medium text-white">
                                  {submission.challenge?.title}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {submission.challenge?.difficulty}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    +{submission.challenge?.points} XP
                                  </Badge>
                                </div>
                              </div>

                              {/* Actions for Pending */}
                              {submission.status === 'pending' && (
                                <div className="space-y-3">
                                  <Textarea
                                    placeholder="Rejection reason (optional)..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                                      onClick={() => rejectMutation.mutate({
                                        submissionId: submission.id,
                                        reason: rejectionReason,
                                      })}
                                      disabled={rejectMutation.isPending || approveMutation.isPending}
                                    >
                                      {rejectMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Reject
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      className="flex-1 bg-green-600 hover:bg-green-700"
                                      onClick={() => approveMutation.mutate(submission.id)}
                                      disabled={rejectMutation.isPending || approveMutation.isPending}
                                    >
                                      {approveMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Approve & Mint
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* NFT Info for Approved */}
                              {submission.status === 'approved' && submission.nft_mint_address && (
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                  <p className="text-xs text-emerald-400 mb-1">NFT Badge Minted</p>
                                  <p className="text-sm text-white font-mono break-all">
                                    {submission.nft_mint_address}
                                  </p>
                                  {submission.nft_tx_signature && (
                                    <a
                                      href={`https://sepolia.mantlescan.xyz/tx/${submission.nft_tx_signature}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-brand-400 mt-2 hover:underline"
                                    >
                                      View on Explorer
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* Rejection Reason */}
                              {submission.status === 'rejected' && submission.rejection_reason && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                  <p className="text-xs text-red-400 mb-1">Rejection Reason</p>
                                  <p className="text-sm text-white">
                                    {submission.rejection_reason}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
