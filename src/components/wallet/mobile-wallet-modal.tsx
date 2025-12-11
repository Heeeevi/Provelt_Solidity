'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, ExternalLink, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  isMobile,
  isInWalletBrowser,
  openInPhantom,
  openInSolflare,
  getStoreUrl,
  MOBILE_WALLETS,
  isPhantomInstalled,
  isSolflareInstalled,
  type MobileWallet,
} from '@/lib/wallet/mobile-wallet-detect';

interface MobileWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileWalletModal({ isOpen, onClose }: MobileWalletModalProps) {
  const { select, wallets, connect, connecting } = useWallet();
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  // Try to connect directly if wallet is available (in-app browser)
  const handleConnectWallet = useCallback(async (walletName: string) => {
    // Find the wallet adapter
    const walletAdapter = wallets.find(w => 
      w.adapter.name.toLowerCase().includes(walletName.toLowerCase())
    );

    if (walletAdapter) {
      try {
        setConnectingWallet(walletName);
        select(walletAdapter.adapter.name);
        // Connection will happen automatically after select due to autoConnect
        onClose();
      } catch (error) {
        console.error('Failed to connect:', error);
        setConnectingWallet(null);
      }
    }
  }, [wallets, select, onClose]);

  // Open app via deep link (when not in wallet browser)
  const handleOpenInWallet = useCallback((wallet: MobileWallet) => {
    if (wallet.name === 'Phantom') {
      openInPhantom();
    } else if (wallet.name === 'Solflare') {
      openInSolflare();
    } else {
      window.location.href = `${wallet.universalLink}${encodeURIComponent(window.location.href)}`;
    }
  }, []);

  const handleDownload = useCallback((wallet: MobileWallet) => {
    window.open(getStoreUrl(wallet), '_blank');
  }, []);

  // Check which wallets are installed (works in wallet browser)
  const [installedWallets, setInstalledWallets] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (isOpen) {
      setInstalledWallets({
        Phantom: isPhantomInstalled(),
        Solflare: isSolflareInstalled(),
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isInApp = isInWalletBrowser();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-surface-900 rounded-t-3xl sm:rounded-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-surface-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-500/20 rounded-xl">
                <Smartphone className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Connect Wallet</h2>
                <p className="text-xs text-gray-400">
                  {isInApp ? 'Select your wallet' : 'Open in wallet app'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Wallet Options */}
          <div className="p-4 space-y-3">
            {!isInApp && (
              <p className="text-sm text-gray-400 mb-4">
                Open PROVELT in your wallet&apos;s browser to connect:
              </p>
            )}

            {MOBILE_WALLETS.map((wallet) => {
              const isInstalled = installedWallets[wallet.name];
              const isConnecting = connectingWallet === wallet.name;
              
              return (
                <div
                  key={wallet.name}
                  className="flex items-center justify-between p-3 bg-surface-800 rounded-xl hover:bg-surface-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-700 rounded-xl flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {wallet.name === 'Phantom' ? '👻' : wallet.name === 'Solflare' ? '🔥' : wallet.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{wallet.name}</p>
                      <p className="text-xs text-gray-400">
                        {isInstalled ? 'Detected' : 'Solana Wallet'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {isInApp && isInstalled ? (
                      // In wallet browser with wallet detected - connect directly
                      <Button
                        size="sm"
                        onClick={() => handleConnectWallet(wallet.name)}
                        disabled={isConnecting || connecting}
                        className="bg-brand-500 hover:bg-brand-600 text-white"
                      >
                        {isConnecting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Connect'
                        )}
                      </Button>
                    ) : (
                      // Not in wallet browser - open deep link
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleOpenInWallet(wallet)}
                          className="bg-brand-500 hover:bg-brand-600 text-white"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Open
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(wallet)}
                          className="border-surface-600"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer tip */}
          <div className="p-4 bg-surface-800/50 border-t border-surface-700">
            <p className="text-xs text-gray-500 text-center">
              {isInApp 
                ? '✨ You\'re in a wallet browser - tap Connect to continue'
                : '💡 Tip: Install Phantom or Solflare for the best experience'
              }
            </p>
          </div>

          {/* Safe area for bottom notch */}
          <div className="h-6 sm:h-0" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to handle mobile wallet connection
 */
export function useMobileWallet() {
  const { connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isWalletBrowser, setIsWalletBrowser] = useState(false);

  useEffect(() => {
    // Detect on client side
    setIsMobileDevice(isMobile());
    setIsWalletBrowser(isInWalletBrowser());
  }, []);

  const openWalletConnect = useCallback(() => {
    if (isMobileDevice && !isWalletBrowser) {
      // On mobile but not in wallet browser - show our custom modal
      setShowMobileModal(true);
    } else {
      // Desktop or in wallet browser - use default modal
      setVisible(true);
    }
  }, [isMobileDevice, isWalletBrowser, setVisible]);

  const closeMobileModal = useCallback(() => {
    setShowMobileModal(false);
  }, []);

  return {
    connected,
    connecting,
    isMobileDevice,
    isWalletBrowser,
    showMobileModal,
    openWalletConnect,
    closeMobileModal,
  };
}
