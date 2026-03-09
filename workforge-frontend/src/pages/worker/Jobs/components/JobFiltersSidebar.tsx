import React from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { useSkills } from '@hooks/useSkills';
import { useGeolocation } from '@hooks/useGeolocation';
import { JobSearchParams, PayType } from '@types';

interface JobFiltersSidebarProps {
  filters: JobSearchParams;
  onChange: (filters: JobSearchParams) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export const JobFiltersSidebar: React.FC<JobFiltersSidebarProps> = ({
  filters,
  onChange,
  onClose,
  isMobile = false,
}) => {
  const { data: skills } = useSkills();
  const { latitude, longitude } = useGeolocation();
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      skill_id: filters.skill_id || '',
      pay_min: filters.pay_min || '',
      pay_max: filters.pay_max || '',
      pay_type: filters.pay_type || '',
      radius_km: filters.radius_km || 25,
      use_location: !!filters.location_lat,
    },
  });

  const useLocation = watch('use_location');

  const onSubmit = (data: any) => {
    const newFilters: JobSearchParams = {
      ...filters,
      skill_id: data.skill_id || undefined,
      pay_min: data.pay_min ? Number(data.pay_min) : undefined,
      pay_max: data.pay_max ? Number(data.pay_max) : undefined,
      pay_type: data.pay_type || undefined,
      radius_km: data.use_location ? Number(data.radius_km) : undefined,
    };

    if (data.use_location && latitude && longitude) {
      newFilters.location_lat = latitude;
      newFilters.location_lng = longitude;
    } else {
      delete newFilters.location_lat;
      delete newFilters.location_lng;
    }

    onChange(newFilters);
  };

  const handleClear = () => {
    reset({
      skill_id: '',
      pay_min: '',
      pay_max: '',
      pay_type: '',
      radius_km: 25,
      use_location: false,
    });
    onChange({});
  };

  const payTypeOptions = [
    { value: '', label: 'Any pay type' },
    { value: PayType.HOURLY, label: 'Hourly' },
    { value: PayType.DAILY, label: 'Daily' },
    { value: PayType.FIXED, label: 'Fixed price' },
  ];

  const radiusOptions = [
    { value: '10', label: '10 km' },
    { value: '25', label: '25 km' },
    { value: '50', label: '50 km' },
    { value: '100', label: '100 km' },
  ];

  const content = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Skills Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-700  mb-2">
          Skill
        </label>
        <Select {...register('skill_id')}>
          <option value="">All skills</option>
          {skills?.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Location Filter */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('use_location')}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 border-gray-600 bg-gray-800"
          />
          <span className="text-sm font-medium text-slate-700 ">
            Near my location
          </span>
        </label>

        {useLocation && (
          <div className="mt-3">
            <Select {...register('radius_km')}>
              {radiusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Pay Range */}
      <div>
        <label className="block text-sm font-medium text-slate-700  mb-2">
          Pay Range
        </label>
        <div className="space-y-3">
          <Select {...register('pay_type')}>
            {payTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-2">
            <Input
              {...register('pay_min')}
              type="number"
              placeholder="Min"
              leftIcon={<span className="text-slate-500">$</span>}
            />
            <Input
              {...register('pay_max')}
              type="number"
              placeholder="Max"
              leftIcon={<span className="text-slate-500">$</span>}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col space-y-2">
        <Button type="submit" fullWidth>
          Apply Filters
        </Button>
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={handleClear}
        >
          Clear All
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white bg-gray-900 overflow-y-auto">
        <div className="sticky top-0 bg-white bg-gray-900 border-b border-gray-200 border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-slate-100 hover:bg-gray-800"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4">{content}</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Filters</h3>
      </CardHeader>
      <CardBody>{content}</CardBody>
    </Card>
  );
};