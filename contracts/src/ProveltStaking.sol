// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPRVLTToken {
    function mint(address to, uint256 amount) external;
}

interface IProveltBadge {
    function getBadgeInfo(uint256 tokenId) external view returns (
        uint256 challengeId,
        uint256 completedAt,
        bytes32 proofHash
    );
}

/**
 * @title ProveltStaking
 * @dev Stake ProveltBadge NFTs to earn PRVLT tokens
 * Yield rates based on badge difficulty (stored off-chain, simplified here)
 */
contract ProveltStaking is ERC721Holder, Ownable, ReentrancyGuard {
    IERC721 public badgeContract;
    IPRVLTToken public rewardToken;

    // Reward rate: tokens per second (scaled by 1e18)
    // Default: 1 token per day = 1e18 / 86400 ≈ 11574074074074
    uint256 public baseRewardRate = 11574074074074; // ~1 PRVLT per day

    // Difficulty multipliers (1x, 3x, 5x, 10x)
    mapping(uint8 => uint256) public difficultyMultiplier;

    // Staking info
    struct StakeInfo {
        address owner;
        uint256 stakedAt;
        uint256 lastClaimAt;
        uint8 difficulty; // 1=Easy, 2=Medium, 3=Hard, 4=Expert
    }

    // tokenId => StakeInfo
    mapping(uint256 => StakeInfo) public stakes;
    
    // user => staked token IDs
    mapping(address => uint256[]) public userStakes;

    // Events
    event Staked(address indexed user, uint256 indexed tokenId, uint8 difficulty);
    event Unstaked(address indexed user, uint256 indexed tokenId, uint256 rewards);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor(address _badgeContract, address _rewardToken) Ownable(msg.sender) {
        badgeContract = IERC721(_badgeContract);
        rewardToken = IPRVLTToken(_rewardToken);

        // Set difficulty multipliers
        difficultyMultiplier[1] = 1;  // Easy: 1x
        difficultyMultiplier[2] = 3;  // Medium: 3x
        difficultyMultiplier[3] = 5;  // Hard: 5x
        difficultyMultiplier[4] = 10; // Expert: 10x
    }

    /**
     * @dev Stake a badge NFT
     * @param tokenId The badge token ID to stake
     * @param difficulty Difficulty level (1-4)
     */
    function stake(uint256 tokenId, uint8 difficulty) external nonReentrant {
        require(difficulty >= 1 && difficulty <= 4, "Invalid difficulty");
        require(badgeContract.ownerOf(tokenId) == msg.sender, "Not badge owner");

        // Transfer NFT to contract
        badgeContract.safeTransferFrom(msg.sender, address(this), tokenId);

        // Record stake info
        stakes[tokenId] = StakeInfo({
            owner: msg.sender,
            stakedAt: block.timestamp,
            lastClaimAt: block.timestamp,
            difficulty: difficulty
        });

        userStakes[msg.sender].push(tokenId);

        emit Staked(msg.sender, tokenId, difficulty);
    }

    /**
     * @dev Get pending rewards for a staked token
     */
    function pendingRewards(uint256 tokenId) public view returns (uint256) {
        StakeInfo memory info = stakes[tokenId];
        if (info.owner == address(0)) return 0;

        uint256 timeStaked = block.timestamp - info.lastClaimAt;
        uint256 multiplier = difficultyMultiplier[info.difficulty];
        
        return timeStaked * baseRewardRate * multiplier;
    }

    /**
     * @dev Get total pending rewards for a user
     */
    function totalPendingRewards(address user) external view returns (uint256) {
        uint256 total = 0;
        uint256[] memory staked = userStakes[user];
        
        for (uint256 i = 0; i < staked.length; i++) {
            if (stakes[staked[i]].owner == user) {
                total += pendingRewards(staked[i]);
            }
        }
        return total;
    }

    /**
     * @dev Claim rewards for a specific token
     */
    function claimRewards(uint256 tokenId) external nonReentrant {
        StakeInfo storage info = stakes[tokenId];
        require(info.owner == msg.sender, "Not stake owner");

        uint256 rewards = pendingRewards(tokenId);
        require(rewards > 0, "No rewards to claim");

        info.lastClaimAt = block.timestamp;
        rewardToken.mint(msg.sender, rewards);

        emit RewardsClaimed(msg.sender, rewards);
    }

    /**
     * @dev Claim all rewards for sender
     */
    function claimAllRewards() external nonReentrant {
        uint256[] memory staked = userStakes[msg.sender];
        uint256 totalRewards = 0;

        for (uint256 i = 0; i < staked.length; i++) {
            uint256 tokenId = staked[i];
            if (stakes[tokenId].owner == msg.sender) {
                uint256 rewards = pendingRewards(tokenId);
                if (rewards > 0) {
                    stakes[tokenId].lastClaimAt = block.timestamp;
                    totalRewards += rewards;
                }
            }
        }

        require(totalRewards > 0, "No rewards to claim");
        rewardToken.mint(msg.sender, totalRewards);

        emit RewardsClaimed(msg.sender, totalRewards);
    }

    /**
     * @dev Unstake a badge NFT and claim rewards
     */
    function unstake(uint256 tokenId) external nonReentrant {
        StakeInfo memory info = stakes[tokenId];
        require(info.owner == msg.sender, "Not stake owner");

        // Calculate and mint rewards
        uint256 rewards = pendingRewards(tokenId);
        if (rewards > 0) {
            rewardToken.mint(msg.sender, rewards);
        }

        // Clear stake info
        delete stakes[tokenId];
        _removeFromUserStakes(msg.sender, tokenId);

        // Return NFT
        badgeContract.safeTransferFrom(address(this), msg.sender, tokenId);

        emit Unstaked(msg.sender, tokenId, rewards);
    }

    /**
     * @dev Get all staked token IDs for a user
     */
    function getStakedTokens(address user) external view returns (uint256[] memory) {
        return userStakes[user];
    }

    /**
     * @dev Update base reward rate (owner only)
     */
    function setBaseRewardRate(uint256 newRate) external onlyOwner {
        baseRewardRate = newRate;
    }

    /**
     * @dev Update difficulty multiplier (owner only)
     */
    function setDifficultyMultiplier(uint8 difficulty, uint256 multiplier) external onlyOwner {
        require(difficulty >= 1 && difficulty <= 4, "Invalid difficulty");
        difficultyMultiplier[difficulty] = multiplier;
    }

    // Internal function to remove token from user's stake array
    function _removeFromUserStakes(address user, uint256 tokenId) internal {
        uint256[] storage stakes_ = userStakes[user];
        for (uint256 i = 0; i < stakes_.length; i++) {
            if (stakes_[i] == tokenId) {
                stakes_[i] = stakes_[stakes_.length - 1];
                stakes_.pop();
                break;
            }
        }
    }
}
