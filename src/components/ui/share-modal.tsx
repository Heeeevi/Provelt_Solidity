'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Copy, 
  Check, 
  Share2,
  MessageCircle,
  Twitter,
  Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  shareContent, 
  getTwitterShareUrl, 
  getTelegramShareUrl,
  getWhatsAppShareUrl,
  canShare 
} from '@/lib/share';
import { cn } from '@/lib/utils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
  url: string;
}

export function ShareModal({ isOpen, onClose, title, text, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    const result = await shareContent({ title, text, url });
    if (result.success && result.method === 'clipboard') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    if (result.success) {
      onClose();
    }
  };

  const shareOptions = [
    {
      name: 'Twitter / X',
      icon: <Twitter className="w-5 h-5" />,
      color: 'bg-black',
      onClick: () => window.open(getTwitterShareUrl(text, url), '_blank'),
    },
    {
      name: 'Telegram',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-[#0088cc]',
      onClick: () => window.open(getTelegramShareUrl(text, url), '_blank'),
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-[#25D366]',
      onClick: () => window.open(getWhatsAppShareUrl(text, url), '_blank'),
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface-900 rounded-t-3xl p-6 max-w-lg mx-auto"
          >
            {/* Handle */}
            <div className="w-12 h-1 bg-surface-700 rounded-full mx-auto mb-6" />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Share</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-800 transition-colors"
              >
                <X className="w-5 h-5 text-surface-400" />
              </button>
            </div>

            {/* Native Share (if available) */}
            {canShare() && (
              <Button
                onClick={handleNativeShare}
                className="w-full mb-4"
                size="lg"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share via...
              </Button>
            )}

            {/* Share Options */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.onClick}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-surface-800 transition-colors"
                >
                  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white', option.color)}>
                    {option.icon}
                  </div>
                  <span className="text-xs text-surface-300">{option.name}</span>
                </button>
              ))}
            </div>

            {/* Copy Link */}
            <div className="flex items-center gap-2 p-3 bg-surface-800 rounded-xl">
              <Link2 className="w-5 h-5 text-surface-400 flex-shrink-0" />
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 bg-transparent text-sm text-surface-300 outline-none truncate"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className={cn(
                  'flex-shrink-0',
                  copied && 'text-green-400'
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* Preview Text */}
            <div className="mt-4 p-3 bg-surface-800/50 rounded-xl">
              <p className="text-xs text-surface-400 mb-1">Preview message:</p>
              <p className="text-sm text-surface-200">{text}</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
