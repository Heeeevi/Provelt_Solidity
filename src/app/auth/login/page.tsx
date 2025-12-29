'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Wallet,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Trophy,
  Users,
  Gift,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { LOGO_URL, APP_NAME } from '@/lib/constants';

/**
 * Login Page
 * Email + Password login with optional wallet connection for Web3 features
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const { address, isConnected: connected } = useAccount();
  const { openConnectModal } = useConnectModal();

  // Handle email + password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again or create a new account.');
        }
        throw error;
      }

      if (data.user) {
        router.push('/feed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email + password signup
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate password
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('already registered')) {
          throw new Error('Email already registered. Please sign in instead.');
        }
        throw error;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        setSuccess('Account created! Check your email to confirm, or try signing in.');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      } else if (data.session) {
        // Auto-logged in (email confirmation disabled)
        router.push('/feed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle wallet login
  const handleWalletLogin = async () => {
    setError(null);

    if (!connected) {
      try {
        openConnectModal?.();
        setShowWalletModal(false);
      } catch (err) {
        setError('Failed to open wallet. Make sure you have a crypto wallet installed.');
      }
      return;
    }

    if (address) {
      router.push('/feed');
    }
  };

  return (
    <main className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-500/10 via-transparent to-transparent" />

      {/* Wallet Login Modal */}
      <AnimatePresence>
        {showWalletModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowWalletModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-50"
            >
              <Card className="border-brand-500/30 shadow-2xl shadow-brand-500/20">
                <CardHeader className="relative text-center pb-2">
                  <button
                    onClick={() => setShowWalletModal(false)}
                    className="absolute right-4 top-4 text-surface-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>

                  <CardTitle className="text-xl">Connect Wallet</CardTitle>
                  <CardDescription>
                    Connect your wallet for Web3 features
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Benefits */}
                  <div className="space-y-2 p-3 rounded-lg bg-surface-800/50">
                    <div className="flex items-center gap-2 text-sm text-surface-300">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Mint NFT badges on Mantle</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-surface-300">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Permanent blockchain proof</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-surface-300">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Trade & showcase your badges</span>
                    </div>
                  </div>

                  {/* Connect Button */}
                  <Button
                    className="w-full h-12"
                    onClick={handleWalletLogin}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    {connected ? `Connected: ${address?.slice(0, 8)}...` : 'Connect Wallet'}
                  </Button>

                  {/* Skip */}
                  <button
                    onClick={() => setShowWalletModal(false)}
                    className="w-full text-center text-sm text-surface-500 hover:text-surface-300 transition-colors"
                  >
                    Skip for now — I'll use email
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-surface-400 hover:text-white mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg shadow-brand-500/20 ring-1 ring-brand-500/30">
                <Image
                  src={LOGO_URL}
                  alt={`${APP_NAME} Logo`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="text-2xl font-bold mb-2">
              <span className="gradient-text">PROVE</span>
              <span className="text-white">LT</span>
            </div>
            <CardTitle className="text-xl">
              {isSignUp ? 'Create Account' : 'Welcome Back!'}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Sign up free and start proving your skills'
                : 'Sign in to continue your journey'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Benefits - Why sign up (only show on signup) */}
            {isSignUp && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-surface-400">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>100% Free</span>
                </div>
                <div className="flex items-center gap-2 text-surface-400">
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Earn XP & badges</span>
                </div>
                <div className="flex items-center gap-2 text-surface-400">
                  <Users className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Join 10K+ users</span>
                </div>
                <div className="flex items-center gap-2 text-surface-400">
                  <Gift className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Win real rewards</span>
                </div>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <AlertDescription className="text-green-400">{success}</AlertDescription>
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login/Signup Form */}
            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 pl-11"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Confirm Password (signup only) */}
              {isSignUp && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 pl-11"
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isLoading || !email || !password || (isSignUp && !confirmPassword)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Account
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>

            {/* Toggle Login/Signup */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-sm text-surface-400 hover:text-white transition-colors"
              >
                {isSignUp ? (
                  <>Already have an account? <span className="text-brand-500">Sign in</span></>
                ) : (
                  <>Don't have an account? <span className="text-brand-500">Sign up free</span></>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-surface-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface-900 px-2 text-surface-500">or</span>
              </div>
            </div>

            {/* Wallet Option - Now a Card */}
            <div
              onClick={() => setShowWalletModal(true)}
              className="p-4 rounded-xl border border-surface-700 bg-gradient-to-r from-surface-800/50 to-surface-800/30 hover:border-brand-500/50 hover:from-brand-500/10 hover:to-purple-500/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white group-hover:text-brand-400 transition-colors">
                    Connect with Wallet
                  </p>
                  <p className="text-xs text-surface-500">
                    Use MetaMask, WalletConnect, or other EVM wallets
                  </p>
                </div>
                <Sparkles className="w-5 h-5 text-surface-600 group-hover:text-brand-400 transition-colors" />
              </div>
            </div>

            {/* Terms */}
            <p className="text-xs text-surface-500 text-center">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-brand-500 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-brand-500 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
