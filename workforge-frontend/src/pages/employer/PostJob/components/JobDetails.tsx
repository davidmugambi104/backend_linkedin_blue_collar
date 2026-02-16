import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Textarea } from '@components/ui/Textarea';
import { RichTextEditor } from '@components/common/RichTextEditor';

export const JobDetails: React.FC = () => {
  const { register, setValue, watch, formState: { errors } } = useFormContext();
  const description = watch('description', '');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">
          Job Details
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          Provide a detailed description of the job and responsibilities.
        </p>
      </div>

      <div className="space-y-4">
        <Textarea
          {...register('short_description')}
          label="Short Description"
          placeholder="Brief summary of the job (will appear in search results)"
          error={errors.short_description?.message as string}
          required
          rows={3}
        />

        <div className="prose prose-slate max-w-none">
          <RichTextEditor
            label="Full Job Description"
            value={description}
            onChange={(value) => setValue('description', value, { shouldValidate: true })}
            error={errors.description?.message as string}
            required
          />
        </div>
      </div>
    </div>
  );
};