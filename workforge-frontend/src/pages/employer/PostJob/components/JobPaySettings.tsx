import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { PayType } from '@types';

export const JobPaySettings: React.FC = () => {
  const { register, watch, formState: { errors } } = useFormContext();
  const payType = watch('pay_type');

  const payTypeOptions = [
    { value: PayType.HOURLY, label: 'Hourly' },
    { value: PayType.DAILY, label: 'Daily' },
    { value: PayType.FIXED, label: 'Fixed Price' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">
          Compensation
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          Set the pay rate and type for this position.
        </p>
      </div>

      <div className="space-y-4">
        <Select
          {...register('pay_type')}
          label="Pay Type"
          error={errors.pay_type?.message as string}
          required
        >
          <option value="">Select pay type</option>
          {payTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('pay_min', { valueAsNumber: true })}
            type="number"
            step="0.01"
            label="Minimum Pay"
            placeholder="0.00"
            error={errors.pay_min?.message as string}
            leftIcon={<span className="text-[#64748B]">$</span>}
            rightIcon={payType && <span className="text-[#64748B]">/{payType}</span>}
            required
          />

          <Input
            {...register('pay_max', { valueAsNumber: true })}
            type="number"
            step="0.01"
            label="Maximum Pay"
            placeholder="0.00"
            error={errors.pay_max?.message as string}
            leftIcon={<span className="text-[#64748B]">$</span>}
            rightIcon={payType && <span className="text-[#64748B]">/{payType}</span>}
          />
        </div>

        <div className="bg-blue-50 border-l-4 border-[#2563EB] rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Setting a competitive pay rate helps attract qualified candidates faster.
            Research shows jobs with clear pay ranges receive 30% more applications.
          </p>
        </div>
      </div>
    </div>
  );
};