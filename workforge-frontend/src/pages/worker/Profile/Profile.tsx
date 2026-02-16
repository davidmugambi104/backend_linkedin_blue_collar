import React, { useState } from 'react';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  StarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useWorkerProfile, useUpdateWorkerProfile } from '@hooks/useWorker';
import { useAuth } from '@context/AuthContext';
import { Modal } from '@components/ui/Modal';

export const WorkerProfile: React.FC = () => {
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useWorkerProfile();
  const { mutate: updateProfile, isPending } = useUpdateWorkerProfile();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profile?.user?.first_name || '',
    last_name: profile?.user?.last_name || '',
    phone: profile?.user?.phone || '',
    hourly_rate: profile?.hourly_rate || 0,
    years_experience: profile?.years_experience || 0,
    availability: profile?.availability || '',
  });

  const handleSave = () => {
    updateProfile(formData as any, {
      onSuccess: () => {
        setIsEditOpen(false);
      },
    });
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">Manage your professional information</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-60" />
        </div>
      ) : (
        <>
          {/* Primary Info Card */}
          <Card className="p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile?.user?.first_name} {profile?.user?.last_name}
                  </h2>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                    {profile?.rating?.toFixed(1) || '0.0'} • {profile?.completed_jobs || 0} jobs completed
                  </p>
                </div>
              </div>
              <Button onClick={() => setIsEditOpen(true)}>Edit Profile</Button>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-8 border-t">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900 flex items-center gap-2">
                  <EnvelopeIcon className="w-4 h-4" />
                  {profile?.user?.email}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-gray-900 flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4" />
                  {profile?.user?.phone || 'Not provided'}
                </p>
              </div>
              {profile?.location && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4" />
                    {profile.location.city}, {profile.location.country}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Professional Info */}
          <Card className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Professional Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <BriefcaseIcon className="w-4 h-4" />
                  Experience
                </label>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {profile?.years_experience || 0} years
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Hourly Rate</label>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  ${profile?.hourly_rate || 0}/hr
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <AcademicCapIcon className="w-4 h-4" />
                  Availability
                </label>
                <p className="mt-2 text-gray-900">{profile?.availability || 'Not specified'}</p>
              </div>
            </div>
          </Card>

          {/* Skills */}
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Skills</h3>
              <Button variant="outline" size="sm">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Skill
              </Button>
            </div>

            {profile?.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {profile.skills.map((skill: any) => (
                  <Badge key={skill.id} variant="outline">
                    {skill.name}
                    <span className="text-xs text-gray-500 ml-2">
                      {skill.proficiency_level}
                    </span>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No skills added yet. Add your skills to stand out!</p>
            )}
          </Card>
        </>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <input
            type="tel"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="Hourly Rate"
            value={formData.hourly_rate}
            onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="Years of Experience"
            value={formData.years_experience}
            onChange={(e) => setFormData({ ...formData, years_experience: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            placeholder="Availability"
            value={formData.availability}
            onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-4 justify-end mt-6">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkerProfile;
