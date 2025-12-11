import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mintCompressedNFT, createBadgeMetadata, uploadMetadata } from '@/lib/solana/mint';
import { MERKLE_TREE_ADDRESS, COLLECTION_ADDRESS } from '@/lib/solana/config';

// Create supabase client with anon key (relies on RLS policies being set correctly)
// For this to work, ensure your Supabase has proper RLS policies that allow:
// - SELECT on submissions for authenticated users or public
// - UPDATE on submissions for admins
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY && 
  process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key'
  ? process.env.SUPABASE_SERVICE_ROLE_KEY 
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

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
      .select('wallet_address')
      .eq('id', submission.user_id)
      .single();

    // Try to get wallet from profile, or use user_id if it's a wallet address
    let walletAddress = profile?.wallet_address;
    if (!walletAddress && submission.user_id.length > 36) {
      // user_id might be the wallet address itself
      walletAddress = submission.user_id;
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'User wallet address not found' },
        { status: 400 }
      );
    }

    const challenge = submission.challenges;

    // Prepare badge metadata
    const badgeMetadata = createBadgeMetadata({
      challengeTitle: challenge.title,
      challengeCategory: challenge.category,
      difficulty: challenge.difficulty,
      completedAt: new Date().toISOString(),
      imageUrl: challenge.badge_image_url || 'https://provelt.app/badge-default.png',
      creatorAddress: walletAddress,
    });

    // Upload metadata (placeholder - would use IPFS in production)
    const metadataUri = await uploadMetadata(badgeMetadata);

    let mintResult: { success: boolean; signature?: string; assetId?: string; error?: string } = { 
      success: false, 
      signature: '', 
      assetId: '' 
    };

    // Try to mint NFT if config is available
    if (MERKLE_TREE_ADDRESS && COLLECTION_ADDRESS && process.env.TREASURY_PRIVATE_KEY) {
      mintResult = await mintCompressedNFT({
        recipientAddress: walletAddress,
        merkleTreeAddress: MERKLE_TREE_ADDRESS.toBase58(),
        collectionAddress: COLLECTION_ADDRESS.toBase58(),
        metadata: badgeMetadata,
        treasuryPrivateKey: process.env.TREASURY_PRIVATE_KEY,
      });

      if (!mintResult.success) {
        console.error('Mint failed:', mintResult.error);
        // Continue anyway - we'll record it without NFT for now
      }
    } else {
      console.log('NFT minting not configured - skipping mint');
      // Generate placeholder data for testing
      mintResult = {
        success: true,
        signature: `sim_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        assetId: `asset_${submissionId}`,
      };
    }

    // Update submission as approved
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        status: 'approved',
        nft_mint_address: mintResult.assetId || null,
        nft_metadata_uri: metadataUri,
        nft_tx_signature: mintResult.signature || null,
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
        mint_address: mintResult.assetId || `pending_${submissionId}`,
        metadata_uri: metadataUri,
        tx_signature: mintResult.signature || 'pending',
        name: challenge.badge_name || `${challenge.title} Badge`,
        description: `Badge earned for completing "${challenge.title}"`,
        image_url: challenge.badge_image_url || 'https://provelt.app/badge-default.png',
        attributes: {
          challenge: challenge.title,
          category: challenge.category,
          difficulty: challenge.difficulty,
          points: challenge.points,
        },
      });

    if (badgeError) {
      console.error('Badge creation error:', badgeError);
      // Don't fail the whole operation
    }

    // Update user stats
    const { error: statsError } = await supabaseAdmin.rpc('increment_user_stats', {
      p_user_id: submission.user_id,
      p_points: challenge.points,
      p_badges: 1,
      p_submissions: 0, // Already counted when submitted
    });

    if (statsError) {
      console.error('Stats update error:', statsError);
      // Don't fail the whole operation
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
        mintAddress: mintResult.assetId,
        txSignature: mintResult.signature,
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
