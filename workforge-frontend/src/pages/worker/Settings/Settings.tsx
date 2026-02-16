import React, { useState } from 'react';
import {
  BellIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  TrashIcon,
  CheckCircleIcon,
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
        // API call to delete account would go here
        await logout();
        toast.success('account deleted');
        window.location.href = '/';
      } catch (error) {
        toast.error('Failed to delete account');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Notification Settings */}
      <Card className="p-8">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 mb-6">
          <BellIcon className="w-6 h-6" />
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
              className="flex items-center justify-between py-3 border-b last:border-b-0"
            >
              <div>
                <p className="font-medium text-gray-900">{notification.label}</p>
                <p className="text-sm text-gray-600">{notification.description}</p>
              </div>
              <button
                onClick={() => handleSettingChange(notification.key as any)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings[notification.key as any] ? 'bg-blue-600' : 'bg-gray-300'
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
      <Card className="p-8">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 mb-6">
          <ShieldCheckIcon className="w-6 h-6" />
          Security
        </h2>

        <div className="space-y-4">
          {/* Password */}
          <div className="flex items-center justify-between py-4 border-b">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LockClosedIcon className="w-5 h-5 text-gray-700" />
                <p className="font-medium text-gray-900">Change Password</p>
              </div>
              <p className="text-sm text-gray-600">Update your password regularly</p>
            </div>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-gray-900 mb-1">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">
                {settings.twoFactorEnabled
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security to your account'}
              </p>
            </div>
            {settings.twoFactorEnabled ? (
              <Button
                onClick={handleDisableTwoFactor}
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
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
      <Card className="p-8 bg-blue-50 border-blue-200">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 mb-6">
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
          Account Status
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Email Verified</span>
            {user?.is_verified ? (
              <Badge variant="success">Verified</Badge>
            ) : (
              <Button variant="outline" size="sm">
                Verify Email
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-8 border-red-200 bg-red-50">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-red-600 mb-6">
          <TrashIcon className="w-6 h-6" />
          Danger Zone
        </h2>

        <p className="text-gray-700 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>

        <Button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isDeleting ? 'Deleting...' : 'Delete Account'}
        </Button>
      </Card>
    </div>
  );
};

export default WorkerSettings;
