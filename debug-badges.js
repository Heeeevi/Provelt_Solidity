// Debug script to check badge_nfts data
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
    'https://elkgqykpfxbhznpxksdn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsa2dxeWtwZnhiaHpucHhrc2RuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA1Mjk3MiwiZXhwIjoyMDgyNjI4OTcyfQ.QV0auTApVR0Get0Ii5rghPA_Ta6ngDG-EERUm7En60Q'
);

async function debug() {
    let output = '';

    // Get all badge_nfts
    const { data: badges, error: badgeErr } = await supabase
        .from('badge_nfts')
        .select('*')
        .limit(20);

    output += '=== BADGE_NFTS ===\n';
    if (badgeErr) output += 'Error: ' + badgeErr.message + '\n';
    output += JSON.stringify(badges, null, 2) + '\n\n';

    // Get approved submissions
    const { data: approved, error: appErr } = await supabase
        .from('submissions')
        .select('id, user_id, status, nft_mint_address')
        .eq('status', 'approved')
        .limit(10);

    output += '=== APPROVED SUBMISSIONS ===\n';
    if (appErr) output += 'Error: ' + appErr.message + '\n';
    output += JSON.stringify(approved, null, 2) + '\n\n';

    // Get profiles with badge counts
    const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, badges_count')
        .limit(10);

    output += '=== PROFILES (with badge count) ===\n';
    output += JSON.stringify(profiles, null, 2) + '\n';

    fs.writeFileSync('debug-badges.txt', output);
    console.log('Output written to debug-badges.txt');
}

debug();
