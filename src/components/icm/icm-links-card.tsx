'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Rocket, Users, FileText, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ICM_LINKS, BELIEVE_LINKS, ICM_PARTNERS } from '@/lib/icm';
import { cn } from '@/lib/utils';

interface ICMLinksCardProps {
  className?: string;
}

const quickLinks = [
  {
    label: 'Apply to Incubator',
    href: ICM_LINKS.apply,
    icon: Rocket,
    description: 'Launch your project with ICM support',
    primary: true,
  },
  {
    label: 'Documentation',
    href: ICM_LINKS.docs,
    icon: FileText,
    description: 'Learn about Internet Capital Markets',
  },
  {
    label: 'Community',
    href: ICM_LINKS.telegram,
    icon: MessageCircle,
    description: 'Join the ICM Investor Center',
  },
  {
    label: 'Believe.app',
    href: BELIEVE_LINKS.website,
    icon: Users,
    description: 'Find your first believers',
  },
];

export function ICMLinksCard({ className }: ICMLinksCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-xl">🌐</span>
          ICM Ecosystem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Links */}
        <div className="space-y-2">
          {quickLinks.map((link, index) => (
            <motion.a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-all',
                link.primary 
                  ? 'bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30' 
                  : 'bg-surface-800/50 hover:bg-surface-700/50'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                link.primary ? 'bg-brand-500' : 'bg-surface-700'
              )}>
                <link.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{link.label}</p>
                <p className="text-xs text-surface-400 truncate">{link.description}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-surface-400 flex-shrink-0" />
            </motion.a>
          ))}
        </div>

        {/* Partners */}
        <div className="pt-3 border-t border-surface-700">
          <p className="text-xs text-surface-400 mb-2">Ecosystem Partners</p>
          <div className="flex flex-wrap gap-2">
            {ICM_PARTNERS.map((partner) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 text-xs rounded-full bg-surface-800 text-surface-300 hover:bg-surface-700 hover:text-white transition-colors"
              >
                {partner.name}
              </a>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
