/**
 * Worker Profile Page - Unified Design System
 */
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
  PencilIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { Input } from '@components/ui/Input';
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
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-red-100 bg-red-900/30 flex items-center justify-center mb-4">
          <UserIcon className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 text-[#1A1A1A] mb-2">
          Failed to load profile
        </h2>
        <p className="text-slate-500  mb-6">
          {error instanceof Error ? error.message : 'Please try again'}
        </p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 text-[#1A1A1A]">
            My Profile
          </h1>
          <p className="mt-1 text-slate-500 ">
            Manage your professional information
          </p>
        </div>
        <Button 
          leftIcon={<PencilIcon className="h-5 w-5" />}
          onClick={() => setIsEditOpen(true)}
        >
          Edit Profile
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          {/* Primary Info Card */}
          <Card className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-blue-100 bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-10 h-10 text-blue-600 text-blue-400" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-900 text-[#1A1A1A]">
                      {profile?.user?.first_name} {profile?.user?.last_name}
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <StarIcon
                            key={star}
                            className={`h-5 w-5 ${
                              star <= Math.round(profile?.rating || 0)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-300 text-gray-600'
                            }`}
                          />
                        ))}
                        <span className="ml-1 font-medium text-gray-900 text-[#1A1A1A]">
                          {profile?.rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      <span className="text-slate-400">•</span>
                      <span className="text-gray-600 ">
                        {profile?.completed_jobs || 0} jobs completed
                      </span>
                    </div>
                  </div>
                  {profile?.is_verified && (
                    <Badge variant="success" className="flex items-center gap-1">
                      <ShieldCheckIcon className="h-4 w-4" />
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Contact Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 bg-gray-800 flex items-center justify-center">
                      <EnvelopeIcon className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 ">Email</p>
                      <p className="text-sm font-medium text-gray-900 text-[#1A1A1A] truncate">
                        {profile?.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 bg-gray-800 flex items-center justify-center">
                      <PhoneIcon className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 ">Phone</p>
                      <p className="text-sm font-medium text-gray-900 text-[#1A1A1A]">
                        {profile?.user?.phone || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  {profile?.location && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 bg-gray-800 flex items-center justify-center">
                        <MapPinIcon className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 ">Location</p>
                        <p className="text-sm font-medium text-gray-900 text-[#1A1A1A]">
                          {profile.location.city}, {profile.location.country}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Professional Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4 lg:p-6">
              <h3 className="text-lg font-semibold text-gray-900 text-[#1A1A1A] mb-6">
                Professional Information
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 bg-blue-900/30 flex items-center justify-center">
                    <BriefcaseIcon className="h-6 w-6 text-blue-600 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 ">Experience</p>
                    <p className="text-xl font-bold text-gray-900 text-[#1A1A1A]">
                      {profile?.years_experience || 0} years
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 bg-green-900/30 flex items-center justify-center">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 ">Hourly Rate</p>
                    <p className="text-xl font-bold text-gray-900 text-[#1A1A1A]">
                      KES {profile?.hourly_rate?.toLocaleString() || 0}/hr
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 bg-purple-900/30 flex items-center justify-center">
                    <ClockIcon className="h-6 w-6 text-purple-600 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 ">Availability</p>
                    <p className="text-xl font-bold text-gray-900 text-[#1A1A1A]">
                      {profile?.availability || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats Card */}
            <Card className="p-4 lg:p-6">
              <h3 className="text-lg font-semibold text-gray-900 text-[#1A1A1A] mb-6">
                Performance Stats
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 bg-gray-800/50">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 text-[#1A1A1A]">
                    {profile?.completed_jobs || 0}
                  </p>
                  <p className="text-sm text-slate-500 ">Jobs Completed</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 bg-gray-800/50">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 text-[#1A1A1A]">
                    {profile?.rating?.toFixed(1) || '0.0'}
                  </p>
                  <p className="text-sm text-slate-500 ">Average Rating</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 bg-gray-800/50">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 text-[#1A1A1A]">
                    {profile?.is_verified ? 100 : 0}%
                  </p>
                  <p className="text-sm text-slate-500 ">Success Rate</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 bg-gray-800/50">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 text-[#1A1A1A]">
                    {profile?.years_experience ? Math.min(100, profile.years_experience * 10) : 0}%
                  </p>
                  <p className="text-sm text-slate-500 ">Response Rate</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Skills */}
          <Card className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 text-[#1A1A1A]">Skills</h3>
              <Button variant="outline" size="sm" leftIcon={<PlusIcon className="h-4 w-4" />}>
                Add Skill
              </Button>
            </div>

            {profile?.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {profile.skills.map((skill: any) => (
                  <Badge key={skill.id} variant="outline" className="px-3 py-1">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      • {skill.proficiency_level}
                    </span>
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AcademicCapIcon className="h-12 w-12 text-slate-300 text-gray-600 mx-auto mb-3" />
                <p className="text-slate-500 ">No skills added yet</p>
                <p className="text-sm text-slate-400 text-slate-500 mt-1">
                  Add your skills to stand out to employers
                </p>
              </div>
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
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Hourly Rate (KES)"
            type="number"
            value={formData.hourly_rate}
            onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
          />
          <Input
            label="Years of Experience"
            type="number"
            value={formData.years_experience}
            onChange={(e) => setFormData({ ...formData, years_experience: Number(e.target.value) })}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} isLoading={isPending}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkerProfile;
