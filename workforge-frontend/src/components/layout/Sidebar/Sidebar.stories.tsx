import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AuthProvider } from '@context/AuthContext';

const meta: Meta<typeof Sidebar> = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/worker/dashboard']}>
        <AuthProvider>
          <div className="min-h-screen bg-slate-50 bg-bg-slate-900">
            <Story />
          </div>
        </AuthProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  args: {
    mobileOpen: false,
    variant: 'default',
  },
};

export const Compact: Story = {
  args: {
    mobileOpen: false,
    variant: 'compact',
  },
};

export const MobileOpen: Story = {
  args: {
    mobileOpen: true,
    variant: 'default',
  },
};
