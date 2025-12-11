import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create supabase client with service role or anon key
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('wallet');

    console.log('Debug badges API called:', { userId, walletAddress });

    // Get all badges
    const { data: allBadges, error: allError } = await supabaseAdmin
      .from('badge_nfts')
      .select('*')
      .limit(20);

    console.log('All badges:', { count: allBadges?.length, error: allError?.message });

    // If userId provided, get badges for that user
    let userBadges = null;
    let userSubmissions = null;
    if (userId) {
      const { data: badges, error: badgeErr } = await supabaseAdmin
        .from('badge_nfts')
        .select('*')
        .eq('user_id', userId);
      userBadges = { data: badges, error: badgeErr?.message };
      
      const { data: subs, error: subErr } = await supabaseAdmin
        .from('submissions')
        .select('*, challenges(id, title, points)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      userSubmissions = { data: subs, error: subErr?.message };
    }

    // If wallet provided, get profile then badges
    let walletBadges = null;
    let walletSubmissions = null;
    if (walletAddress) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, badges_count, submissions_count')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
      
      if (profile) {
        const { data: badges, error: badgeErr } = await supabaseAdmin
          .from('badge_nfts')
          .select('*')
          .eq('user_id', profile.id);
        walletBadges = { 
          profile,
          badges, 
          error: badgeErr?.message 
        };
        
        const { data: subs, error: subErr } = await supabaseAdmin
          .from('submissions')
          .select('*, challenges(id, title, points)')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
        walletSubmissions = { 
          data: subs, 
          error: subErr?.message 
        };
      } else {
        walletBadges = { profile: null, badges: [], error: 'Profile not found' };
        walletSubmissions = { data: [], error: 'Profile not found' };
      }
    }

    // Get recent submissions (all)
    const { data: submissions, error: subError } = await supabaseAdmin
      .from('submissions')
      .select('id, user_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      allBadges: {
        count: allBadges?.length || 0,
        data: allBadges,
        error: allError?.message,
      },
      userBadges,
      userSubmissions,
      walletBadges,
      walletSubmissions,
      recentSubmissions: {
        count: submissions?.length || 0,
        data: submissions,
        error: subError?.message,
      },
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
