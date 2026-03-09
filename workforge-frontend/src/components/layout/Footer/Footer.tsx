import React from 'react';
import { Link } from 'react-router-dom';
import {
  GlobeAltIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

const navigation = {
  platform: [
    { name: 'Find Work', href: '/jobs' },
    { name: 'Find Workers', href: '/workers' },
    { name: 'How it Works', href: '/how-it-works' },
    { name: 'Pricing', href: '/pricing' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Safety', href: '/safety' },
    { name: 'Terms', href: '/terms' },
    { name: 'Privacy', href: '/privacy' },
  ],
  social: [
    { name: 'Facebook', icon: GlobeAltIcon, href: '#' },
    { name: 'Twitter', icon: LinkIcon, href: '#' },
    { name: 'LinkedIn', icon: GlobeAltIcon, href: '#' },
    { name: 'Instagram', icon: LinkIcon, href: '#' },
  ],
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white bg-bg-slate-900 border-t border-slate-200 bg-border-slate-800">
      <div className="container py-12 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand */}
          <div className="space-y-8 xl:col-span-1">
            <Link to="/" className="text-2xl font-bold text-blue-600 bg-text-blue-400">
              WorkForge
            </Link>
            <p className="text-sm text-slate-600 bg-text-slate-400 max-w-xs">
              Connecting skilled workers with employers who need their expertise. 
              Find work, hire talent, and get the job done.
            </p>
            <div className="flex space-x-6">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-500 hover:text-gray-600 bg-text-gray-400 bg-hover:text-gray-300"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 bg-text-white uppercase tracking-wider">
                  Platform
                </h3>
                <ul className="mt-4 space-y-4">
                  {navigation.platform.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-sm text-gray-600 hover:text-gray-900 bg-text-gray-400 bg-hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-900 bg-text-white uppercase tracking-wider">
                  Company
                </h3>
                <ul className="mt-4 space-y-4">
                  {navigation.company.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-sm text-gray-600 hover:text-gray-900 bg-text-gray-400 bg-hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-1 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 bg-text-white uppercase tracking-wider">
                  Support
                </h3>
                <ul className="mt-4 space-y-4">
                  {navigation.support.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-sm text-gray-600 hover:text-gray-900 bg-text-gray-400 bg-hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-gray-200 bg-border-gray-800 pt-8">
          <p className="text-sm text-gray-500 bg-text-gray-400 text-center">
            &copy; {new Date().getFullYear()} WorkForge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};