import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { useSkills } from '@hooks/useSkills';

export const JobBasicInfo: React.FC = () => {
  const { register, formState: { errors } } = useFormContext();
  const { data: skills } = useSkills();

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
        <Input
          {...register('title')}
          label="Job Title"
          placeholder="e.g., Senior Carpenter Needed for Renovation"
          error={errors.title?.message as string}
          required
        />

        <Select
          {...register('required_skill_id', { valueAsNumber: true })}
          label="Required Skill"
          error={errors.required_skill_id?.message as string}
          required
        >
          <option value="">Select a skill</option>
          {skills?.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.name} ({skill.category})
            </option>
          ))}
        </Select>

        <Input
          {...register('expiration_date')}
          type="date"
          label="Application Deadline"
          error={errors.expiration_date?.message as string}
          hint="Leave empty for no deadline"
        />
      </div>
    </div>
  );
};