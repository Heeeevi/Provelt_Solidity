'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useMintBadge } from '@/hooks/use-mint-badge';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface MintBadgeButtonProps {
  challengeId: string;
  submissionId: string;
  challengeTitle: string;
  disabled?: boolean;
  className?: string;
  onSuccess?: (result: { transactionHash: string; tokenId?: string }) => void;
  onError?: (error: string) => void;
}

export function MintBadgeButton({
  challengeId,
  submissionId,
  challengeTitle,
  disabled = false,
  className,
  onSuccess,
  onError,
}: MintBadgeButtonProps) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const mintBadge = useMintBadge();
  const [showSuccess, setShowSuccess] = useState(false);
  const [mintResult, setMintResult] = useState<{ transactionHash: string; explorerUrl?: string } | null>(null);

  const handleMint = async () => {
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }

    try {
      const result = await mintBadge.mutateAsync({ challengeId, submissionId });
      setMintResult({
        transactionHash: result.transactionHash!,
        explorerUrl: result.explorerUrl,
      });
      setShowSuccess(true);
      onSuccess?.({ transactionHash: result.transactionHash!, tokenId: result.tokenId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Minting failed';
      onError?.(message);
    }
  };

  // Success state
  if (showSuccess && mintResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={className}
      >
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="py-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            </motion.div>
            <h3 className="text-lg font-semibold text-white mb-2">Badge Minted!</h3>
            <p className="text-surface-400 text-sm mb-4">
              Your badge for &quot;{challengeTitle}&quot; has been minted on Mantle.
            </p>
            {mintResult.explorerUrl && (
              <a
                href={mintResult.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View on Mantlescan
              </a>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Error state
  if (mintBadge.isError) {
    return (
      <div className={className}>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Minting Failed</p>
                <p className="text-surface-400 text-sm mt-1">
                  {mintBadge.error?.message || 'Unknown error occurred'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => mintBadge.reset()}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Button
      onClick={handleMint}
      disabled={disabled || mintBadge.isPending}
      className={cn(
        'bg-gradient-to-r from-brand-500 to-accent-500',
        'hover:from-brand-600 hover:to-accent-600',
        'text-white font-medium',
        className
      )}
    >
      {mintBadge.isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Minting...
        </>
      ) : !isConnected ? (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Connect to Mint
        </>
      ) : (
        <>
          <Trophy className="w-4 h-4 mr-2" />
          Mint Badge NFT
        </>
      )}
    </Button>
  );
}
