import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useSkills } from '@hooks/useSkills';

export const JobBasicInfo: React.FC = () => {
  const { register, watch, formState: { errors } } = useFormContext();
  const { data: skills } = useSkills();
  const selectedSkill = watch('required_skill_id');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">
          Basic Information
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          Start with the basic details of your job posting.
        </p>
      </div>

      <div className="space-y-4">
        <div className="employer-floating">
          <input
            {...register('title')}
            className="employer-floating-input"
            placeholder=" "
            required
          />
          <label className="employer-floating-label">Job Title</label>
          {errors.title?.message && (
            <p className="employer-validation-error">
              <ExclamationTriangleIcon className="h-4 w-4" />
              {errors.title.message as string}
            </p>
          )}
        </div>

        <div className="employer-floating">
          <select
            {...register('required_skill_id', { valueAsNumber: true })}
            className={`employer-floating-select ${selectedSkill ? 'has-value' : ''}`}
            defaultValue=""
            required
          >
            <option value="" disabled>Select a skill</option>
            {skills?.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name} ({skill.category})
              </option>
            ))}
          </select>
          <label className="employer-floating-label">Required Skill</label>
          {errors.required_skill_id?.message && (
            <p className="employer-validation-error">
              <ExclamationTriangleIcon className="h-4 w-4" />
              {errors.required_skill_id.message as string}
            </p>
          )}
        </div>

        <div className="employer-floating">
          <input
            {...register('expiration_date')}
            type="date"
            className="employer-floating-input"
            placeholder=" "
          />
          <label className="employer-floating-label">Application Deadline</label>
          {errors.expiration_date?.message ? (
            <p className="employer-validation-error">
              <ExclamationTriangleIcon className="h-4 w-4" />
              {errors.expiration_date.message as string}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[#516176]">Leave empty for no deadline</p>
          )}
        </div>
      </div>
    </div>
  );
};