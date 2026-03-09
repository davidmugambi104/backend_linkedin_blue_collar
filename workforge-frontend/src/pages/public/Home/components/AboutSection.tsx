import React from 'react';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  RocketLaunchIcon,
  HeartIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@components/ui/Button';

const values = [
  {
    icon: UsersIcon,
    title: 'Community First',
    description: 'We prioritize building a strong, supportive community where workers and employers thrive together.',
  },
  {
    icon: RocketLaunchIcon,
    title: 'Innovation',
    description: 'Leveraging cutting-edge technology to streamline the hiring process and enhance user experience.',
  },
  {
    icon: HeartIcon,
    title: 'Fair Opportunities',
    description: 'Ensuring equal access to opportunities and fair compensation for all skilled professionals.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Trust & Safety',
    description: 'Comprehensive verification and secure payment systems to protect both workers and employers.',
  },
];

export const AboutSection: React.FC = () => {
  return (
    <section className="py-16 md:py-20 bg-white bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-[#1A1A1A] mb-4">
            About WorkForge
          </h2>
          <p className="text-lg text-gray-600  leading-relaxed">
            WorkForge is a platform connecting talented blue-collar workers with employers who value their skills. 
            Our mission is to make finding work and hiring easier, faster, and more transparent for everyone.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-primary-50 to-emerald-50 from-primary-900/20 to-emerald-900/20 rounded-2xl p-8 md:p-12 border border-primary-200 border-primary-800">
            <h3 className="text-2xl font-bold text-gray-900 text-[#1A1A1A] mb-4">
              Our Mission
            </h3>
            <p className="text-lg text-slate-700  leading-relaxed mb-6">
              We believe skilled workers deserve respect, fair pay, and access to quality opportunities. 
              Whether you're a carpenter, electrician, plumber, or any other skilled professional, 
              WorkForge empowers you to take control of your career and build lasting relationships with employers.
            </p>
            <p className="text-lg text-slate-700  leading-relaxed">
              For employers, we provide access to a vetted network of talented professionals, 
              streamlined hiring tools, and secure payment processing—making it simple to find 
              the right person for the job.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-900 text-[#1A1A1A] mb-10">
            Our Core Values
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 from-primary-900 to-primary-800 rounded-2xl mb-4">
                    <Icon className="h-8 w-8 text-primary-600 text-primary-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 text-[#1A1A1A] mb-2">
                    {value.title}
                  </h4>
                  <p className="text-sm text-gray-600 ">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600  mb-6">
            Want to learn more about our platform and team?
          </p>
          <Link to="/about">
            <Button size="lg" variant="outline">
              Read Full Story
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
