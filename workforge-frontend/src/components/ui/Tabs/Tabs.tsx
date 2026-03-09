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
      container: 'border-b border-slate-200',
      tab: 'px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-700',
      active: 'border-b-2 border-[#0A2540] text-[#0A2540]',
      disabled: 'opacity-50 cursor-not-allowed',
    },
    pills: {
      container: 'space-x-2',
      tab: 'px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100',
      active: 'bg-[#0A2540] text-white',
      disabled: 'opacity-50 cursor-not-allowed',
    },
    underline: {
      container: '',
      tab: 'px-1 py-2 text-sm font-medium text-slate-500 hover:text-slate-700',
      active: 'border-b-2 border-[#0A2540] text-[#0A2540]',
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