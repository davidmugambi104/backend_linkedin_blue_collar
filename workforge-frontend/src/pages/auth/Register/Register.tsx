import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Resolver, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  BuildingOfficeIcon, 
  BriefcaseIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Card } from '@components/ui/Card';
import { authService } from '@services/auth.service';
import { UserRole } from '@types';
import { RegisterFormData, registerSchema, registerSteps } from './Register.schema';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const defaultRole = searchParams.get('role');
  const validRoles = [UserRole.WORKER, UserRole.EMPLOYER] as const;
  const parsedRole =
    defaultRole === UserRole.WORKER || defaultRole === UserRole.EMPLOYER
      ? defaultRole
      : undefined;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema) as Resolver<RegisterFormData>,
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: parsedRole,
      terms: false,
    },
  });

  const selectedRole = watch('role');

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    setIsLoading(true);
    try {
      await authService.register({
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role as UserRole,
      });
      
      toast.success('Account created successfully! Please sign in.');
      navigate('/auth/login');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 0) {
      if (!watch('username') || !watch('email') || !watch('password') || !watch('confirmPassword')) {
        toast.error('Please fill in all fields');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, registerSteps.length - 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <Card className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create Your Account
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Join WorkForge and start your journey
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {registerSteps.map((step, index) => (
            <div key={step.id} className="flex-1 text-center">
              <div className="relative">
                <div
                  className={`
                    w-8 h-8 mx-auto rounded-full flex items-center justify-center
                    ${index <= currentStep 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }
                  `}
                >
                  {index < currentStep ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap text-gray-600 dark:text-gray-400">
                  {step.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Account Details */}
        {currentStep === 0 && (
          <div className="space-y-4 animate-in">
            <Input
              {...register('username')}
              label="Username"
              placeholder="johndoe"
              error={errors.username?.message}
              leftIcon={<UserIcon className="h-5 w-5" />}
              autoComplete="username"
            />

            <Input
              {...register('email')}
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              error={errors.email?.message}
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
              autoComplete="email"
            />

            <Input
              {...register('password')}
              type="password"
              label="Password"
              placeholder="••••••••"
              error={errors.password?.message}
              leftIcon={<LockClosedIcon className="h-5 w-5" />}
              hint="Must be at least 6 characters with uppercase, lowercase, and number"
            />

            <Input
              {...register('confirmPassword')}
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              leftIcon={<LockClosedIcon className="h-5 w-5" />}
            />
          </div>
        )}

        {/* Step 2: Select Role */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setValue('role', UserRole.WORKER)}
                className={`
                  p-6 border-2 rounded-lg text-center transition-all
                  ${selectedRole === UserRole.WORKER
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <BriefcaseIcon className="h-12 w-12 mx-auto mb-3 text-gray-700 dark:text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  I'm a Worker
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Find jobs, earn money, and grow your skills
                </p>
              </button>

              <button
                type="button"
                onClick={() => setValue('role', UserRole.EMPLOYER)}
                className={`
                  p-6 border-2 rounded-lg text-center transition-all
                  ${selectedRole === UserRole.EMPLOYER
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-3 text-gray-700 dark:text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  I'm an Employer
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Post jobs, find talent, and grow your business
                </p>
              </button>
            </div>
            {errors.role && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {errors.role.message}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Complete */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Review Your Information
              </h3>
              
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Username:</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {watch('username')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Email:</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {watch('email')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Role:</dt>
                  <dd className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                    {watch('role')}
                  </dd>
                </div>
              </dl>
            </div>

            <label className="flex items-start">
              <input
                {...register('terms')}
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.terms && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.terms.message}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-between pt-4">
          {currentStep > 0 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
          )}
          
          {currentStep < registerSteps.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              className={currentStep === 0 ? 'ml-auto' : ''}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              isLoading={isLoading}
              className="ml-auto"
            >
              Create Account
            </Button>
          )}
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
          Sign in
        </Link>
      </p>
    </Card>
  );
};

export default RegisterPage;