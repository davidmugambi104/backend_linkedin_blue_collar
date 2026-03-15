/**
 * Worker Settings Page - Unified Design System
 */
import React, { useEffect, useMemo, useState } from 'react';
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
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import { useAuth } from '@context/AuthContext';
import { useWorkerProfile, useUpdateWorkerProfile } from '@hooks/useWorker';
import { userService } from '@services/user.service';
import { toast } from 'react-toastify';

const NOTIFICATION_STORAGE_KEY = 'workerNotificationSettings';

type NotificationSettings = {
  emailNotifications: boolean;
  applicationNotifications: boolean;
  messageNotifications: boolean;
  marketingEmails: boolean;
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNotifications: true,
  applicationNotifications: true,
  messageNotifications: true,
  marketingEmails: false,
};

export const WorkerSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useWorkerProfile();
  const updateProfileMutation = useUpdateWorkerProfile();

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    bio: '',
    daily_rate: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!profile) return;

    setProfileForm({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      address: profile.address || '',
      bio: profile.bio || '',
      daily_rate:
        profile.daily_rate != null
          ? String(profile.daily_rate)
          : profile.hourly_rate != null
          ? String(profile.hourly_rate)
          : '',
    });
  }, [profile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!saved) return;

    try {
      setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) });
    } catch {
      window.localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
    }
  }, []);

  const profileCompleteness = useMemo(() => {
    const values = [
      profileForm.full_name,
      profileForm.phone,
      profileForm.address,
      profileForm.bio,
      profileForm.daily_rate,
    ];
    const completed = values.filter((value) => String(value).trim().length > 0).length;
    return Math.round((completed / values.length) * 100);
  }, [profileForm]);

  const handleSettingChange = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(newSettings));
    }
    toast.success('Notification setting saved on this device');
  };

  const handleProfileSave = async () => {
    await updateProfileMutation.mutateAsync({
      full_name: profileForm.full_name,
      phone: profileForm.phone,
      address: profileForm.address,
      bio: profileForm.bio,
      daily_rate: profileForm.daily_rate ? Number(profileForm.daily_rate) : undefined,
    });
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      toast.error('Current password and new password are required');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setIsSavingPassword(true);
    try {
      await userService.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to change password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )) {
      setIsDeleting(true);
      try {
        if (user?.id) {
          await userService.deleteUser(user.id);
        }
        await logout();
        toast.success('Account deactivated');
        window.location.href = '/';
      } catch (error: any) {
        toast.error(error?.response?.data?.error || 'Failed to deactivate account');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 title-display">
          Settings
        </h1>
        <p className="mt-1 text-slate-600">
          Manage your account and preferences
        </p>
      </div>

      <Card className="p-4 lg:p-6">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-slate-900 mb-6">
          <UserCircleIcon className="w-5 h-5" />
          Profile Settings
        </h2>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Make your profile easier to trust</p>
          <p className="mt-1 text-sm text-slate-600">Use your real name, phone, location, daily wage, and a short bio so employers can contact and shortlist you faster.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            label="Full Name"
            value={profileForm.full_name}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))}
            placeholder="e.g. David Mugambi"
            hint="Shown to employers when they view your profile"
          />
          <Input
            type="tel"
            label="Phone"
            value={profileForm.phone}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="e.g. +254 700 000 000"
            hint="Use a reachable number for job calls and WhatsApp"
          />
          <div className="md:col-span-2">
            <Input
              type="text"
              label="Address"
              value={profileForm.address}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="e.g. Nairobi, Kasarani"
              hint="This helps employers understand your service area"
            />
          </div>
          <Input
            type="number"
            min="0"
            step="0.01"
            label="Daily Wage"
            value={profileForm.daily_rate}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, daily_rate: e.target.value }))}
            placeholder="e.g. 1500"
            hint="Enter your typical daily charge in KES"
          />
          <div className="flex items-end">
            <div className="w-full rounded-lg bg-slate-50 px-4 py-3 border border-slate-200">
              <p className="text-xs text-slate-600">Profile completeness</p>
              <p className="text-lg font-semibold text-slate-900">{profileCompleteness}%</p>
            </div>
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="Bio"
              value={profileForm.bio}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
              className="min-h-[140px]"
              placeholder="Tell employers what work you do best, how many years of experience you have, and why they should hire you."
              hint="A short, specific bio usually converts better than a long generic one."
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={handleProfileSave} isLoading={updateProfileMutation.isPending || isProfileLoading}>
            Save Profile
          </Button>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-4 lg:p-6">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-slate-900 mb-6">
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
              className="flex items-center justify-between py-3 border-b border-slate-200 last:border-b-0"
            >
              <div>
                <p className="font-medium text-slate-900">{notification.label}</p>
                <p className="text-sm text-slate-600">{notification.description}</p>
              </div>
              <button
                type="button"
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
      <Card className="p-4 lg:p-6">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-slate-900 mb-6">
          <ShieldCheckIcon className="w-5 h-5" />
          Security
        </h2>

        <div className="space-y-4">
          <div className="py-1 border-b border-slate-200 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <LockClosedIcon className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Change Password</p>
                <p className="text-sm text-slate-600">Update your password regularly</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="password"
                label="Current Password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
                placeholder="Current password"
              />
              <Input
                type="password"
                label="New Password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
                placeholder="New password"
                hint="Use at least 8 characters"
              />
              <Input
                type="password"
                label="Confirm New Password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={handlePasswordChange} isLoading={isSavingPassword}>
                Change Password
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-medium text-amber-900">Password Recovery Support</p>
            <p className="mt-1 text-sm text-amber-800">
              If you use Forgot Password and do not receive a reset code, contact support for private recovery.
              A support admin can issue a short-lived one-time code after identity verification.
            </p>
            <p className="mt-2 text-xs text-amber-700">
              For your privacy, recovery codes are never shown publicly and are only shared through verified support channels.
            </p>
          </div>

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <DevicePhoneMobileIcon className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                <p className="text-sm text-slate-600">
                  2FA is not yet available on the backend. Password change is live and working.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Coming Soon
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Status */}
      <Card className="p-4 lg:p-6 bg-blue-50 border-blue-200">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-slate-900 mb-6">
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
          Account Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <EnvelopeIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Email</p>
              <p className="text-sm font-medium text-slate-900">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <UserCircleIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Status</p>
              {user?.is_verified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
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

        <p className="text-slate-600 mb-4">
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
