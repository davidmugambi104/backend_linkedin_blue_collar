import { cn } from '@utils/cn';

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (value: string) => void;
}

export const Tabs = ({ items, active, onChange }: TabsProps) => (
  <div className="border-b border-gray-200">
    {items.map((tab) => {
      const isActive = tab.value === active;
      return (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            'inline-block px-4 py-2 text-sm font-medium transition-colors duration-200',
            isActive ? 'border-b-2 border-primary-blue text-primary-blue' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);
