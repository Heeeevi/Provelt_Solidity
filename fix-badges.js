// Script to fix missing badge_nfts records with unique mint_address
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://elkgqykpfxbhznpxksdn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsa2dxeWtwZnhiaHpucHhrc2RuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA1Mjk3MiwiZXhwIjoyMDgyNjI4OTcyfQ.QV0auTApVR0Get0Ii5rghPA_Ta6ngDG-EERUm7En60Q'
);

async function fixMissingBadges() {
    console.log('=== Fixing Missing Badge NFTs (v2) ===\n');

    // Get approved submissions with challenge details
    const { data: approvedSubmissions } = await supabase
        .from('submissions')
        .select('*, challenges(*)')
        .eq('status', 'approved');

    const { data: existingBadges } = await supabase
        .from('badge_nfts')
        .select('submission_id');

    const existingSubmissionIds = new Set(existingBadges?.map(b => b.submission_id) || []);

    console.log(`Approved submissions: ${approvedSubmissions?.length || 0}`);
    console.log(`Existing badges: ${existingBadges?.length || 0}\n`);

    let tokenCounter = 100; // Start from a high number to avoid conflicts

    for (const sub of approvedSubmissions || []) {
        if (existingSubmissionIds.has(sub.id)) {
            console.log(`✓ Badge exists: ${sub.id}`);
            continue;
        }

        console.log(`✗ Missing: ${sub.id} (user: ${sub.user_id})`);

        const challenge = sub.challenges;
        if (!challenge) {
            console.log('  No challenge data, skip');
            continue;
        }

        tokenCounter++;

        // Use submission_id in mint_address to make it unique per badge
        const uniqueMintAddress = `0xc079d4dcfae3250ba38fbf9323676d1f53256ab5#${tokenCounter}`;

        const badgeData = {
            user_id: sub.user_id,
            submission_id: sub.id,
            challenge_id: sub.challenge_id,
            mint_address: uniqueMintAddress,
            metadata_uri: sub.nft_metadata_uri || 'pending',
            tx_signature: sub.nft_tx_signature || `pending_${sub.id.slice(0, 8)}`,
            name: challenge.badge_name || `${challenge.title} Badge`,
            description: `Badge earned for completing "${challenge.title}"`,
            image_url: challenge.badge_image_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=' + challenge.category,
            attributes: {
                challenge: challenge.title,
                category: challenge.category,
                difficulty: challenge.difficulty,
                points: challenge.points,
                tokenId: tokenCounter.toString(),
            },
        };

        const { error } = await supabase.from('badge_nfts').insert(badgeData);

        if (error) {
            console.log(`  Failed: ${error.message}`);
        } else {
            console.log(`  Created! (token #${tokenCounter})`);
        }
    }

    console.log('\n=== Done ===');
}

fixMissingBadges();
