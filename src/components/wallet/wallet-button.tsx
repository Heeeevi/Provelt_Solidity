'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMantleWallet } from '@/hooks/use-solana-wallet';

interface WalletButtonProps {
  className?: string;
  showBalance?: boolean;
}

/**
 * Wallet connect button using RainbowKit
 * Migrated from Solana wallet adapters to EVM/Mantle
 */
export function WalletButton({ className, showBalance = false }: WalletButtonProps) {
  const { connected, connecting, isCorrectNetwork } = useMantleWallet();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    data-onboarding="wallet-button"
                    className={cn(
                      'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700',
                      'text-white font-medium',
                      className
                    )}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    variant="destructive"
                    className={cn('font-medium', className)}
                  >
                    Wrong Network
                  </Button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  {showBalance && (
                    <Button
                      onClick={openChainModal}
                      variant="outline"
                      className={cn(
                        'border-surface-700 bg-surface-800/50 hover:bg-surface-800',
                        'text-white font-medium hidden sm:flex'
                      )}
                    >
                      {chain.hasIcon && (
                        <div
                          className="w-4 h-4 mr-2 rounded-full overflow-hidden"
                          style={{ background: chain.iconBackground }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              className="w-4 h-4"
                            />
                          )}
                        </div>
                      )}
                      {account.displayBalance
                        ? account.displayBalance
                        : ''}
                    </Button>
                  )}

                  <Button
                    onClick={openAccountModal}
                    variant="outline"
                    className={cn(
                      'border-surface-700 bg-surface-800/50 hover:bg-surface-800',
                      'text-white font-medium',
                      className
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                    {account.displayName}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

// Simple version that uses RainbowKit's built-in button
export function SimpleWalletButton({ className }: { className?: string }) {
  return (
    <div className={cn('rainbowkit-wrapper', className)}>
      <ConnectButton
        showBalance={false}
        chainStatus="icon"
        accountStatus={{
          smallScreen: 'avatar',
          largeScreen: 'address',
        }}
      />
    </div>
  );
}
