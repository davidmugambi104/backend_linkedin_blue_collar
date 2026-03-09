import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Card } from '@components/ui/Card';
import { ForgotPasswordFormData, forgotPasswordSchema } from './ForgotPassword.schema';

export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error('Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 text-[#1A1A1A]">
          Forgot Password?
        </h1>
        <p className="mt-2 text-sm text-gray-600 ">
          {!isSubmitted
            ? "Enter your email and we'll send you a reset link"
            : 'Check your email for the reset link'}
        </p>
      </div>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            {...register('email')}
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            error={errors.email?.message}
            leftIcon={<EnvelopeIcon className="h-5 w-5" />}
            autoComplete="email"
          />

          <Button type="submit" fullWidth isLoading={isLoading}>
            Send Reset Link
          </Button>
        </form>
      ) : (
        <div className="text-center space-y-6">
          <div className="bg-green-50 bg-green-900/20 rounded-lg p-4">
            <p className="text-sm text-green-800 text-green-300">
              We've sent a password reset link to your email address.
              Please check your inbox and follow the instructions.
            </p>
          </div>
          
          <Button
            variant="outline"
            fullWidth
            onClick={() => setIsSubmitted(false)}
          >
            Try another email
          </Button>
        </div>
      )}

      <Link
        to="/auth/login"
        className="mt-6 flex items-center justify-center text-sm text-gray-600 hover:text-gray-900  hover:text-gray-100"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to sign in
      </Link>
    </Card>
  );
};

export default ForgotPasswordPage;