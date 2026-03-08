import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { RichTextEditor } from '@components/common/RichTextEditor';

export const JobDetails: React.FC = () => {
  const { register, setValue, watch, formState: { errors } } = useFormContext();
  const description = watch('description', '');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold employer-text-primary mb-4">
          Job Details
        </h2>
        <p className="text-sm employer-text-muted mb-6">
          Provide a detailed description of the job and responsibilities.
        </p>
      </div>

      <div className="space-y-4">
        <div className="employer-floating">
          <textarea
            {...register('short_description')}
            className="employer-floating-textarea"
            placeholder=" "
            rows={3}
            required
          />
          <label className="employer-floating-label">Short Description</label>
          {errors.short_description?.message && (
            <p className="employer-validation-error">
              <ExclamationTriangleIcon className="h-4 w-4" />
              {errors.short_description.message as string}
            </p>
          )}
        </div>

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