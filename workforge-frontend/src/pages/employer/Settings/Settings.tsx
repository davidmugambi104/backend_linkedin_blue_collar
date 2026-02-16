import React, { useState } from 'react';
import { BellIcon, LockClosedIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    jobNotifications: true,
    applicationNotifications: true,
    messageNotifications: true,
    weeklyDigest: true,
    twoFactorEnabled: false,
    verificationStatus: 'verified',
  });

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleToggleSetting = (key: string) => {
    setSettings({...settings, [key]: !settings[key]});
  };

  const handleChangePassword = () => {
    if (passwordData.new === passwordData.confirm && passwordData.current && passwordData.new) {
      alert('Password changed successfully');
      setPasswordData({current: '', new: '', confirm: ''});
      setShowPasswordChange(false);
    } else {
      alert('Passwords do not match or are empty');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Settings</h1>
        <p className="mt-2 text-[#64748B]">Manage your account preferences and security</p>
      </div>

      {/* Notification Settings */}
      <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <BellIcon className="h-6 w-6 text-[#2563EB]" />
          <h2 className="text-xl font-semibold text-[#0F172A]">Notification Preferences</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: 'jobNotifications', label: 'Job Notifications', description: 'Receive notifications about matching jobs' },
            { key: 'applicationNotifications', label: 'Application Updates', description: 'Get notified when workers apply to your jobs' },
            { key: 'messageNotifications', label: 'Message Notifications', description: 'Receive messages from workers' },
            { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Summary of activity each week' },
          ].map(notif => (
            <div key={notif.key} className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-lg">
              <div>
                <p className="font-medium text-[#0F172A]">{notif.label}</p>
                <p className="text-sm text-[#64748B]">{notif.description}</p>
              </div>
              <input
                type="checkbox"
                checked={settings[notif.key as keyof typeof settings] as boolean}
                onChange={() => handleToggleSetting(notif.key)}
                className="h-4 w-4 rounded accent-[#2563EB]"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <LockClosedIcon className="h-6 w-6 text-[#2563EB]" />
          <h2 className="text-xl font-semibold text-[#0F172A]">Security & Privacy</h2>
        </div>

        {/* Account Verification */}
        <div className="mb-6 p-4 border border-green-200 rounded-lg bg-green-50">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Account Verified</p>
              <p className="text-sm text-green-800">Your account has been verified and is in good standing</p>
            </div>
          </div>
        </div>

        {/* Password Change */}
        {!showPasswordChange ? (
          <Button variant="outline" onClick={() => setShowPasswordChange(true)} className="mb-6 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]">
            Change Password
          </Button>
        ) : (
          <div className="space-y-4 mb-6 p-4 border border-[#E2E8F0] rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <Input
                type="password"
                value={passwordData.current}
                onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                placeholder="Enter current password"
                className="border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <Input
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                placeholder="Enter new password"
                className="border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <Input
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                placeholder="Confirm new password"
                className="border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleChangePassword} className="rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1E3A8A] active:scale-95">Update Password</Button>
              <Button variant="outline" onClick={() => setShowPasswordChange(false)} className="rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]">Cancel</Button>
            </div>
          </div>
        )}

        {/* Two-Factor Authentication */}
        <div className="p-4 border border-[#E2E8F0] rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#0F172A]">Two-Factor Authentication</p>
              <p className="text-sm text-[#64748B]">Add an extra layer of security</p>
            </div>
            <Button
              variant={settings.twoFactorEnabled ? 'outline' : 'default'}
              onClick={() => handleToggleSetting('twoFactorEnabled')}
              className={settings.twoFactorEnabled
                ? 'rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]'
                : 'rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1E3A8A] active:scale-95'
              }
            >
              {settings.twoFactorEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-white border border-red-200 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <TrashIcon className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 mb-3">
            Deleting your account is permanent and cannot be undone. All your job postings and data will be deleted.
          </p>
          <Button variant="outline" className="rounded-xl border border-red-200 text-red-600 hover:bg-red-50">
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
