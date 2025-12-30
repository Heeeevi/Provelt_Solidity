import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyMessage } from 'viem';

// Fallback values for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elkgqykpfxbhznpxksdn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsa2dxeWtwZnhiaHpucHhrc2RuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA1Mjk3MiwiZXhwIjoyMDgyNjI4OTcyfQ.QV0auTApVR0Get0Ii5rghPA_Ta6ngDG-EERUm7En60Q';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsa2dxeWtwZnhiaHpucHhrc2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNTI5NzIsImV4cCI6MjA4MjYyODk3Mn0._flz8aUNKcsy-Ac5oz73hIOekbjCaDyFB7RGI8zhvtc';

// Server-side Supabase client
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY !== 'your_supabase_service_role_key'
    ? SUPABASE_SERVICE_KEY
    : SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Wallet Authentication API
 * Verifies EVM wallet signature and creates/retrieves user profile
 * 
 * This uses a simplified auth flow:
 * 1. Verify wallet signature
 * 2. Check/create profile with wallet_address
 * 3. Return profile data (client stores in local state)
 */
const WALLET_PASSWORD = process.env.WALLET_AUTH_PASSWORD || 'Provelt_Wallet_Auth_Secret_Password_2025!';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, signature, message } = body;

    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, signature, message' },
        { status: 400 }
      );
    }

    // Verify the EVM signature
    const isValid = await verifyEvmSignature(walletAddress, signature, message);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const walletEmail = `${walletAddress.slice(0, 10).toLowerCase()}@wallet.provelt.app`;

    // Check if user exists but first try to sign in
    // This handles both existing users (if password matches) and serves as a check
    let { data: { session }, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: walletEmail,
      password: WALLET_PASSWORD,
    });

    // If sign in failed (user doesn't exist or wrong password), try to create user or update password
    if (!session) {
      // Check if profile exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (existingProfile) {
        // User exists but maybe password is wrong (or different method used initially)
        // Retrieve user ID to update password
        // Since we don't have user ID easily from profile (table only has ID which matches auth.users.id), 
        // we can try to find user by email via admin API
        // Note: admin.listUsers is overkill.

        // Simplest hack: Try to update user by email using admin context? Not possible directly.
        // We can just rely on the existing profile ID since `profiles.id` === `auth.users.id`
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingProfile.id,
          { password: WALLET_PASSWORD }
        );

        if (!updateError) {
          // Retry sign in
          const result = await supabaseAdmin.auth.signInWithPassword({
            email: walletEmail,
            password: WALLET_PASSWORD,
          });
          session = result.data.session;
        }
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: walletEmail,
          password: WALLET_PASSWORD,
          email_confirm: true,
          user_metadata: {
            wallet_address: walletAddress.toLowerCase(),
            auth_method: 'wallet',
            network: 'mantle',
          },
        });

        if (createError) {
          console.error('Create user error:', createError);
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        // Create profile
        const username = `user_${walletAddress.slice(2, 10).toLowerCase()}`;
        await supabaseAdmin.from('profiles').insert({
          id: newUser.user.id,
          wallet_address: walletAddress.toLowerCase(),
          username: username,
          display_name: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        });

        // Sign in now
        const result = await supabaseAdmin.auth.signInWithPassword({
          email: walletEmail,
          password: WALLET_PASSWORD,
        });
        session = result.data.session;
      }
    }

    if (!session) {
      return NextResponse.json({ error: 'Failed to establish session' }, { status: 500 });
    }

    // Get updated profile to return
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    return NextResponse.json({
      success: true,
      profile,
      session,
    });

  } catch (error: any) {
    console.error('Wallet auth error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verify EVM wallet signature using viem
 */
async function verifyEvmSignature(
  address: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
