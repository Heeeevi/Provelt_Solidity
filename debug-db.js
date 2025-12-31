// Debug script to check submission and profile data
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
    'https://elkgqykpfxbhznpxksdn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsa2dxeWtwZnhiaHpucHhrc2RuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA1Mjk3MiwiZXhwIjoyMDgyNjI4OTcyfQ.QV0auTApVR0Get0Ii5rghPA_Ta6ngDG-EERUm7En60Q'
);

async function debug() {
    let output = '';

    // Get pending submissions
    const { data: submissions } = await supabase
        .from('submissions')
        .select('id, user_id, status')
        .eq('status', 'pending')
        .limit(10);

    output += '=== PENDING SUBMISSIONS ===\n';
    output += JSON.stringify(submissions, null, 2) + '\n\n';

    // Get all profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, wallet_address, username')
        .limit(20);

    output += '=== PROFILES ===\n';
    output += JSON.stringify(profiles, null, 2) + '\n';

    fs.writeFileSync('debug-output.txt', output);
    console.log('Output written to debug-output.txt');
}

debug();
