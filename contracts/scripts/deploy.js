const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying ProveltBadge to", hre.network.name, "...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", hre.ethers.formatEther(balance), "MNT\n");

    // Deploy ProveltBadge
    const ProveltBadge = await hre.ethers.getContractFactory("ProveltBadge");
    const badge = await ProveltBadge.deploy();
    await badge.waitForDeployment();

    const contractAddress = await badge.getAddress();
    console.log("✅ ProveltBadge deployed to:", contractAddress);
    console.log("\n📝 Add this to your .env.local:");
    console.log(`NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS=${contractAddress}`);

    // Wait for block confirmations before verification
    console.log("\n⏳ Waiting for block confirmations...");
    await badge.deploymentTransaction().wait(5);

    // Verify on explorer
    if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
        console.log("\n🔍 Verifying contract on explorer...");
        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: [],
            });
            console.log("✅ Contract verified!");
        } catch (error) {
            console.log("⚠️  Verification failed:", error.message);
            console.log("You can verify manually later with:");
            console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress}`);
        }
    }

    console.log("\n🎉 Deployment complete!");
    console.log("\n📊 Contract Info:");
    console.log("- Name:", await badge.name());
    console.log("- Symbol:", await badge.symbol());
    console.log("- Admin:", deployer.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
