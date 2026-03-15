import { NextResponse } from 'next/server';
import log from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  log.info('API Test Monitoring route called');

  try {
    // Simulate some logic
    const context = { action: 'verification' };
    log.info('Processing API request', context);

    return NextResponse.json({ 
      status: 'ok', 
      message: 'Server-side logs sent to Better Stack' 
    });
  } catch (err) {
    const error = err as Error;
    log.error('API Test Error', { error: error.message });
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  log.error('Manual Server Error Triggered');
  Sentry.captureMessage('Manually triggered Sentry message from API');
  return NextResponse.json({ message: 'Error reported' });
}
