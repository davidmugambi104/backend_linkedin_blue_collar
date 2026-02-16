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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Post a New Job
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Fill out the details below to create a job posting and find the perfect candidate.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1 text-center">
              <div className="relative">
                <div
                  className={`
                      w-8 h-8 mx-auto rounded-full flex items-center justify-center
                      ${index < currentStep 
                        ? 'bg-[#2563EB] text-white' 
                        : index === currentStep
                        ? 'bg-[#2563EB] text-white ring-4 ring-[#DBEAFE]'
                        : 'bg-[#E2E8F0] text-[#64748B]'
                      }
                    `}
                >
                  {index + 1}
                </div>
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap text-[#64748B]">
                  {step.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Card className="bg-white border border-[#E2E8F0] rounded-2xl">
            <CardBody className="p-6">
              <CurrentStepComponent />

              <div className="flex justify-between mt-8 pt-6 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
                >
                  Previous
                </Button>
                
                {currentStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    isLoading={createJob.isPending}
                    className="rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1E3A8A] active:scale-95"
                  >
                    Post Job
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="rounded-xl bg-[#2563EB] text-white shadow-sm hover:bg-[#1E3A8A] active:scale-95"
                  >
                    Continue
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </form>
      </FormProvider>
    </div>
  );
};

export default PostJobPage;