# Deploy Staking Contract

The staking contract address was invalid (43 characters instead of 42). You need to deploy a new staking contract.

## Issue Identified

The original staking address `0x98c3Fadf7BB455dA84e11220D9D52dcd500CB43C6` has 43 characters, but valid Ethereum addresses must have exactly 42 characters (0x + 40 hex chars).

## Steps to Deploy

### 1. Create `.env.local` file

Copy `.env.example` to `.env.local`:

```powershell
copy .env.example .env.local
```

Edit `.env.local` and set your treasury private key:
```env
TREASURY_PRIVATE_KEY=0x_your_private_key_here
```

**Important:** The treasury wallet (`0x70D0D4378dAA33cc453666931a74C75e355c478e`) needs MNT tokens for gas fees on Mantle Sepolia.

### 2. Deploy Staking Contract Only

Since PRVLT Token is already deployed, use the staking-only script:

```powershell
cd contracts
npm run deploy:staking-only
```

Or manually:
```powershell
cd contracts
npx hardhat run scripts/deployStakingOnly.js --network mantleSepolia
```

### 3. Update Contract Addresses

After deployment, you'll see output like:
```
✅ ProveltStaking deployed to: 0x...
```

Update the address in `src/lib/mantle/config.ts`:
```typescript
export const STAKING_CONTRACT_ADDRESS = '0x_NEW_ADDRESS_HERE';
```

Or add to `.env.local`:
```env
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=0x_NEW_ADDRESS_HERE
```

### 4. Grant Minter Role (if needed)

If the deploy script couldn't grant minter role automatically, you need to call this function on PRVLT Token contract:

```solidity
grantMinterRole(stakingContractAddress)
```

### Current Addresses (Mantle Sepolia)

| Contract | Address | Status |
|----------|---------|--------|
| Badge NFT | `0xc079d4dcfae3250ba38fbf9323676d1f53256ab5` | ✅ Working |
| PRVLT Token | `0xd707f900be8386c7bb094d21d90cc17202773208` | ✅ Working |
| Staking | N/A | ❌ Needs deployment |

### Notes

- The PRVLT Token was created by wallet `0x70D0D4378dAA33cc453666931a74C75e355c478e`
- Make sure the staking contract has MINTER_ROLE on PRVLT token to mint rewards
- The staking contract needs to be approved by users before it can transfer their NFT badges
