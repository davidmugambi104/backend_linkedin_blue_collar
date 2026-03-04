// workforge-frontend/src/pages/admin/Users/components/BanUserModal.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Button } from '@components/ui/Button';
import { Textarea } from '@components/ui/Textarea';

const banUserSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason'),
  duration: z.enum(['24h', '7d', '30d', 'permanent']),
  notify_user: z.boolean(),
});

type BanUserFormData = z.infer<typeof banUserSchema>;

interface BanUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: BanUserFormData) => void;
  userName: string;
}

export const BanUserModal: React.FC<BanUserModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BanUserFormData>({
    resolver: zodResolver(banUserSchema),
    defaultValues: {
      duration: '7d',
      notify_user: true,
    },
  });

  React.useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const durationOptions = [
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: 'permanent', label: 'Permanent' },
  ];

  const onSubmit = (data: BanUserFormData) => {
    onConfirm(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Header onClose={onClose} showCloseButton>
        Ban User
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              You are about to ban <span className="font-semibold">{userName}</span>.
              This action will restrict their access to the platform.
            </p>
          </div>

          <Select
            {...register('duration')}
            label="Ban Duration"
            error={errors.duration?.message}
            required
          >
            {durationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Textarea
            {...register('reason')}
            label="Reason for Ban"
            placeholder="Provide a detailed explanation for this action..."
            rows={4}
            error={errors.reason?.message}
            required
          />

          <label className="flex items-center space-x-3">
            <input
              {...register('notify_user')}
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Notify the user via email about this ban
            </span>
          </label>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              Ban User
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};