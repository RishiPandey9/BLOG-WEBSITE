'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-vh-100 bg-background text-foreground p-4">
          <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
          <p className="text-muted-foreground mb-8 text-center max-w-md">
            We've been notified about this issue and are working to fix it.
          </p>
          <Button
            onClick={() => reset()}
            className="px-8"
          >
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
