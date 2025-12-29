'use client';

/**
 * @deprecated This component is no longer used after migrating to EVM/Mantle.
 * RainbowKit handles mobile wallet connections automatically.
 * Keeping as a stub for backwards compatibility.
 */

import { useState } from 'react';

export function useMobileWallet() {
  const [showMobileModal, setShowMobileModal] = useState(false);

  return {
    isMobileDevice: false,
    isWalletBrowser: false,
    showMobileModal,
    openWalletConnect: () => setShowMobileModal(true),
    closeMobileModal: () => setShowMobileModal(false),
  };
}

interface MobileWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileWalletModal({ isOpen, onClose }: MobileWalletModalProps) {
  // RainbowKit handles mobile wallet connections automatically
  return null;
}
