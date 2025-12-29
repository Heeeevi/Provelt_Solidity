import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// Logo URL for Open Graph
const LOGO_URL = 'https://res.cloudinary.com/dtgqtofh6/image/upload/v1765375868/Refine_to_hd_202512102109_ef1imb.jpg';

export const metadata: Metadata = {
  title: 'PROVELT - Turn Your Skills Into Income | Verified Proof Platform',
  description: 'Monetize your skills with verified proof. Complete challenges in coding, trading, design, fitness & more. Build your portfolio, earn badges, and get discovered by clients and employers.',
  keywords: ['Skill monetization', 'Verified portfolio', 'Proof of skills', 'Freelance', 'Personal branding', 'NFT badges', 'Trading proof', 'Coding challenges', 'Web3', 'Mantle', 'EVM'],
  authors: [{ name: 'PROVELT Team' }],
  icons: {
    icon: LOGO_URL,
    apple: LOGO_URL,
  },
  openGraph: {
    title: 'PROVELT - Your Skills Have Value. Prove It. Get Paid.',
    description: 'Monetize any skill with verified proof. Complete challenges, build your portfolio, and unlock opportunities.',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: LOGO_URL,
        width: 512,
        height: 512,
        alt: 'PROVELT Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PROVELT - Turn Your Skills Into Income',
    description: 'Your Skills Have Value. Prove It. Get Paid.',
    images: [LOGO_URL],
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#18181b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ backgroundColor: '#09090b' }}>
      <body
        className={`${inter.variable} font-sans min-h-screen bg-surface-950 text-surface-50 antialiased`}
        style={{ backgroundColor: '#09090b', color: '#fafafa', minHeight: '100vh' }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
