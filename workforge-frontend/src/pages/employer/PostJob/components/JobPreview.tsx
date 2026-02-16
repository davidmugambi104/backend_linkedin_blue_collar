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
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">
          Preview Your Job Posting
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          Review how your job posting will appear to workers.
        </p>
      </div>

      <Card className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-xl font-bold text-[#0F172A]">{formData.title || 'Job Title'}</h3>
          <p className="text-[#64748B] mt-1">{employer?.company_name}</p>
        </div>

        <CardBody className="p-6">
          {/* Quick Info */}
          <div className="flex flex-wrap gap-4 pb-6 mb-6 border-b border-[#E2E8F0]">
            {formData.pay_min && (
              <div className="flex items-center text-sm">
                <CurrencyDollarIcon className="w-5 h-5 text-[#64748B] mr-2" />
                <div>
                  <span className="text-[#64748B]">Pay: </span>
                  <span className="font-medium text-[#0F172A]">
                    {formatCurrency(formData.pay_min)}
                    {formData.pay_max && ` - ${formatCurrency(formData.pay_max)}`}
                    {formData.pay_type && `/${formData.pay_type}`}
                  </span>
                </div>
              </div>
            )}

            {skill && (
              <div className="flex items-center text-sm">
                <BriefcaseIcon className="w-5 h-5 text-[#64748B] mr-2" />
                <div>
                  <span className="text-[#64748B]">Skill: </span>
                  <span className="font-medium text-[#0F172A]">
                    {skill.name}
                  </span>
                </div>
              </div>
            )}

            {formData.address && (
              <div className="flex items-center text-sm">
                <MapPinIcon className="w-5 h-5 text-[#64748B] mr-2" />
                <div>
                  <span className="text-[#64748B]">Location: </span>
                  <span className="font-medium text-[#0F172A]">
                    {formData.address}
                  </span>
                </div>
              </div>
            )}

            {formData.expiration_date && (
              <div className="flex items-center text-sm">
                <CalendarIcon className="w-5 h-5 text-[#64748B] mr-2" />
                <div>
                  <span className="text-[#64748B]">Deadline: </span>
                  <span className="font-medium text-[#0F172A]">
                    {format(new Date(formData.expiration_date), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-[#64748B] mb-2">
                Short Description
              </h4>
              <p className="text-[#64748B]">
                {formData.short_description || 'No short description provided'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[#64748B] mb-2">
                Full Description
              </h4>
              <div 
                className="prose prose-slate max-w-none text-[#64748B]"
                dangerouslySetInnerHTML={{ 
                  __html: formData.description || '<p>No description provided</p>' 
                }}
              />
            </div>
          </div>

          {/* Status Badges */}
          <div className="mt-6 pt-6 border-t border-[#E2E8F0] flex items-center space-x-2">
            <Badge variant="success">Active</Badge>
            <Badge variant="default">Public</Badge>
            <Badge variant="info">Immediate Start</Badge>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};