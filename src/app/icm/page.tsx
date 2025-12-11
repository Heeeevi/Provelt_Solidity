'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Rocket, Trophy, Coins, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageContainer, Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ICMTokenCard, ICMLinksCard } from '@/components/icm';
import { ICM_LINKS, ICM_CHALLENGE_CATEGORIES } from '@/lib/icm';

/**
 * ICM Integration Page
 * Internet Capital Markets ecosystem integration for PROVELT
 */
export default function ICMPage() {
  const router = useRouter();

  return (
    <PageContainer>
      <Header
        title="ICM Integration"
        leftAction={
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        }
        rightAction={
          <a href={ICM_LINKS.website} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon">
              <ExternalLink className="w-5 h-5" />
            </Button>
          </a>
        }
      />

      <div className="space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500/20 via-purple-500/10 to-transparent p-6 border border-brand-500/20"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Internet Capital Markets</h1>
                <p className="text-sm text-surface-300">On-chain ICM Incubator</p>
              </div>
            </div>
            <p className="text-sm text-surface-300 leading-relaxed">
              ICM.RUN is the first on-chain ICM incubator helping projects tokenize 
              and launch on Solana. PROVELT integrates with ICM to bring exclusive 
              challenges and badges for the ICM ecosystem.
            </p>
          </div>
        </motion.div>

        {/* Token Card */}
        <ICMTokenCard />

        {/* ICM Challenge Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand-500" />
              ICM Challenges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-surface-400 mb-4">
              Complete ICM-specific challenges to earn exclusive badges and prove your participation in the ICM ecosystem.
            </p>
            {ICM_CHALLENGE_CATEGORIES.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 hover:bg-surface-700/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/challenges?category=${category.id}`)}
              >
                <span className="text-2xl">{category.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-white">{category.name}</p>
                  <p className="text-xs text-surface-400">{category.description}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-brand-500/20 text-brand-400">
                  Coming Soon
                </span>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Links Card */}
        <ICMLinksCard />

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-brand-500" />
              How PROVELT + ICM Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-brand-500">1</span>
                </div>
                <div>
                  <p className="font-medium text-white">Hold $ICM Token</p>
                  <p className="text-sm text-surface-400">
                    Get $ICM tokens to unlock exclusive ICM challenges
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-brand-500">2</span>
                </div>
                <div>
                  <p className="font-medium text-white">Complete Challenges</p>
                  <p className="text-sm text-surface-400">
                    Prove your activity in ICM ecosystem (trading, holding, building)
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-brand-500">3</span>
                </div>
                <div>
                  <p className="font-medium text-white">Earn ICM Badges</p>
                  <p className="text-sm text-surface-400">
                    Get exclusive NFT badges for ICM ecosystem contributions
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-brand-500">4</span>
                </div>
                <div>
                  <p className="font-medium text-white">Access Benefits</p>
                  <p className="text-sm text-surface-400">
                    Badge holders may receive airdrops, whitelist access, and more
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <a href={ICM_LINKS.apply} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button
              size="lg"
              className="w-full"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Apply to ICM Incubator
            </Button>
          </a>
          
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => router.push('/challenges')}
          >
            <Trophy className="w-5 h-5 mr-2" />
            Browse All Challenges
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
