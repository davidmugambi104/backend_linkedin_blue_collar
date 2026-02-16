import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';
import { AuthProvider } from '@context/AuthContext';

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <AuthProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <Story />
          </div>
        </AuthProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Header>;

export const Public: Story = {
  args: {
    variant: 'public',
  },
};

export const Dashboard: Story = {
  args: {
    variant: 'dashboard',
    title: 'Dashboard',
    subtitle: 'Welcome back',
  },
};
