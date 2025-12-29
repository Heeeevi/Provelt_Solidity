// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ProveltBadge
 * @dev ERC-721 NFT contract for PROVELT skill challenge badges
 * Deployed on Mantle Network for low-cost, high-throughput minting
 * Compatible with OpenZeppelin v5
 */
contract ProveltBadge is ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 private _nextTokenId;

    // Challenge completion tracking
    struct BadgeInfo {
        uint256 challengeId;
        uint256 completedAt;
        bytes32 proofHash;
    }

    // tokenId => BadgeInfo
    mapping(uint256 => BadgeInfo) public badges;
    
    // challengeId => completion count
    mapping(uint256 => uint256) public challengeCompletions;
    
    // user => challengeId => hasMinted (prevent duplicate badges)
    mapping(address => mapping(uint256 => bool)) public userChallengeBadges;

    // Events
    event BadgeMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        uint256 indexed challengeId,
        bytes32 proofHash,
        string uri
    );

    event ChallengeCompleted(
        address indexed user,
        uint256 indexed challengeId,
        bytes32 proofHash,
        uint256 timestamp
    );

    constructor() ERC721("PROVELT Badge", "PRVLT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Mint a badge NFT for completing a challenge
     * @param to Recipient address
     * @param challengeId The ID of the completed challenge
     * @param proofHash Hash of the submission proof (for verification)
     * @param uri Metadata URI for the badge
     */
    function mintBadge(
        address to,
        uint256 challengeId,
        bytes32 proofHash,
        string memory uri
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        require(!userChallengeBadges[to][challengeId], "Badge already minted for this challenge");

        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        // Store badge info
        badges[tokenId] = BadgeInfo({
            challengeId: challengeId,
            completedAt: block.timestamp,
            proofHash: proofHash
        });

        // Update tracking
        userChallengeBadges[to][challengeId] = true;
        challengeCompletions[challengeId]++;

        emit BadgeMinted(to, tokenId, challengeId, proofHash, uri);
        emit ChallengeCompleted(to, challengeId, proofHash, block.timestamp);

        return tokenId;
    }

    /**
     * @dev Get all badge token IDs owned by an address
     */
    function getBadgesOf(address owner) public view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }

    /**
     * @dev Check if user has badge for specific challenge
     */
    function hasChallengeBadge(address user, uint256 challengeId) public view returns (bool) {
        return userChallengeBadges[user][challengeId];
    }

    /**
     * @dev Get badge info for a token
     */
    function getBadgeInfo(uint256 tokenId) public view returns (
        uint256 challengeId,
        uint256 completedAt,
        bytes32 proofHash
    ) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        BadgeInfo memory info = badges[tokenId];
        return (info.challengeId, info.completedAt, info.proofHash);
    }

    /**
     * @dev Get total badges minted
     */
    function totalMinted() public view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Grant minter role to an address
     */
    function grantMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, account);
    }

    /**
     * @dev Revoke minter role from an address
     */
    function revokeMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, account);
    }

    // Required overrides for multiple inheritance (OpenZeppelin v5)
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
