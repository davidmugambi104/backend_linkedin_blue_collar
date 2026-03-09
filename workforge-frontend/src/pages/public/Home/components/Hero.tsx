import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, BriefcaseIcon, UserGroupIcon, CheckCircleIcon, SparklesIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { Button } from '@components/ui/Button';

// Animated counter component
const AnimatedStat: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-white/80 shadow-md border border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
      <div className="text-xl sm:text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs sm:text-sm text-slate-700 whitespace-nowrap">{label}</div>
    </div>
  );
};

// Floating badge component
const FloatingBadge: React.FC<{ icon: React.ReactNode; text: string; delay: number }> = ({ icon, text, delay }) => {
  return (
    <div 
      className="absolute animate-pulse"
      style={{
        animation: `float 6s ease-in-out infinite`,
        animationDelay: `${delay}s`
      }}
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
        <span className="text-primary-600">{icon}</span>
        <span className="text-sm font-medium text-gray-800">{text}</span>
      </div>
    </div>
  );
};

export const Hero: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl opacity-25 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl opacity-25 animate-blob animation-delay-4000" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="container mx-auto px-4 pt-2.5 pb-20 lg:pb-32 relative z-10">
        {/* Top bar with logo and auth buttons */}
        <div className="mb-[100px] flex items-center justify-between">
          <img src="/logo.png" alt="WorkForge" className="h-16 w-36 object-cover object-center" />
          <div className="flex items-center gap-3">
            <Link
              to="/auth/login"
              className="rounded-full border border-emerald-200 bg-emerald-500/20 px-5 py-2 text-sm font-semibold text-emerald-900 shadow-sm backdrop-blur-md transition hover:bg-emerald-500/30"
            >
              Log In
            </Link>
            <Link
              to="/auth/register"
              className="rounded-full border border-emerald-200 bg-emerald-600/80 px-5 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-emerald-600"
            >
              Sign Up
            </Link>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary-100 to-emerald-100 border border-primary-300 mb-6">
              <SparklesIcon className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">Trusted by Industry Leaders</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-gray-900 leading-tight mb-6">
              <span className="block">Your Next</span>
              <span className="block">Great Opportunity</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-emerald-600 to-blue-600">
                Awaits
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg lg:text-xl text-slate-700 leading-relaxed mb-8 max-w-xl">
              WorkForge connects talented professionals with employers who value their skills. Whether you're looking for your next role or searching for top talent, we make it happen—fast, fair, and transparent.
            </p>

            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircleIcon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>Verified Profiles</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircleIcon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircleIcon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>24/7 Support</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-black font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                <Link to="/jobs">
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Find Work Now
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-gray-300 hover:border-primary-600 text-gray-900 hover:bg-primary-50 transition-all duration-200"
              >
                <Link to="/auth/register?role=employer">
                  <BriefcaseIcon className="h-5 w-5 mr-2" />
                  Post a Job Free
                </Link>
              </Button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <AnimatedStat value="10K+" label="Active Workers" />
              <AnimatedStat value="5K+" label="Verified Employers" />
              <AnimatedStat value="$2M+" label="Payments Made" />
            </div>
          </div>

          {/* Right side - Visual element */}
          <div className={`hidden lg:flex relative h-96 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            {/* Floating cards container */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Main card */}
              <div className="absolute w-72 h-80 bg-gradient-to-br from-primary-100 to-blue-100 border border-primary-200 rounded-2xl shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-500"
                style={{
                  animation: 'float 6s ease-in-out infinite'
                }}
              >
                <div className="p-8 h-full flex flex-col justify-between">
                  <div>
                    <div className="h-12 w-12 bg-gradient-to-br from-primary-400 to-blue-400 rounded-xl mb-4 opacity-90"></div>
                    <h3 className="text-gray-900 font-semibold text-lg mb-2">Senior Developer</h3>
                    <p className="text-slate-700 text-sm">Remote • Full-time</p>
                  </div>
                  <div className="text-primary-700 font-bold text-2xl">$120k/yr</div>
                </div>
              </div>

              {/* Card 2 - rotated right */}
              <div className="absolute w-64 h-72 bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 rounded-2xl shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-500 ml-32"
                style={{
                  animation: 'float 6s ease-in-out infinite',
                  animationDelay: '1s'
                }}
              >
                <div className="p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-lg mb-3 opacity-90"></div>
                    <h3 className="text-gray-900 font-semibold text-base mb-2">Marketing Manager</h3>
                    <p className="text-slate-700 text-sm">NYC • Contract</p>
                  </div>
                  <div className="text-emerald-700 font-bold text-xl">$85k/yr</div>
                </div>
              </div>

              {/* Floating badges */}
              <FloatingBadge 
                icon={<ArrowTrendingUpIcon className="h-4 w-4" />}
                text="Hiring Now" 
                delay={0}
              />
              <FloatingBadge 
                icon={<UserGroupIcon className="h-4 w-4" />}
                text="500+ New Jobs" 
                delay={2}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};