/**
 * Log Completion API
 * Records challenge completion for verification
 * 
 * POST /api/log-completion
 * Body: { challengeId, userId, proofHash, walletAddress, timestamp }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface LogCompletionBody {
  challengeId: string;
  userId: string;
  proofHash: string;
  walletAddress?: string;
  timestamp: number;
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
    const body: LogCompletionBody = await request.json();
    const { challengeId, userId, proofHash, walletAddress, timestamp } = body;

    if (!challengeId || !proofHash) {
      return NextResponse.json(
        { error: 'Missing required fields: challengeId, proofHash' },
        { status: 400 }
      );
    }

    // Store completion log in database
    const { data: log, error: logError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'completion_logged',
        title: 'Challenge Completion Logged',
        message: `Your challenge completion has been logged. Proof: ${proofHash.slice(0, 10)}...`,
        data: {
          challengeId,
          proofHash,
          walletAddress,
          timestamp: new Date(timestamp).toISOString(),
        },
      })
      .select()
      .single();

    if (logError) {
      console.error('Error storing completion log:', logError);
    }

    return NextResponse.json({
      success: true,
      proofHash,
      message: 'Completion logged successfully',
    });

  } catch (error) {
    console.error('Log completion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/log-completion - Get completion logs for a user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'completion_logged')
      .order('created_at', { ascending: false });

    if (challengeId) {
      query = query.contains('data', { challengeId });
    }

    const { data: logs, error } = await query.limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({ logs });

  } catch (error) {
    console.error('Get logs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
