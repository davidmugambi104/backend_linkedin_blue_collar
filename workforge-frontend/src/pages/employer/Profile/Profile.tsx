/**
 * Employer Profile Page - Unified Design System
 */
import React, { useState, useEffect } from 'react';
import {
  PencilIcon,
  MapPinIcon,
  GlobeAltIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  CalendarIcon,
  StarIcon,
  BriefcaseIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { Textarea } from '@components/ui/Textarea';
import { useEmployerProfile, useUpdateEmployerProfile } from '@hooks/useEmployer';
import { formatDate } from '@lib/utils/format';

const Profile: React.FC = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { data: profile, isLoading, error } = useEmployerProfile();
  const updateProfileMutation = useUpdateEmployerProfile();
  
  const [editData, setEditData] = useState({
    company_name: '',
    phone: '',
    website: '',
    description: '',
    address: '',
  });

  useEffect(() => {
    if (profile) {
      setEditData({
        company_name: profile.company_name || '',
        phone: profile.phone || '',
        website: profile.website || '',
        description: profile.description || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    await updateProfileMutation.mutateAsync(editData);
    setIsEditModalOpen(false);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <BuildingOfficeIcon className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load profile
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {error instanceof Error ? error.message : 'Please try again'}
        </p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Company Profile
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage and update your company information
          </p>
        </div>
        <Button
          leftIcon={<PencilIcon className="h-5 w-5" />}
          onClick={() => setIsEditModalOpen(true)}
        >
          Edit Profile
        </Button>
      </div>

      {/* Profile Header Card */}
      <Card className="p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <BuildingOfficeIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.company_name || 'Company Name'}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-gray-500 dark:text-gray-400">
                    Member since {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
                  </span>
                  {(profile?.verification_score || 0) > 0 && (
                    <>
                      <span className="text-gray-400">•</span>
                      <Badge variant="success" className="flex items-center gap-1">
                        <ShieldCheckIcon className="h-4 w-4" />
                        Verified
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {profile?.description && (
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {profile.description}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 lg:p-6" hoverable>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <BriefcaseIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.total_jobs || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-6" hoverable>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <StarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.active_jobs || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-6" hoverable>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Workers Hired</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.total_jobs || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-6" hoverable>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Verification</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{profile?.verification_score || 0}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Contact Information */}
      <Card className="p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <PhoneIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {profile?.phone || 'Not provided'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <GlobeAltIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {profile?.website || 'Not provided'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <MapPinIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {profile?.address || 'Not provided'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Company Profile" size="lg">
        <div className="space-y-4">
          <Input
            label="Company Name"
            value={editData.company_name}
            onChange={(e) => setEditData({...editData, company_name: e.target.value})}
          />
          <Textarea
            label="Description"
            value={editData.description}
            onChange={(e) => setEditData({...editData, description: e.target.value})}
            rows={3}
          />
          <Input
            label="Phone"
            type="tel"
            value={editData.phone}
            onChange={(e) => setEditData({...editData, phone: e.target.value})}
          />
          <Input
            label="Website"
            type="url"
            value={editData.website}
            onChange={(e) => setEditData({...editData, website: e.target.value})}
          />
          <Input
            label="Address"
            value={editData.address}
            onChange={(e) => setEditData({...editData, address: e.target.value})}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleSaveProfile} 
              isLoading={updateProfileMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
