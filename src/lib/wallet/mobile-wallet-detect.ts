/**
 * Mobile Wallet Detection & Deep Linking
 * Handles auto-detection and connection for EVM mobile wallet apps
 * 
 * Note: With RainbowKit, most mobile wallet handling is automatic.
 * This file provides utility functions for detection purposes.
 */

export interface MobileWallet {
  name: string;
  icon: string;
  deepLink: string;
  universalLink: string;
  appStoreUrl: string;
  playStoreUrl: string;
  isInstalled?: boolean;
}

// Popular EVM mobile wallets
export const MOBILE_WALLETS: MobileWallet[] = [
  {
    name: 'MetaMask',
    icon: '/wallets/metamask.svg',
    deepLink: 'metamask://',
    universalLink: 'https://metamask.app.link/dapp/',
    appStoreUrl: 'https://apps.apple.com/app/metamask/id1438144202',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=io.metamask',
  },
  {
    name: 'Rainbow',
    icon: '/wallets/rainbow.svg',
    deepLink: 'rainbow://',
    universalLink: 'https://rnbwapp.com/',
    appStoreUrl: 'https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=me.rainbow',
  },
  {
    name: 'Coinbase Wallet',
    icon: '/wallets/coinbase.svg',
    deepLink: 'cbwallet://',
    universalLink: 'https://go.cb-w.com/',
    appStoreUrl: 'https://apps.apple.com/app/coinbase-wallet/id1278383455',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=org.toshi',
  },
  {
    name: 'Trust Wallet',
    icon: '/wallets/trust.svg',
    deepLink: 'trust://',
    universalLink: 'https://link.trustwallet.com/',
    appStoreUrl: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
  },
];

/**
 * Check if running on mobile device
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Check if MetaMask is available
 */
export function isMetaMaskInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).ethereum?.isMetaMask;
}

/**
 * Check if any EVM wallet is available
 */
export function isWalletInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).ethereum;
}

/**
 * Check if running inside a wallet's in-app browser
 */
export function isInWalletBrowser(): boolean {
  if (typeof window === 'undefined') return false;

  const eth = (window as any).ethereum;
  if (!eth) return false;

  // Check for various in-app browser indicators
  return eth.isMetaMask || eth.isCoinbaseWallet || eth.isRainbow || eth.isTrust;
}

/**
 * Get the current URL for deep linking
 */
export function getCurrentUrl(): string {
  if (typeof window === 'undefined') return '';
  return encodeURIComponent(window.location.href);
}

/**
 * Open app in MetaMask's in-app browser
 */
export function openInMetaMask(url?: string): void {
  const targetUrl = url || window.location.href;
  const metamaskUrl = `https://metamask.app.link/dapp/${targetUrl.replace(/^https?:\/\//, '')}`;
  window.location.href = metamaskUrl;
}

/**
 * Get store URL based on platform
 */
export function getStoreUrl(wallet: MobileWallet): string {
  if (isIOS()) return wallet.appStoreUrl;
  if (isAndroid()) return wallet.playStoreUrl;
  return wallet.playStoreUrl; // Default to Play Store
}

/**
 * Try to open wallet app, fallback to store
 */
export function openWalletApp(wallet: MobileWallet, fallbackToStore = true): void {
  const currentUrl = getCurrentUrl();

  // Try universal link first (works better on iOS)
  const universalUrl = `${wallet.universalLink}${currentUrl}`;

  // Create a hidden iframe to try opening the app
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = wallet.deepLink;
  document.body.appendChild(iframe);

  // Set timeout to redirect to universal link or store
  setTimeout(() => {
    document.body.removeChild(iframe);

    if (fallbackToStore) {
      // Try universal link, then store
      window.location.href = universalUrl;
    }
  }, 500);
}

/**
 * Detect which wallets are available
 */
export function detectAvailableWallets(): MobileWallet[] {
  return MOBILE_WALLETS.map(wallet => ({
    ...wallet,
    isInstalled:
      (wallet.name === 'MetaMask' && isMetaMaskInstalled()) ||
      isWalletInstalled()
  }));
}
