import { useState } from 'react';
import { 
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  KeyIcon,
  GlobeAltIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Tab Navigation
const Tabs: React.FC<{
  tabs: { id: string; label: string; icon: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
}> = ({ tabs, activeTab, onChange }) => (
  <div className="flex gap-1 border-b border-charcoal-200 pb-0 overflow-x-auto">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
          activeTab === tab.id
            ? 'border-navy text-navy'
            : 'border-transparent text-muted hover:text-charcoal'
        }`}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </div>
);

// Form Field
interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, children }) => (
  <div className="mb-5">
    <label className="block text-sm font-medium text-charcoal mb-2">{label}</label>
    {children}
  </div>
);

// Toggle Switch
const Toggle: React.FC<{
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
}> = ({ enabled, onChange, label }) => (
  <button
    role="switch"
    aria-checked={enabled}
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled ? 'bg-navy' : 'bg-charcoal-300'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
    {label && <span className="ml-3 text-sm text-charcoal">{label}</span>}
  </button>
);

// Section Card
const SectionCard: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <div className="solid-card p-6 mb-6">
    <h3 className="text-lg font-semibold text-charcoal mb-1">{title}</h3>
    {description && <p className="text-sm text-muted mb-5">{description}</p>}
    {children}
  </div>
);

// Profile Tab
const ProfileTab: React.FC = () => (
  <div className="animate-fade-in-up">
    <SectionCard 
      title="Company Information"
      description="Update your company details and branding"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Company Name">
          <input type="text" className="input-field" defaultValue="WorkForge Builders" />
        </FormField>
        <FormField label="Industry">
          <select className="input-field">
            <option>Construction</option>
            <option>Manufacturing</option>
            <option>Infrastructure</option>
          </select>
        </FormField>
        <FormField label="Contact Email">
          <input type="email" className="input-field" defaultValue="contact@workforge.com" />
        </FormField>
        <FormField label="Phone Number">
          <input type="tel" className="input-field" defaultValue="+1 (555) 123-4567" />
        </FormField>
        <FormField label="Company Size">
          <select className="input-field">
            <option>1-10 employees</option>
            <option>11-50 employees</option>
            <option>51-200 employees</option>
            <option>200+ employees</option>
          </select>
        </FormField>
        <FormField label="Website">
          <input type="url" className="input-field" defaultValue="https://workforge.com" />
        </FormField>
      </div>
      <div className="mt-5">
        <FormField label="Company Description">
          <textarea 
            className="input-field min-h-[120px] resize-none" 
            defaultValue="WorkForge Builders is a leading construction company specializing in commercial and residential projects across Texas."
          />
        </FormField>
      </div>
      <div className="flex justify-end mt-5">
        <button className="btn-primary">Save Changes</button>
      </div>
    </SectionCard>

    <SectionCard title="Profile Photo">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-xl bg-navy flex items-center justify-center text-white font-bold text-2xl">
          WF
        </div>
        <div>
          <button className="btn-secondary text-sm mb-2">Upload New Logo</button>
          <p className="text-xs text-muted">PNG, JPG up to 2MB. Recommended: 200x200px</p>
        </div>
      </div>
    </SectionCard>
  </div>
);

// Notifications Tab
const NotificationsTab: React.FC = () => {
  const [settings, setSettings] = useState({
    emailApplications: true,
    emailMessages: true,
    emailMarketing: false,
    pushApplications: true,
    pushMessages: true,
    pushHiring: true,
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="animate-fade-in-up">
      <SectionCard 
        title="Email Notifications"
        description="Choose what emails you want to receive"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-charcoal-100">
            <div>
              <p className="font-medium text-charcoal">New Applications</p>
              <p className="text-sm text-muted">Get notified when someone applies to your jobs</p>
            </div>
            <Toggle 
              enabled={settings.emailApplications} 
              onChange={(v) => updateSetting('emailApplications', v)} 
            />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-charcoal-100">
            <div>
              <p className="font-medium text-charcoal">Messages</p>
              <p className="text-sm text-muted">Receive email for new messages from workers</p>
            </div>
            <Toggle 
              enabled={settings.emailMessages} 
              onChange={(v) => updateSetting('emailMessages', v)} 
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-charcoal">Marketing & Updates</p>
              <p className="text-sm text-muted">Product news, tips, and promotional content</p>
            </div>
            <Toggle 
              enabled={settings.emailMarketing} 
              onChange={(v) => updateSetting('emailMarketing', v)} 
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard 
        title="Push Notifications"
        description="Real-time alerts on your device"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-charcoal-100">
            <div>
              <p className="font-medium text-charcoal">Application Updates</p>
              <p className="text-sm text-muted">Instant alerts for new applications</p>
            </div>
            <Toggle 
              enabled={settings.pushApplications} 
              onChange={(v) => updateSetting('pushApplications', v)} 
            />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-charcoal-100">
            <div>
              <p className="font-medium text-charcoal">Messages</p>
              <p className="text-sm text-muted">Real-time message notifications</p>
            </div>
            <Toggle 
              enabled={settings.pushMessages} 
              onChange={(v) => updateSetting('pushMessages', v)} 
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-charcoal">Hiring Activity</p>
              <p className="text-sm text-muted">Updates on workers you&apos;ve hired</p>
            </div>
            <Toggle 
              enabled={settings.pushHiring} 
              onChange={(v) => updateSetting('pushHiring', v)} 
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

// Security Tab
const SecurityTab: React.FC = () => (
  <div className="animate-fade-in-up">
    <SectionCard 
      title="Password"
      description="Update your password to keep your account secure"
    >
      <div className="space-y-4 max-w-md">
        <FormField label="Current Password">
          <input type="password" className="input-field" placeholder="Enter current password" />
        </FormField>
        <FormField label="New Password">
          <input type="password" className="input-field" placeholder="Enter new password" />
        </FormField>
        <FormField label="Confirm New Password">
          <input type="password" className="input-field" placeholder="Confirm new password" />
        </FormField>
        <button className="btn-primary">Update Password</button>
      </div>
    </SectionCard>

    <SectionCard title="Two-Factor Authentication">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-charcoal">Add an extra layer of security</p>
          <p className="text-sm text-muted mt-1">Require a verification code in addition to your password</p>
        </div>
        <button className="btn-secondary">Enable 2FA</button>
      </div>
    </SectionCard>

    <SectionCard title="Active Sessions">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-charcoal-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-navy flex items-center justify-center text-white">
              💻
            </div>
            <div>
              <p className="font-medium text-charcoal">MacBook Pro - Chrome</p>
              <p className="text-sm text-muted">Dallas, TX • Current session</p>
            </div>
          </div>
          <span className="badge-success">Active</span>
        </div>
        <div className="flex items-center justify-between p-4 border border-charcoal-200 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-charcoal-100 flex items-center justify-center">
              📱
            </div>
            <div>
              <p className="font-medium text-charcoal">iPhone 14 - Safari</p>
              <p className="text-sm text-muted">Dallas, TX • Last active 2 hours ago</p>
            </div>
          </div>
          <button className="text-sm text-red-600 hover:underline">Revoke</button>
        </div>
      </div>
    </SectionCard>
  </div>
);

// Billing Tab
const BillingTab: React.FC = () => (
  <div className="animate-fade-in-up">
    <SectionCard 
      title="Current Plan"
      description="Manage your subscription and billing"
    >
      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-navy-700 to-navy-800 rounded-xl text-white">
        <div>
          <p className="text-sm text-white/70">Current Plan</p>
          <h4 className="text-xl font-bold mt-1">Professional</h4>
          <p className="text-sm text-white/70 mt-1">$49/month • Billed monthly</p>
        </div>
        <button className="btn bg-white text-navy hover:bg-white/90">Upgrade Plan</button>
      </div>
    </SectionCard>

    <SectionCard title="Payment Method">
      <div className="flex items-center justify-between p-4 border border-charcoal-200 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-charcoal-100 rounded flex items-center justify-center text-sm font-bold">
            💳
          </div>
          <div>
            <p className="font-medium text-charcoal">•••• •••• •••• 4242</p>
            <p className="text-sm text-muted">Expires 12/2027</p>
          </div>
        </div>
        <button className="btn-ghost text-sm">Edit</button>
      </div>
    </SectionCard>

    <SectionCard title="Billing History">
      <div className="overflow-x-auto">
        <table className="employer-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-charcoal">Mar 1, 2026</td>
              <td className="text-charcoal">Professional Plan</td>
              <td className="text-charcoal">$49.00</td>
              <td><span className="badge-success">Paid</span></td>
            </tr>
            <tr>
              <td className="text-charcoal">Feb 1, 2026</td>
              <td className="text-charcoal">Professional Plan</td>
              <td className="text-charcoal">$49.00</td>
              <td><span className="badge-success">Paid</span></td>
            </tr>
            <tr>
              <td className="text-charcoal">Jan 1, 2026</td>
              <td className="text-charcoal">Professional Plan</td>
              <td className="text-charcoal">$49.00</td>
              <td><span className="badge-success">Paid</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>
  </div>
);

// Settings Page
const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <UserCircleIcon className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <ShieldCheckIcon className="w-5 h-5" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCardIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'billing' && <BillingTab />}
      </div>
    </div>
  );
};

export default Settings;
