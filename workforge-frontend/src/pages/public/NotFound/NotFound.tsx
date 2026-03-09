import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* 404 Text */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4">
            404
          </h1>
          <p className="text-3xl md:text-4xl font-bold text-white mb-2">Page Not Found</p>
          <p className="text-lg text-slate-400 mb-8">
            Oops! The page you're looking for doesn't exist.
          </p>
        </div>

        {/* Description */}
        <div className="mb-12 max-w-md">
          <p className="text-slate-300 mb-6">
            It might have been removed, renamed, or you might have mistyped the URL. 
            Let's get you back on track!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            Back to Home
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="px-8 py-3 border-2 border-gray-400 text-slate-300 font-semibold rounded-lg hover:border-gray-200 hover:text-white transition-all"
          >
            Go Back
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 text-sm text-slate-400">
          <p>Need help? <a href="/" className="text-blue-400 hover:text-blue-300 underline">Contact support</a></p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
