import React, { useState } from 'react';
import { PaymentElement as StripePaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@components/ui/Button';
import { toast } from 'react-toastify';

interface PaymentElementProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  buttonText?: string;
}

export const PaymentElement: React.FC<PaymentElementProps> = ({
  amount,
  onSuccess,
  onError,
  buttonText = 'Pay Now',
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payments/complete`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
        onError?.(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      onError?.('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 bg-bg-gray-800 p-4 rounded-lg">
        <StripePaymentElement />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 bg-text-gray-400">
            Total Amount:
          </p>
          <p className="text-2xl font-bold text-gray-900 bg-text-white">
            ${amount.toFixed(2)}
          </p>
        </div>

        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          isLoading={isProcessing}
          size="lg"
        >
          {buttonText}
        </Button>
      </div>
    </form>
  );
};