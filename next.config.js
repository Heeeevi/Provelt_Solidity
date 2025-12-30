/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Enable gzip/brotli compression
  compress: true,

  // Optimize production builds
  poweredByHeader: false,
  generateEtags: true,

  // Image optimization config for Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'arweave.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
    ],
    // Image optimization settings
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
  },

  // Webpack config for Solana packages and optimizations
  webpack: (config, { dev, isServer }) => {
    // Fallbacks for Solana packages and wallet packages
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      encoding: false,
      'pino-pretty': false,
    };

    // Handle problematic packages for SSR
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'idb-keyval': 'idb-keyval',
        '@react-native-async-storage/async-storage': 'commonjs @react-native-async-storage/async-storage',
      });
    }

    // Alias for packages that have SSR issues
    config.resolve.alias = {
      ...config.resolve.alias,
      'idb-keyval': false,
    };

    // Production optimizations
    if (!dev && !isServer) {
      // Tree shaking for Solana packages
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
      };
    }

    return config;
  },

  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elkgqykpfxbhznpxksdn.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsa2dxeWtwZnhiaHpucHhrc2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNTI5NzIsImV4cCI6MjA4MjYyODk3Mn0._flz8aUNKcsy-Ac5oz73hIOekbjCaDyFB7RGI8zhvtc',
    NEXT_PUBLIC_MANTLE_NETWORK: process.env.NEXT_PUBLIC_MANTLE_NETWORK || 'sepolia',
    NEXT_PUBLIC_MANTLE_RPC_URL: process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
    NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS || '0xc079d4dcfae3250ba38fbf9323676d1f53256ab5',
  },

  // Experimental features
  experimental: {
    // Enable server actions for form submissions
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Optimize package imports
    optimizePackageImports: [
      '@solana/web3.js',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-wallets',
      '@metaplex-foundation/mpl-bubblegum',
      'lucide-react',
    ],
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        // Cache static assets
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
