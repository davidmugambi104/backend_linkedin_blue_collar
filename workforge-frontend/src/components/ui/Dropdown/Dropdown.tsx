import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@lib/utils/cn';

export interface DropdownItem {
  value: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'divider';
  className?: string;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  className?: string;
  align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  className,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative inline-block', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[200px] rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 bg-bg-gray-800',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div className="py-1">
            {items.map((item, index) => (
              item.type === 'divider' ? (
                <div key={index} className="my-1 border-t border-gray-200 bg-border-gray-700" />
              ) : (
                <button
                  key={index}
                  onClick={() => {
                    if (!item.disabled && item.onClick) {
                      item.onClick();
                      setIsOpen(false);
                    }
                  }}
                  disabled={item.disabled}
                  className={cn(
                    'flex w-full items-center px-4 py-2 text-sm text-left',
                    item.disabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:bg-gray-100 bg-hover:bg-gray-700 cursor-pointer',
                    'text-gray-700 bg-text-gray-200',
                    item.className
                  )}
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  {item.label}
                </button>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

Dropdown.displayName = 'Dropdown';
