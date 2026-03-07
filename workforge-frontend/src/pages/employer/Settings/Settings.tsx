/**
 * Employer Settings Page - Unified Design System
 */
import React, { useState } from 'react';
import {
  BellIcon,
  LockClosedIcon,
  TrashIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { useAuth } from '@context/AuthContext';

const Settings: React.FC = () => {
  const { user } = useAuth();
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
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Manage your account preferences and security
        </p>
      </div>

      {/* Notification Settings */}
      <Card className="p-4 lg:p-6">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white mb-6">
          <BellIcon className="w-5 h-5" />
          Notification Preferences
        </h2>
        
        <div className="space-y-4">
          {[
            { key: 'jobNotifications', label: 'Job Notifications', description: 'Receive notifications about matching workers' },
            { key: 'applicationNotifications', label: 'Application Updates', description: 'Get notified when workers apply to your jobs' },
            { key: 'messageNotifications', label: 'Message Notifications', description: 'Receive messages from workers' },
            { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Summary of activity each week' },
          ].map(notif => (
            <div 
              key={notif.key} 
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{notif.label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{notif.description}</p>
              </div>
              <button
                onClick={() => handleToggleSetting(notif.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings[notif.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings[notif.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-4 lg:p-6">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white mb-6">
          <LockClosedIcon className="w-5 h-5" />
          Security & Privacy
        </h2>

        {/* Account Verification Status */}
        <div className="mb-6 p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ShieldCheckIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-400">Account Verified</p>
              <p className="text-sm text-green-700 dark:text-green-500">Your account has been verified and is in good standing</p>
            </div>
          </div>
        </div>

        {/* Password Change */}
        {!showPasswordChange ? (
          <Button 
            variant="outline" 
            onClick={() => setShowPasswordChange(true)} 
            className="mb-6"
          >
            Change Password
          </Button>
        ) : (
          <div className="space-y-4 mb-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <Input
              type="password"
              label="Current Password"
              value={passwordData.current}
              onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
              placeholder="Enter current password"
            />
            <Input
              type="password"
              label="New Password"
              value={passwordData.new}
              onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
              placeholder="Enter new password"
            />
            <Input
              type="password"
              label="Confirm Password"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
              placeholder="Confirm new password"
            />
            <div className="flex gap-3">
              <Button onClick={handleChangePassword}>Update Password</Button>
              <Button variant="outline" onClick={() => setShowPasswordChange(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Two-Factor Authentication */}
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
              </div>
            </div>
            <Button
              variant={settings.twoFactorEnabled ? 'outline' : 'default'}
              size="sm"
            >
              {settings.twoFactorEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Info */}
      <Card className="p-4 lg:p-6">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white mb-6">
          <EnvelopeIcon className="w-5 h-5" />
          Account Information
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <EnvelopeIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ShieldCheckIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <Badge variant="success">Verified</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-4 lg:p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          <TrashIcon className="w-5 h-5" />
          Danger Zone
        </h2>
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Deleting your account is permanent and cannot be undone. All your job postings and data will be deleted.
          </p>
          <Button variant="destructive">
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
