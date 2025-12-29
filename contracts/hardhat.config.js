require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env.local" });

// Helper to validate EVM private key (64 hex chars or 66 with 0x prefix)
function getAccounts() {
    const key = process.env.TREASURY_PRIVATE_KEY;
    if (!key) return [];

    // Check if it's a valid EVM hex key (with or without 0x prefix)
    const cleanKey = key.startsWith("0x") ? key : `0x${key}`;
    if (/^0x[a-fA-F0-9]{64}$/.test(cleanKey)) {
        return [cleanKey];
    }

    // Key is not valid EVM format (might be Solana base58)
    return [];
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        mantleSepolia: {
            url: process.env.NEXT_PUBLIC_MANTLE_RPC_URL || "https://rpc.sepolia.mantle.xyz",
            chainId: 5003,
            accounts: getAccounts(),
        },
        mantleMainnet: {
            url: "https://rpc.mantle.xyz",
            chainId: 5000,
            accounts: getAccounts(),
        },
        localhost: {
            url: "http://127.0.0.1:8545",
        },
    },
    etherscan: {
        apiKey: {
            mantleSepolia: process.env.MANTLE_EXPLORER_API_KEY || "no-api-key-needed",
            mantleMainnet: process.env.MANTLE_EXPLORER_API_KEY || "no-api-key-needed",
        },
        customChains: [
            {
                network: "mantleSepolia",
                chainId: 5003,
                urls: {
                    apiURL: "https://api-sepolia.mantlescan.xyz/api",
                    browserURL: "https://sepolia.mantlescan.xyz",
                },
            },
            {
                network: "mantleMainnet",
                chainId: 5000,
                urls: {
                    apiURL: "https://api.mantlescan.xyz/api",
                    browserURL: "https://mantlescan.xyz",
                },
            },
        ],
    },
    paths: {
        sources: "./src",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};
