import React from 'react';
import { UserPlusIcon, DocumentTextIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';

const steps = [
  {
    title: 'Create an Account',
    description: 'Sign up as a worker or employer in just a few minutes.',
    icon: UserPlusIcon,
    for: 'both',
  },
  {
    title: 'Workers: Apply for Jobs',
    description: 'Browse opportunities and submit applications with your skills.',
    icon: DocumentTextIcon,
    for: 'worker',
  },
  {
    title: 'Employers: Post Jobs',
    description: 'Create job listings and find the perfect candidate.',
    icon: DocumentTextIcon,
    for: 'employer',
  },
  {
    title: 'Get Hired & Get Paid',
    description: 'Complete jobs, receive ratings, and get paid securely.',
    icon: HandThumbUpIcon,
    for: 'both',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <div className="py-20 bg-gray-50 bg-gray-800">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-[#1A1A1A] sm:text-4xl">
            How WorkForge Works
          </h2>
          <p className="mt-4 text-lg text-gray-600 ">
            Simple, transparent, and efficient process for everyone
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Worker Journey */}
          <div className="relative p-8 bg-white bg-gray-900 rounded-2xl shadow-sm border border-gray-200 border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 text-[#1A1A1A] mb-6 flex items-center">
              <span className="w-8 h-8 bg-primary-100 bg-primary-900/30 rounded-lg flex items-center justify-center mr-3">
                <span className="text-primary-600 text-primary-400 font-semibold">1</span>
              </span>
              For Workers
            </h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 bg-gray-800 rounded-full flex items-center justify-center mr-3">
                  <UserPlusIcon className="h-4 w-4 text-gray-600 " />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-[#1A1A1A]">Create Profile</h4>
                  <p className="text-sm text-gray-600 ">
                    Showcase your skills, experience, and hourly rate
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 bg-gray-800 rounded-full flex items-center justify-center mr-3">
                  <DocumentTextIcon className="h-4 w-4 text-gray-600 " />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-[#1A1A1A]">Find & Apply</h4>
                  <p className="text-sm text-gray-600 ">
                    Search for jobs that match your skills and apply
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 bg-gray-800 rounded-full flex items-center justify-center mr-3">
                  <HandThumbUpIcon className="h-4 w-4 text-gray-600 " />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-[#1A1A1A]">Get Hired & Earn</h4>
                  <p className="text-sm text-gray-600 ">
                    Complete jobs, get paid, and build your reputation
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Employer Journey */}
          <div className="relative p-8 bg-white bg-gray-900 rounded-2xl shadow-sm border border-gray-200 border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 text-[#1A1A1A] mb-6 flex items-center">
              <span className="w-8 h-8 bg-primary-100 bg-primary-900/30 rounded-lg flex items-center justify-center mr-3">
                <span className="text-primary-600 text-primary-400 font-semibold">2</span>
              </span>
              For Employers
            </h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 bg-gray-800 rounded-full flex items-center justify-center mr-3">
                  <UserPlusIcon className="h-4 w-4 text-gray-600 " />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-[#1A1A1A]">Create Company Profile</h4>
                  <p className="text-sm text-gray-600 ">
                    Set up your business profile and verify your identity
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 bg-gray-800 rounded-full flex items-center justify-center mr-3">
                  <DocumentTextIcon className="h-4 w-4 text-gray-600 " />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-[#1A1A1A]">Post Jobs</h4>
                  <p className="text-sm text-gray-600 ">
                    Create detailed job listings with requirements and pay
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 bg-gray-800 rounded-full flex items-center justify-center mr-3">
                  <HandThumbUpIcon className="h-4 w-4 text-gray-600 " />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-[#1A1A1A]">Hire & Manage</h4>
                  <p className="text-sm text-gray-600 ">
                    Review applications, hire workers, and manage projects
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};