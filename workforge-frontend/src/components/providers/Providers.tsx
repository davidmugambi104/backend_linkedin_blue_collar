import type { PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from 'react-toastify';
import { queryClient } from '@lib/queryClient';
import { AuthProvider } from '@context/AuthContext';
import 'react-toastify/dist/ReactToastify.css';

export const Providers = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        {children}
        <ToastContainer position="top-right" autoClose={5000} theme="light" />
      </AuthProvider>
    </BrowserRouter>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);
