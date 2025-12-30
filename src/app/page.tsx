import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LOGO_URL, APP_NAME, APP_TAGLINE } from '@/lib/constants';
import { CheckCircle, TrendingUp, Users, Zap, Award, Globe, DollarSign, Gift, Flame, Target, Coins, Lock, Unlock } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-dark">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent-500/10 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 mb-6">
              <Zap className="w-4 h-4 text-brand-400" />
              <span className="text-sm text-brand-300">Turn Your Skills Into Income</span>
            </div>

            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-2xl shadow-brand-500/20 ring-2 ring-brand-500/30">
                <Image
                  src={LOGO_URL}
                  alt={`${APP_NAME} Logo`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* App Name */}
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
              <span className="gradient-text">PROVE</span>
              <span className="text-white">LT</span>
            </h1>

            {/* Tagline - More Inclusive */}
            <p className="mt-6 text-xl sm:text-2xl text-surface-300 max-w-3xl mx-auto font-medium">
              Your Skills Have Value. <span className="text-brand-400">Prove It.</span> Get Paid.
            </p>

            {/* Description - Appeal to Non-Web3 Users */}
            <p className="mt-4 text-surface-400 max-w-2xl mx-auto text-lg">
              Whether you&apos;re a coder, designer, trader, artist, or fitness enthusiast —
              complete challenges, build your verified portfolio, and unlock opportunities to
              <span className="text-white font-medium"> monetize your expertise</span>.
            </p>

            {/* Trust Indicators */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-surface-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Free to start
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No crypto knowledge needed
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Instant proof of skills
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/login">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 py-6">
                  Start Proving Your Skills →
                </Button>
              </Link>
              <Link href="/feed">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-6">
                  See What Others Prove
                </Button>
              </Link>
            </div>
          </div>

          {/* Value Proposition Cards */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8 text-brand-400" />}
              title="Monetize Any Skill"
              description="Coding, trading, design, fitness, cooking — turn what you're already good at into verified credentials that attract opportunities."
            />
            <FeatureCard
              icon={<Award className="w-8 h-8 text-accent-400" />}
              title="Build Trusted Proof"
              description="No more 'trust me bro'. Get blockchain-verified badges that prove you actually did the work. Stand out from the crowd."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-green-400" />}
              title="Grow Your Audience"
              description="Share your achievements, connect with like-minded achievers, and get discovered by brands and clients looking for proven talent."
            />
          </div>

          {/* How It Works Section */}
          <div className="mt-32">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
              From Skill to Income in 3 Steps
            </h2>
            <p className="text-center text-surface-400 mb-12 max-w-xl mx-auto">
              No complicated setup. No crypto knowledge required. Just prove what you can do.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StepCard
                step={1}
                title="Pick a Challenge"
                description="Choose from daily challenges in your area of expertise — coding, trading, design, fitness, and more."
              />
              <StepCard
                step={2}
                title="Submit Your Proof"
                description="Upload a screenshot, video, or link showing you completed the challenge. Simple as that."
              />
              <StepCard
                step={3}
                title="Earn & Share"
                description="Get your verified badge, build your portfolio, and share it everywhere — LinkedIn, Twitter, your website."
              />
            </div>
          </div>

          {/* How You Earn Section - NEW */}
          <div className="mt-32">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
              💰 How You Actually Earn
            </h2>
            <p className="text-center text-surface-400 mb-12 max-w-xl mx-auto">
              Multiple ways to monetize your proven skills. No gatekeeping.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EarnCard
                icon={<Gift className="w-6 h-6 text-purple-400" />}
                title="Weekly Prize Pools"
                amount="Up to $500/week"
                description="Top performers in each category win from the weekly prize pool. More badges = higher chance to win."
                tag="Most Popular"
                tagColor="bg-purple-500"
              />
              <EarnCard
                icon={<DollarSign className="w-6 h-6 text-green-400" />}
                title="Sponsored Challenges"
                amount="$50-500 per challenge"
                description="Brands sponsor challenges with real cash prizes. Complete them, win the reward. Simple."
                tag="High Reward"
                tagColor="bg-green-500"
              />
              <EarnCard
                icon={<Users className="w-6 h-6 text-brand-400" />}
                title="Referral Bonuses"
                amount="$5 per referral"
                description="Invite friends and earn $5 for each one who completes their first challenge. No limit."
                tag="Passive Income"
                tagColor="bg-brand-500"
              />
              <EarnCard
                icon={<Target className="w-6 h-6 text-amber-400" />}
                title="Get Hired"
                amount="Freelance & Jobs"
                description="Employers browse verified profiles. Your badges are your resume. Get discovered for paid gigs."
                tag="Career Boost"
                tagColor="bg-amber-500"
              />
            </div>
          </div>

          {/* Streak & Gamification - NEW */}
          <div className="mt-32">
            <div className="card bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20 p-8 sm:p-12 rounded-2xl">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm mb-4">
                    <Flame className="w-4 h-4" />
                    Daily Streaks
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                    🔥 Build Your Streak, Multiply Your Rewards
                  </h2>
                  <p className="text-surface-400 mb-6">
                    Complete at least one challenge every day to build your streak.
                    The longer your streak, the bigger your multiplier on XP and rewards!
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <StreakBadge days={7} multiplier="1.5x" />
                    <StreakBadge days={30} multiplier="2x" />
                    <StreakBadge days={100} multiplier="3x" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-6xl sm:text-8xl font-bold text-orange-500">🔥</div>
                  <p className="text-surface-400 mt-2">Don&apos;t break the chain!</p>
                </div>
              </div>
            </div>
          </div>

          {/* PRVLT Token Staking - NEW YIELD FEATURE */}
          <div className="mt-32">
            <div className="card bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 p-8 sm:p-12 rounded-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm mb-4">
                  <Coins className="w-4 h-4" />
                  Powered by Mantle Network
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  💰 Stake Badges, Earn PRVLT Tokens
                </h2>
                <p className="text-surface-400 max-w-2xl mx-auto">
                  Your badges aren&apos;t just proof — they&apos;re <span className="text-purple-400 font-semibold">yield-bearing assets</span>.
                  Stake your earned badges and earn PRVLT tokens daily. Real crypto rewards for real skills.
                </p>
              </div>

              {/* How Staking Works */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-surface-900/50 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🏆</div>
                  <p className="text-sm text-surface-300">Complete Challenge</p>
                </div>
                <div className="bg-surface-900/50 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🎖️</div>
                  <p className="text-sm text-surface-300">Earn Badge NFT</p>
                </div>
                <div className="bg-surface-900/50 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🔒</div>
                  <p className="text-sm text-surface-300">Stake in Vault</p>
                </div>
                <div className="bg-surface-900/50 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">💎</div>
                  <p className="text-sm text-surface-300">Earn PRVLT Daily</p>
                </div>
              </div>

              {/* Yield Rates */}
              <div className="bg-surface-900/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">📈 Daily Yield Rates</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-green-400 font-bold text-xl">1 PRVLT</p>
                    <p className="text-surface-500 text-sm">Easy Badge</p>
                  </div>
                  <div className="text-center">
                    <p className="text-yellow-400 font-bold text-xl">3 PRVLT</p>
                    <p className="text-surface-500 text-sm">Medium Badge</p>
                  </div>
                  <div className="text-center">
                    <p className="text-orange-400 font-bold text-xl">5 PRVLT</p>
                    <p className="text-surface-500 text-sm">Hard Badge</p>
                  </div>
                  <div className="text-center">
                    <p className="text-red-400 font-bold text-xl">10 PRVLT</p>
                    <p className="text-surface-500 text-sm">Expert Badge</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link href="/staking">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                    <Coins className="w-5 h-5 mr-2" />
                    Start Earning PRVLT →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-32">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
              Perfect For Anyone Who Wants To
            </h2>
            <p className="text-center text-surface-400 mb-12 max-w-xl mx-auto">
              PROVELT helps you turn skills into opportunities, regardless of your background.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <UseCase emoji="💼" text="Get hired faster with verified skills" />
              <UseCase emoji="🎨" text="Build a portfolio that stands out" />
              <UseCase emoji="📈" text="Prove trading or investment wins" />
              <UseCase emoji="💪" text="Track and share fitness progress" />
              <UseCase emoji="💻" text="Showcase coding projects" />
              <UseCase emoji="🎯" text="Stay accountable to goals" />
              <UseCase emoji="🌟" text="Grow personal brand" />
              <UseCase emoji="🤝" text="Connect with other achievers" />
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-32 text-center">
            <div className="card bg-gradient-to-r from-brand-500/10 to-accent-500/10 border-brand-500/20 p-8 sm:p-12 rounded-2xl">
              <Globe className="w-12 h-12 text-brand-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Your Skills Are Worth More Than You Think
              </h2>
              <p className="text-surface-400 mb-6 max-w-xl mx-auto">
                Join thousands of creators, developers, and professionals who are building
                their verified reputation and unlocking new opportunities.
              </p>
              <Link href="/auth/login">
                <Button size="lg" className="text-base px-8 py-6">
                  Start For Free — No Card Required
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card card-hover p-6">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-surface-400">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-brand-500 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
        {step}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-surface-400">{description}</p>
    </div>
  );
}

function UseCase({
  emoji,
  text
}: {
  emoji: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-800/50 border border-surface-700/50">
      <span className="text-2xl">{emoji}</span>
      <span className="text-surface-300 text-sm">{text}</span>
    </div>
  );
}

function EarnCard({
  icon,
  title,
  amount,
  description,
  tag,
  tagColor
}: {
  icon: React.ReactNode;
  title: string;
  amount: string;
  description: string;
  tag: string;
  tagColor: string;
}) {
  return (
    <div className="card card-hover p-6 relative overflow-hidden">
      <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs text-white ${tagColor}`}>
        {tag}
      </div>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-2xl font-bold text-brand-400 mt-1">{amount}</p>
          <p className="text-surface-400 text-sm mt-2">{description}</p>
        </div>
      </div>
    </div>
  );
}

function StreakBadge({
  days,
  multiplier
}: {
  days: number;
  multiplier: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-800/80 border border-surface-700">
      <span className="text-orange-400 font-bold">{days} days</span>
      <span className="text-surface-500">→</span>
      <span className="text-white font-bold">{multiplier} XP</span>
    </div>
  );
}
