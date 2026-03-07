import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { ArrowRightIcon, UserIcon, UserPlusIcon } from '@heroicons/react/24/outline';

export const CTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative z-50 pointer-events-auto bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800">
      <div className="container py-16 lg:py-24 relative z-50 pointer-events-auto">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-xl text-primary-100">
            Join thousands of workers and employers who trust WorkForge for their hiring needs.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto bg-white text-primary-600 hover:bg-gray-50"
              type="button"
              onClick={() => navigate('/auth/register?role=worker')}
            >
              Join as Worker
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-white text-white hover:bg-white/10"
              type="button"
              onClick={() => navigate('/auth/register?role=employer')}
            >
              Join as Employer
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </Button>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="default"
              variant="outline"
              className="w-full sm:w-auto border-white text-white hover:bg-white/10"
              type="button"
              onClick={() => navigate('/auth/login')}
            >
              <UserIcon className="h-5 w-5 mr-2" />
              Sign In
            </Button>
            <Button
              size="default"
              variant="outline"
              className="w-full sm:w-auto border-white text-white hover:bg-white/10"
              type="button"
              onClick={() => navigate('/auth/register')}
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
