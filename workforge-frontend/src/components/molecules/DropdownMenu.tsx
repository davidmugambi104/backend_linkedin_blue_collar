import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@utils/cn';
import type { ReactNode } from 'react';

export interface DropdownOption {
  label: string;
  onClick: () => void;
}

export interface DropdownMenuProps {
  label?: string;
  trigger?: ReactNode;
  options: DropdownOption[];
}

export const DropdownMenu = ({ label = 'Menu', trigger, options }: DropdownMenuProps) => (
  <Menu as="div" className="relative inline-block text-left">
    <Menu.Button
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2',
        trigger && 'h-10 w-10 justify-center p-0',
      )}
      aria-label={label}
    >
      {trigger ?? (
        <>
          {label}
          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
        </>
      )}
    </Menu.Button>
    <Transition
      as={Fragment}
      enter="transition duration-200"
      enterFrom="opacity-0 scale-95"
      enterTo="opacity-100 scale-100"
      leave="transition duration-150"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
    >
      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-level-2 focus:outline-none">
        {options.map((option) => (
          <Menu.Item key={option.label}>
            {({ active }) => (
              <button
                type="button"
                onClick={option.onClick}
                className={cn('w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors duration-200', active && 'bg-gray-100')}
              >
                {option.label}
              </button>
            )}
          </Menu.Item>
        ))}
      </Menu.Items>
    </Transition>
  </Menu>
);
