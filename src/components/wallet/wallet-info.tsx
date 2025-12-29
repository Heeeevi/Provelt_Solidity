'use client';

import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { Wallet, ExternalLink, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getExplorerUrl, truncateAddress } from '@/lib/mantle';

interface WalletInfoProps {
  className?: string;
  showBalance?: boolean;
}

export function WalletInfo({ className, showBalance = true }: WalletInfoProps) {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  if (!isConnected || !address) return null;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-sm text-surface-400">Connected Wallet</p>
            <p className="font-mono text-sm text-white">{truncateAddress(address)}</p>
          </div>
        </div>

        {showBalance && balanceData && (
          <div className="mb-3 p-3 rounded-lg bg-surface-800/50">
            <p className="text-xs text-surface-400 mb-1">Balance</p>
            <p className="text-lg font-semibold text-white">
              {parseFloat(formatEther(balanceData.value)).toFixed(4)} {balanceData.symbol}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </>
            )}
          </Button>

          <a
            href={getExplorerUrl(address, 'address')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 border border-surface-700 bg-transparent hover:bg-surface-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Explorer
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
