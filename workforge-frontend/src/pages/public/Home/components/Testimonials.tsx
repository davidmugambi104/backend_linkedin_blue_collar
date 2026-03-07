import React from 'react';
import { 
  CheckCircleIcon, 
  UserGroupIcon, 
  ShieldCheckIcon,
  CurrencyDollarIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const testimonials = [
  {
    name: 'Maria Rodriguez',
    role: 'Construction Worker',
    image: null,
    rating: 5,
    text: "I've found consistent work through WorkForge. The payment system is secure and employers are professional.",
  },
  {
    name: 'David Chen',
    role: 'Restaurant Owner',
    image: null,
    rating: 5,
    text: "WorkForge helped me find reliable kitchen staff quickly. The verification system gives me peace of mind.",
  },
  {
    name: 'Sarah Johnson',
    role: 'Plumber',
    image: null,
    rating: 5,
    text: "Great platform for finding flexible work. I can choose jobs that fit my schedule and location.",
  },
];

const benefits = [
  {
    icon: CheckCircleIcon,
    title: 'Verified Profiles',
    description: 'All users go through verification for safety and trust',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Secure Payments',
    description: 'Escrow system ensures fair payment for completed work',
  },
  {
    icon: UserGroupIcon,
    title: 'Quality Matches',
    description: 'Smart algorithm matches workers with relevant opportunities',
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Transparent Pricing',
    description: 'No hidden fees - know exactly what you pay or earn',
  },
];

export const Testimonials: React.FC = () => {
  return (
    <div className="py-20 bg-white dark:bg-gray-900">
      <div className="container">
        {/* Benefits Section */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Why Choose WorkForge?
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Trusted by thousands for secure, reliable, and efficient hiring
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <benefit.icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              What Our Users Say
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="relative p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  "{testimonial.text}"
                </p>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mr-3">
                    <span className="text-primary-600 dark:text-primary-400 font-semibold text-lg">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
