import React from 'react';
import {
  ClockIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Smart Matching',
    description: 'AI-powered job recommendations based on your skills and location.',
    icon: ChartBarIcon,
    gradient: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50'
  },
  {
    name: 'Secure Payments',
    description: 'Safe and transparent payment processing with escrow protection.',
    icon: ShieldCheckIcon,
    gradient: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50'
  },
  {
    name: 'Real-time Chat',
    description: 'Communicate instantly with employers or workers.',
    icon: ChatBubbleLeftRightIcon,
    gradient: 'from-primary-500 to-primary-600',
    bgLight: 'bg-primary-50'
  },
  {
    name: 'Flexible Schedule',
    description: 'Choose jobs that fit your availability and preferences.',
    icon: ClockIcon,
    gradient: 'from-amber-500 to-amber-600',
    bgLight: 'bg-amber-50'
  },
  {
    name: 'Competitive Rates',
    description: 'Fair pay rates with transparent pricing and no hidden fees.',
    icon: CurrencyDollarIcon,
    gradient: 'from-rose-500 to-rose-600',
    bgLight: 'bg-rose-50'
  },
  {
    name: 'Local Opportunities',
    description: 'Find work near you with our location-based search.',
    icon: MapPinIcon,
    gradient: 'from-indigo-500 to-indigo-600',
    bgLight: 'bg-indigo-50'
  },
];

export const Features: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-8 md:py-10 lg:py-12 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl opacity-25 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl opacity-25 animate-blob animation-delay-4000" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-primary-600 via-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Everything You Need
            </span>
            <span className="block text-gray-900">to Succeed</span>
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            WorkForge provides all the tools you need to find work or hire talent effectively.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.name}
                className="group relative bg-gray-500/10 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-4 border border-gray-300/50 hover:border-gray-400 transform hover:scale-105 hover:-translate-y-1 overflow-hidden backdrop-blur-xl"
              >
                {/* Icon Container */}
                <div className={`inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br ${feature.gradient} rounded-lg mb-3 transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    {feature.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Accent line */}
                  <div className="mt-3 h-1 w-4 bg-gradient-to-r from-primary-400 to-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};