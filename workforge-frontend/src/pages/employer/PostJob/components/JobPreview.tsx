import React from 'react';
import { useFormContext } from 'react-hook-form';
import { format } from 'date-fns';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { MapPinIcon, CurrencyDollarIcon, BriefcaseIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useEmployerProfile } from '@hooks/useEmployer';
import { useSkills } from '@hooks/useSkills';
import { formatCurrency } from '@lib/utils/format';

export const JobPreview: React.FC = () => {
  const { watch } = useFormContext();
  const { data: employer } = useEmployerProfile();
  const { data: skills } = useSkills();

  const formData = watch();

  const skill = skills?.find(s => s.id === Number(formData.required_skill_id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold employer-text-primary mb-4">
          Preview Your Job Posting
        </h2>
        <p className="text-sm employer-text-muted mb-6">
          Review how your job posting will appear to workers.
        </p>
      </div>

      <Card className="employer-bg-surface border employer-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b employer-border">
          <h3 className="text-xl font-bold employer-text-primary">{formData.title || 'Job Title'}</h3>
          <p className="employer-text-muted mt-1">{employer?.company_name}</p>
        </div>

        <CardBody className="p-6">
          {/* Quick Info */}
          <div className="flex flex-wrap gap-4 pb-6 mb-6 border-b employer-border">
            {formData.pay_min && (
              <div className="flex items-center text-sm">
                <CurrencyDollarIcon className="w-5 h-5 employer-text-muted mr-2" />
                <div>
                  <span className="employer-text-muted">Pay: </span>
                  <span className="font-medium employer-text-primary">
                    {formatCurrency(formData.pay_min)}
                    {formData.pay_max && ` - ${formatCurrency(formData.pay_max)}`}
                    {formData.pay_type && `/${formData.pay_type}`}
                  </span>
                </div>
              </div>
            )}

            {skill && (
              <div className="flex items-center text-sm">
                <BriefcaseIcon className="w-5 h-5 employer-text-muted mr-2" />
                <div>
                  <span className="employer-text-muted">Skill: </span>
                  <span className="font-medium employer-text-primary">
                    {skill.name}
                  </span>
                </div>
              </div>
            )}

            {formData.address && (
              <div className="flex items-center text-sm">
                <MapPinIcon className="w-5 h-5 employer-text-muted mr-2" />
                <div>
                  <span className="employer-text-muted">Location: </span>
                  <span className="font-medium employer-text-primary">
                    {formData.address}
                  </span>
                </div>
              </div>
            )}

            {formData.expiration_date && (
              <div className="flex items-center text-sm">
                <CalendarIcon className="w-5 h-5 employer-text-muted mr-2" />
                <div>
                  <span className="employer-text-muted">Deadline: </span>
                  <span className="font-medium employer-text-primary">
                    {format(new Date(formData.expiration_date), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium employer-text-muted mb-2">
                Short Description
              </h4>
              <p className="employer-text-muted">
                {formData.short_description || 'No short description provided'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium employer-text-muted mb-2">
                Full Description
              </h4>
              <div 
                className="prose prose-slate max-w-none employer-text-muted"
                dangerouslySetInnerHTML={{ 
                  __html: formData.description || '<p>No description provided</p>' 
                }}
              />
            </div>
          </div>

          {/* Status Badges */}
          <div className="mt-6 pt-6 border-t employer-border flex items-center space-x-2">
            <Badge variant="success">Active</Badge>
            <Badge variant="default">Public</Badge>
            <Badge variant="info">Immediate Start</Badge>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};