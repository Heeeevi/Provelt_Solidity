'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import {
    BADGE_CONTRACT_ADDRESS,
    STAKING_CONTRACT_ADDRESS,
    PRVLT_TOKEN_ADDRESS,
    MANTLE_RPC_URL,
    getExplorerUrl
} from '@/lib/mantle/config';
import {
    PROVELT_BADGE_ABI,
    STAKING_CONTRACT_ABI,
    PRVLT_TOKEN_ABI
} from '@/lib/mantle/contracts';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface Badge {
    tokenId: string;
    difficulty: number;
    isStaked: boolean;
    pendingRewards: string;
}

interface StakeInfo {
    owner: string;
    stakedAt: number;
    lastClaimAt: number;
    difficulty: number;
}

const DIFFICULTY_LABELS = ['', 'Easy', 'Medium', 'Hard', 'Expert'];
const DIFFICULTY_COLORS = ['', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];
const DIFFICULTY_YIELDS = ['', '1', '3', '5', '10'];

export default function StakingPage() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();

    const [ownedBadges, setOwnedBadges] = useState<Badge[]>([]);
    const [stakedBadges, setStakedBadges] = useState<Badge[]>([]);
    const [prvltBalance, setPrvltBalance] = useState('0');
    const [totalPending, setTotalPending] = useState('0');
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Load user data
    const loadUserData = useCallback(async () => {
        if (!address) return;
        setLoading(true);
        setError(null);

        try {
            const provider = new ethers.JsonRpcProvider(MANTLE_RPC_URL);
            const badgeContract = new ethers.Contract(BADGE_CONTRACT_ADDRESS, PROVELT_BADGE_ABI, provider);
            const prvltContract = new ethers.Contract(PRVLT_TOKEN_ADDRESS, PRVLT_TOKEN_ABI, provider);

            // Get PRVLT balance first (this should always work)
            try {
                const balance = await prvltContract.balanceOf(address);
                setPrvltBalance(ethers.formatEther(balance));
            } catch (prvltErr) {
                console.error('Error getting PRVLT balance:', prvltErr);
                setPrvltBalance('0');
            }

            // Get owned badges
            let badgeIds: bigint[] = [];
            try {
                badgeIds = await badgeContract.getBadgesOf(address);
            } catch (badgeErr) {
                console.error('Error getting badges:', badgeErr);
            }

            // Try to get staking data - this may fail if contract not deployed
            let stakedIds: bigint[] = [];
            let stakingAvailable = false;
            
            try {
                // First check if staking contract has code
                const stakingCode = await provider.getCode(STAKING_CONTRACT_ADDRESS);
                if (stakingCode === '0x' || stakingCode === '0x0') {
                    console.warn('Staking contract not deployed at:', STAKING_CONTRACT_ADDRESS);
                    setError('Staking contract not available. Please contact admin to deploy the staking contract.');
                } else {
                    stakingAvailable = true;
                    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_CONTRACT_ABI, provider);
                    
                    // Get staked badges
                    stakedIds = await stakingContract.getStakedTokens(address);

                    // Get total pending rewards
                    const pending = await stakingContract.totalPendingRewards(address);
                    setTotalPending(ethers.formatEther(pending));

                    // Process staked badges
                    const staked: Badge[] = [];
                    for (const id of stakedIds) {
                        const tokenId = id.toString();
                        const stakeInfo: StakeInfo = await stakingContract.stakes(id);
                        const rewards = await stakingContract.pendingRewards(id);
                        staked.push({
                            tokenId,
                            difficulty: stakeInfo.difficulty,
                            isStaked: true,
                            pendingRewards: ethers.formatEther(rewards)
                        });
                    }
                    setStakedBadges(staked);
                }
            } catch (stakingErr) {
                console.error('Error with staking contract:', stakingErr);
                setError('Staking contract not available. Please contact admin to deploy the staking contract.');
            }

            // Process owned badges (not staked)
            const owned: Badge[] = [];
            for (const id of badgeIds) {
                const tokenId = id.toString();
                // Check if staked
                if (!stakedIds.map(s => s.toString()).includes(tokenId)) {
                    owned.push({
                        tokenId,
                        difficulty: 2, // Default medium, can be selected when staking
                        isStaked: false,
                        pendingRewards: '0'
                    });
                }
            }
            setOwnedBadges(owned);

        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load staking data. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => {
        if (isConnected && address) {
            loadUserData();
        }
    }, [isConnected, address, loadUserData]);

    // Stake a badge
    const handleStake = async (tokenId: string, difficulty: number) => {
        if (!walletClient || !address) return;
        setActionLoading(tokenId);
        setError(null);

        try {
            const provider = new ethers.BrowserProvider(walletClient);
            
            // Check if staking contract is deployed
            const stakingCode = await provider.getCode(STAKING_CONTRACT_ADDRESS);
            if (stakingCode === '0x' || stakingCode === '0x0') {
                setError('Staking contract not deployed. Please contact admin.');
                return;
            }
            
            const signer = await provider.getSigner();

            // First approve NFT transfer
            const badgeContract = new ethers.Contract(BADGE_CONTRACT_ADDRESS, [
                ...PROVELT_BADGE_ABI,
                'function approve(address to, uint256 tokenId)',
                'function getApproved(uint256 tokenId) view returns (address)',
            ], signer);

            // Check if already approved
            const approved = await badgeContract.getApproved(tokenId);
            if (approved.toLowerCase() !== STAKING_CONTRACT_ADDRESS.toLowerCase()) {
                setSuccess('Approving NFT transfer...');
                const approveTx = await badgeContract.approve(STAKING_CONTRACT_ADDRESS, tokenId);
                await approveTx.wait();
            }

            // Stake
            setSuccess('Staking badge...');
            const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_CONTRACT_ABI, signer);
            const tx = await stakingContract.stake(tokenId, difficulty);
            await tx.wait();

            setSuccess('Badge staked successfully! 🎉');
            loadUserData();
        } catch (err: any) {
            console.error('Stake error:', err);
            setError(err.message || 'Failed to stake badge');
        } finally {
            setActionLoading(null);
        }
    };

    // Unstake a badge
    const handleUnstake = async (tokenId: string) => {
        if (!walletClient || !address) return;
        setActionLoading(tokenId);
        setError(null);

        try {
            const provider = new ethers.BrowserProvider(walletClient);
            const signer = await provider.getSigner();
            const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_CONTRACT_ABI, signer);

            setSuccess('Unstaking badge...');
            const tx = await stakingContract.unstake(tokenId);
            await tx.wait();

            setSuccess('Badge unstaked and rewards claimed! 🎉');
            loadUserData();
        } catch (err: any) {
            console.error('Unstake error:', err);
            setError(err.message || 'Failed to unstake badge');
        } finally {
            setActionLoading(null);
        }
    };

    // Claim all rewards
    const handleClaimAll = async () => {
        if (!walletClient || !address) return;
        setActionLoading('claim');
        setError(null);

        try {
            const provider = new ethers.BrowserProvider(walletClient);
            const signer = await provider.getSigner();
            const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_CONTRACT_ABI, signer);

            setSuccess('Claiming rewards...');
            const tx = await stakingContract.claimAllRewards();
            await tx.wait();

            setSuccess('Rewards claimed! 🎉');
            loadUserData();
        } catch (err: any) {
            console.error('Claim error:', err);
            setError(err.message || 'Failed to claim rewards');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 text-white">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-4">
                        🔥 Badge Staking
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Stake your PROVELT badges to earn PRVLT tokens
                    </p>
                </div>

                {/* Connect Wallet */}
                {!isConnected && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <p className="text-gray-400 mb-6">Connect your wallet to stake badges</p>
                        <ConnectButton />
                    </div>
                )}

                {isConnected && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            {/* PRVLT Balance */}
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">💰</span>
                                    <span className="text-gray-400">PRVLT Balance</span>
                                </div>
                                <p className="text-3xl font-bold text-purple-400">
                                    {parseFloat(prvltBalance).toFixed(2)} PRVLT
                                </p>
                            </div>

                            {/* Pending Rewards */}
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">🌟</span>
                                    <span className="text-gray-400">Pending Rewards</span>
                                </div>
                                <p className="text-3xl font-bold text-green-400">
                                    {parseFloat(totalPending).toFixed(6)} PRVLT
                                </p>
                                {parseFloat(totalPending) > 0 && (
                                    <button
                                        onClick={handleClaimAll}
                                        disabled={actionLoading === 'claim'}
                                        className="mt-3 w-full py-2 bg-green-500 hover:bg-green-600 rounded-lg transition disabled:opacity-50"
                                    >
                                        {actionLoading === 'claim' ? 'Claiming...' : 'Claim All'}
                                    </button>
                                )}
                            </div>

                            {/* Staked Count */}
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-pink-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">🏆</span>
                                    <span className="text-gray-400">Badges Staked</span>
                                </div>
                                <p className="text-3xl font-bold text-pink-400">
                                    {stakedBadges.length}
                                </p>
                            </div>
                        </div>

                        {/* Yield Rates Info */}
                        <div className="bg-gray-800/30 rounded-xl p-6 mb-8">
                            <h3 className="text-lg font-semibold mb-4">📈 Yield Rates (PRVLT per day)</h3>
                            <div className="flex flex-wrap gap-4">
                                {[1, 2, 3, 4].map(d => (
                                    <div key={d} className={`px-4 py-2 rounded-lg bg-gray-800 ${DIFFICULTY_COLORS[d]}`}>
                                        {DIFFICULTY_LABELS[d]}: {DIFFICULTY_YIELDS[d]} PRVLT/day
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
                                <p className="text-red-400">{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6">
                                <p className="text-green-400">{success}</p>
                            </div>
                        )}

                        {loading && (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                                <p className="mt-4 text-gray-400">Loading your badges...</p>
                            </div>
                        )}

                        {!loading && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Owned Badges (Available to Stake) */}
                                <div>
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <span>🎖️</span> Your Badges
                                        <span className="text-sm font-normal text-gray-400">({ownedBadges.length})</span>
                                    </h2>

                                    {ownedBadges.length === 0 ? (
                                        <div className="bg-gray-800/30 rounded-xl p-8 text-center">
                                            <p className="text-gray-400">No badges available to stake</p>
                                            <p className="text-sm text-gray-500 mt-2">Complete challenges to earn badges!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {ownedBadges.map(badge => (
                                                <BadgeCard
                                                    key={badge.tokenId}
                                                    badge={badge}
                                                    onStake={handleStake}
                                                    loading={actionLoading === badge.tokenId}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Staked Badges */}
                                <div>
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <span>🔒</span> Staked Badges
                                        <span className="text-sm font-normal text-gray-400">({stakedBadges.length})</span>
                                    </h2>

                                    {stakedBadges.length === 0 ? (
                                        <div className="bg-gray-800/30 rounded-xl p-8 text-center">
                                            <p className="text-gray-400">No badges staked yet</p>
                                            <p className="text-sm text-gray-500 mt-2">Stake badges to earn PRVLT rewards!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {stakedBadges.map(badge => (
                                                <StakedBadgeCard
                                                    key={badge.tokenId}
                                                    badge={badge}
                                                    onUnstake={handleUnstake}
                                                    loading={actionLoading === badge.tokenId}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Contract Links */}
                        <div className="mt-12 pt-8 border-t border-gray-700">
                            <h3 className="text-lg font-semibold mb-4">📜 Contracts</h3>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <a
                                    href={getExplorerUrl(BADGE_CONTRACT_ADDRESS, 'address')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:underline"
                                >
                                    Badge NFT ↗
                                </a>
                                <a
                                    href={getExplorerUrl(STAKING_CONTRACT_ADDRESS, 'address')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:underline"
                                >
                                    Staking Contract ↗
                                </a>
                                <a
                                    href={getExplorerUrl(PRVLT_TOKEN_ADDRESS, 'address')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:underline"
                                >
                                    PRVLT Token ↗
                                </a>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Badge Card Component (for unstaked badges)
function BadgeCard({
    badge,
    onStake,
    loading
}: {
    badge: Badge;
    onStake: (tokenId: string, difficulty: number) => void;
    loading: boolean;
}) {
    const [selectedDifficulty, setSelectedDifficulty] = useState(2);

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="font-semibold">Badge #{badge.tokenId}</p>
                    <p className="text-sm text-gray-400">Ready to stake</p>
                </div>
                <span className="text-3xl">🏅</span>
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Select difficulty for yield rate:</p>
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(d => (
                        <button
                            key={d}
                            onClick={() => setSelectedDifficulty(d)}
                            className={`px-3 py-1 rounded text-sm transition ${selectedDifficulty === d
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {DIFFICULTY_LABELS[d]}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Yield: {DIFFICULTY_YIELDS[selectedDifficulty]} PRVLT/day
                </p>
            </div>

            <button
                onClick={() => onStake(badge.tokenId, selectedDifficulty)}
                disabled={loading}
                className="w-full py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition disabled:opacity-50"
            >
                {loading ? 'Staking...' : 'Stake Badge'}
            </button>
        </div>
    );
}

// Staked Badge Card Component
function StakedBadgeCard({
    badge,
    onUnstake,
    loading
}: {
    badge: Badge;
    onUnstake: (tokenId: string) => void;
    loading: boolean;
}) {
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-green-500/30">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="font-semibold">Badge #{badge.tokenId}</p>
                    <p className={`text-sm ${DIFFICULTY_COLORS[badge.difficulty]}`}>
                        {DIFFICULTY_LABELS[badge.difficulty]} • {DIFFICULTY_YIELDS[badge.difficulty]} PRVLT/day
                    </p>
                </div>
                <span className="text-3xl">🔒</span>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-400">Pending Rewards</p>
                <p className="text-xl font-bold text-green-400">
                    {parseFloat(badge.pendingRewards).toFixed(6)} PRVLT
                </p>
            </div>

            <button
                onClick={() => onUnstake(badge.tokenId)}
                disabled={loading}
                className="w-full py-2 bg-red-500/80 hover:bg-red-600 rounded-lg transition disabled:opacity-50"
            >
                {loading ? 'Unstaking...' : 'Unstake & Claim'}
            </button>
        </div>
    );
}
