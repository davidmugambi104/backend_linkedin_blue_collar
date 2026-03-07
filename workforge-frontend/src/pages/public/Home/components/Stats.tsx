import React from 'react';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { UserGroupIcon, CheckCircleIcon, UserGroupIcon as CompanyIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const stats = [
  { 
    id: 1, 
    name: 'Active Workers', 
    value: 15000, 
    suffix: '+',
    icon: UserGroupIcon,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  { 
    id: 2, 
    name: 'Jobs Completed', 
    value: 50000, 
    suffix: '+',
    icon: CheckCircleIcon,
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600'
  },
  { 
    id: 3, 
    name: 'Verified Employers', 
    value: 5000, 
    suffix: '+',
    icon: CompanyIcon,
    bgColor: 'bg-primary-50',
    iconColor: 'text-primary-600'
  },
  { 
    id: 4, 
    name: 'Total Earnings', 
    value: 2.5, 
    prefix: '$', 
    suffix: 'M+',
    icon: CurrencyDollarIcon,
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600'
  },
];

export const Stats: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="relative bg-gradient-to-b from-white to-gray-50 py-12 md:py-14 lg:py-16">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-100/20 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-100/20 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Trusted by Thousands Worldwide
          </h2>
          <p className="text-base text-gray-600 max-w-3xl mx-auto">
            Join a thriving community growing stronger every day
          </p>
        </div>

        {/* Stats Grid */}
        <div 
          ref={ref}
          className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 md:p-5 text-center border border-gray-100 hover:border-primary-200 transform hover:-translate-y-0.5"
              >
                {/* Icon Circle */}
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${stat.bgColor} mb-2 transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>

                {/* Stat Number */}
                <div className="mb-2">
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                    {stat.prefix}
                    {inView && (
                      <CountUp
                        end={stat.value}
                        duration={2.5}
                        separator=","
                        decimals={stat.value < 10 ? 1 : 0}
                      />
                    )}
                    <span className={`${stat.iconColor} text-xl md:text-2xl`}>{stat.suffix}</span>
                  </div>
                </div>

                {/* Stat Label */}
                <div className="text-xs md:text-sm font-medium text-gray-700">
                  {stat.name}
                </div>

                {/* Accent bar */}
                <div className="mt-2 h-0.5 w-6 bg-gradient-to-r from-primary-400 to-emerald-400 rounded-full mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};