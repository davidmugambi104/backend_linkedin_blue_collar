import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Button } from '@components/ui/Button';
import { StripeProvider, PaymentElement } from '@components/common/Stripe';
import { useJob } from '@hooks/useJobs';
import { useCreatePaymentIntent, useCreatePayment } from '@hooks/usePayments';
import { PaymentMethod } from '@types';
import { formatCurrency } from '@lib/utils/format';
import { Skeleton } from '@components/ui/Skeleton';
import { toast } from 'react-toastify';

const paymentSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  payment_method: z.enum([
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BANK_TRANSFER,
  ]),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export const PaymentForm: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string>();
  const [paymentIntentId, setPaymentIntentId] = useState<string>();

  const { data: job, isLoading: jobLoading } = useJob(Number(jobId));
  const createPaymentIntent = useCreatePaymentIntent();
  const createPayment = useCreatePayment();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: job?.pay_min || 0,
      payment_method: PaymentMethod.CREDIT_CARD,
    },
  });

  const amount = watch('amount');

  React.useEffect(() => {
    if (job) {
      setValue('amount', job.pay_min || 0);
    }
  }, [job, setValue]);

  const handleCreatePaymentIntent = async (data: PaymentFormData) => {
    try {
      const intent = await createPaymentIntent.mutateAsync({
        jobId: Number(jobId),
        amount: data.amount,
      });
      setClientSecret(intent.client_secret);
      setPaymentIntentId(intent.payment_intent_id);
    } catch (error) {
      toast.error('Failed to initialize payment');
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const payment = await createPayment.mutateAsync({
        job_id: Number(jobId),
        amount: amount,
        payment_method: watch('payment_method'),
        metadata: {
          payment_intent_id: paymentIntentId,
        },
      });

      toast.success('Payment completed successfully!');
      navigate(`/employer/jobs/${jobId}?payment=${payment.id}`);
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  if (jobLoading) {
    return (
      <Card>
        <CardBody>
          <Skeleton className="h-64" />
        </CardBody>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardBody>
          <p className="text-center text-slate-500">Job not found</p>
        </CardBody>
      </Card>
    );
  }

  const platformFee = amount * 0.1;
  const workerAmount = amount - platformFee;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900 text-[#1A1A1A]">
          Complete Payment
        </h2>
        <p className="text-sm text-gray-600 ">
          Pay for job: {job.title}
        </p>
      </CardHeader>
      <CardBody>
        {!clientSecret ? (
          // Payment Details Form
          <form onSubmit={handleSubmit(handleCreatePaymentIntent)} className="space-y-6">
            <div className="bg-gray-50 bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-slate-700  mb-2">
                Payment Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 ">Job Amount:</span>
                  <span className="font-medium text-gray-900 text-[#1A1A1A]">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 ">Platform Fee (10%):</span>
                  <span className="font-medium text-gray-900 text-[#1A1A1A]">
                    {formatCurrency(platformFee)}
                  </span>
                </div>
                <div className="border-t border-gray-200 border-gray-700 my-2 pt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-900 text-[#1A1A1A]">Total:</span>
                    <span className="text-primary-600 text-primary-400">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-500  mt-2">
                  Worker receives: {formatCurrency(workerAmount)}
                </div>
              </div>
            </div>

            <Input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              step="0.01"
              label="Payment Amount"
              error={errors.amount?.message}
              leftIcon={<span className="text-slate-500">$</span>}
              required
            />

            <Select
              {...register('payment_method')}
              label="Payment Method"
              error={errors.payment_method?.message}
              required
            >
              <option value={PaymentMethod.CREDIT_CARD}>Credit Card</option>
              <option value={PaymentMethod.DEBIT_CARD}>Debit Card</option>
              <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
            </Select>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={createPaymentIntent.isPending}
              disabled={!isValid}
            >
              Continue to Payment
            </Button>
          </form>
        ) : (
          // Stripe Payment Element
          <StripeProvider clientSecret={clientSecret}>
            <PaymentElement
              amount={amount}
              onSuccess={handlePaymentSuccess}
              buttonText={`Pay ${formatCurrency(amount)}`}
            />
          </StripeProvider>
        )}
      </CardBody>
    </Card>
  );
};