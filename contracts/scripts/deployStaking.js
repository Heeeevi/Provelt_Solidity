const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying PROVELT Staking System to", hre.network.name, "...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", hre.ethers.formatEther(balance), "MNT\n");

    // Get existing badge contract address
    const BADGE_CONTRACT = process.env.NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS || "0xc079d4dcfae3250ba38fbf9323676d1f53256ab5";
    console.log("Badge contract:", BADGE_CONTRACT);

    // Deploy PRVLT Token
    console.log("\n📦 Deploying PRVLT Token...");
    const PRVLTToken = await hre.ethers.getContractFactory("PRVLTToken");
    const prvltToken = await PRVLTToken.deploy();
    await prvltToken.waitForDeployment();
    const prvltAddress = await prvltToken.getAddress();
    console.log("✅ PRVLT Token deployed to:", prvltAddress);

    // Deploy Staking Contract
    console.log("\n📦 Deploying ProveltStaking...");
    const ProveltStaking = await hre.ethers.getContractFactory("ProveltStaking");
    const staking = await ProveltStaking.deploy(BADGE_CONTRACT, prvltAddress);
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    console.log("✅ ProveltStaking deployed to:", stakingAddress);

    // Grant minter role to staking contract
    console.log("\n🔑 Granting MINTER_ROLE to staking contract...");
    const tx = await prvltToken.grantMinterRole(stakingAddress);
    await tx.wait();
    console.log("✅ Minter role granted!");

    // Summary
    console.log("\n🎉 Deployment complete!\n");
    console.log("📝 Add these to your .env.local:");
    console.log(`NEXT_PUBLIC_PRVLT_TOKEN_ADDRESS=${prvltAddress}`);
    console.log(`NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=${stakingAddress}`);

    console.log("\n📊 Contract Info:");
    console.log("- PRVLT Token:", prvltAddress);
    console.log("- Staking Contract:", stakingAddress);
    console.log("- Badge Contract:", BADGE_CONTRACT);
    console.log("- Admin:", deployer.address);

    // Wait for confirmations before verification
    console.log("\n⏳ Waiting for block confirmations...");
    await prvltToken.deploymentTransaction().wait(3);
    await staking.deploymentTransaction().wait(3);

    // Verify contracts
    if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
        console.log("\n🔍 Verifying contracts on explorer...");

        try {
            await hre.run("verify:verify", {
                address: prvltAddress,
                constructorArguments: [],
            });
            console.log("✅ PRVLT Token verified!");
        } catch (error) {
            console.log("⚠️  PRVLT verification failed:", error.message);
        }

        try {
            await hre.run("verify:verify", {
                address: stakingAddress,
                constructorArguments: [BADGE_CONTRACT, prvltAddress],
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
