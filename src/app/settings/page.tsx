'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight,
  HelpCircle,
  Sparkles,
  Bell,
  Shield,
  Moon,
  Globe,
  LogOut,
  Trash2,
  ExternalLink,
  Rocket
} from 'lucide-react';
import { PageContainer, Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/components/providers/auth-provider';
import { useOnboarding } from '@/components/onboarding';
import { useSolanaWallet } from '@/hooks/use-solana-wallet';
import { cn } from '@/lib/utils';
import { ICM_LINKS } from '@/lib/icm';

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingItem({ icon, label, description, onClick, rightElement, danger }: SettingItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick && !rightElement}
      className={cn(
        'w-full flex items-center gap-4 p-4 hover:bg-surface-800/50 transition-colors text-left',
        danger && 'text-red-400 hover:bg-red-500/10'
      )}
    >
      <div className={cn(
        'p-2 rounded-xl',
        danger ? 'bg-red-500/20' : 'bg-surface-800'
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium', danger ? 'text-red-400' : 'text-white')}>
          {label}
        </p>
        {description && (
          <p className="text-sm text-surface-400 truncate">{description}</p>
        )}
      </div>
      {rightElement || (onClick && (
        <ChevronRight className="w-5 h-5 text-surface-500" />
      ))}
    </button>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-2 bg-surface-800/50 border-b border-surface-700">
        <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">
          {title}
        </p>
      </div>
      <CardContent className="p-0 divide-y divide-surface-800">
        {children}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { disconnect } = useSolanaWallet();
  const { startOnboarding } = useOnboarding();
  
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleDisconnect = async () => {
    await disconnect();
    router.push('/');
  };

  const handleStartTour = () => {
    // Clear the completed flag so tour shows again
    localStorage.removeItem('provelt_onboarding_completed');
    startOnboarding();
    router.push('/feed');
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all local data? This will reset your preferences.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <PageContainer>
      <Header 
        title="Settings"
        leftAction={
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 pb-20"
      >
        {/* Help & Tutorial */}
        <SettingSection title="Help">
          <SettingItem
            icon={<Sparkles className="w-5 h-5 text-brand-400" />}
            label="Take the Tour"
            description="Learn how to use PROVELT"
            onClick={handleStartTour}
          />
          <SettingItem
            icon={<HelpCircle className="w-5 h-5 text-blue-400" />}
            label="Help Center"
            description="FAQs and support"
            onClick={() => window.open('https://provelt.app/help', '_blank')}
          />
        </SettingSection>

        {/* ICM Integration */}
        <SettingSection title="ICM Ecosystem">
          <SettingItem
            icon={<Rocket className="w-5 h-5 text-brand-500" />}
            label="ICM Integration"
            description="Internet Capital Markets"
            onClick={() => router.push('/icm')}
          />
          <SettingItem
            icon={<ExternalLink className="w-5 h-5 text-purple-400" />}
            label="Believe.app"
            description="Launch your project"
            onClick={() => window.open('https://believe.app', '_blank')}
          />
          <SettingItem
            icon={<ExternalLink className="w-5 h-5 text-green-400" />}
            label="Apply to Incubator"
            description="Get ICM support"
            onClick={() => window.open(ICM_LINKS.apply, '_blank')}
          />
        </SettingSection>

        {/* Preferences */}
        <SettingSection title="Preferences">
          <SettingItem
            icon={<Bell className="w-5 h-5 text-amber-400" />}
            label="Notifications"
            description="Push notifications"
            rightElement={
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            }
          />
          <SettingItem
            icon={<Moon className="w-5 h-5 text-purple-400" />}
            label="Dark Mode"
            description="Always on"
            rightElement={
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
                disabled
              />
            }
          />
          <SettingItem
            icon={<Globe className="w-5 h-5 text-emerald-400" />}
            label="Language"
            description="English"
            onClick={() => {}}
          />
        </SettingSection>

        {/* Security */}
        <SettingSection title="Security">
          <SettingItem
            icon={<Shield className="w-5 h-5 text-green-400" />}
            label="Privacy Policy"
            onClick={() => window.open('https://provelt.app/privacy', '_blank')}
          />
          <SettingItem
            icon={<ExternalLink className="w-5 h-5 text-surface-400" />}
            label="Terms of Service"
            onClick={() => window.open('https://provelt.app/terms', '_blank')}
          />
        </SettingSection>

        {/* Account */}
        <SettingSection title="Account">
          <SettingItem
            icon={<LogOut className="w-5 h-5 text-orange-400" />}
            label="Disconnect Wallet"
            description="Sign out of PROVELT"
            onClick={handleDisconnect}
          />
          <SettingItem
            icon={<Trash2 className="w-5 h-5" />}
            label="Clear Local Data"
            description="Reset preferences and cache"
            onClick={handleClearData}
            danger
          />
        </SettingSection>

        {/* App Info */}
        <div className="text-center pt-4">
          <p className="text-sm text-surface-500">PROVELT v1.0.0</p>
          <p className="text-xs text-surface-600 mt-1">Built on Solana</p>
        </div>
      </motion.div>
    </PageContainer>
  );
}
