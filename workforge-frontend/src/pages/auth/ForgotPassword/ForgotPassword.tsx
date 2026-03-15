import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, ArrowLeftIcon, KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Card } from '@components/ui/Card';
import { authService } from '@services/auth.service';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    setIsLoading(true);
    try {
      await authService.requestPasswordReset(email.trim());
      setStep('reset');
      toast.success('Password reset code sent to your email');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !code.trim() || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyPasswordReset(email.trim(), code.trim(), newPassword);
      toast.success('Password reset successfully. You can now sign in.');
      setStep('request');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold !text-[#1A1A1A]" style={{ color: '#1A1A1A' }}>
          Forgot Password?
        </h1>
        <p className="mt-2 text-sm !text-[#4B5563]" style={{ color: '#4B5563' }}>
          {step === 'request'
            ? "Enter your email and we'll send you a reset code"
            : 'Enter the code from your email and choose a new password'}
        </p>
      </div>

      {step === 'request' ? (
        <form onSubmit={handleRequestCode} className="space-y-6">
          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            leftIcon={<EnvelopeIcon className="h-5 w-5" />}
            autoComplete="email"
          />

          <Button type="submit" fullWidth isLoading={isLoading}>
            Send Reset Code
          </Button>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-800">
              If you do not receive a reset code, contact support for private recovery.
              Support can issue a short-lived one-time code after identity verification.
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="rounded-lg bg-green-50 bg-green-900/20 p-4">
            <p className="text-sm text-green-800 text-green-300">
              We sent a 6-digit reset code to your email. Enter it below with your new password.
            </p>
          </div>

          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            leftIcon={<EnvelopeIcon className="h-5 w-5" />}
            autoComplete="email"
          />

          <Input
            label="Reset Code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            leftIcon={<KeyIcon className="h-5 w-5" />}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
          />

          <Input
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="••••••••"
            leftIcon={<LockClosedIcon className="h-5 w-5" />}
            autoComplete="new-password"
          />

          <Input
            type="password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="••••••••"
            leftIcon={<LockClosedIcon className="h-5 w-5" />}
            autoComplete="new-password"
          />

          <Button type="submit" fullWidth isLoading={isLoading}>
            Reset Password
          </Button>

          <Button type="button" variant="outline" fullWidth onClick={() => setStep('request')}>
            Use a Different Email
          </Button>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-800">
              Did not get a code? Contact support for private recovery and request an admin-issued
              one-time reset code.
            </p>
          </div>
        </form>
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