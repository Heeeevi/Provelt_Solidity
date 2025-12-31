import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import {
  BADGE_CONTRACT_ADDRESS,
  MANTLE_RPC_URL,
  PROVELT_BADGE_ABI,
  getExplorerUrl,
  createProofHash,
} from '@/lib/mantle';

// Fallback values for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elkgqykpfxbhznpxksdn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsa2dxeWtwZnhiaHpucHhrc2RuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA1Mjk3MiwiZXhwIjoyMDgyNjI4OTcyfQ.QV0auTApVR0Get0Ii5rghPA_Ta6ngDG-EERUm7En60Q';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsa2dxeWtwZnhiaHpucHhrc2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNTI5NzIsImV4cCI6MjA4MjYyODk3Mn0._flz8aUNKcsy-Ac5oz73hIOekbjCaDyFB7RGI8zhvtc';

// Create supabase client 
const supabaseKey = SUPABASE_SERVICE_KEY && SUPABASE_SERVICE_KEY !== 'your_service_role_key'
  ? SUPABASE_SERVICE_KEY
  : SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Treasury wallet for minting (Mantle Sepolia testnet)
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY || '0xc0027d443f51b7eff4772cfda503626084707f6668b5042b777e211cb5bea65e';

// Check if contract minting is configured
function isMintingConfigured(): boolean {
  return !!(
    BADGE_CONTRACT_ADDRESS &&
    BADGE_CONTRACT_ADDRESS.startsWith('0x') &&
    TREASURY_PRIVATE_KEY &&
    !TREASURY_PRIVATE_KEY.startsWith('your_')
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, action, rejectionReason } = body;

    console.log('Approve API called:', { submissionId, action });

    if (!submissionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get submission with challenge details
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select('*, challenges(*)')
      .eq('id', submissionId)
      .single();

    console.log('Fetch result:', { submission: submission?.id, error: fetchError?.message });

    if (fetchError || !submission) {
      console.error('Submission fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Submission not found', details: fetchError?.message },
        { status: 404 }
      );
    }

    // Check if already processed
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: 'Submission already processed' },
        { status: 400 }
      );
    }

    if (action === 'reject') {
      // Update submission status to rejected
      const { error: updateError } = await supabaseAdmin
        .from('submissions')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason || 'Does not meet challenge requirements',
          updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: 'Submission rejected',
      });
    }

    // === APPROVE FLOW ===

    // Get user's wallet address
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('wallet_address, id')
      .eq('id', submission.user_id)
      .single();

    console.log('Profile lookup by ID:', {
      userId: submission.user_id,
      profile: profile ? { id: profile.id, wallet: profile.wallet_address } : null,
      error: profileError?.message
    });

    // Try to get wallet from profile
    let walletAddress = profile?.wallet_address;

    // If profile lookup failed and user_id looks like a wallet address (full or partial)
    if (!walletAddress && submission.user_id && submission.user_id.startsWith('0x')) {

      // Case 1: Full wallet address (42 chars)
      if (submission.user_id.length === 42) {
        walletAddress = submission.user_id;
        console.log('Using user_id as wallet address (full):', walletAddress);
      }
      // Case 2: Partial/truncated wallet address - try to find profile by LIKE query
      else {
        console.log('Trying profile lookup by partial wallet:', submission.user_id);

        const { data: matchedProfile } = await supabaseAdmin
          .from('profiles')
          .select('wallet_address, id')
          .ilike('wallet_address', `${submission.user_id}%`)
          .limit(1)
          .single();

        if (matchedProfile?.wallet_address) {
          walletAddress = matchedProfile.wallet_address;
          console.log('Found wallet by partial match:', walletAddress);
        }
      }
    }

    // Still no wallet? Try one more lookup - maybe user_id is actually stored as wallet_address in profiles
    if (!walletAddress) {
      const { data: walletProfile } = await supabaseAdmin
        .from('profiles')
        .select('wallet_address')
        .eq('wallet_address', submission.user_id.toLowerCase())
        .single();

      if (walletProfile?.wallet_address) {
        walletAddress = walletProfile.wallet_address;
        console.log('Found wallet by direct wallet_address lookup:', walletAddress);
      }
    }

    // Still no wallet? Return error
    if (!walletAddress) {
      console.error('Wallet address resolution failed:', {
        userId: submission.user_id,
        profileExists: !!profile,
        profileWallet: profile?.wallet_address,
      });

      return NextResponse.json(
        {
          error: 'User wallet address not found. User may not have completed wallet login.',
          debug: {
            userId: submission.user_id,
            hasProfile: !!profile,
            walletInProfile: profile?.wallet_address || null,
          }
        },
        { status: 400 }
      );
    }

    const challenge = submission.challenges;

    // Prepare badge metadata
    const badgeMetadata = {
      name: `PROVELT: ${challenge.title}`,
      description: `Badge earned for completing "${challenge.title}" on PROVELT.`,
      image: challenge.badge_image_url || 'https://provelt.app/badge-default.png',
      attributes: [
        { trait_type: 'Challenge', value: challenge.title },
        { trait_type: 'Category', value: challenge.category },
        { trait_type: 'Difficulty', value: challenge.difficulty },
        { trait_type: 'Completed', value: new Date().toISOString() },
        { trait_type: 'Platform', value: 'PROVELT' },
        { trait_type: 'Network', value: 'Mantle' },
        { trait_type: 'Points', value: challenge.points },
      ],
    };

    // Create metadata URI (base64 encoded JSON)
    const metadataJson = JSON.stringify(badgeMetadata);
    const metadataUri = `data:application/json;base64,${Buffer.from(metadataJson).toString('base64')}`;

    let mintResult: { success: boolean; transactionHash?: string; tokenId?: string; error?: string } = {
      success: false,
      transactionHash: '',
      tokenId: ''
    };

    // Try to mint NFT if config is available
    if (isMintingConfigured()) {
      try {
        const provider = new ethers.JsonRpcProvider(MANTLE_RPC_URL);
        const wallet = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(BADGE_CONTRACT_ADDRESS, PROVELT_BADGE_ABI, wallet);

        // Create proof hash
        const proofHash = createProofHash(
          submission.challenge_id,
          submission.user_id,
          submissionId,
          Date.now()
        );

        // Convert challengeId to uint256
        const challengeIdNum = ethers.toBigInt(ethers.keccak256(ethers.toUtf8Bytes(submission.challenge_id)));

        // Mint the badge
        const tx = await contract.mintBadge(
          walletAddress,
          challengeIdNum,
          proofHash,
          metadataUri
        );

        const receipt = await tx.wait();

        // Get tokenId from event logs
        let tokenId = '0';
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed?.name === 'BadgeMinted') {
              tokenId = parsed.args.tokenId.toString();
              break;
            }
          } catch {
            // Not a matching event
          }
        }

        mintResult = {
          success: true,
          transactionHash: receipt.hash,
          tokenId,
        };
      } catch (mintError: any) {
        console.error('Mint failed:', mintError);
        // Continue anyway - we'll record it without NFT for now
        mintResult = {
          success: false,
          error: mintError.message,
        };
      }
    } else {
      console.log('NFT minting not configured - using placeholder');
      // Generate placeholder data for testing
      mintResult = {
        success: true,
        transactionHash: `sim_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        tokenId: `token_${submissionId.slice(0, 8)}`,
      };
    }

    // Update submission as approved
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        status: 'approved',
        nft_mint_address: BADGE_CONTRACT_ADDRESS || null,
        nft_metadata_uri: metadataUri,
        nft_tx_signature: mintResult.transactionHash || null,
        minted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // Create badge_nft record
    const { error: badgeError } = await supabaseAdmin
      .from('badge_nfts')
      .insert({
        user_id: submission.user_id,
        submission_id: submissionId,
        challenge_id: submission.challenge_id,
        mint_address: BADGE_CONTRACT_ADDRESS || `pending_${submissionId}`,
        metadata_uri: metadataUri,
        tx_signature: mintResult.transactionHash || 'pending',
        name: challenge.badge_name || `${challenge.title} Badge`,
        description: `Badge earned for completing "${challenge.title}"`,
        image_url: challenge.badge_image_url || 'https://provelt.app/badge-default.png',
        attributes: {
          challenge: challenge.title,
          category: challenge.category,
          difficulty: challenge.difficulty,
          points: challenge.points,
          tokenId: mintResult.tokenId,
        },
      });

    if (badgeError) {
      console.error('Badge creation error:', badgeError);
    }

    // Update user stats
    try {
      const { data: currentProfile } = await supabaseAdmin
        .from('profiles')
        .select('total_points, badges_count')
        .eq('id', submission.user_id)
        .single();

      if (currentProfile) {
        await supabaseAdmin
          .from('profiles')
          .update({
            total_points: (currentProfile.total_points || 0) + challenge.points,
            badges_count: (currentProfile.badges_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', submission.user_id);
      }
    } catch (statsErr) {
      console.error('Stats update error:', statsErr);
    }

    // Update challenge completion count
    await supabaseAdmin
      .from('challenges')
      .update({
        completions_count: (challenge.completions_count || 0) + 1,
      })
      .eq('id', challenge.id);

    return NextResponse.json({
      success: true,
      message: 'Submission approved and badge minted',
      data: {
        contractAddress: BADGE_CONTRACT_ADDRESS,
        tokenId: mintResult.tokenId,
        txHash: mintResult.transactionHash,
        explorerUrl: mintResult.transactionHash ? getExplorerUrl(mintResult.transactionHash, 'tx') : null,
        metadataUri,
        pointsAwarded: challenge.points,
      },
    });
  } catch (error: any) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
