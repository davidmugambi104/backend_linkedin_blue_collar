import React from 'react';
import { cn } from '@lib/utils/cn';
import { TabsProps, TabPanelProps } from './Tabs.types';

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  fullWidth = false,
  className,
}) => {
  const variants = {
    default: {
      container: 'border-b border-gray-200 dark:border-gray-800',
      tab: 'px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
      active: 'border-b-2 border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500',
      disabled: 'opacity-50 cursor-not-allowed',
    },
    pills: {
      container: 'space-x-2',
      tab: 'px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
      active: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
      disabled: 'opacity-50 cursor-not-allowed',
    },
    underline: {
      container: '',
      tab: 'px-1 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
      active: 'border-b-2 border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500',
      disabled: 'opacity-50 cursor-not-allowed',
    },
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('flex', variants[variant].container, fullWidth && 'w-full')}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cn(
              variants[variant].tab,
              activeTab === tab.id && variants[variant].active,
              tab.disabled && variants[variant].disabled,
              fullWidth && 'flex-1'
            )}
            disabled={tab.disabled}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            <div className="flex items-center justify-center gap-2">
              {tab.icon}
              {tab.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const TabPanel: React.FC<TabPanelProps> = ({ id, activeTab, children, className }) => {
  if (id !== activeTab) return null;
  
  return (
    <div className={cn('mt-4', className)} role="tabpanel">
      {children}
    </div>
  );
};

TabPanel.displayName = 'TabPanel';