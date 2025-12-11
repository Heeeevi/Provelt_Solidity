'use client';

import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  ChevronDown, 
  Copy, 
  ExternalLink, 
  LogOut,
  Check,
  Loader2,
  Download,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSolanaWallet } from '@/hooks/use-solana-wallet';
import { MobileWalletModal, useMobileWallet } from './mobile-wallet-modal';

interface WalletButtonProps {
  className?: string;
  showBalance?: boolean;
}

// Check if specific wallet is installed
const isPhantomInstalled = () => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).phantom?.solana?.isPhantom;
};

const isSolflareInstalled = () => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).solflare?.isSolflare;
};

// Check if any Solana wallet is installed
const hasWalletExtension = () => {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).phantom?.solana ||
    (window as any).solflare ||
    (window as any).solana ||
    (window as any).backpack
  );
};

// Wallet download links
const WALLET_LINKS = {
  phantom: {
    name: 'Phantom',
    chrome: 'https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa',
    android: 'https://play.google.com/store/apps/details?id=app.phantom',
    ios: 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977',
  },
  solflare: {
    name: 'Solflare',
    chrome: 'https://chrome.google.com/webstore/detail/solflare-wallet/bhhhlbepdkbapadjdnnojkbgioiodbic',
    android: 'https://play.google.com/store/apps/details?id=com.solflare.mobile',
    ios: 'https://apps.apple.com/app/solflare/id1580902717',
  },
};

export function WalletButton({ className, showBalance = false }: WalletButtonProps) {
  const { setVisible } = useWalletModal();
  const { connected, connecting, publicKey, select, wallets } = useWallet();
  const { truncatedAddress, explorerUrl, disconnect, getBalance } = useSolanaWallet();
  const { 
    isMobileDevice, 
    isWalletBrowser, 
    showMobileModal, 
    openWalletConnect, 
    closeMobileModal 
  } = useMobileWallet();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [hasWallet, setHasWallet] = useState(true);
  const [detectedWallets, setDetectedWallets] = useState<{phantom: boolean; solflare: boolean}>({ phantom: false, solflare: false });

  // Check for wallet on mount
  useEffect(() => {
    setHasWallet(hasWalletExtension());
    setDetectedWallets({
      phantom: isPhantomInstalled(),
      solflare: isSolflareInstalled(),
    });
  }, []);

  // Direct connect to a specific wallet
  const connectToWallet = useCallback((walletName: string) => {
    const wallet = wallets.find(w => 
      w.adapter.name.toLowerCase() === walletName.toLowerCase()
    );
    if (wallet) {
      select(wallet.adapter.name);
      setShowInstallModal(false);
    }
  }, [wallets, select]);

  const handleConnect = useCallback(() => {
    // On mobile - use mobile wallet modal
    if (isMobileDevice && !isWalletBrowser) {
      openWalletConnect();
      return;
    }
    
    // On desktop - if no wallet installed, show install options
    if (!hasWallet) {
      setShowInstallModal(true);
      return;
    }
    
    // Default - show wallet adapter modal (which lists all detected wallets)
    setVisible(true);
  }, [openWalletConnect, isMobileDevice, isWalletBrowser, hasWallet, setVisible]);

  const handleCopyAddress = useCallback(async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [publicKey]);

  const handleFetchBalance = useCallback(async () => {
    if (!loadingBalance) {
      setLoadingBalance(true);
      const bal = await getBalance();
      setBalance(bal);
      setLoadingBalance(false);
    }
  }, [getBalance, loadingBalance]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setIsDropdownOpen(false);
    setBalance(null);
  }, [disconnect]);

  // Install Modal Component (for desktop - shows detected wallets or install links)
  const InstallWalletModal = () => (
    <AnimatePresence>
      {showInstallModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowInstallModal(false)}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-surface-800 border border-surface-700 rounded-2xl p-6 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-brand-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {hasWallet ? 'Select Wallet' : 'Install Wallet Extension'}
                </h3>
                <p className="text-surface-400 text-sm">
                  {hasWallet 
                    ? 'Choose a wallet to connect with PROVELT'
                    : 'Install a Solana wallet browser extension to connect.'
                  }
                </p>
              </div>

              <div className="space-y-3">
                {/* Phantom Wallet */}
                {detectedWallets.phantom ? (
                  <button
                    onClick={() => connectToWallet('Phantom')}
                    className="w-full flex items-center gap-4 p-4 bg-surface-700/50 hover:bg-surface-700 rounded-xl transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#AB9FF2] rounded-xl flex items-center justify-center">
                      <span className="text-2xl">👻</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white">Phantom</p>
                      <p className="text-sm text-emerald-400">✓ Detected</p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-surface-400 -rotate-90" />
                  </button>
                ) : (
                  <a
                    href={WALLET_LINKS.phantom.chrome}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-surface-700/50 hover:bg-surface-700 rounded-xl transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#AB9FF2] rounded-xl flex items-center justify-center">
                      <span className="text-2xl">👻</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">Phantom</p>
                      <p className="text-sm text-surface-400">Most popular Solana wallet</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-surface-400" />
                  </a>
                )}

                {/* Solflare Wallet */}
                {detectedWallets.solflare ? (
                  <button
                    onClick={() => connectToWallet('Solflare')}
                    className="w-full flex items-center gap-4 p-4 bg-surface-700/50 hover:bg-surface-700 rounded-xl transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#FC822B] rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🔥</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white">Solflare</p>
                      <p className="text-sm text-emerald-400">✓ Detected</p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-surface-400 -rotate-90" />
                  </button>
                ) : (
                  <a
                    href={WALLET_LINKS.solflare.chrome}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-surface-700/50 hover:bg-surface-700 rounded-xl transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#FC822B] rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🔥</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">Solflare</p>
                      <p className="text-sm text-surface-400">Feature-rich wallet</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-surface-400" />
                  </a>
                )}
              </div>

              <Button
                variant="ghost"
                className="w-full mt-4 text-surface-400"
                onClick={() => setShowInstallModal(false)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Not connected - show connect button
  if (!connected) {
    return (
      <>
        <Button
          onClick={handleConnect}
          disabled={connecting}
          data-onboarding="wallet-button"
          className={cn(
            'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700',
            'text-white font-medium',
            className
          )}
        >
          {connecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              {hasWallet || isMobileDevice ? 'Connect Wallet' : 'Get Wallet'}
            </>
          )}
        </Button>
        
        {/* Mobile wallet modal for mobile devices */}
        <MobileWalletModal isOpen={showMobileModal} onClose={closeMobileModal} />
        
        {/* Desktop install modal when no extension */}
        <InstallWalletModal />
      </>
    );
  }

  // Connected - show wallet dropdown
  return (
    <div className="relative">
      <Button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        variant="outline"
        className={cn(
          'border-surface-700 bg-surface-800/50 hover:bg-surface-800',
          'text-white font-medium',
          className
        )}
      >
        <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
        {truncatedAddress}
        <ChevronDown className={cn(
          'w-4 h-4 ml-2 transition-transform',
          isDropdownOpen && 'rotate-180'
        )} />
      </Button>

      <AnimatePresence>
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute right-0 top-full mt-2 z-50',
                'w-64 rounded-xl overflow-hidden',
                'bg-surface-800 border border-surface-700',
                'shadow-xl shadow-black/20'
              )}
            >
              {/* Wallet Info */}
              <div className="p-4 border-b border-surface-700">
                <p className="text-sm text-surface-400 mb-1">Connected Wallet</p>
                <p className="font-mono text-sm text-white break-all">
                  {publicKey?.toBase58()}
                </p>
                
                {showBalance && (
                  <div className="mt-3">
                    <p className="text-sm text-surface-400 mb-1">Balance</p>
                    {balance !== null ? (
                      <p className="text-lg font-semibold text-white">
                        {balance.toFixed(4)} SOL
                      </p>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleFetchBalance}
                        disabled={loadingBalance}
                        className="text-brand-400 hover:text-brand-300 p-0 h-auto"
                      >
                        {loadingBalance ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'View Balance'
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-2">
                <button
                  onClick={handleCopyAddress}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                    'text-surface-300 hover:text-white hover:bg-surface-700/50',
                    'transition-colors text-sm'
                  )}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>

                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                      'text-surface-300 hover:text-white hover:bg-surface-700/50',
                      'transition-colors text-sm'
                    )}
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Explorer
                  </a>
                )}

                <button
                  onClick={handleDisconnect}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                    'text-red-400 hover:text-red-300 hover:bg-red-500/10',
                    'transition-colors text-sm'
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
