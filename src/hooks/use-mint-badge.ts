'use client';

import { useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseAbiItem, encodeFunctionData, keccak256, encodePacked } from 'viem';
import { getExplorerUrl, BADGE_CONTRACT_ADDRESS } from '@/lib/mantle';

interface MintBadgeParams {
  challengeId: string;
  submissionId: string;
}

interface MintBadgeResult {
  success: boolean;
  transactionHash?: string;
  tokenId?: string;
  explorerUrl?: string;
  error?: string;
}

/**
 * Hook for minting badge NFTs on Mantle
 * Handles the client-side wallet interaction and API calls
 */
export function useMintBadge() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, submissionId }: MintBadgeParams): Promise<MintBadgeResult> => {
      // Ensure wallet is connected
      if (!address || !isConnected) {
        openConnectModal?.();
        throw new Error('Please connect your wallet first');
      }

      // Call mint API (server-side minting for gas sponsorship)
      const response = await fetch('/api/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          submissionId,
          walletAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mint badge');
      }

      return {
        success: true,
        transactionHash: data.transactionHash,
        tokenId: data.tokenId,
        explorerUrl: data.explorerUrl,
      };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

interface LogCompletionParams {
  challengeId: string;
  userId: string;
  timestamp: number;
}

/**
 * Hook for logging challenge completion
 * For EVM, this is done via API (no on-chain memo needed)
 */
export function useLogChallengeCompletion() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  return useMutation({
    mutationFn: async ({ challengeId, userId, timestamp }: LogCompletionParams): Promise<{ proofHash: string }> => {
      if (!address || !isConnected) {
        openConnectModal?.();
        throw new Error('Please connect your wallet first');
      }

      // Create proof hash (matches contract's expected format)
      const proofHash = keccak256(
        encodePacked(
          ['string', 'string', 'uint256'],
          [challengeId, userId, BigInt(timestamp)]
        )
      );

      // Log to API for record keeping
      await fetch('/api/log-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          userId,
          proofHash,
          walletAddress: address,
          timestamp,
        }),
      }).catch(console.error); // Non-blocking

      return { proofHash };
    },
  });
}

/**
 * Hook for wallet connection state and utilities
 * Re-exports from useMantleWallet for backwards compatibility
 */
export { useMantleWallet as useWalletConnection } from './use-solana-wallet';
