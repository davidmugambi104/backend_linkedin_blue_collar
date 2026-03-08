import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, InputField, Label } from '@components/atoms';

const steps = ['Basic', 'Details', 'Compensation', 'Location', 'Preview'] as const;

interface JobFormValues {
  title: string;
  description: string;
  salary: string;
  location: string;
}

export interface MultiStepJobFormProps {
  onSubmit?: (values: JobFormValues) => void;
}

export const MultiStepJobForm = ({ onSubmit }: MultiStepJobFormProps) => {
  const [step, setStep] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<JobFormValues>({
    defaultValues: {
      title: '',
      description: '',
      salary: '',
      location: '',
    },
  });

  const values = watch();

  const next = () => setStep((value) => Math.min(value + 1, steps.length - 1));
  const prev = () => setStep((value) => Math.max(value - 1, 0));

  return (
    <form onSubmit={handleSubmit((data) => onSubmit?.(data))} className="space-y-4 rounded-lg bg-white p-6 shadow-level-1">
      <div>
        <div className="mb-3 h-2 rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-primary-blue transition-all duration-200" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <p className="text-sm text-gray-500">Step {step + 1} of {steps.length}: {steps[step]}</p>
      </div>

      {step === 0 && (
        <div>
          <Label htmlFor="title" required>Job title</Label>
          <InputField id="title" {...register('title', { required: 'Title is required' })} error={errors.title?.message} placeholder="Senior Plumber" />
        </div>
      )}

      {step === 1 && (
        <div>
          <Label htmlFor="description" required>Description</Label>
          <InputField id="description" {...register('description', { required: 'Description is required' })} error={errors.description?.message} placeholder="Describe responsibilities" />
        </div>
      )}

      {step === 2 && (
        <div>
          <Label htmlFor="salary" required>Compensation</Label>
          <InputField id="salary" {...register('salary', { required: 'Salary is required' })} error={errors.salary?.message} placeholder="$40,000 - $55,000" />
        </div>
      )}

      {step === 3 && (
        <div>
          <Label htmlFor="location" required>Location</Label>
          <InputField id="location" {...register('location', { required: 'Location is required' })} error={errors.location?.message} placeholder="Dallas, TX" />
        </div>
      )}

      {step === 4 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
          <p className="font-medium text-gray-900">Preview</p>
          <p className="mt-1 text-gray-700">{values.title || 'Untitled role'}</p>
          <p className="text-gray-500">{values.description || 'No description yet'}</p>
          <p className="text-gray-500">{values.salary || 'No salary range'}</p>
          <p className="text-gray-500">{values.location || 'No location set'}</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="secondary" onClick={prev} disabled={step === 0}>Previous</Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={next}>Next</Button>
        ) : (
          <Button type="submit" loading={isSubmitting}>Submit</Button>
        )}
      </div>
    </form>
  );
};
