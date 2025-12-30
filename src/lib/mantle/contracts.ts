/**
 * ProveltBadge Smart Contract Interface
 * Generated from contracts/src/ProveltBadge.sol
 */

import { ethers } from 'ethers';
import { BADGE_CONTRACT_ADDRESS, MANTLE_RPC_URL } from './config';

// Contract ABI (subset of functions we need)
export const PROVELT_BADGE_ABI = [
    // Read functions
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalMinted() view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function getBadgesOf(address owner) view returns (uint256[])',
    'function hasChallengeBadge(address user, uint256 challengeId) view returns (bool)',
    'function getBadgeInfo(uint256 tokenId) view returns (uint256 challengeId, uint256 completedAt, bytes32 proofHash)',
    'function challengeCompletions(uint256 challengeId) view returns (uint256)',

    // Write functions
    'function mintBadge(address to, uint256 challengeId, bytes32 proofHash, string uri) returns (uint256)',
    'function grantMinterRole(address account)',
    'function revokeMinterRole(address account)',

    // Events
    'event BadgeMinted(address indexed recipient, uint256 indexed tokenId, uint256 indexed challengeId, bytes32 proofHash, string uri)',
    'event ChallengeCompleted(address indexed user, uint256 indexed challengeId, bytes32 proofHash, uint256 timestamp)',
] as const;

// Types
export interface BadgeInfo {
    challengeId: bigint;
    completedAt: bigint;
    proofHash: string;
}

export interface MintBadgeParams {
    to: string;
    challengeId: number;
    proofHash: string;
    uri: string;
}

export interface MintBadgeResult {
    success: boolean;
    tokenId?: string;
    transactionHash?: string;
    explorerUrl?: string;
    error?: string;
}

// Get read-only provider
export function getProvider(): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(MANTLE_RPC_URL);
}

// Get read-only contract instance
export function getBadgeContract(): ethers.Contract {
    if (!BADGE_CONTRACT_ADDRESS) {
        throw new Error('Badge contract address not configured');
    }
    const provider = getProvider();
    return new ethers.Contract(BADGE_CONTRACT_ADDRESS, PROVELT_BADGE_ABI, provider);
}

// Get contract with signer for write operations
export function getBadgeContractWithSigner(signer: ethers.Signer): ethers.Contract {
    if (!BADGE_CONTRACT_ADDRESS) {
        throw new Error('Badge contract address not configured');
    }
    return new ethers.Contract(BADGE_CONTRACT_ADDRESS, PROVELT_BADGE_ABI, signer);
}

// Server-side: Get contract with wallet for minting (uses private key)
export async function getServerMintingContract(): Promise<ethers.Contract> {
    const privateKey = process.env.TREASURY_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('Treasury private key not configured');
    }

    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    return getBadgeContractWithSigner(wallet);
}

// Helper: Create proof hash from submission data
export function createProofHash(
    challengeId: string,
    userId: string,
    submissionId: string,
    timestamp: number
): string {
    const data = ethers.solidityPacked(
        ['string', 'string', 'string', 'uint256'],
        [challengeId, userId, submissionId, timestamp]
    );
    return ethers.keccak256(data);
}

// Read: Check if user has badge for challenge
export async function hasChallengeBadge(
    userAddress: string,
    challengeId: number
): Promise<boolean> {
    const contract = getBadgeContract();
    return await contract.hasChallengeBadge(userAddress, challengeId);
}

// Read: Get user's badge token IDs
export async function getUserBadges(userAddress: string): Promise<bigint[]> {
    const contract = getBadgeContract();
    return await contract.getBadgesOf(userAddress);
}

// Read: Get badge info
export async function getBadgeInfo(tokenId: number): Promise<BadgeInfo> {
    const contract = getBadgeContract();
    const [challengeId, completedAt, proofHash] = await contract.getBadgeInfo(tokenId);
    return { challengeId, completedAt, proofHash };
}

// Read: Get total badges minted
export async function getTotalMinted(): Promise<bigint> {
    const contract = getBadgeContract();
    return await contract.totalMinted();
}

// ===== PRVLT Token ABI =====
export const PRVLT_TOKEN_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
] as const;

// ===== Staking Contract ABI =====
export const STAKING_CONTRACT_ABI = [
    // Read functions
    'function badgeContract() view returns (address)',
    'function rewardToken() view returns (address)',
    'function baseRewardRate() view returns (uint256)',
    'function difficultyMultiplier(uint8) view returns (uint256)',
    'function stakes(uint256 tokenId) view returns (address owner, uint256 stakedAt, uint256 lastClaimAt, uint8 difficulty)',
    'function userStakes(address user, uint256 index) view returns (uint256)',
    'function pendingRewards(uint256 tokenId) view returns (uint256)',
    'function totalPendingRewards(address user) view returns (uint256)',
    'function getStakedTokens(address user) view returns (uint256[])',

    // Write functions
    'function stake(uint256 tokenId, uint8 difficulty)',
    'function unstake(uint256 tokenId)',
    'function claimRewards(uint256 tokenId)',
    'function claimAllRewards()',

    // Events
    'event Staked(address indexed user, uint256 indexed tokenId, uint8 difficulty)',
    'event Unstaked(address indexed user, uint256 indexed tokenId, uint256 rewards)',
    'event RewardsClaimed(address indexed user, uint256 amount)',
] as const;

