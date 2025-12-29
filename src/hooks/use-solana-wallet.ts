'use client';

import { useCallback, useMemo } from 'react';
import { useAccount, useBalance, useDisconnect, useChainId } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { formatEther } from 'viem';
import { truncateAddress, getExplorerUrl, mantleConfig } from '@/lib/mantle';

/**
 * Hook for Mantle wallet connection state and utilities
 * Replaces useSolanaWallet for EVM-based wallets
 */
export function useMantleWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
  });

  const truncatedAddress = useMemo(() => {
    return address ? truncateAddress(address) : null;
  }, [address]);

  const explorerUrl = useMemo(() => {
    if (!address) return null;
    return getExplorerUrl(address, 'address');
  }, [address]);

  const balance = useMemo(() => {
    if (!balanceData) return null;
    return formatEther(balanceData.value);
  }, [balanceData]);

  const connect = useCallback(() => {
    openConnectModal?.();
  }, [openConnectModal]);

  const getBalance = useCallback(async (): Promise<string | null> => {
    const result = await refetchBalance();
    if (result.data) {
      return formatEther(result.data.value);
    }
    return null;
  }, [refetchBalance]);

  // Check if connected to correct network
  const isCorrectNetwork = chainId === mantleConfig.chainId;

  return {
    // State
    address,
    truncatedAddress,
    connected: isConnected,
    connecting: isConnecting,
    balance,
    network: mantleConfig.network,
    chainId,
    isCorrectNetwork,
    explorerUrl,

    // Actions
    connect,
    disconnect,
    getBalance,
    refetchBalance,
  };
}

// Re-export for backwards compatibility
export { useMantleWallet as useWalletConnection };
