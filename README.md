# 🏆 PROVELT

> **Prove Your Skills, Earn Your Badges** – A Web3 Social Skill-Challenge Platform on Mantle Network

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Mantle](https://img.shields.io/badge/Mantle-Network-00d395)](https://mantle.xyz/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)

---

## 🎯 What is PROVELT?

PROVELT is a gamified social platform where users complete daily skill challenges, submit proof of completion, and earn **ERC-721 NFT badges** on the Mantle Network. Think of it as a TikTok-style feed meets Web3 achievements.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Daily Challenges** | New skill challenges every day across categories |
| 📸 **Proof Submissions** | Upload photos, videos, or text as proof |
| 🏆 **NFT Badges** | Earn ERC-721 NFTs for completed challenges |
| 📜 **On-Chain Verification** | Challenge completions logged on Mantle |
| 📱 **Infinite Feed** | TikTok-style swipeable feed of submissions |
| 👛 **Wallet Integration** | MetaMask, WalletConnect, Coinbase, and more |
| 🔥 **Reactions & Streaks** | Engage with community and build streaks |
| 👤 **Profiles** | Showcase your badges and achievements |

## 🛠️ Tech Stack

```
Frontend          Backend           Blockchain
─────────────     ─────────────     ─────────────
Next.js 14        Supabase          Mantle Network
TypeScript        PostgreSQL        Solidity / ERC-721
TailwindCSS       Realtime          wagmi + viem
React Query       Storage           RainbowKit
Zustand           Edge Functions    ethers.js
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** or **pnpm**
- **Supabase** account ([supabase.com](https://supabase.com))
- **EVM Wallet** with testnet MNT ([faucet](https://faucet.sepolia.mantle.xyz))

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/Heeeevi/Provelt_Solidity.git
cd Provelt_Solidity

# Install frontend dependencies
npm install

# Install contract dependencies
cd contracts && npm install && cd ..
```

### 2. Environment Setup

```bash
# Copy example environment file
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Mantle Network (required)
NEXT_PUBLIC_MANTLE_NETWORK=sepolia
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS=your_deployed_contract

# WalletConnect (required for mobile wallets)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Server (required for minting)
TREASURY_PRIVATE_KEY=0x_your_evm_private_key
```

### 3. Deploy Smart Contract

```bash
cd contracts

# Deploy to Mantle Sepolia Testnet
npx hardhat run scripts/deploy.js --network mantleSepolia

# Copy the deployed address to .env.local
```

### 4. Database Setup

```bash
# Run Supabase migrations (if using Supabase CLI)
npx supabase db push

# Generate TypeScript types
npm run db:generate
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
provelt/
├── contracts/                 # Solidity smart contracts
│   ├── src/
│   │   └── ProveltBadge.sol  # ERC-721 NFT badge contract
│   ├── scripts/
│   │   └── deploy.js         # Deployment script
│   └── hardhat.config.js     # Hardhat configuration
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes (challenges, mint, submissions)
│   │   ├── auth/             # Authentication pages
│   │   ├── challenges/       # Challenge list & detail pages
│   │   ├── feed/             # Infinite scroll feed
│   │   └── profile/          # User profile pages
│   │
│   ├── components/
│   │   ├── challenges/       # Challenge-specific components
│   │   ├── feed/             # Feed & submission cards
│   │   ├── profile/          # Profile components
│   │   ├── providers/        # React context providers
│   │   ├── ui/               # Reusable UI components
│   │   └── wallet/           # Wallet connection components
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── use-feed.ts       # Feed data fetching
│   │   ├── use-mint-badge.ts # NFT minting hook
│   │   └── use-realtime.ts   # Supabase realtime
│   │
│   ├── lib/
│   │   ├── actions/          # Server actions
│   │   ├── mantle/           # Mantle utilities
│   │   │   ├── config.ts     # Network configuration
│   │   │   └── contracts.ts  # Contract ABI & helpers
│   │   └── supabase/         # Supabase clients & types
│   │
│   ├── stores/               # Zustand state stores
│   └── types/                # TypeScript definitions
│
├── supabase/                 # Database migrations & config
├── public/                   # Static assets
├── netlify.toml             # Netlify deployment config
└── .env.example             # Environment template
```

---

## ⚙️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Supabase types |

### Contract Scripts

| Command | Description |
|---------|-------------|
| `npx hardhat compile` | Compile smart contracts |
| `npx hardhat run scripts/deploy.js --network mantleSepolia` | Deploy to testnet |
| `npx hardhat run scripts/deploy.js --network mantle` | Deploy to mainnet |

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL migrations in `supabase/migrations/`
3. Enable Row Level Security (RLS) policies
4. Create storage buckets: `submissions`, `avatars`, `badges`

### Mantle Network Setup

| Network | Chain ID | RPC URL | Explorer |
|---------|----------|---------|----------|
| Mainnet | 5000 | https://rpc.mantle.xyz | https://mantlescan.xyz |
| Sepolia | 5003 | https://rpc.sepolia.mantle.xyz | https://sepolia.mantlescan.xyz |

**Get testnet MNT**: [faucet.sepolia.mantle.xyz](https://faucet.sepolia.mantle.xyz)

---

## 🌐 Deployment

### Netlify (Recommended)

1. **Connect Repository**:
   - Push your code to GitHub
   - Connect repo in Netlify dashboard

2. **Configure Build**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `20`

3. **Set Environment Variables**:
   Add all variables from `.env.example` to Netlify's environment settings.

4. **Deploy!** 🚀

### Vercel Alternative

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## 🔐 Security Considerations

- ⚠️ Never expose `SUPABASE_SERVICE_ROLE_KEY` or `TREASURY_PRIVATE_KEY` to the client
- ✅ Use environment variables for all secrets
- ✅ Enable RLS policies on all Supabase tables
- ✅ Validate wallet signatures server-side
- ✅ Rate limit API endpoints

---

## 🗺️ Roadmap

- [x] Core challenge system
- [x] Proof submissions with media
- [x] ERC-721 NFT minting on Mantle
- [x] User profiles & badges
- [x] Infinite feed with reactions
- [ ] Challenge categories filter
- [ ] Leaderboards
- [ ] Social follows
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ on Mantle Network**

[Website](https://provelt.xyz) · [Twitter](https://twitter.com/provelt) · [Discord](https://discord.gg/provelt)

</div>
