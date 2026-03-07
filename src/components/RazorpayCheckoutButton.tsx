'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useSession } from 'next-auth/react';
import { Zap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type RazorpayInstance = { open(): void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

interface RazorpayCheckoutButtonProps {
  className?: string;
  label?: string;
}

export function RazorpayCheckoutButton({
  className,
  label = 'Get Premium Access',
}: RazorpayCheckoutButtonProps) {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  const handleCheckout = async () => {
    if (!session?.user?.email) {
      toast.error('Please sign in to upgrade to premium.');
      return;
    }
    if (!scriptReady || typeof window.Razorpay === 'undefined') {
      toast.error('Payment SDK not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create order on server
      const orderRes = await fetch('/api/payment/create-order', { method: 'POST' });
      if (!orderRes.ok) {
        const err = await orderRes.json() as { error?: string };
        toast.error(err.error ?? 'Failed to create order.');
        setLoading(false);
        return;
      }
      const order = await orderRes.json() as {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        name: string;
        email: string;
        description: string;
      };

      // Step 2: Open Razorpay checkout modal
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'DevBlog Premium',
          description: order.description,
          order_id: order.orderId,
          prefill: {
            name: order.name,
            email: order.email,
          },
          theme: { color: '#f59e0b' },
          modal: {
            ondismiss: () => {
              setLoading(false);
              reject(new Error('dismissed'));
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // Step 3: Verify payment on server
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (verifyRes.ok) {
                const result = await verifyRes.json() as { subscriptionEndDate: string };
                toast.success('🎉 Welcome to Premium! Enjoy unlimited access.');
                // Step 4: Force JWT refresh so isPremium = true immediately
                await update();
                const endDate = new Date(result.subscriptionEndDate).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric',
                });
                toast.success(`Access valid until ${endDate}`, { duration: 6000 });
                resolve();
              } else {
                const err = await verifyRes.json() as { error?: string };
                toast.error(err.error ?? 'Payment verification failed.');
                reject(new Error('verification failed'));
              }
            } catch {
              toast.error('Something went wrong during verification.');
              reject(new Error('verification error'));
            } finally {
              setLoading(false);
            }
          },
        });
        rzp.open();
      });
    } catch (err) {
      if (err instanceof Error && err.message !== 'dismissed') {
        toast.error('Payment failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onReady={() => setScriptReady(true)}
        strategy="lazyOnload"
      />
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-amber-300/40 hover:from-amber-600 hover:to-orange-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all',
          className
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            {label}
          </>
        )}
      </button>
    </>
  );
}
