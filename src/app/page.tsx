import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LOGO_URL, APP_NAME, APP_TAGLINE } from '@/lib/constants';
import { CheckCircle, TrendingUp, Users, Zap, Award, Globe } from 'lucide-react';

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
              No complicated setup. No technical knowledge required. Just prove what you can do.
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
          
          {/* Who Is This For Section */}
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
