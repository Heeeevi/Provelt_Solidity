const hre = require("hardhat");

/**
 * Deploy ONLY the Staking Contract
 * Uses existing PRVLT Token and Badge Contract
 */
async function main() {
    console.log("🚀 Deploying PROVELT Staking Contract to", hre.network.name, "...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", hre.ethers.formatEther(balance), "MNT\n");

    // Existing contract addresses
    const BADGE_CONTRACT = process.env.NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS || "0xc079d4dcfae3250ba38fbf9323676d1f53256ab5";
    const PRVLT_TOKEN = process.env.NEXT_PUBLIC_PRVLT_TOKEN_ADDRESS || "0xd707f900be8386c7bb094d21d90cc17202773208";

    console.log("📋 Using existing contracts:");
    console.log("   Badge contract:", BADGE_CONTRACT);
    console.log("   PRVLT Token:", PRVLT_TOKEN);

    // Deploy Staking Contract
    console.log("\n📦 Deploying ProveltStaking...");
    const ProveltStaking = await hre.ethers.getContractFactory("ProveltStaking");
    const staking = await ProveltStaking.deploy(BADGE_CONTRACT, PRVLT_TOKEN);
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    console.log("✅ ProveltStaking deployed to:", stakingAddress);

    // Grant minter role to staking contract on PRVLT Token
    console.log("\n🔑 Granting MINTER_ROLE to staking contract on PRVLT Token...");
    try {
        const PRVLTToken = await hre.ethers.getContractFactory("PRVLTToken");
        const prvltToken = PRVLTToken.attach(PRVLT_TOKEN);
        const tx = await prvltToken.grantMinterRole(stakingAddress);
        await tx.wait();
        console.log("✅ Minter role granted!");
    } catch (error) {
        console.log("⚠️  Could not grant minter role:", error.message);
        console.log("   You may need to manually grant minter role if you're not the PRVLT token admin.");
    }

    // Summary
    console.log("\n🎉 Deployment complete!\n");
    console.log("📝 Add this to your .env.local:");
    console.log(`NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=${stakingAddress}`);

    console.log("\n📝 Update src/lib/mantle/config.ts:");
    console.log(`export const STAKING_CONTRACT_ADDRESS = '${stakingAddress}';`);

    console.log("\n📊 Contract Info:");
    console.log("- Staking Contract:", stakingAddress);
    console.log("- Badge Contract:", BADGE_CONTRACT);
    console.log("- PRVLT Token:", PRVLT_TOKEN);
    console.log("- Admin:", deployer.address);

    // Wait for confirmations before verification
    console.log("\n⏳ Waiting for block confirmations...");
    await staking.deploymentTransaction().wait(3);

    // Verify contract
    if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
        console.log("\n🔍 Verifying contract on explorer...");

        try {
            await hre.run("verify:verify", {
                address: stakingAddress,
                constructorArguments: [BADGE_CONTRACT, PRVLT_TOKEN],
            });
            console.log("✅ Staking contract verified!");
        } catch (error) {
            console.log("⚠️  Staking verification failed:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
