'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  Wallet,
  Trophy,
  Upload,
  User,
  Compass,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Onboarding steps configuration
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  targetSelector?: string; // CSS selector for spotlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to PROVELT! 🎉',
    description: 'PROVELT is a Web3 social platform where you complete challenges, prove your achievements, and earn NFT badges. Let us show you around!',
    icon: <Sparkles className="w-8 h-8" />,
  },
  {
    id: 'wallet',
    title: 'Connect Your Wallet',
    description: 'First, connect your Solana wallet (like Phantom or Solflare). This is your identity on PROVELT - no email or password needed!',
    icon: <Wallet className="w-8 h-8" />,
    targetSelector: '[data-onboarding="wallet-button"]',
    position: 'bottom',
  },
  {
    id: 'explore',
    title: 'Explore Challenges',
    description: 'Browse available challenges in the Explore page. Find something interesting - fitness, coding, creativity, and more!',
    icon: <Compass className="w-8 h-8" />,
    targetSelector: '[data-onboarding="nav-explore"]',
    position: 'bottom',
  },
  {
    id: 'challenges',
    title: 'Join a Challenge',
    description: 'Pick a challenge that interests you. Each challenge has requirements and rewards - complete them to earn points and NFT badges!',
    icon: <Trophy className="w-8 h-8" />,
    targetSelector: '[data-onboarding="nav-challenges"]',
    position: 'bottom',
  },
  {
    id: 'submit',
    title: 'Submit Your Proof',
    description: 'Completed a challenge? Submit photo or video proof. Our community will verify your achievement!',
    icon: <Upload className="w-8 h-8" />,
    targetSelector: '[data-onboarding="nav-submit"]',
    position: 'bottom',
  },
  {
    id: 'profile',
    title: 'Build Your Profile',
    description: 'Your profile showcases all your achievements, NFT badges, and stats. The more you prove, the more you earn!',
    icon: <User className="w-8 h-8" />,
    targetSelector: '[data-onboarding="nav-profile"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'That\'s it! Start exploring challenges and prove what you can do. Your achievements live forever on the blockchain!',
    icon: <CheckCircle2 className="w-8 h-8" />,
  },
];

// Context for onboarding state
interface OnboardingContextType {
  isOnboarding: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  hasCompletedOnboarding: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  // Return default values if context is not available (e.g., during SSR/prerender)
  if (!context) {
    return {
      isOnboarding: false,
      currentStep: 0,
      steps: [],
      startOnboarding: () => {},
      nextStep: () => {},
      prevStep: () => {},
      goToStep: () => {},
      skipOnboarding: () => {},
      completeOnboarding: () => {},
      hasCompletedOnboarding: true,
    };
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
  steps?: OnboardingStep[];
}

export function OnboardingProvider({ children, steps = DEFAULT_STEPS }: OnboardingProviderProps) {
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);
  
  const { connected } = useWallet();

  // Check localStorage on mount
  useEffect(() => {
    setMounted(true);
    const completed = localStorage.getItem('provelt_onboarding_completed');
    if (completed) {
      setHasCompletedOnboarding(true);
    } else {
      setHasCompletedOnboarding(false);
    }
  }, []);

  // Trigger onboarding when user first connects wallet
  useEffect(() => {
    if (!mounted) return;
    
    // Detect first-time wallet connection
    if (connected && !wasConnected && !hasCompletedOnboarding) {
      // User just connected wallet for the first time
      setTimeout(() => {
        setIsOnboarding(true);
      }, 800); // Small delay for smooth transition
    }
    
    setWasConnected(connected);
  }, [connected, wasConnected, hasCompletedOnboarding, mounted]);

  const startOnboarding = useCallback(() => {
    setCurrentStep(0);
    setIsOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsOnboarding(false);
    localStorage.setItem('provelt_onboarding_completed', 'true');
    setHasCompletedOnboarding(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, steps.length, completeOnboarding]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  }, [steps.length]);

  const skipOnboarding = useCallback(() => {
    setIsOnboarding(false);
    localStorage.setItem('provelt_onboarding_completed', 'true');
    setHasCompletedOnboarding(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        currentStep,
        steps,
        startOnboarding,
        nextStep,
        prevStep,
        goToStep,
        skipOnboarding,
        completeOnboarding,
        hasCompletedOnboarding,
      }}
    >
      {children}
      <OnboardingOverlay />
    </OnboardingContext.Provider>
  );
}

// Centered modal overlay component
function OnboardingOverlay() {
  const { 
    isOnboarding, 
    currentStep, 
    steps, 
    nextStep, 
    prevStep,
    goToStep,
    skipOnboarding 
  } = useOnboarding();
  
  const step = steps[currentStep];

  if (!isOnboarding) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Dark backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Centered modal container */}
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            className="w-full max-w-sm sm:max-w-md bg-surface-800 border border-surface-700 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header with icon */}
            <div className="p-5 sm:p-6 pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className="p-3 sm:p-4 bg-brand-500/20 rounded-xl sm:rounded-2xl text-brand-400 shrink-0">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 sm:gap-2 pb-4 sm:pb-5">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={cn(
                    'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-200',
                    index === currentStep 
                      ? 'bg-brand-500 scale-125' 
                      : 'bg-surface-600 hover:bg-surface-500'
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 p-4 sm:p-5 bg-surface-900/50 border-t border-surface-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={skipOnboarding}
                className="text-gray-400 hover:text-white w-full sm:w-auto"
              >
                {isLastStep ? 'Close' : 'Skip Tour'}
              </Button>
              
              <div className="flex gap-2 w-full sm:w-auto">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    className="border-surface-600 flex-1 sm:flex-none"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="bg-brand-500 hover:bg-brand-600 text-white flex-1 sm:flex-none"
                >
                  {isLastStep ? (
                    <>
                      Get Started
                      <Sparkles className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Skip hint at bottom - hidden on mobile */}
        <div className="hidden sm:block absolute bottom-6 left-1/2 -translate-x-1/2">
          <p className="text-sm text-gray-500">
            Press <kbd className="px-2 py-0.5 bg-surface-700 rounded text-xs">ESC</kbd> to skip
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to handle ESC key
export function useOnboardingKeyboard() {
  const { isOnboarding, skipOnboarding, nextStep } = useOnboarding();

  useEffect(() => {
    if (!isOnboarding) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipOnboarding();
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        nextStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOnboarding, skipOnboarding, nextStep]);
}

// Button to restart onboarding (for settings/help)
export function RestartOnboardingButton() {
  const { startOnboarding } = useOnboarding();

  return (
    <Button
      variant="outline"
      onClick={startOnboarding}
      className="border-surface-600"
    >
      <Sparkles className="w-4 h-4 mr-2" />
      Take the Tour
    </Button>
  );
}
