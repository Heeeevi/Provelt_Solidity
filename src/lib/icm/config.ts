/**
 * ICM.run Integration Config
 * Internet Capital Markets (ICM) ecosystem integration
 */

// ICM Token Contract Address (EVM/Mantle compatible)
export const ICM_TOKEN_ADDRESS = 'G5bStqnKXv11fmPvMaagUbZi86BGnpf9zZtyPQtAdaos';

// ICM Ecosystem Links
export const ICM_LINKS = {
  website: 'https://www.icm.run',
  docs: 'https://docs.icm.run',
  apply: 'https://apply.icm.run',
  telegram: 'https://t.me/icmdotrun',
  twitter: 'https://x.com/icm_run',
  daos: `https://www.daos.fun/${ICM_TOKEN_ADDRESS}`,
  dexscreener: `https://dexscreener.com/mantle/${ICM_TOKEN_ADDRESS}`,
  magiceden: 'https://magiceden.io/marketplace/icm_investor_center_cult',
} as const;

// Believe.app Links (ICM Partner)
export const BELIEVE_LINKS = {
  website: 'https://believe.app',
  terms: 'https://believe.app/terms',
  privacy: 'https://believe.app/privacy',
} as const;

// ICM Partner Projects
export const ICM_PARTNERS = [
  { name: 'Pump.fun', url: 'https://pump.fun' },
  { name: 'Meteora', url: 'https://meteora.ag' },
  { name: 'DAOS.fun', url: 'https://daos.fun' },
  { name: 'Believe.app', url: 'https://believe.app' },
  { name: 'Mantle Network', url: 'https://mantle.xyz' },
  { name: 'Pudgy Penguins', url: 'https://pudgypenguins.com' },
] as const;

// ICM Challenge Categories for PROVELT
export const ICM_CHALLENGE_CATEGORIES = [
  {
    id: 'icm-trader',
    name: 'ICM Trader',
    description: 'Prove your trading skills in Internet Capital Markets',
    icon: '📈',
  },
  {
    id: 'icm-holder',
    name: 'ICM Holder',
    description: 'Show your diamond hands with ICM ecosystem tokens',
    icon: '💎',
  },
  {
    id: 'icm-builder',
    name: 'ICM Builder',
    description: 'Build and contribute to the ICM ecosystem',
    icon: '🔨',
  },
  {
    id: 'believe-launcher',
    name: 'Believe Launcher',
    description: 'Launch your project on Believe.app',
    icon: '🚀',
  },
] as const;

// API endpoints for fetching token data
export const ICM_API = {
  // DexScreener API (public)
  dexScreener: `https://api.dexscreener.com/latest/dex/tokens/${ICM_TOKEN_ADDRESS}`,
} as const;

export type ICMLink = keyof typeof ICM_LINKS;
export type ICMPartner = typeof ICM_PARTNERS[number];
export type ICMChallengeCategory = typeof ICM_CHALLENGE_CATEGORIES[number];
