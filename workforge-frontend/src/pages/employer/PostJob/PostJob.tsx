/**
 * Post Job Page - Unified Design System
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardBody } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { JobBasicInfo } from './components/JobBasicInfo';
import { JobDetails } from './components/JobDetails';
import { JobPaySettings } from './components/JobPaySettings';
import { JobLocation } from './components/JobLocation';
import { JobPreview } from './components/JobPreview';
import { useCreateJob } from '@hooks/useEmployerJobs';
import { JobCreateRequest, PayType } from '@types';
import { BriefcaseIcon } from '@heroicons/react/24/outline';

const postJobSchema = z.object({
  title: z.string().min(5, 'Job title must be at least 5 characters'),
  required_skill_id: z.number().min(1, 'Please select a required skill'),
  short_description: z.string().min(20, 'Short description must be at least 20 characters'),
  description: z.string().min(50, 'Job description must be at least 50 characters'),
  pay_type: z.enum([PayType.HOURLY, PayType.DAILY, PayType.FIXED]),
  pay_min: z.number().min(0, 'Minimum pay must be greater than 0'),
  pay_max: z.number().min(0).optional(),
  address: z.string().optional(),
  location_lat: z.number().optional(),
  location_lng: z.number().optional(),
  expiration_date: z.string().optional(),
}).refine(
  (data) => !data.pay_max || data.pay_max >= data.pay_min,
  {
    message: "Maximum pay must be greater than or equal to minimum pay",
    path: ["pay_max"],
  }
);

type PostJobFormData = z.infer<typeof postJobSchema>;

const steps = [
  { id: 'basic', title: 'Basic Info', component: JobBasicInfo },
  { id: 'details', title: 'Job Details', component: JobDetails },
  { id: 'pay', title: 'Compensation', component: JobPaySettings },
  { id: 'location', title: 'Location', component: JobLocation },
  { id: 'preview', title: 'Preview', component: JobPreview },
];

export const PostJobPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const createJob = useCreateJob();

  const methods = useForm<PostJobFormData>({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      title: '',
      short_description: '',
      description: '',
      pay_min: 0,
      pay_max: undefined,
      address: '',
      expiration_date: '',
    },
  });

  const onSubmit = async (data: PostJobFormData) => {
    try {
      await createJob.mutateAsync(data as JobCreateRequest);
      navigate('/employer/jobs');
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  const nextStep = async () => {
    if (currentStep < steps.length - 1) {
      const fields = getFieldsForStep(currentStep);
      const isValid = await methods.trigger(fields as any);
      
      if (isValid) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 0:
        return ['title', 'required_skill_id', 'expiration_date'];
      case 1:
        return ['short_description', 'description'];
      case 2:
        return ['pay_type', 'pay_min', 'pay_max'];
      case 3:
        return ['address'];
      default:
        return [];
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="max-w-4xl mx-auto space-y-6 employer-page-m3">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <BriefcaseIcon className="h-8 w-8" />
          Post a New Job
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Fill out the details below to create a job posting and find the perfect candidate.
        </p>
      </div>

      {/* Progress Steps */}
      <Card className="p-4 lg:p-6 employer-m3-card">
        <div className="space-y-3">
          <div className="h-2 w-full rounded-full bg-[#E9EDF2]">
            <div
              className="h-2 rounded-full bg-[#0A2540] transition-all duration-200"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[#516176]">
            {steps.map((step, index) => (
              <span
                key={step.id}
                className={`${index === currentStep ? 'font-semibold text-[#0A2540]' : ''}`}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>
        <div className="sm:hidden mt-8 text-center text-sm text-gray-500">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
        </div>
      </Card>

      {/* Form */}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Card className="p-4 lg:p-6 employer-m3-card">
            <CardBody>
              <CurrentStepComponent />

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  {currentStep === steps.length - 1 ? (
                    <Button
                      type="submit"
                      isLoading={createJob.isPending}
                      className="flex-1 sm:flex-none"
                    >
                      Post Job
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 sm:flex-none"
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </form>
      </FormProvider>
    </div>
  );
};

export default PostJobPage;
