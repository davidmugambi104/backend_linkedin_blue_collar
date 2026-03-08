import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, InputField, Label, ToggleSwitch } from '@components/atoms';
import { Tabs } from '@components/molecules';

interface SettingsValues {
  companyName: string;
  email: string;
}

const tabs = [
  { value: 'account', label: 'Account' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'security', label: 'Security' },
  { value: 'team', label: 'Team' },
];

export const SettingsForm = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [notifications, setNotifications] = useState(true);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<SettingsValues>({
    defaultValues: {
      companyName: 'Workforge Inc.',
      email: 'employer@workforge.com',
    },
  });

  return (
    <section className="rounded-lg bg-white p-6 shadow-level-1">
      <Tabs items={tabs} active={activeTab} onChange={setActiveTab} />
      <form className="mt-4 space-y-4" onSubmit={handleSubmit(() => undefined)}>
        <div>
          <Label htmlFor="companyName">Company name</Label>
          <InputField id="companyName" {...register('companyName')} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <InputField id="email" type="email" {...register('email')} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
          <span className="text-sm text-gray-700">Enable email notifications</span>
          <ToggleSwitch checked={notifications} onChange={setNotifications} />
        </div>
        <Button type="submit" loading={isSubmitting}>Save Changes</Button>
      </form>
    </section>
  );
}
