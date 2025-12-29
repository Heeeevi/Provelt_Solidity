import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyMessage } from 'viem';

// Server-side Supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key'
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Check if profile with this wallet already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (existingProfile) {
      // User exists, return their profile
      return NextResponse.json({
        success: true,
        isNewUser: false,
        profile: existingProfile,
      });
    }

    // Profile doesn't exist - check if we have service role key to create one
    const hasServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key';

    if (!hasServiceRole) {
      // Without service role, we can't create auth user
      return NextResponse.json({
        success: true,
        isNewUser: true,
        profile: null,
        needsProfileCreation: true,
        walletAddress,
      });
    }

    // With service role key, create full auth user + profile
    const walletEmail = `${walletAddress.slice(0, 10).toLowerCase()}@wallet.provelt.app`;

    // Create auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: walletEmail,
      email_confirm: true,
      user_metadata: {
        wallet_address: walletAddress.toLowerCase(),
        auth_method: 'wallet',
        network: 'mantle',
      },
    });

    if (createError) {
      console.error('Create user error:', createError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create profile for new user
    const username = `user_${walletAddress.slice(2, 10).toLowerCase()}`;
    const { data: newProfile, error: newProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        wallet_address: walletAddress.toLowerCase(),
        username: username,
        display_name: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      })
      .select()
      .single();

    if (newProfileError) {
      console.error('Create profile error:', newProfileError);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isNewUser: true,
      profile: newProfile,
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
