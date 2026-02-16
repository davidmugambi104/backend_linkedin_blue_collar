import React, { useState, useEffect } from 'react';
import { PencilIcon, MapPinIcon, GlobeAltIcon, PhoneIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Skeleton } from '@components/ui/Skeleton';
import { useEmployerProfile, useUpdateEmployerProfile } from '@hooks/useEmployer';

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border border-red-200 rounded-2xl p-6">
        <p className="text-red-600">Error loading profile</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Company Profile</h1>
          <p className="mt-2 text-[#64748B]">Manage and update your company information</p>
        </div>
        <Button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center space-x-2 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
        >
          <PencilIcon className="h-4 w-4" />
          <span>Edit Profile</span>
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-8">
        <div className="flex items-start space-x-6">
          <div className="h-24 w-24 rounded-lg bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
            <IdentificationIcon className="h-12 w-12" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#0F172A]">{profile?.company_name}</h2>
            <p className="mt-1 text-[#64748B]">
              Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
            </p>
            <p className="mt-4 text-[#64748B]">{profile?.description}</p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#F8FAFC] rounded-2xl p-6">
          <p className="text-sm text-[#64748B]">Active Jobs</p>
          <p className="mt-2 text-3xl font-bold text-[#0F172A]">{profile?.total_jobs || 0}</p>
        </Card>
        <Card className="bg-[#F8FAFC] rounded-2xl p-6">
          <p className="text-sm text-[#64748B]">Jobs in Progress</p>
          <p className="mt-2 text-3xl font-bold text-[#0F172A]">{profile?.active_jobs || 0}</p>
        </Card>
        <Card className="bg-[#F8FAFC] rounded-2xl p-6">
          <p className="text-sm text-[#64748B]">Verification Score</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{profile?.verification_score || 0}%</p>
        </Card>
      </div>

      {/* Contact Information */}
      <Card className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <PhoneIcon className="h-5 w-5 text-[#64748B]" />
            <div>
              <p className="text-sm text-[#64748B]">Phone</p>
              <p className="font-medium text-[#0F172A]">{profile?.phone || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <GlobeAltIcon className="h-5 w-5 text-[#64748B]" />
            <div>
              <p className="text-sm text-[#64748B]">Website</p>
              <p className="font-medium text-[#0F172A]">{profile?.website || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 md:col-span-2">
            <MapPinIcon className="h-5 w-5 text-[#64748B]" />
            <div>
              <p className="text-sm text-[#64748B]">Address</p>
              <p className="font-medium text-[#0F172A]">
                {profile?.address || 'Not provided'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} size="lg">
        <Modal.Header onClose={() => setIsEditModalOpen(false)}>Edit Company Profile</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <Input
                value={editData.company_name}
                onChange={(e) => setEditData({...editData, company_name: e.target.value})}
                className="border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({...editData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={editData.phone}
                onChange={(e) => setEditData({...editData, phone: e.target.value})}
                className="border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <Input
                value={editData.website}
                onChange={(e) => setEditData({...editData, website: e.target.value})}
                className="border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <Input
                value={editData.address}
                onChange={(e) => setEditData({...editData, address: e.target.value})}
                className="border border-[#E2E8F0] rounded-lg"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]">Cancel</Button>
          <Button
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
            className="rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1E3A8A] active:scale-95"
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Profile;
