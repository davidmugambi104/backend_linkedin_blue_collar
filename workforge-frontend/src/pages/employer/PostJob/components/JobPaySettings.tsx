import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
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
        <div className="employer-floating">
          <select
            {...register('pay_type')}
            className={`employer-floating-select ${payType ? 'has-value' : ''}`}
            defaultValue=""
            required
          >
            <option value="" disabled>Select pay type</option>
            {payTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="employer-floating-label">Pay Type</label>
          {errors.pay_type?.message && (
            <p className="employer-validation-error">
              <ExclamationTriangleIcon className="h-4 w-4" />
              {errors.pay_type.message as string}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="employer-floating">
            <input
              {...register('pay_min', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="employer-floating-input"
              placeholder=" "
              required
            />
            <label className="employer-floating-label">Minimum Pay ({payType || 'rate'})</label>
            {errors.pay_min?.message && (
              <p className="employer-validation-error">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {errors.pay_min.message as string}
              </p>
            )}
          </div>

          <div className="employer-floating">
            <input
              {...register('pay_max', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="employer-floating-input"
              placeholder=" "
            />
            <label className="employer-floating-label">Maximum Pay ({payType || 'rate'})</label>
            {errors.pay_max?.message && (
              <p className="employer-validation-error">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {errors.pay_max.message as string}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[#E9EDF2] bg-[#F8FAFC] p-4">
          <p className="text-sm text-[#0A2540]">
            <strong>Tip:</strong> Setting a competitive pay rate helps attract qualified candidates faster.
            Research shows jobs with clear pay ranges receive 30% more applications.
          </p>
        </div>
      </div>
    </div>
  );
};