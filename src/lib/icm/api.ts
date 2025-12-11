'use client';

import { useQuery } from '@tanstack/react-query';
import { ICM_API, ICM_TOKEN_ADDRESS } from './config';

// Token price data interface
export interface TokenPriceData {
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
}

// DexScreener response interface
interface DexScreenerPair {
  priceUsd: string;
  priceChange: {
    h24: number;
  };
  volume: {
    h24: number;
  };
  liquidity: {
    usd: number;
  };
  fdv: number;
}

interface DexScreenerResponse {
  pairs: DexScreenerPair[];
}

// Fetch ICM token price from DexScreener
async function fetchICMPrice(): Promise<TokenPriceData> {
  const response = await fetch(ICM_API.dexScreener);
  
  if (!response.ok) {
    throw new Error('Failed to fetch ICM price');
  }
  
  const data: DexScreenerResponse = await response.json();
  
  if (!data.pairs || data.pairs.length === 0) {
    throw new Error('No trading pairs found');
  }
  
  // Get the first/most liquid pair
  const pair = data.pairs[0];
  
  return {
    price: parseFloat(pair.priceUsd) || 0,
    priceChange24h: pair.priceChange?.h24 || 0,
    volume24h: pair.volume?.h24 || 0,
    marketCap: pair.fdv || 0,
    liquidity: pair.liquidity?.usd || 0,
  };
}

// Hook to get ICM token price
export function useICMPrice() {
  return useQuery({
    queryKey: ['icm-price'],
    queryFn: fetchICMPrice,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
  });
}

// Format price with appropriate decimals
export function formatPrice(price: number): string {
  if (price < 0.0001) {
    return price.toExponential(4);
  }
  if (price < 1) {
    return price.toFixed(6);
  }
  if (price < 100) {
    return price.toFixed(4);
  }
  return price.toFixed(2);
}

// Format large numbers (volume, market cap)
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

// Format percentage change
export function formatPercentage(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

// Get Solscan link for token
export function getSolscanLink(address: string = ICM_TOKEN_ADDRESS): string {
  return `https://solscan.io/token/${address}`;
}

// Get Birdeye link for token
export function getBirdeyeLink(address: string = ICM_TOKEN_ADDRESS): string {
  return `https://birdeye.so/token/${address}?chain=solana`;
}
