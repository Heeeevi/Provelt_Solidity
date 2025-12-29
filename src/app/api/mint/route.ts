/**
 * Mint Badge API
 * Mints an ERC-721 NFT badge on Mantle for challenge completion
 * 
 * POST /api/mint
 * Body: { challengeId, submissionId, walletAddress }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ethers } from 'ethers';
import {
  getExplorerUrl,
  BADGE_CONTRACT_ADDRESS,
  MANTLE_RPC_URL,
  PROVELT_BADGE_ABI,
  createProofHash,
} from '@/lib/mantle';

interface MintRequestBody {
  challengeId: string;
  submissionId: string;
  walletAddress: string;
}

// Check if contract is configured
function isMintingConfigured(): boolean {
  return !!(
    BADGE_CONTRACT_ADDRESS &&
    BADGE_CONTRACT_ADDRESS.startsWith('0x') &&
    process.env.TREASURY_PRIVATE_KEY
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: MintRequestBody = await request.json();
    const { challengeId, submissionId, walletAddress } = body;

    if (!challengeId || !submissionId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: challengeId, submissionId, walletAddress' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Check minting configuration
    if (!isMintingConfigured()) {
      return NextResponse.json(
        { error: 'Minting not configured. Please deploy the badge contract and set environment variables.' },
        { status: 503 }
      );
    }

    // Verify submission exists and belongs to user
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select(`
        *,
        challenge:challenges(*)
      `)
      .eq('id', submissionId)
      .eq('user_id', user.id)
      .single();

    if (subError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found or access denied' },
        { status: 404 }
      );
    }

    // Check if submission is approved
    if (submission.status !== 'approved') {
      return NextResponse.json(
        { error: 'Submission must be approved before minting' },
        { status: 400 }
      );
    }

    // Check if badge already minted
    const { data: existingBadge } = await supabase
      .from('badge_nfts')
      .select('id')
      .eq('submission_id', submissionId)
      .single();

    if (existingBadge) {
      return NextResponse.json(
        { error: 'Badge already minted for this submission' },
        { status: 409 }
      );
    }

    // Get treasury private key
    const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY!;

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(MANTLE_RPC_URL);
    const wallet = new ethers.Wallet(treasuryPrivateKey, provider);

    // Create contract instance
    const contract = new ethers.Contract(BADGE_CONTRACT_ADDRESS, PROVELT_BADGE_ABI, wallet);

    // Create badge metadata
    const challenge = submission.challenge as any;
    const metadata = {
      name: `PROVELT: ${challenge.title}`,
      description: `Badge earned for completing the "${challenge.title}" challenge on PROVELT.`,
      image: challenge.image_url || 'https://provelt.app/badge-default.png',
      attributes: [
        { trait_type: 'Challenge', value: challenge.title },
        { trait_type: 'Category', value: challenge.category || 'General' },
        { trait_type: 'Difficulty', value: challenge.difficulty || 'Medium' },
        { trait_type: 'Completed', value: new Date().toISOString() },
        { trait_type: 'Platform', value: 'PROVELT' },
        { trait_type: 'Network', value: 'Mantle' },
      ],
    };

    // Create metadata URI (base64 encoded JSON for now)
    const metadataJson = JSON.stringify(metadata);
    const metadataUri = `data:application/json;base64,${Buffer.from(metadataJson).toString('base64')}`;

    // Create proof hash
    const proofHash = createProofHash(
      challengeId,
      user.id,
      submissionId,
      Date.now()
    );

    // Convert challengeId to uint256 (hash it if string)
    const challengeIdNum = ethers.toBigInt(ethers.keccak256(ethers.toUtf8Bytes(challengeId)));

    // Mint the badge
    const tx = await contract.mintBadge(
      walletAddress,
      challengeIdNum,
      proofHash,
      metadataUri
    );

    // Wait for confirmation
    const receipt = await tx.wait();
    const transactionHash = receipt.hash;

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

    // Store badge in database
    const { data: badge, error: badgeError } = await supabase
      .from('badge_nfts')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        submission_id: submissionId,
        mint_address: BADGE_CONTRACT_ADDRESS,
        metadata_uri: metadataUri,
        tx_signature: transactionHash,
        name: metadata.name,
        description: metadata.description,
        image_url: metadata.image,
        attributes: metadata.attributes as any,
      })
      .select()
      .single();

    if (badgeError) {
      console.error('Error storing badge:', badgeError);
    }

    // Update submission with badge mint info
    await supabase
      .from('submissions')
      .update({
        nft_mint_address: BADGE_CONTRACT_ADDRESS,
        nft_metadata_uri: metadataUri,
        nft_tx_signature: transactionHash,
        minted_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    // Update user badge count
    await supabase
      .from('profiles')
      .update({
        badges_count: (await supabase
          .from('badge_nfts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
        ).count || 0
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      transactionHash,
      tokenId,
      explorerUrl: getExplorerUrl(transactionHash, 'tx'),
      badge,
    });

  } catch (error) {
    console.error('Mint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mint - Get minting configuration status
 */
export async function GET() {
  const configured = isMintingConfigured();
  return NextResponse.json({
    configured,
    network: process.env.NEXT_PUBLIC_MANTLE_NETWORK || 'sepolia',
    contract: BADGE_CONTRACT_ADDRESS ? `${BADGE_CONTRACT_ADDRESS.slice(0, 10)}...` : null,
  });
}
