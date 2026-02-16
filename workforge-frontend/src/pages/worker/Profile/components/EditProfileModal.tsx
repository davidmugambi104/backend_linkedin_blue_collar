import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import { useWorkerProfile, useUpdateWorkerProfile } from '@hooks/useWorker';
import { WorkerUpdateRequest } from '@types';

const editProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().optional(),
  phone: z.string().min(10, 'Please enter a valid phone number').optional(),
  hourly_rate: z.number().min(0, 'Hourly rate must be positive').optional(),
  address: z.string().optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: worker } = useWorkerProfile();
  const updateProfile = useUpdateWorkerProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      full_name: worker?.full_name || '',
      bio: worker?.bio || '',
      phone: worker?.phone || '',
      hourly_rate: worker?.hourly_rate,
      address: worker?.address || '',
    },
  });

  React.useEffect(() => {
    if (worker) {
      reset({
        full_name: worker.full_name || '',
        bio: worker.bio || '',
        phone: worker.phone || '',
        hourly_rate: worker.hourly_rate,
        address: worker.address || '',
      });
    }
  }, [worker, reset]);

  const onSubmit = async (data: EditProfileFormData) => {
    await updateProfile.mutateAsync(data);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Header onClose={onClose} showCloseButton>
        Edit Profile
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('full_name')}
            label="Full Name"
            error={errors.full_name?.message}
            required
          />

          <Textarea
            {...register('bio')}
            label="Bio"
            placeholder="Tell employers about yourself, your experience, and what you're looking for..."
            rows={4}
            error={errors.bio?.message}
          />

          <Input
            {...register('phone')}
            label="Phone Number"
            placeholder="(555) 123-4567"
            error={errors.phone?.message}
          />

          <Input
            {...register('hourly_rate', { valueAsNumber: true })}
            type="number"
            label="Hourly Rate ($)"
            placeholder="25.00"
            error={errors.hourly_rate?.message}
            leftIcon={<span className="text-gray-500">$</span>}
          />

          <Input
            {...register('address')}
            label="Location"
            placeholder="City, State"
            error={errors.address?.message}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={updateProfile.isPending}
              disabled={!isDirty}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};