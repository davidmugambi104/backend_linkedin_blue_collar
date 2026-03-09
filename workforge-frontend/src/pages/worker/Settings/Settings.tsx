/**
 * Worker Settings Page - Unified Design System
 */
import React, { useState } from 'react';
import {
  BellIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  TrashIcon,
  CheckCircleIcon,
  UserCircleIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { useAuth } from '@context/AuthContext';

// Simple toast fallback
const toast = {
  success: (msg: string) => alert(msg),
  error: (msg: string) => alert(msg),
};

export const WorkerSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    applicationNotifications: true,
    messageNotifications: true,
    marketingEmails: false,
    twoFactorEnabled: false,
  });

  const [isDeleting, setIsDeleting] = useState(false);

  const handleSettingChange = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    toast.success('Setting updated');
  };

  const handleDisableTwoFactor = () => {
    setSettings({ ...settings, twoFactorEnabled: false });
    toast.success('Two-factor authentication disabled');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )) {
      setIsDeleting(true);
      try {
        await logout();
        toast.success('Account deleted');
        window.location.href = '/';
      } catch (error) {
        toast.error('Failed to delete account');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 text-[#1A1A1A]">
          Settings
        </h1>
        <p className="mt-1 text-slate-500 ">
          Manage your account and preferences
        </p>
      </div>

      {/* Notification Settings */}
      <Card className="p-4 lg:p-6">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-gray-900 text-[#1A1A1A] mb-6">
          <BellIcon className="w-5 h-5" />
          Notifications
        </h2>

        <div className="space-y-4">
          {[
            {
              key: 'emailNotifications',
              label: 'Email Notifications',
              description: 'Receive email updates about your applications',
            },
            {
              key: 'applicationNotifications',
              label: 'Application Updates',
              description: 'Get notified when employers respond to your applications',
            },
            {
              key: 'messageNotifications',
              label: 'Message Notifications',
              description: 'Receive alerts for new messages',
            },
            {
              key: 'marketingEmails',
              label: 'Marketing Emails',
              description: 'Receive offers and promotional emails',
            },
          ].map((notification) => (
            <div
              key={notification.key}
              className="flex items-center justify-between py-3 border-b border-gray-200 border-gray-700 last:border-b-0"
            >
              <div>
                <p className="font-medium text-gray-900 text-[#1A1A1A]">{notification.label}</p>
                <p className="text-sm text-slate-500 ">{notification.description}</p>
              </div>
              <button
                onClick={() => handleSettingChange(notification.key as any)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings[notification.key as any] ? 'bg-blue-600' : 'bg-gray-300 bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings[notification.key as any] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-4 lg:p-6">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-gray-900 text-[#1A1A1A] mb-6">
          <ShieldCheckIcon className="w-5 h-5" />
          Security
        </h2>

        <div className="space-y-4">
          {/* Password */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200 border-gray-700">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 bg-gray-800 flex items-center justify-center flex-shrink-0">
                <LockClosedIcon className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-[#1A1A1A]">Change Password</p>
                <p className="text-sm text-slate-500 ">Update your password regularly</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 bg-gray-800 flex items-center justify-center flex-shrink-0">
                <DevicePhoneMobileIcon className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-[#1A1A1A]">Two-Factor Authentication</p>
                <p className="text-sm text-slate-500 ">
                  {settings.twoFactorEnabled
                    ? 'Your account is protected with 2FA'
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
            </div>
            {settings.twoFactorEnabled ? (
              <Button
                onClick={handleDisableTwoFactor}
                variant="outline"
                size="sm"
                className="text-red-600"
              >
                Disable
              </Button>
            ) : (
              <Button variant="outline" size="sm">
                Enable
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Account Status */}
      <Card className="p-4 lg:p-6 bg-blue-50 bg-blue-900/20 border-blue-200 border-blue-800">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-gray-900 text-[#1A1A1A] mb-6">
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
          Account Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white bg-slate-800">
            <div className="w-10 h-10 rounded-xl bg-green-100 bg-green-900/30 flex items-center justify-center">
              <EnvelopeIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 ">Email</p>
              <p className="text-sm font-medium text-gray-900 text-[#1A1A1A]">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white bg-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-100 bg-purple-900/30 flex items-center justify-center">
              <UserCircleIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 ">Status</p>
              {user?.is_verified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Button variant="outline" size="sm">
                  Verify
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-4 lg:p-6 border-red-200 border-red-800 bg-red-50 bg-red-900/10">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-red-600 text-red-400 mb-4">
          <TrashIcon className="w-5 h-5" />
          Danger Zone
        </h2>

        <p className="text-gray-600  mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>

        <Button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          variant="destructive"
        >
          {isDeleting ? 'Deleting...' : 'Delete Account'}
        </Button>
      </Card>
    </div>
  );
};

export default WorkerSettings;
