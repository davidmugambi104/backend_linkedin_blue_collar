import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { LocationPicker } from '@components/common/LocationPicker';

export const JobLocation: React.FC = () => {
  const { register, setValue, watch, formState: { errors } } = useFormContext();
  const [useMapPicker, setUseMapPicker] = useState(false);
  
  const locationLat = watch('location_lat');
  const locationLng = watch('location_lng');
  const address = watch('address');

  const handleLocationChange = (location: { lat: number; lng: number; address?: string }) => {
    setValue('location_lat', location.lat, { shouldValidate: true });
    setValue('location_lng', location.lng, { shouldValidate: true });
    if (location.address) {
      setValue('address', location.address, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">
          Job Location
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          Where will the work be performed?
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setUseMapPicker(false)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
              !useMapPicker
                ? 'bg-[#0A2540] text-white'
                : 'bg-white border border-[#E9EDF2] text-[#1A1A1A] hover:bg-[#F8FAFC]'
            }`}
          >
            Enter Address Manually
          </button>
          <button
            type="button"
            onClick={() => setUseMapPicker(true)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
              useMapPicker
                ? 'bg-[#0A2540] text-white'
                : 'bg-white border border-[#E9EDF2] text-[#1A1A1A] hover:bg-[#F8FAFC]'
            }`}
          >
            Pick on Map
          </button>
        </div>

        {!useMapPicker ? (
          <div className="employer-floating">
            <input
              {...register('address')}
              className="employer-floating-input"
              placeholder=" "
            />
            <label className="employer-floating-label">Full Address</label>
            {errors.address?.message && (
              <p className="employer-validation-error">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {errors.address.message as string}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="employer-floating">
              <input
                {...register('address')}
                className="employer-floating-input"
                placeholder=" "
                disabled
              />
              <label className="employer-floating-label">Address</label>
            </div>
            <LocationPicker
              value={locationLat && locationLng ? { lat: locationLat, lng: locationLng, address } : undefined}
              onChange={handleLocationChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};