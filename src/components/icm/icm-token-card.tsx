'use client';

import { motion } from 'framer-motion';
import { ExternalLink, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useICMPrice,
  formatPrice,
  formatLargeNumber,
  formatPercentage,
  ICM_TOKEN_ADDRESS,
  ICM_LINKS,
} from '@/lib/icm';
import { cn } from '@/lib/utils';

interface ICMTokenCardProps {
  className?: string;
  compact?: boolean;
}

export function ICMTokenCard({ className, compact = false }: ICMTokenCardProps) {
  const { data: priceData, isLoading, error } = useICMPrice();

  const isPositive = priceData && priceData.priceChange24h >= 0;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 border border-surface-700',
          className
        )}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
          <span className="text-xs font-bold text-white">ICM</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">$ICM</p>
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin text-surface-400" />
          ) : error ? (
            <p className="text-xs text-surface-400">Price unavailable</p>
          ) : priceData ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-surface-300">
                ${formatPrice(priceData.price)}
              </span>
              <span className={cn(
                'text-xs',
                isPositive ? 'text-green-400' : 'text-red-400'
              )}>
                {formatPercentage(priceData.priceChange24h)}
              </span>
            </div>
          ) : null}
        </div>

        <a
          href={ICM_LINKS.dexscreener}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg hover:bg-surface-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-surface-400" />
        </a>
      </motion.div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
              <span className="text-sm font-bold text-white">ICM</span>
            </div>
            <div>
              <h3 className="font-semibold text-white">$ICM Token</h3>
              <p className="text-xs text-surface-400">Internet Capital Markets</p>
            </div>
          </div>

          {priceData && (
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              isPositive
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            )}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {formatPercentage(priceData.priceChange24h)}
            </div>
          )}
        </div>

        {/* Price Data */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-surface-400">Unable to load price data</p>
          </div>
        ) : priceData ? (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                ${formatPrice(priceData.price)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-surface-800/50">
                <p className="text-xs text-surface-400">Market Cap</p>
                <p className="text-sm font-medium text-white">
                  {formatLargeNumber(priceData.marketCap)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-surface-800/50">
                <p className="text-xs text-surface-400">24h Volume</p>
                <p className="text-sm font-medium text-white">
                  {formatLargeNumber(priceData.volume24h)}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <a href={ICM_LINKS.dexscreener} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button
              variant="default"
              size="sm"
              className="w-full"
            >
              Buy $ICM
            </Button>
          </a>
          <a href={ICM_LINKS.dexscreener} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
            >
              Chart
            </Button>
          </a>
        </div>

        {/* Contract Address */}
        <div className="mt-3 pt-3 border-t border-surface-700">
          <p className="text-xs text-surface-400 text-center">
            CA: {ICM_TOKEN_ADDRESS.slice(0, 8)}...{ICM_TOKEN_ADDRESS.slice(-6)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
