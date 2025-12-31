// Script to fix existing profiles by adding wallet_address from auth.users metadata
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://elkgqykpfxbhznpxksdn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsa2dxeWtwZnhiaHpucHhrc2RuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA1Mjk3MiwiZXhwIjoyMDgyNjI4OTcyfQ.QV0auTApVR0Get0Ii5rghPA_Ta6ngDG-EERUm7En60Q'
);

async function fixProfiles() {
    console.log('=== Fixing Profile Wallet Addresses ===\n');

    // Get all profiles with null wallet_address
    const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, wallet_address, username')
        .is('wallet_address', null);

    if (profErr) {
        console.error('Error fetching profiles:', profErr);
        return;
    }

    console.log(`Found ${profiles.length} profiles with null wallet_address\n`);

    // For each profile, get user metadata which should have wallet_address
    for (const profile of profiles) {
        console.log(`Processing: ${profile.username} (${profile.id})`);

        // Get auth user data
        const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(profile.id);

        if (userErr || !user) {
            console.log(`  - No auth user found: ${userErr?.message || 'Not found'}`);

            // Try to extract wallet from username if it looks like 0xXXXX_XXXX format
            const match = profile.username?.match(/^(0x[a-f0-9]+)_/i);
            if (match) {
                const partialWallet = match[1].toLowerCase();
                console.log(`  - Extracted partial wallet from username: ${partialWallet}`);

                // Update profile with partial wallet (better than nothing)
                const { error: updateErr } = await supabase
                    .from('profiles')
                    .update({ wallet_address: partialWallet })
                    .eq('id', profile.id);

                if (updateErr) {
                    console.log(`  - Failed to update: ${updateErr.message}`);
                } else {
                    console.log(`  - Updated with partial wallet address`);
                }
            }
            continue;
        }

        const walletFromMeta = user.user_metadata?.wallet_address;
        const walletFromEmail = user.email?.match(/^(0x[a-f0-9]+)@/i)?.[1];

        let walletAddress = walletFromMeta || walletFromEmail;

        if (walletAddress) {
            walletAddress = walletAddress.toLowerCase();
            console.log(`  - Found wallet: ${walletAddress}`);

            // Update profile
            const { error: updateErr } = await supabase
                .from('profiles')
                .update({ wallet_address: walletAddress })
                .eq('id', profile.id);

            if (updateErr) {
                console.log(`  - Failed to update: ${updateErr.message}`);
            } else {
                console.log(`  - Updated successfully!`);
            }
        } else {
            console.log(`  - No wallet found in metadata or email`);

            // Try username extraction as fallback
            const match = profile.username?.match(/^(0x[a-f0-9]+)/i);
            if (match) {
                const partialWallet = match[1].toLowerCase();
                console.log(`  - Extracted from username: ${partialWallet}`);

                const { error: updateErr } = await supabase
                    .from('profiles')
                    .update({ wallet_address: partialWallet })
                    .eq('id', profile.id);

                if (updateErr) {
                    console.log(`  - Failed to update: ${updateErr.message}`);
                } else {
                    console.log(`  - Updated with username-derived wallet`);
                }
            }
        }
    }

    console.log('\n=== Done ===');
}

fixProfiles();
