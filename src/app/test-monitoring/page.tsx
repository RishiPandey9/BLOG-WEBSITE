'use client';

import { useEffect } from 'react';
import log from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';

export default function TestMonitoringPage() {
  useEffect(() => {
    log.info('Test Monitoring Page loaded');
  }, []);

  const triggerError = () => {
    log.error('Test error triggered from client');
    throw new Error('This is a test error from the browser');
  };

  const triggerLog = () => {
    log.info('Manual test log from client', { timestamp: new Date().toISOString() });
    alert('Log sent to Better Stack!');
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Monitoring Verification Page</h1>
      <p>This page tests if Sentry and Logtail are correctly capturing events.</p>
      
      <div className="flex gap-4">
        <Button onClick={triggerLog} variant="outline">
          Send Test Log
        </Button>
        <Button onClick={triggerError} variant="destructive">
          Trigger Test Error
        </Button>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-md">
        <h2 className="font-semibold mb-2">Instructions:</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Open your Browser Console (F12).</li>
          <li>Click "Send Test Log" and check your Better Stack dashboard.</li>
          <li>Click "Trigger Test Error" and check your Sentry dashboard.</li>
        </ul>
      </div>
    </div>
  );
}
