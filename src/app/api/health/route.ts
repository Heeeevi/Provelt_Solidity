/**
 * Health Check API
 * Returns server status and environment info
 */
import { NextResponse } from 'next/server';
import { MANTLE_NETWORK, mantleConfig } from '@/lib/mantle';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    network: MANTLE_NETWORK,
    chainId: mantleConfig.chainId,
  });
}
