/**
 * Mantle Network Configuration
 * For PROVELT badge minting on Mantle L2
 */

// Network configuration
export const MANTLE_NETWORK = (process.env.NEXT_PUBLIC_MANTLE_NETWORK || 'sepolia') as 'sepolia' | 'mainnet';

export const CHAIN_CONFIG = {
    sepolia: {
        chainId: 5003,
        name: 'Mantle Sepolia',
        rpcUrl: 'https://rpc.sepolia.mantle.xyz',
        explorerUrl: 'https://sepolia.mantlescan.xyz',
        symbol: 'MNT',
    },
    mainnet: {
        chainId: 5000,
        name: 'Mantle',
        rpcUrl: 'https://rpc.mantle.xyz',
        explorerUrl: 'https://mantlescan.xyz',
        symbol: 'MNT',
    },
} as const;

// Get active chain config
export const activeChainConfig = CHAIN_CONFIG[MANTLE_NETWORK];

// RPC URL (use custom if provided)
export const MANTLE_RPC_URL = process.env.NEXT_PUBLIC_MANTLE_RPC_URL || activeChainConfig.rpcUrl;

// Contract addresses
export const BADGE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS || '';

// Explorer URLs
export function getExplorerUrl(hashOrAddress: string, type: 'tx' | 'address' = 'tx'): string {
    return `${activeChainConfig.explorerUrl}/${type}/${hashOrAddress}`;
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Truncate address for display
export function truncateAddress(address: string, chars: number = 4): string {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Export config object
export const mantleConfig = {
    network: MANTLE_NETWORK,
    chainId: activeChainConfig.chainId,
    rpcUrl: MANTLE_RPC_URL,
    explorerUrl: activeChainConfig.explorerUrl,
    badgeContract: BADGE_CONTRACT_ADDRESS,
} as const;
