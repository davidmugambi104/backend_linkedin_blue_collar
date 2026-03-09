import React from 'react';
import { Spinner } from '@components/ui/Spinner';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-bg-gray-900">
      <div className="text-center">
        <Spinner size="xl" color="primary" />
        <p className="mt-4 text-sm text-gray-500 bg-text-gray-400 animate-pulse">
          Loading WorkForge...
        </p>
      </div>
    </div>
  );
};